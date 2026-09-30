import React, { useState, useEffect } from 'react';
import { FodderItem } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useStore } from '../../store';
import { normalizeElephantSlug, getElephantName, ElephantSlug, ELEPHANTS_META } from '../../utils/elephantUtils';
import { RecipeBottomSheet } from './RecipeBottomSheet';

interface KitchenSlideProps {
  slideWrapperClass: string;
  fodderInventory: FodderItem[];
  updateFodderAmount: (id: string, delta: number) => void;
  deductFodderKg?: (id: string, kg: number) => void;
  addEvent: (title: string) => void;
  feedSubTab?: 'kitchen' | 'roughage';
  onFeedSubTabChange?: (tab: 'kitchen' | 'roughage') => void;
  roughageContent?: React.ReactNode;
}

export type MealTab = 'm' | 'n' | 's' | 'e';

interface DispensedBatch {
  time: string;
  ingredients: Record<string, number>;
  additives: string[];
}

// Biochemical Active Agents & Functional markers (Понятный язык киперов)
const BIOCHEMICAL_MARKERS: Record<string, { label: string; style: string }> = {
  // Крупяные и структурные маркеры
  starch: { label: "🌾 Крахмал (энергия)", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  microbiota_fiber: { label: "🌿 Клетчатка ЖКТ", style: "text-emerald-300 bg-emerald-950/40 border-emerald-800/50" },
  corn_energy: { label: "🌽 Кукуруза (калории / жиры)", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  sunflower_lipids: { label: "🌻 Омега-6 / Раст. жиры", style: "text-yellow-300 bg-yellow-950/40 border-yellow-800/50" },
  // Готовые коммерческие каши (13:00 и 17:00)
  formamax_spec: { label: "🥣 ФормаМакс (восстановление / суставы)", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  optiform_spec: { label: "🥣 ОптиФорм Юниор (баланс роста)", style: "text-sky-300 bg-sky-950/40 border-sky-800/50" },
  monograss_spec: { label: "🌿 Mono Grass (монотравы / волокно)", style: "text-emerald-300 bg-emerald-950/40 border-emerald-800/50" },
  // Добавки и фитотерапия
  nacl: { label: "💧 Для водопоя", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  calcium_mineral: { label: "💅 Ногти и подошва", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  chondro_msm: { label: "🦴 Суставы и связки", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  psyllium_gel: { label: "🧹 Вывод песка", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  anethole: { label: "💨 От вздутия / колик", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  silymarin: { label: "🛡️ Защита печени", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  harpagoside: { label: "🌿 Боль в суставах", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  // Сочные корма (ужин 19:00)
  carotene: { label: "🥕 Каротин (вит. А)", style: "text-orange-300 bg-orange-950/40 border-orange-800/50" },
  betaine: { label: "🍠 Бетаин / Кровь", style: "text-fuchsia-300 bg-fuchsia-950/40 border-fuchsia-800/50" },
  vit_c: { label: "🍎 Витамин C", style: "text-rose-300 bg-rose-950/40 border-rose-800/50" },
  zinc_antiox: { label: "🎃 Цинк / Антиоксиданты", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  hydration: { label: "🍉 Гидратация", style: "text-teal-300 bg-teal-950/40 border-teal-800/50" },
  water_balance: { label: "🥒 Баланс жидкости", style: "text-emerald-300 bg-emerald-950/40 border-emerald-800/50" }
};

const INGREDIENT_TO_MARKER: Record<string, string> = {
  c1: 'starch',            // Овёс
  c2: 'microbiota_fiber',  // Отруби
  c11: 'starch',           // Геркулес
  c13: 'corn_energy',      // Кукуруза
  c14: 'sunflower_lipids', // Семечки
  c15: 'formamax_spec',    // ФормаМакс Каша
  c16: 'optiform_spec',    // ОптиФорм Микс Юниор
  c17: 'monograss_spec',   // Mono Grass
  psyllium: 'psyllium_gel',
  devils_claw: 'harpagoside',
  chondro: 'chondro_msm',
  fennel: 'anethole',
  milk_thistle: 'silymarin',
  salt: 'nacl',
  calcium: 'calcium_mineral',
  j1: 'carotene',
  j2: 'betaine',
  j3: 'vit_c',
  j4: 'zinc_antiox',
  j6: 'hydration',
  j5: 'water_balance'
};

// Регламент кормления (по реальной техкарте зоопарка)
const ELEPHANT_PRESETS: Record<MealTab, Record<'margo' | 'audrey' | 'pretty', { ingredients: Record<string, number>; additives: string[] }>> = {
  m: {
    // 🌅 7:00 Завтрак:
    // Прэтти: Геркулес 2 гарнца, Отруби 2 гарнца, Овес 1 гарец, Кукуруза 0.5 гарнца (300 гр), Семечки 300 гр.
    pretty: {
      ingredients: { c11: 2.0, c2: 2.0, c1: 1.0, c13: 0.3, c14: 0.3 },
      additives: ['chondro']
    },
    // Марго: Геркулес 1 гарец, Отруби 1 гарец, Овес 0.5 гарнца, Кукуруза 300 гр, Семечки 200 гр.
    margo: {
      ingredients: { c11: 1.0, c2: 1.0, c1: 0.5, c13: 0.3, c14: 0.2 },
      additives: ['calcium']
    },
    // Одри: Геркулес 1 гарец, Отруби 1 гарец, Овес 0.5 гарнца, Семечки 200 гр.
    audrey: {
      ingredients: { c11: 1.0, c2: 1.0, c1: 0.5, c14: 0.2 },
      additives: ['calcium', 'salt']
    }
  },
  n: {
    // ☀️ 13:00 Обед:
    // Прэтти: ФормаМакс Каша 2 кг
    pretty: {
      ingredients: { c15: 2.0 },
      additives: ['salt', 'devils_claw']
    },
    // Марго: ОптиФорм Микс (Юниор) 1.5 кг
    margo: {
      ingredients: { c16: 1.5 },
      additives: ['salt']
    },
    // Одри: Mono Grass 1.5 кг
    audrey: {
      ingredients: { c17: 1.5 },
      additives: ['salt']
    }
  },
  s: {
    // 🌇 17:00 Полдник:
    // Прэтти: ФормаМакс Каша 2 кг
    pretty: {
      ingredients: { c15: 2.0 },
      additives: ['psyllium']
    },
    // Марго: ОптиФорм Микс (Юниор) 1.5 кг
    margo: {
      ingredients: { c16: 1.5 },
      additives: ['fennel']
    },
    // Одри: Mono Grass 1.5 кг
    audrey: {
      ingredients: { c17: 1.5 },
      additives: ['salt']
    }
  },
  e: {
    // 🌙 19:00 Овощи:
    margo: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j4: 2.0 }, additives: ['calcium'] },
    audrey: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j5: 2.0 }, additives: [] },
    pretty: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j6: 3.0 }, additives: ['chondro'] }
  }
};

export function KitchenSlide({
  slideWrapperClass,
  fodderInventory,
  updateFodderAmount,
  deductFodderKg,
  addEvent,
  feedSubTab,
  onFeedSubTabChange,
  roughageContent
}: KitchenSlideProps) {
  const { elephants: storeElephants, setActiveElephantId } = useStore();
  const [activeMealTab, setActiveMealTab] = useLocalStorage<MealTab>(
    'slonovet_meal_time',
    'm',
    ['kitchen_active_meal_tab']
  );
  const [storedActiveElephant, setStoredActiveElephant] = useLocalStorage<string>(
    'slonovet_active_elephant',
    'margo'
  );
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [recipeInitialMeal, setRecipeInitialMeal] = useState<'all' | 'roughage' | 'm' | 'n' | 's' | 'e'>('all');

  // Normalize selected elephant to canonical 'margo' | 'audrey' | 'pretty'
  const selectedKitchenElephant: ElephantSlug = React.useMemo(() => {
    return normalizeElephantSlug(storedActiveElephant, storeElephants);
  }, [storedActiveElephant, storeElephants]);

  const setSelectedKitchenElephant = (slug: ElephantSlug) => {
    setStoredActiveElephant(slug);
    const matched = storeElephants.find(e => normalizeElephantSlug(e.id, storeElephants) === slug);
    if (matched) {
      setActiveElephantId(matched.id);
    }
  };

  const KITCHEN_ELEPHANTS = ELEPHANTS_META;

  // 1. ИНГРЕДИЕНТЫ ЗАВТРАКА (7:00): только базовые крупы из техкарты
  const BREAKFAST_INGREDIENTS = [
    { id: 'c11', name: 'Геркулес', icon: '🥣', steps: [1.0, 2.0], defaultKg: 1.0 },
    { id: 'c2', name: 'Отруби', icon: '🌾', steps: [1.0, 2.0], defaultKg: 1.0 },
    { id: 'c1', name: 'Овёс', icon: '🌾', steps: [0.5, 1.0], defaultKg: 0.5 },
    { id: 'c13', name: 'Кукуруза', icon: '🌽', steps: [0.3, 0.6], defaultKg: 0.3 },
    { id: 'c14', name: 'Семечки', icon: '🌻', steps: [0.1, 0.2, 0.3], defaultKg: 0.2 },
  ];

  // 2. ДНЕВНЫЕ СПЕЦ-КАШИ (13:00 и 17:00): коммерческие миксы
  const DAY_MASH_INGREDIENTS = [
    {
      id: 'c15',
      name: 'ФормаМакс Каша',
      target: 'Для Прэтти (2 кг)',
      icon: '🥣',
      defaultKg: 2.0,
      recommendedFor: 'pretty'
    },
    {
      id: 'c16',
      name: 'ОптиФорм Микс Юниор',
      target: 'Для Марго (1.5 кг)',
      icon: '🥣',
      defaultKg: 1.5,
      recommendedFor: 'margo'
    },
    {
      id: 'c17',
      name: 'Mono Grass',
      target: 'Для Одри (1.5 кг)',
      icon: '🌿',
      defaultKg: 1.5,
      recommendedFor: 'audrey'
    }
  ];

  // 3. СОЧНЫЕ КОРМА (19:00 Овощи)
  const SUCCULENT_INGREDIENTS = [
    { id: 'j1', name: 'Морковь', icon: '🥕', defaultKg: 5.0 },
    { id: 'j2', name: 'Свёкла', icon: '🟣', defaultKg: 3.5 },
    { id: 'j3', name: 'Яблоки', icon: '🍎', defaultKg: 1.5 },
    { id: 'j4', name: 'Тыква', icon: '🎃', defaultKg: 2.0 },
    { id: 'j6', name: 'Арбуз', icon: '🍉', defaultKg: 3.0 },
    { id: 'j5', name: 'Кабачки', icon: '🥒', defaultKg: 2.0 }
  ];

  // 4. ДОБАВКИ И ПРЕМИКСЫ
  const KITCHEN_ADDITIVES = [
    { id: 'salt', label: 'Соль кормовая', sub: 'Для водопоя (жажда)', icon: '🧂', fodderId: 'c7' },
    { id: 'calcium', label: 'Кальций', sub: 'Ногти и подошва', icon: '💊', fodderId: 'c9' },
    { id: 'chondro', label: 'Хондро + МСМ', sub: 'Суставы и связки', icon: '🦴', fodderId: 'c9' },
    { id: 'devils_claw', label: 'Дьявольский коготь', sub: 'Боль в суставах (Обед)', icon: '🌿', fodderId: 'c10' },
    { id: 'psyllium', label: 'Псиллиум', sub: 'Вывод песка', icon: '🌾', fodderId: 'c7' },
    { id: 'fennel', label: 'Фенхель / Анис', sub: 'От вздутия и колик', icon: '🌱', fodderId: 'c10' },
    { id: 'milk_thistle', label: 'Расторопша', sub: 'Защита печени', icon: '🌺', fodderId: 'c10' }
  ];

  // Current ingredients in bowl
  const [kitchenIngredients, setKitchenIngredients] = useLocalStorage<Record<string, Record<string, Record<string, number>>>>(
    'slonovet_kitchen_ingredients',
    {
      m: {
        margo: { ...ELEPHANT_PRESETS.m.margo.ingredients },
        audrey: { ...ELEPHANT_PRESETS.m.audrey.ingredients },
        pretty: { ...ELEPHANT_PRESETS.m.pretty.ingredients }
      },
      n: {
        margo: { ...ELEPHANT_PRESETS.n.margo.ingredients },
        audrey: { ...ELEPHANT_PRESETS.n.audrey.ingredients },
        pretty: { ...ELEPHANT_PRESETS.n.pretty.ingredients }
      },
      s: {
        margo: { ...ELEPHANT_PRESETS.s.margo.ingredients },
        audrey: { ...ELEPHANT_PRESETS.s.audrey.ingredients },
        pretty: { ...ELEPHANT_PRESETS.s.pretty.ingredients }
      },
      e: {
        margo: { ...ELEPHANT_PRESETS.e.margo.ingredients },
        audrey: { ...ELEPHANT_PRESETS.e.audrey.ingredients },
        pretty: { ...ELEPHANT_PRESETS.e.pretty.ingredients }
      }
    }
  );

  // Active additives in bowl
  const [kitchenAdditives, setKitchenAdditives] = useLocalStorage<Record<string, Record<string, string[]>>>(
    'slonovet_kitchen_additives',
    {
      m: {
        margo: [...ELEPHANT_PRESETS.m.margo.additives],
        audrey: [...ELEPHANT_PRESETS.m.audrey.additives],
        pretty: [...ELEPHANT_PRESETS.m.pretty.additives]
      },
      n: {
        margo: [...ELEPHANT_PRESETS.n.margo.additives],
        audrey: [...ELEPHANT_PRESETS.n.audrey.additives],
        pretty: [...ELEPHANT_PRESETS.n.pretty.additives]
      },
      s: {
        margo: [...ELEPHANT_PRESETS.s.margo.additives],
        audrey: [...ELEPHANT_PRESETS.s.audrey.additives],
        pretty: [...ELEPHANT_PRESETS.s.pretty.additives]
      },
      e: {
        margo: [...ELEPHANT_PRESETS.e.margo.additives],
        audrey: [...ELEPHANT_PRESETS.e.audrey.additives],
        pretty: [...ELEPHANT_PRESETS.e.pretty.additives]
      }
    }
  );

  // Track initialized bowls per meal
  const [initializedBowls, setInitializedBowls] = useState<Record<string, boolean>>({
    'm-margo': true,
    'm-audrey': true,
    'm-pretty': true,
    'n-margo': true,
    'n-audrey': true,
    'n-pretty': true,
    's-margo': true,
    's-audrey': true,
    's-pretty': true
  });

  // Devil's claw safety: strictly forbidden on empty stomach / breakfast
  useEffect(() => {
    if (activeMealTab === 'm') {
      setKitchenAdditives(prev => {
        let changed = false;
        const nextM = { ...(prev.m || {}) };
        for (const elId of ['margo', 'audrey', 'pretty']) {
          if (nextM[elId]?.includes('devils_claw')) {
            nextM[elId] = nextM[elId].filter(a => a !== 'devils_claw');
            changed = true;
          }
        }
        return changed ? { ...prev, m: nextM } : prev;
      });
    }
  }, [activeMealTab]);

  // Dispensed batches with recorded ingredients and additives for exact warehouse reversion
  const [dispensedBatches, setDispensedBatches] = useLocalStorage<Record<string, Record<string, DispensedBatch>>>(
    'slonovet_kitchen_dispensed_batches',
    {},
    ['kitchen_dispensed_batches']
  );

  // Track if ingredients/additives were modified after previously dispensing
  const [modifiedBatches, setModifiedBatches] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem('kitchen_dispensed_batches', JSON.stringify(dispensedBatches));
      const portions: Record<string, Record<string, string>> = {};
      Object.entries(dispensedBatches).forEach(([m, els]) => {
        portions[m] = {};
        Object.entries(els).forEach(([elId, batch]) => {
          if (batch?.time) portions[m][elId] = batch.time;
        });
      });
      localStorage.setItem('kitchen_dispensed_portions', JSON.stringify(portions));
    } catch {}
  }, [dispensedBatches]);

  const dispensedPortions = React.useMemo(() => {
    const portions: Record<string, Record<string, string>> = {};
    Object.entries(dispensedBatches).forEach(([m, els]) => {
      portions[m] = {};
      Object.entries(els).forEach(([elId, batch]) => {
        if (batch?.time) portions[m][elId] = batch.time;
      });
    });
    return portions;
  }, [dispensedBatches]);

  // Revert a dispensed meal: restore warehouse stock and reset draft state
  const handleRevertDispense = (meal: MealTab, elephantId: string, reason: 'cancel' | 'edit' = 'cancel') => {
    const batch = dispensedBatches[meal]?.[elephantId];
    if (!batch) return;

    const elName = getElephantName(elephantId, storeElephants);
    const mealLabel = getMealLabel(meal);
    const returnedItems: string[] = [];

    // 1. Revert base ingredients back to warehouse
    Object.entries(batch.ingredients || {}).forEach(([id, val]) => {
      if (val > 0) {
        const item = fodderInventory.find(f => f.id === id);
        const name = item ? item.name.split('(')[0].trim() : id;

        if (deductFodderKg) {
          deductFodderKg(id, -val);
        } else if (meal === 'e') {
          updateFodderAmount(id, val);
        } else {
          const deltaBags = Number((val / 25).toFixed(3));
          updateFodderAmount(id, deltaBags);
        }
        returnedItems.push(`${name} ${val} кг`);
      }
    });

    // 2. Revert additives back to warehouse (+1)
    (batch.additives || []).forEach(addId => {
      const addInfo = KITCHEN_ADDITIVES.find(a => a.id === addId);
      if (addInfo) {
        updateFodderAmount(addInfo.fodderId, 1);
        returnedItems.push(`${addInfo.label}`);
      }
    });

    // 3. Remove batch from dispensedBatches
    setDispensedBatches(prev => {
      const nextMeal = { ...(prev[meal] || {}) };
      delete nextMeal[elephantId];
      return { ...prev, [meal]: nextMeal };
    });

    if (reason === 'cancel') {
      setModifiedBatches(prev => {
        const next = { ...prev };
        delete next[`${meal}-${elephantId}`];
        return next;
      });

      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      addEvent(`↺ Отменён замес для ${elName} (${mealLabel}). Списания аннулированы, корма возвращены на склад.`);
    } else {
      setModifiedBatches(prev => ({
        ...prev,
        [`${meal}-${elephantId}`]: true
      }));

      addEvent(`✏️ Рецепт для ${elName} (${mealLabel}) изменён: предыдущий замес сброшен, корма возвращены на склад.`);
    }
  };

  const getMealLabel = (meal: MealTab) => {
    switch (meal) {
      case 'm': return 'Завтрак 7:00';
      case 'n': return 'Обед 13:00';
      case 's': return 'Полдник 17:00';
      case 'e': return 'Ужин 19:00';
    }
  };

  // Fast 1-tap reset to techcard baseline
  const applyElephantPreset = (meal: MealTab, elephantId: 'margo' | 'audrey' | 'pretty') => {
    if (dispensedBatches[meal]?.[elephantId]) {
      handleRevertDispense(meal, elephantId, 'edit');
    }

    const preset = ELEPHANT_PRESETS[meal]?.[elephantId];
    if (!preset) return;

    setKitchenIngredients(prev => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || {}),
        [elephantId]: { ...preset.ingredients }
      }
    }));

    setKitchenAdditives(prev => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || {}),
        [elephantId]: [...preset.additives]
      }
    }));

    if (navigator.vibrate) navigator.vibrate(15);
    const elName = getElephantName(elephantId, storeElephants);
    addEvent(`📋 Загружена техкарта для ${elName} (${getMealLabel(meal)})`);
  };

  const handleSelectElephant = (elId: 'margo' | 'audrey' | 'pretty') => {
    setSelectedKitchenElephant(elId);
    const key = `${activeMealTab}-${elId}`;
    if (!initializedBowls[key]) {
      applyElephantPreset(activeMealTab, elId);
      setInitializedBowls(prev => ({ ...prev, [key]: true }));
    } else {
      // Auto-populate preset if current bowl is completely empty
      const currentIngs = kitchenIngredients[activeMealTab]?.[elId] || {};
      if (Object.keys(currentIngs).length === 0) {
        applyElephantPreset(activeMealTab, elId);
      }
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // 1. Циклическое переключение утренних ингредиентов по шагам
  const toggleBreakfastIngredient = (meal: MealTab, elephantId: string, id: string, steps: number[]) => {
    if (dispensedBatches[meal]?.[elephantId]) {
      handleRevertDispense(meal, elephantId, 'edit');
    }

    setKitchenIngredients(prev => {
      const mealMap = { ...(prev[meal] || {}) };
      const elMap = { ...(mealMap[elephantId] || {}) };
      const current = elMap[id] || 0;

      // Найти текущий шаг
      const currentIndex = steps.findIndex(s => Math.abs(s - current) < 0.05);
      if (currentIndex === -1) {
        elMap[id] = steps[0];
      } else if (currentIndex < steps.length - 1) {
        elMap[id] = steps[currentIndex + 1];
      } else {
        delete elMap[id];
      }

      mealMap[elephantId] = elMap;
      return { ...prev, [meal]: mealMap };
    });

    if (navigator.vibrate) navigator.vibrate(12);
  };

  // 2. Переключение спец-каш в обед (13:00) и полдник (17:00)
  const toggleDayMashIngredient = (meal: MealTab, elephantId: string, id: string, defaultKg: number) => {
    if (dispensedBatches[meal]?.[elephantId]) {
      handleRevertDispense(meal, elephantId, 'edit');
    }

    setKitchenIngredients(prev => {
      const mealMap = { ...(prev[meal] || {}) };
      const elMap = { ...(mealMap[elephantId] || {}) };
      if (elMap[id] && elMap[id] > 0) {
        delete elMap[id];
      } else {
        // Очищаем другие дневные каши для чистой порции
        delete elMap.c15;
        delete elMap.c16;
        delete elMap.c17;
        elMap[id] = defaultKg;
      }
      mealMap[elephantId] = elMap;
      return { ...prev, [meal]: mealMap };
    });

    if (navigator.vibrate) navigator.vibrate(12);
  };

  // 3. Переключение сочных кормов на ужин (19:00)
  const toggleSucculentIngredient = (meal: MealTab, elephantId: string, id: string, defaultKg: number) => {
    if (dispensedBatches[meal]?.[elephantId]) {
      handleRevertDispense(meal, elephantId, 'edit');
    }

    setKitchenIngredients(prev => {
      const mealMap = { ...(prev[meal] || {}) };
      const elMap = { ...(mealMap[elephantId] || {}) };
      if (elMap[id] && elMap[id] > 0) {
        delete elMap[id];
      } else {
        elMap[id] = defaultKg;
      }
      mealMap[elephantId] = elMap;
      return { ...prev, [meal]: mealMap };
    });

    if (navigator.vibrate) navigator.vibrate(12);
  };

  // Переключение добавок
  const toggleKitchenAdditive = (meal: MealTab, elephantId: string, addId: string) => {
    if (addId === 'devils_claw' && meal === 'm') {
      if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
      addEvent(`⚠️ Дьявольский коготь запрещён натощак на завтрак! Назначается только в обед/полдник.`);
      return;
    }

    if (dispensedBatches[meal]?.[elephantId]) {
      handleRevertDispense(meal, elephantId, 'edit');
    }

    setKitchenAdditives(prev => {
      const mealMap = { ...(prev[meal] || {}) };
      const currentList = mealMap[elephantId] || [];
      const updated = currentList.includes(addId)
        ? currentList.filter(i => i !== addId)
        : [...currentList, addId];
      mealMap[elephantId] = updated;
      return { ...prev, [meal]: mealMap };
    });

    if (navigator.vibrate) navigator.vibrate(12);
  };

  const getFodderStock = (id: string): number => {
    const item = fodderInventory.find(f => f.id === id);
    if (!item) return 0;
    if (item.fullBagsCount !== undefined) {
      return (item.fullBagsCount * (item.bagCapacityKg || 25)) + (item.currentBagKg || 0);
    }
    return item.amount;
  };

  // Форматирование единиц измерения по регламенту
  const formatBreakfastChipLabel = (id: string, kg: number) => {
    if (id === 'c11' || id === 'c2') {
      if (kg === 1) return '1 гарец';
      if (kg === 2) return '2 гарнца';
      return `${kg} гарн`;
    }
    if (id === 'c1') {
      if (kg === 0.5) return '0.5 гарнца';
      if (kg === 1) return '1 гарец';
      return `${kg} гарн`;
    }
    if (id === 'c13') {
      if (kg === 0.3) return '0.5г / 300г';
      if (kg === 0.6) return '1 гарнец';
      return `${Math.round(kg * 1000)}г`;
    }
    if (id === 'c14') {
      return `${Math.round(kg * 1000)} гр`;
    }
    return `${kg} кг`;
  };

  // Расчёт баланса и активных веществ
  const getSelectedElephantBowl = (meal: MealTab, elephantId: string) => {
    const ings = kitchenIngredients[meal]?.[elephantId] || {};
    const adds = kitchenAdditives[meal]?.[elephantId] || [];

    const totalWeight = Object.values(ings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    // Крахмальная нагрузка (NSC): Геркулес + Овёс + Кукуруза
    const starchKg = ((ings.c11 || 0) * 0.6) + ((ings.c1 || 0) * 0.5) + ((ings.c13 || 0) * 0.7);

    // Структурное волокно (NDF): Отруби + Mono Grass
    const fiberKg = (ings.c2 || 0) + (ings.c17 || 0);

    const hasMucilage = adds.includes('psyllium');

    const activeMarkers: string[] = [];

    // Премиксы и фитодобавки
    KITCHEN_ADDITIVES.forEach(add => {
      if (adds.includes(add.id)) {
        const marker = INGREDIENT_TO_MARKER[add.id];
        if (marker && BIOCHEMICAL_MARKERS[marker] && !activeMarkers.includes(marker)) {
          activeMarkers.push(marker);
        }
      }
    });

    // Зерновые, спец-каши или сочные
    Object.keys(ings).forEach(id => {
      if ((ings[id] || 0) > 0) {
        const marker = INGREDIENT_TO_MARKER[id];
        if (marker && BIOCHEMICAL_MARKERS[marker] && !activeMarkers.includes(marker)) {
          activeMarkers.push(marker);
        }
      }
    });

    return {
      totalWeight,
      starchKg,
      fiberKg,
      hasMucilage,
      activeMarkers
    };
  };

  const handleKitchenDispense = (meal: MealTab, elephantId: string) => {
    const ings = kitchenIngredients[meal]?.[elephantId] || {};
    const adds = kitchenAdditives[meal]?.[elephantId] || [];
    const elName = getElephantName(elephantId, storeElephants);

    const logItems: string[] = [];
    let hasShortage = false;

    // Deduct base ingredients
    Object.entries(ings).forEach(([id, val]) => {
      if (val > 0) {
        const item = fodderInventory.find(f => f.id === id);
        const name = item ? item.name.split('(')[0].trim() : id;
        const isConcentrateBag = item?.fullBagsCount !== undefined;
        const totalStockKg = isConcentrateBag
          ? ((item?.fullBagsCount || 0) * (item?.bagCapacityKg || 25) + (item?.currentBagKg || 0))
          : (item ? item.amount : 0);

        if (totalStockKg <= 0) hasShortage = true;

        if (deductFodderKg) {
          deductFodderKg(id, val);
        } else if (meal === 'e') {
          updateFodderAmount(id, -val);
        } else {
          const deltaBags = Number((val / 25).toFixed(3));
          updateFodderAmount(id, -deltaBags);
        }

        const displayLabel = meal === 'm' ? formatBreakfastChipLabel(id, val) : `${val} кг`;
        logItems.push(`${name} (${displayLabel})`);
      }
    });

    // Deduct additives
    adds.forEach(addId => {
      const addInfo = KITCHEN_ADDITIVES.find(a => a.id === addId);
      if (addInfo) {
        const item = fodderInventory.find(f => f.id === addInfo.fodderId);
        const stock = item ? item.amount : 0;
        if (stock <= 0) hasShortage = true;
        updateFodderAmount(addInfo.fodderId, -1);
        logItems.push(`${addInfo.label}`);
      }
    });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isPreviouslyModified = Boolean(modifiedBatches[`${meal}-${elephantId}`]);

    setDispensedBatches(prev => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || {}),
        [elephantId]: {
          time: timeStr,
          ingredients: { ...ings },
          additives: [...adds]
        }
      }
    }));

    setModifiedBatches(prev => {
      const next = { ...prev };
      delete next[`${meal}-${elephantId}`];
      return next;
    });

    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);

    const totalWeight = Object.values(ings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const mealLabel = getMealLabel(meal);

    if (hasShortage) {
      addEvent(`⚠️ Списание при нулевом остатке! Замешано для ${elName} (${mealLabel}, ${totalWeight.toFixed(1)} кг): ${logItems.join(', ')}.`);
    } else if (isPreviouslyModified) {
      addEvent(`✓ Замес для ${elName} пересчитан и зафиксирован (${mealLabel}, ${totalWeight.toFixed(1)} кг): ${logItems.join(', ')}. Списано со склада.`);
    } else {
      addEvent(`✓ Замешано для ${elName} (${mealLabel}, ${totalWeight.toFixed(1)} кг): ${logItems.join(', ')}. Списано со склада.`);
    }
  };

  // Batch dispense for all 3 elephants at once (1-tap routine)
  const handleBatchDispenseAll = (meal: MealTab) => {
    const elephants: ('margo' | 'audrey' | 'pretty')[] = ['margo', 'audrey', 'pretty'];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newBatches: Record<string, DispensedBatch> = {};
    const updatedIngs: Record<string, Record<string, number>> = { ...(kitchenIngredients[meal] || {}) };
    const updatedAdds: Record<string, string[]> = { ...(kitchenAdditives[meal] || {}) };

    elephants.forEach(elId => {
      // If already dispensed, keep existing
      if (dispensedBatches[meal]?.[elId]) {
        newBatches[elId] = dispensedBatches[meal][elId];
        return;
      }

      // Get or initialize preset
      let ings = updatedIngs[elId] || {};
      let adds = updatedAdds[elId] || [];

      if (Object.keys(ings).length === 0) {
        const preset = ELEPHANT_PRESETS[meal]?.[elId];
        if (preset) {
          ings = { ...preset.ingredients };
          adds = [...preset.additives];
          updatedIngs[elId] = ings;
          updatedAdds[elId] = adds;
        }
      }

      // Deduct stock for base ingredients
      Object.entries(ings).forEach(([id, val]) => {
        if (val > 0) {
          if (deductFodderKg) {
            deductFodderKg(id, val);
          } else if (meal === 'e') {
            updateFodderAmount(id, -val);
          } else {
            const deltaBags = Number((val / 25).toFixed(3));
            updateFodderAmount(id, -deltaBags);
          }
        }
      });

      // Deduct stock for additives
      adds.forEach(addId => {
        const addInfo = KITCHEN_ADDITIVES.find(a => a.id === addId);
        if (addInfo) {
          updateFodderAmount(addInfo.fodderId, -1);
        }
      });

      newBatches[elId] = {
        time: timeStr,
        ingredients: { ...ings },
        additives: [...adds]
      };
    });

    setKitchenIngredients(prev => ({ ...prev, [meal]: updatedIngs }));
    setKitchenAdditives(prev => ({ ...prev, [meal]: updatedAdds }));

    setDispensedBatches(prev => ({
      ...prev,
      [meal]: {
        ...(prev[meal] || {}),
        ...newBatches
      }
    }));

    setModifiedBatches(prev => {
      const next = { ...prev };
      elephants.forEach(elId => {
        delete next[`${meal}-${elId}`];
      });
      return next;
    });

    if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
    const mealLabel = getMealLabel(meal);
    addEvent(`🥣 Замешен рацион сразу на троих (Марго, Одри, Прэтти) — ${mealLabel} по техкарте. Все порции списаны со склада.`);
  };

  const isDayMashMeal = activeMealTab === 'n' || activeMealTab === 's';
  const currentBowlIngs = kitchenIngredients[activeMealTab]?.[selectedKitchenElephant] || {};

  return (
    <div className={slideWrapperClass || "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto sm:overflow-y-hidden overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-slate-100"}>
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full h-full justify-between">
        
        {/* Header with SubTab Switcher (STRICTLY LOCAL TO 2ND SLIDE, IN NORMAL DOCUMENT FLOW) */}
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5 leading-none">
              <span>🥣</span>
              <span>{feedSubTab === 'roughage' ? 'Фураж' : 'Кухня'}</span>
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              {feedSubTab === 'roughage' ? 'Склад фуража' : 'Техкарта & Замес'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRecipeInitialMeal(activeMealTab);
                setIsRecipeOpen(true);
              }}
              className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              title="Открыть официальную технологическую карту EAZA"
            >
              <span>📋</span>
              <span className="hidden sm:inline">Техкарта</span>
            </button>

            {onFeedSubTabChange && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => onFeedSubTabChange('kitchen')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    feedSubTab !== 'roughage'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🥣 Рационы
                </button>
                <button
                  type="button"
                  onClick={() => onFeedSubTabChange('roughage')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    feedSubTab === 'roughage'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌾 Фураж
                </button>
              </div>
            )}
          </div>
        </div>

        {feedSubTab === 'roughage' ? (
          <div className="flex-1 overflow-y-auto flex flex-col justify-start">
            {roughageContent}
          </div>
        ) : (
          <>
            {/* 1. MEAL TABS (4 приёма по регламенту) */}
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
          {[
            { id: 'm' as MealTab, time: '🌅 7:00', label: 'Завтрак' },
            { id: 'n' as MealTab, time: '☀️ 13:00', label: 'Обед' },
            { id: 's' as MealTab, time: '🌇 17:00', label: 'Полдник' },
            { id: 'e' as MealTab, time: '🌙 19:00', label: 'Овощи' }
          ].map(tab => {
            const isActive = activeMealTab === tab.id;
            const allDone = KITCHEN_ELEPHANTS.every(e => Boolean(dispensedPortions[tab.id]?.[e.id]));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMealTab(tab.id);
                  const key = `${tab.id}-${selectedKitchenElephant}`;
                  if (!initializedBowls[key]) {
                    applyElephantPreset(tab.id, selectedKitchenElephant);
                    setInitializedBowls(prev => ({ ...prev, [key]: true }));
                  }
                }}
                className={`py-0.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center font-bold cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-0.5 text-[11px] font-bold leading-tight">
                  <span>{tab.time}</span>
                  {allDone && <span className="text-emerald-400 text-[9px] font-black">✓</span>}
                </div>
                <span className="text-[8.5px] text-slate-400 font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. ELEPHANT SWITCHER (1-TAP) */}
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-900/90 border border-slate-800/80 rounded-xl shrink-0">
          {KITCHEN_ELEPHANTS.map(el => {
            const isSelected = selectedKitchenElephant === el.id;
            const isDispensed = Boolean(dispensedPortions[activeMealTab]?.[el.id]);
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => handleSelectElephant(el.id)}
                className={`py-1 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white bg-slate-950/60 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs leading-none">
                  <span>{el.icon}</span>
                  <span>{el.name}</span>
                  {isDispensed && (
                    <span className={`text-[9px] font-black ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>✓</span>
                  )}
                </div>
                <span className={`text-[8px] font-medium leading-none truncate max-w-full ${isSelected ? 'text-slate-950/90 font-bold' : 'text-slate-400'}`}>
                  {el.focus}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. INGREDIENTS GENERATOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 shrink-0">
          {/* Header row with preset reset button */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              {activeMealTab === 'm' && '🌅 Утренние крупы (по техкарте):'}
              {isDayMashMeal && '🥣 Спец-миксы (готовые каши):'}
              {activeMealTab === 'e' && '🌙 Сочные корма (ужин):'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setRecipeInitialMeal(activeMealTab);
                  setIsRecipeOpen(true);
                }}
                className="text-[8.5px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Посмотреть всю техкарту рациона зоопарка"
              >
                <span>📋</span>
                <span>Техкарта</span>
              </button>
              <button
                type="button"
                onClick={() => applyElephantPreset(activeMealTab, selectedKitchenElephant)}
                className="text-[8.5px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Сбросить к техкарте слонихи"
              >
                <span>↺</span>
                <span>Норма слонихи</span>
              </button>
            </div>
          </div>

          {/* Вкладка 🌅 Завтрак 7:00 (Крупы без обрезки и с мягким переносом) */}
          {activeMealTab === 'm' && (
            <div className="grid grid-cols-3 gap-1">
              {BREAKFAST_INGREDIENTS.map(item => {
                const currentVal = kitchenIngredients.m?.[selectedKitchenElephant]?.[item.id] || 0;
                const isSelected = currentVal > 0;
                const stock = getFodderStock(item.id);
                const isZero = stock <= 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleBreakfastIngredient('m', selectedKitchenElephant, item.id, item.steps)}
                    className={`px-1 py-1 rounded-xl text-center border transition-all flex flex-col items-center justify-between min-h-[40px] cursor-pointer select-none ${
                      isSelected
                        ? isZero
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                          : 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                        : isZero
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 w-full text-center">
                      <span className="text-xs shrink-0">{item.icon}</span>
                      <span className="text-[11px] font-bold text-slate-200 whitespace-normal text-center leading-tight">
                        {item.name}
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-center pt-0.5">
                      {isZero ? (
                        <span className="text-[8.5px] text-amber-400 font-black">⚠️ 0</span>
                      ) : (
                        <span className={`text-[9.5px] font-bold font-mono px-1 py-0.2 rounded leading-tight ${
                          isSelected
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-400 opacity-80'
                        }`}>
                          {isSelected ? formatBreakfastChipLabel(item.id, currentVal) : '+'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Вкладки ☀️ 13:00 Обед и 🌇 17:00 Полдник (Спец-каши) */}
          {isDayMashMeal && (
            <div className="grid grid-cols-1 gap-1">
              {DAY_MASH_INGREDIENTS.map(item => {
                const currentKg = kitchenIngredients[activeMealTab]?.[selectedKitchenElephant]?.[item.id] || 0;
                const isSelected = currentKg > 0;
                const isRecommended = item.recommendedFor === selectedKitchenElephant;
                const stock = getFodderStock(item.id);
                const isZero = stock <= 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDayMashIngredient(activeMealTab, selectedKitchenElephant, item.id, item.defaultKg)}
                    className={`py-1 px-2 rounded-xl text-left border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : isRecommended
                        ? 'bg-slate-950 border-slate-700 hover:border-slate-500 text-slate-200'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-300' : 'text-slate-100'}`}>
                            {item.name}
                          </span>
                          {isRecommended && (
                            <span className="text-[8px] font-black uppercase tracking-tight bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 px-1 py-0.2 rounded">
                              Регламент
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 leading-tight">
                          {item.target}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isZero && <span className="text-[8.5px] text-amber-400 font-black">⚠️ 0</span>}
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {isSelected ? `${currentKg} кг ✓` : `+`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Вкладка 🌙 19:00 Ужин (Сочные корма) */}
          {activeMealTab === 'e' && (
            <div className="grid grid-cols-3 gap-1">
              {SUCCULENT_INGREDIENTS.map(item => {
                const currentKg = kitchenIngredients.e?.[selectedKitchenElephant]?.[item.id] || 0;
                const isSelected = currentKg > 0;
                const stock = getFodderStock(item.id);
                const isZero = stock <= 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSucculentIngredient('e', selectedKitchenElephant, item.id, item.defaultKg)}
                    className={`px-1 py-1 rounded-xl text-center border transition-all flex flex-col items-center justify-between min-h-[40px] cursor-pointer select-none ${
                      isSelected
                        ? isZero
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                          : 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                        : isZero
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 w-full text-center">
                      <span className="text-xs shrink-0">{item.icon}</span>
                      <span className="text-[11px] font-bold text-slate-200 whitespace-normal text-center leading-tight">
                        {item.name}
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-center pt-0.5">
                      {isZero ? (
                        <span className="text-[8.5px] text-amber-400 font-black">⚠️ 0</span>
                      ) : (
                        <span className={`text-[9.5px] font-bold font-mono px-1 py-0.2 rounded leading-tight ${
                          isSelected
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-400 opacity-80'
                        }`}>
                          {isSelected ? `${currentKg} кг` : '+'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Additives & Premixes (Компактная 2-колоночная сетка) */}
          <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              Премиксы / Добавки и фитотерапия:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {KITCHEN_ADDITIVES.map(add => {
                const isDevilsClawInBreakfast = add.id === 'devils_claw' && activeMealTab === 'm';

                if (isDevilsClawInBreakfast) {
                  return (
                    <div
                      key={add.id}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
                        addEvent(`⚠️ Ошибка: Дьявольский коготь запрещён натощак на завтрак! Только в обед/полдник.`);
                      }}
                      className="py-0.5 px-1.5 rounded-lg border border-red-900/40 bg-red-950/20 text-red-400/50 flex items-center justify-between gap-1 cursor-not-allowed select-none opacity-60 min-h-[26px]"
                      title="Только в обед со слизистым мэшем (риск гастрита натощак)"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs shrink-0">{add.icon}</span>
                        <span className="text-[10px] font-medium line-through decoration-red-500/50 truncate">{add.label}</span>
                      </div>
                      <span className="text-[8px] font-black text-red-400/90 shrink-0 border border-red-800/40 px-1 py-0.2 rounded bg-red-950/40 leading-none">
                        Блок
                      </span>
                    </div>
                  );
                }

                const activeList = kitchenAdditives[activeMealTab]?.[selectedKitchenElephant] || [];
                const isSelected = activeList.includes(add.id);
                const stock = getFodderStock(add.fodderId);
                const isZero = stock <= 0;

                return (
                  <button
                    key={add.id}
                    type="button"
                    onClick={() => toggleKitchenAdditive(activeMealTab, selectedKitchenElephant, add.id)}
                    className={`py-0.5 px-1.5 rounded-lg border transition-all flex items-center justify-between gap-1 cursor-pointer text-left min-h-[26px] ${
                      isSelected
                        ? isZero
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-purple-950/70 border-purple-500 text-purple-100 shadow-sm shadow-purple-950/50 ring-1 ring-purple-500/50'
                        : isZero
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs shrink-0">{add.icon}</span>
                      <span className={`text-[10px] font-medium leading-none truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {add.label}
                      </span>
                    </div>
                    {isZero ? (
                      <span className="text-[8px] text-amber-400 font-bold shrink-0">⚠️ 0</span>
                    ) : (
                      <span className={`text-[9.5px] font-black shrink-0 px-1 py-0.2 rounded leading-none ${
                        isSelected ? 'text-purple-200 bg-purple-900/60 border border-purple-400/50' : 'text-slate-500'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. ЗООТЕХНИЧЕСКИЙ БАЛАНСИР И БИОХИМИЯ ДЕЙСТВУЮЩИХ ВЕЩЕСТВ */}
        {(() => {
          const { totalWeight, starchKg, fiberKg, hasMucilage, activeMarkers } = getSelectedElephantBowl(activeMealTab, selectedKitchenElephant);

          const isStarchOverload = starchKg > 3.5;
          const isStarchWarning = starchKg > 2.5 && !isStarchOverload;
          const starchPct = Math.min(100, Math.round((starchKg / 5.0) * 100));

          const isFiberOptimum = fiberKg >= 1.0;
          const fiberPct = Math.min(100, Math.round((fiberKg / 3.0) * 100));

          return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 shadow-sm flex flex-col gap-0.5 shrink-0">
              {/* Строка 1: Вес замеса */}
              <div className="flex items-center justify-between gap-1 shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Вес:</span>
                  <span className="font-black text-white text-xs">{totalWeight.toFixed(1)} кг</span>
                </div>

                {isStarchOverload ? (
                  <span className="animate-pulse px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/80 text-red-300 text-[8.5px] font-black tracking-tight shrink-0 shadow-sm flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Перегруз крахмалом!</span>
                  </span>
                ) : isStarchWarning ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[8.5px] font-bold shrink-0">
                    Повышенная нагрузка
                  </span>
                ) : (
                  <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                    {isDayMashMeal ? 'Спец-рацион (каши)' : activeMealTab === 'e' ? 'Сочный рацион' : '✓ Баланс ЖКТ в норме'}
                  </span>
                )}
              </div>

              {/* Строка 2: Микро-шкалы нагрузки */}
              <div className="grid grid-cols-3 gap-1 pt-0.5 border-t border-slate-800/60 shrink-0">
                {/* Шкала 1: Крахмал */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[8.5px] leading-none">
                    <span className="font-bold text-slate-400">Крахмал:</span>
                    <span className={`font-mono font-bold ${
                      isStarchOverload ? 'text-red-400' : isStarchWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {starchKg.toFixed(1)}к
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isStarchOverload
                          ? 'bg-red-500 shadow-sm shadow-red-500/50'
                          : isStarchWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${starchPct}%` }}
                    />
                  </div>
                </div>

                {/* Шкала 2: Клетчатка */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[8.5px] leading-none">
                    <span className="font-bold text-slate-400">Клетчатка:</span>
                    <span className={`font-mono font-bold ${isFiberOptimum ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {fiberKg.toFixed(1)}к
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFiberOptimum ? 'bg-emerald-500' : fiberKg > 0 ? 'bg-slate-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${fiberPct}%` }}
                    />
                  </div>
                </div>

                {/* Шкала 3: Слизистый барьер */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[8.5px] leading-none">
                    <span className="font-bold text-slate-400 truncate">Слизистая:</span>
                    <span className={`font-bold ${hasMucilage ? 'text-sky-400' : 'text-slate-500'}`}>
                      {hasMucilage ? 'Активна' : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hasMucilage ? 'bg-sky-400 shadow-sm shadow-sky-400/40 w-full' : 'w-0 bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Строка 3: Компактная лента маркеров */}
              {activeMarkers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5 border-t border-slate-800/40">
                  {activeMarkers.map(markerKey => {
                    const marker = BIOCHEMICAL_MARKERS[markerKey];
                    if (!marker) return null;
                    return (
                      <span
                        key={markerKey}
                        className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] leading-none font-bold border shrink-0 ${marker.style}`}
                      >
                        {marker.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* 5. TECH CARD (ПАМЯТКА ПО ТЕХНИКЕ ЗАПАРИВАНИЯ) & АЛЕРТЫ */}
        <div className="flex flex-col gap-0.5 shrink-0">
          {isDayMashMeal && (
            <div className="px-2 py-0.5 bg-amber-950/70 border border-amber-500/70 rounded-lg text-amber-200 font-bold text-[9.5px] flex items-center gap-1.5 shadow-sm">
              <span className="text-xs shrink-0">⚠️</span>
              <span>Запарить строго за 20 минут до скармливания!</span>
            </div>
          )}

          {(() => {
            const currentAdds = kitchenAdditives[activeMealTab]?.[selectedKitchenElephant] || [];
            if (!currentAdds.includes('psyllium')) return null;
            return (
              <div className="px-2 py-0.5 bg-amber-950/50 border border-amber-500/60 rounded-lg text-[9.5px] text-amber-200 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="shrink-0 text-xs">⚠️</span>
                <span>Засыпать псиллиум строго за 1 мин до подачи!</span>
              </div>
            );
          })()}

          <div className="px-2 py-0.5 bg-slate-900/60 border border-slate-800/70 rounded-lg text-[9px] text-slate-300 font-medium leading-tight flex items-center gap-1.5">
            <span className="shrink-0 text-[10px]">💧</span>
            <span className="text-slate-300">
              {activeMealTab === 'm' && 'Кипяток 100°C (1:2.5) под крышку (Геркулес 30 мин). Скормить за 40 мин.'}
              {isDayMashMeal && 'Вода 35–40°C. Запарить за 20 минут до скармливания.'}
              {activeMealTab === 'e' && 'Проверить корнеплоды на отсутствие песка и гнили. Нарезать крупно.'}
            </span>
          </div>
        </div>

        {/* 6. ACTION BUTTONS: SINGLE ELEPHANT & BATCH ALL 3 */}
        <div className="shrink-0 flex items-center gap-1.5 w-full">
          {(() => {
            const isDispensed = Boolean(dispensedPortions[activeMealTab]?.[selectedKitchenElephant]);
            const timeStr = dispensedPortions[activeMealTab]?.[selectedKitchenElephant] || '';
            const elName = getElephantName(selectedKitchenElephant, storeElephants);
            const isModified = Boolean(modifiedBatches[`${activeMealTab}-${selectedKitchenElephant}`]);

            if (isDispensed) {
              return (
                <div className="flex-1 flex items-center gap-1.5 h-9 min-w-0">
                  <div className="flex-1 h-full rounded-xl bg-emerald-950/80 border border-emerald-500/60 px-2 flex items-center justify-between text-xs font-bold text-emerald-300 shadow-sm min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-emerald-400 font-black text-xs shrink-0">✓</span>
                      <span className="truncate">{elName} готов</span>
                    </div>
                    <span className="font-mono text-[9px] text-emerald-300 font-black shrink-0 bg-emerald-900/80 border border-emerald-500/50 px-1 py-0.2 rounded ml-1">
                      {timeStr}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevertDispense(activeMealTab, selectedKitchenElephant, 'cancel')}
                    className="h-full px-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 active:scale-95 border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-200 font-bold text-[10px] flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm"
                    title="Отменить фиксацию замеса и вернуть списанные корма на склад"
                  >
                    <span className="text-xs text-rose-400">↺</span>
                    <span>Отмена</span>
                  </button>
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => handleKitchenDispense(activeMealTab, selectedKitchenElephant)}
                className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-98 cursor-pointer min-w-0 px-2 truncate"
              >
                <span>✓</span>
                <span className="truncate">{isModified ? 'Пересчитать' : `Замесить для ${elName}`}</span>
              </button>
            );
          })()}

          {/* GLOBAL BATCH BUTTON: 1 CLICK FOR ALL 3 ELEPHANTS */}
          {(() => {
            const allDispensed = ['margo', 'audrey', 'pretty'].every(
              elId => Boolean(dispensedPortions[activeMealTab]?.[elId])
            );

            return (
              <button
                type="button"
                onClick={() => handleBatchDispenseAll(activeMealTab)}
                disabled={allDispensed}
                className={`h-9 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer ${
                  allDispensed
                    ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 opacity-80 cursor-default'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 active:scale-95 shadow-emerald-950/40'
                }`}
                title="Списать рацион сразу для Марго, Одри и Прэтти по регламентной техкарте в 1 клик"
              >
                <span>{allDispensed ? '✓' : '🥣'}</span>
                <span className="whitespace-nowrap">{allDispensed ? 'Все 3 готовы' : 'На троих (техкарта)'}</span>
              </button>
            );
          })()}
        </div>
        </>
        )}

      </div>

      {/* 7. FULL RATION TECH CARD MODAL */}
      <RecipeBottomSheet
        isOpen={isRecipeOpen}
        onClose={() => setIsRecipeOpen(false)}
        initialMeal={recipeInitialMeal}
      />
    </div>
  );
}
