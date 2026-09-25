import React, { useState, useEffect } from 'react';
import { FodderItem } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useStore } from '../../store';
import { normalizeElephantSlug, getElephantName, ElephantSlug, ELEPHANTS_META } from '../../utils/elephantUtils';
import { useRole } from '../../context/RoleContext';

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

// Регламент кормления (по реальной техкарте зоопарка)
const ELEPHANT_PRESETS: Record<MealTab, Record<'margo' | 'audrey' | 'pretty', { ingredients: Record<string, number>; additives: string[] }>> = {
  m: {
    // 🌅 7:00 Завтрак (по обновлённой техкарте):
    // Прэтти: Геркулес 2 гарнца, Отруби 2 гарнца, Овес 1 гарнец, Кукуруза 0.5 гарнца (300 гр), Семечки 300 гр, Mono Grass 0.3 кг (вводить постепенно)
    pretty: {
      ingredients: { c11: 2.0, c2: 2.0, c1: 1.0, c13: 0.3, c14: 0.3, c17: 0.3 },
      additives: []
    },
    // Марго: Геркулес 1 гарнец, Отруби 1 гарнец, Овес 0.5 гарнца, Кукуруза 300 гр, Семечки 200 гр, Mono Grass 0.3 кг
    margo: {
      ingredients: { c11: 1.0, c2: 1.0, c1: 0.5, c13: 0.3, c14: 0.2, c17: 0.3 },
      additives: []
    },
    // Одри: Геркулес 1 гарнец, Отруби 1 гарнец, Овес 0.5 гарнца, Семечки 200 гр, Mono Grass 0.2 кг (без кукурузы)
    audrey: {
      ingredients: { c11: 1.0, c2: 1.0, c1: 0.5, c14: 0.2, c17: 0.2 },
      additives: []
    }
  },
  n: {
    // ☀️ 13:00 Обед:
    // Прэтти: ФормаМакс Каша 2 кг
    pretty: {
      ingredients: { c15: 2.0 },
      additives: []
    },
    // Марго: ОптиФорм + Структокаша + Мэш 1.5 кг
    margo: {
      ingredients: { c16: 1.5 },
      additives: []
    },
    // Одри: ОптиФорм + Структокаша + Мэш 0.5 кг
    audrey: {
      ingredients: { c16: 0.5 },
      additives: []
    }
  },
  s: {
    // 🌇 17:00 Полдник:
    // Прэтти: ФормаМакс Каша 2 кг
    pretty: {
      ingredients: { c15: 2.0 },
      additives: []
    },
    // Марго: ОптиФорм + Структокаша + Мэш 1.5 кг
    margo: {
      ingredients: { c16: 1.5 },
      additives: []
    },
    // Одри: ОптиФорм + Структокаша + Мэш 0.5 кг
    audrey: {
      ingredients: { c16: 0.5 },
      additives: []
    }
  },
  e: {
    // 🌙 19:00 Овощи:
    margo: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j4: 2.0 }, additives: [] },
    audrey: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j5: 2.0 }, additives: [] },
    pretty: { ingredients: { j1: 5.0, j2: 3.5, j3: 1.5, j6: 3.0 }, additives: [] }
  }
};

interface RationDetailItem {
  id: string;
  name: string;
  icon: string;
  amountText: string;
  why?: string;
  isWarning?: boolean;
}

// Детальные рационы: компактные данные (только крупы и дозировка)
const ELEPHANT_RATION_EXPLANATIONS: Record<MealTab, Record<'margo' | 'audrey' | 'pretty', {
  focusBadge: string;
  normKg: number;
  items: RationDetailItem[];
}>> = {
  m: {
    pretty: {
      focusBadge: 'Возрастная • Увеличенная порция',
      normKg: 5.9,
      items: [
        { id: 'c11', name: 'Геркулес', icon: '🥣', amountText: '2 гарнца' },
        { id: 'c2', name: 'Отруби', icon: '🌾', amountText: '2 гарнца' },
        { id: 'c1', name: 'Овёс', icon: '🌾', amountText: '1 гарнец' },
        { id: 'c13', name: 'Кукуруза', icon: '🌽', amountText: '0.5 гарнца' },
        { id: 'c14', name: 'Семечки', icon: '🌻', amountText: '300 г' },
        { id: 'c17', name: 'Mono Grass', icon: '🌿', amountText: '0.3 кг' }
      ]
    },
    margo: {
      focusBadge: 'Молодая • Активный рост',
      normKg: 3.3,
      items: [
        { id: 'c11', name: 'Геркулес', icon: '🥣', amountText: '1 гарнец' },
        { id: 'c2', name: 'Отруби', icon: '🌾', amountText: '1 гарнец' },
        { id: 'c1', name: 'Овёс', icon: '🌾', amountText: '0.5 гарнца' },
        { id: 'c13', name: 'Кукуруза', icon: '🌽', amountText: '0.5 гарнца' },
        { id: 'c14', name: 'Семечки', icon: '🌻', amountText: '200 г' },
        { id: 'c17', name: 'Mono Grass', icon: '🌿', amountText: '0.3 кг' }
      ]
    },
    audrey: {
      focusBadge: 'Бережный ЖКТ • Без кукурузы',
      normKg: 2.9,
      items: [
        { id: 'c11', name: 'Геркулес', icon: '🥣', amountText: '1 гарнец' },
        { id: 'c2', name: 'Отруби', icon: '🌾', amountText: '1 гарнец' },
        { id: 'c1', name: 'Овёс', icon: '🌾', amountText: '0.5 гарнца' },
        { id: 'c13', name: 'Кукуруза', icon: '🚫', amountText: '0 г (ЗАПРЕТ)', isWarning: true },
        { id: 'c14', name: 'Семечки', icon: '🌻', amountText: '200 г' },
        { id: 'c17', name: 'Mono Grass', icon: '🌿', amountText: '0.2 кг' }
      ]
    }
  },
  n: {
    pretty: {
      focusBadge: 'Возрастной спец-микс',
      normKg: 2.0,
      items: [
        { id: 'c15', name: 'ФормаМакс', icon: '🥣', amountText: '2.0 кг' }
      ]
    },
    margo: {
      focusBadge: 'Энергетический микс',
      normKg: 1.5,
      items: [
        { id: 'c16', name: 'ОптиФорм / Мэш', icon: '🥣', amountText: '1.5 кг' }
      ]
    },
    audrey: {
      focusBadge: 'Диетическая норма',
      normKg: 0.5,
      items: [
        { id: 'c16', name: 'ОптиФорм / Мэш', icon: '🥣', amountText: '0.5 кг' }
      ]
    }
  },
  s: {
    pretty: {
      focusBadge: 'Дневной спец-микс',
      normKg: 2.0,
      items: [
        { id: 'c15', name: 'ФормаМакс', icon: '🥣', amountText: '2.0 кг' }
      ]
    },
    margo: {
      focusBadge: 'Полнорационный микс',
      normKg: 1.5,
      items: [
        { id: 'c16', name: 'ОптиФорм / Мэш', icon: '🥣', amountText: '1.5 кг' }
      ]
    },
    audrey: {
      focusBadge: 'Диетический микс',
      normKg: 0.5,
      items: [
        { id: 'c16', name: 'ОптиФорм / Мэш', icon: '🥣', amountText: '0.5 кг' }
      ]
    }
  },
  e: {
    pretty: {
      focusBadge: 'Сочные корнеплоды',
      normKg: 13.0,
      items: [
        { id: 'j1', name: 'Морковь', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j3', name: 'Яблоки', icon: '🍎', amountText: '1.5 кг' },
        { id: 'j6', name: 'Арбуз / Тыква', icon: '🍉', amountText: '3.0 кг' }
      ]
    },
    margo: {
      focusBadge: 'Свежие корнеплоды',
      normKg: 12.0,
      items: [
        { id: 'j1', name: 'Морковь', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j3', name: 'Яблоки', icon: '🍎', amountText: '1.5 кг' },
        { id: 'j4', name: 'Тыква', icon: '🎃', amountText: '2.0 кг' }
      ]
    },
    audrey: {
      focusBadge: 'Диетические сочные',
      normKg: 12.0,
      items: [
        { id: 'j1', name: 'Морковь', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j3', name: 'Яблоки', icon: '🍎', amountText: '1.5 кг' },
        { id: 'j5', name: 'Кабачки', icon: '🥒', amountText: '2.0 кг' }
      ]
    }
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
  const { isChief, isKeeper, roleConfig } = useRole();
  const canInteract = isKeeper;
  const [activeMealTab, setActiveMealTab] = useLocalStorage<MealTab>(
    'slonovet_meal_time',
    'm',
    ['kitchen_active_meal_tab']
  );
  const [storedActiveElephant, setStoredActiveElephant] = useLocalStorage<string>(
    'slonovet_active_elephant',
    'margo'
  );
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

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

  // 1. ИНГРЕДИЕНТЫ ЗАВТРАКА (7:00): базовые крупы + Mono Grass
  const BREAKFAST_INGREDIENTS = [
    { id: 'c11', name: 'Геркулес', icon: '🥣', steps: [1.0, 2.0], defaultKg: 1.0 },
    { id: 'c2', name: 'Отруби', icon: '🌾', steps: [1.0, 2.0], defaultKg: 1.0 },
    { id: 'c1', name: 'Овёс', icon: '🌾', steps: [0.5, 1.0], defaultKg: 0.5 },
    { id: 'c13', name: 'Кукуруза', icon: '🌽', steps: [0.3, 0.6], defaultKg: 0.3 },
    { id: 'c14', name: 'Семечки', icon: '🌻', steps: [0.1, 0.2, 0.3], defaultKg: 0.2 },
    { id: 'c17', name: 'Mono Grass', icon: '🌿', steps: [0.2, 0.3, 0.5], defaultKg: 0.3 },
  ];

  // 2. ДНЕВНЫЕ СПЕЦ-КАШИ (13:00 и 17:00): готовые миксы по техкарте
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
      name: 'ОптиФорм + Структокаша + Мэш',
      target: selectedKitchenElephant === 'audrey' ? 'Для Одри (0.5 кг)' : 'Для Марго (1.5 кг)',
      icon: '🥣',
      defaultKg: selectedKitchenElephant === 'audrey' ? 0.5 : 1.5,
      recommendedFor: selectedKitchenElephant === 'pretty' ? 'margo' : selectedKitchenElephant
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

  // 4. ДОБАВКИ (сохранены только для обратной совместимости истории)
  const KITCHEN_ADDITIVES = [
    { id: 'salt', label: 'Соль кормовая', sub: 'Для водопоя', icon: '🧂', fodderId: 'c7' },
    { id: 'calcium', label: 'Кальций', sub: 'Ногти и подошва', icon: '💊', fodderId: 'c9' },
    { id: 'chondro', label: 'Хондро + МСМ', sub: 'Суставы и связки', icon: '🦴', fodderId: 'c9' }
  ];

  // Current ingredients in bowl
  const [kitchenIngredients, setKitchenIngredients] = useLocalStorage<Record<string, Record<string, Record<string, number>>>>(
    'slonovet_kitchen_ingredients_v3',
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
    if (id === 'c17') {
      if (selectedKitchenElephant === 'pretty' && Math.abs(kg - 0.3) < 0.05) {
        return '0.3 кг (ввод)';
      }
      return `${kg} кг`;
    }
    return `${kg} кг`;
  };

  // Расчёт итогового веса замеса по техкарте
  const getSelectedElephantBowl = (meal: MealTab, elephantId: string) => {
    const ings = kitchenIngredients[meal]?.[elephantId] || {};
    const totalWeight = Object.values(ings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    return {
      totalWeight
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
  const currentRationSpec = ELEPHANT_RATION_EXPLANATIONS[activeMealTab]?.[selectedKitchenElephant];
  const { totalWeight } = getSelectedElephantBowl(activeMealTab, selectedKitchenElephant);
  const isDispensed = Boolean(dispensedPortions[activeMealTab]?.[selectedKitchenElephant]);
  const dispensedTime = dispensedPortions[activeMealTab]?.[selectedKitchenElephant] || '';
  const currentElephantName = getElephantName(selectedKitchenElephant, storeElephants);
  const allDispensed = (['margo', 'audrey', 'pretty'] as ElephantSlug[]).every(
    elId => Boolean(dispensedPortions[activeMealTab]?.[elId])
  );

  return (
    <div className={slideWrapperClass || "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto sm:overflow-y-hidden overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-slate-100"}>
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full h-full justify-between">
        
        {/* 0. HEADER */}
        <div className="flex items-center justify-between shrink-0 mb-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
              <span>🥣</span>
              <span>Кухня и Рационы</span>
            </h1>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
            Запарка и выдача
          </span>
        </div>

        {/* 1. MEAL TABS (4 приёма по регламенту) */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
              {[
                { id: 'm' as MealTab, time: '🌅 7:00', label: 'Завтрак' },
                { id: 'n' as MealTab, time: '☀️ 13:00', label: 'Обед' },
                { id: 's' as MealTab, time: '🌇 17:00', label: 'Полдник' },
                { id: 'e' as MealTab, time: '🌙 19:00', label: 'Овощи' }
              ].map(tab => {
                const isActive = activeMealTab === tab.id;
                const tabAllDone = KITCHEN_ELEPHANTS.every(e => Boolean(dispensedPortions[tab.id]?.[e.id]));
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
                    className={`py-1 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center font-bold cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 text-[11px] font-bold leading-tight">
                      <span>{tab.time}</span>
                      {tabAllDone && <span className="text-emerald-400 text-[10px] font-black">✓</span>}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium leading-none">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 2. ELEPHANT SWITCHER: КОМУ ДАВАТЬ + СТАТУС СДЕЛАНО ЛИ */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl shrink-0">
              {KITCHEN_ELEPHANTS.map(el => {
                const isSelected = selectedKitchenElephant === el.id;
                const doneTime = dispensedPortions[activeMealTab]?.[el.id];
                const spec = ELEPHANT_RATION_EXPLANATIONS[activeMealTab]?.[el.id];
                const isElDispensed = Boolean(doneTime);

                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => handleSelectElephant(el.id)}
                    className={`py-1.5 px-1.5 rounded-xl text-center transition-all flex flex-col items-center justify-between min-h-[50px] cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-slate-950 shadow-md font-black'
                        : isElDispensed
                        ? 'bg-emerald-950/50 border border-emerald-500/50 text-slate-200'
                        : 'text-slate-300 hover:text-white bg-slate-950/60 border border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs leading-none">
                      <span>{el.icon}</span>
                      <span>{el.name}</span>
                      {isElDispensed && (
                        <span className={`text-[10px] font-black ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>✓</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between w-full mt-1 pt-0.5 border-t border-black/10 dark:border-white/10 text-[9.5px]">
                      <span className={`font-mono font-bold ${isSelected ? 'text-slate-950' : 'text-slate-300'}`}>
                        {spec?.normKg ? `${spec.normKg} кг` : ''}
                      </span>
                      <span className={`text-[8.5px] font-semibold ${isSelected ? 'text-slate-950/90' : isElDispensed ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                        {isElDispensed ? doneTime : 'Ожидает'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 4. РАЦИОН ВЫБРАННОЙ СЛОНИХИ: КОМПАКТНЫЙ ALL-IN-ONE СПИСОК */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col flex-1 min-h-0 overflow-y-auto gap-2 shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-black text-slate-100 shrink-0">
                    {currentElephantName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    {currentRationSpec?.focusBadge || 'Норматив рациона'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isDispensed ? (
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 border border-emerald-500/60 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                      <span>✓ Замешано</span>
                      <span className="font-mono text-emerald-200">({dispensedTime})</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>⏳ Ожидает</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Items List: Компактная плотная сетка плашек без лекций и научного текста */}
              <div className="grid grid-cols-2 gap-1.5 py-0.5 overflow-y-auto pr-0.5 flex-1">
                {currentRationSpec?.items.map(item => {
                  return (
                    <div
                      key={item.id}
                      className={`px-2 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all min-h-[36px] ${
                        item.isWarning
                          ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                          : 'bg-slate-950/80 border-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs shrink-0">{item.icon}</span>
                        <span className="text-[11px] font-bold text-slate-200 whitespace-normal leading-tight break-words">
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] sm:text-[10.5px] font-mono font-black px-1.5 py-0.5 rounded-md shrink-0 border whitespace-nowrap ${
                          item.isWarning
                            ? 'bg-rose-950 border-rose-500/60 text-rose-300'
                            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {item.amountText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Weight & Customize toggle */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Итого:</span>
                  <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg shadow-inner">
                    {totalWeight.toFixed(1)} кг
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyElephantPreset(activeMealTab, selectedKitchenElephant)}
                    disabled={!canInteract}
                    className={`text-[9.5px] font-bold px-2 py-1 rounded-lg transition-colors ${
                      !canInteract ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed' : 'text-slate-400 hover:text-emerald-300 bg-slate-950 border border-slate-800 cursor-pointer'
                    }`}
                    title="Сбросить к базовой норме регламента"
                  >
                    ↺ К норме
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomizeOpen(prev => !prev)}
                    className="text-[9.5px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-800/60 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    {isCustomizeOpen ? 'Скрыть' : '⚙️ Подстроить'}
                  </button>
                </div>
              </div>

              {/* Optional Customizer (Clean steppers if keeper needs to adjust custom grams) */}
              {isCustomizeOpen && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 mt-1 shrink-0 animate-in fade-in duration-150">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
                    Точная подстройка замеса ({currentElephantName}):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeMealTab === 'm' && BREAKFAST_INGREDIENTS.map(item => {
                      const curVal = kitchenIngredients.m?.[selectedKitchenElephant]?.[item.id] || 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                          <span className="text-[11px] font-medium text-slate-300">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleBreakfastIngredient('m', selectedKitchenElephant, item.id, item.steps)}
                            disabled={!canInteract}
                            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                              !canInteract ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 cursor-pointer'
                            }`}
                          >
                            {curVal > 0 ? formatBreakfastChipLabel(item.id, curVal) : '+'}
                          </button>
                        </div>
                      );
                    })}
                    {isDayMashMeal && DAY_MASH_INGREDIENTS.map(item => {
                      const curVal = kitchenIngredients[activeMealTab]?.[selectedKitchenElephant]?.[item.id] || 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                          <span className="text-[11px] font-medium text-slate-300 whitespace-normal leading-tight">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleDayMashIngredient(activeMealTab, selectedKitchenElephant, item.id, item.defaultKg)}
                            disabled={!canInteract}
                            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${
                              !canInteract ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'text-amber-400 bg-amber-950/80 border border-amber-500/40 cursor-pointer'
                            }`}
                          >
                            {curVal > 0 ? `${curVal} кг` : '+'}
                          </button>
                        </div>
                      );
                    })}
                    {activeMealTab === 'e' && SUCCULENT_INGREDIENTS.map(item => {
                      const curVal = kitchenIngredients.e?.[selectedKitchenElephant]?.[item.id] || 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                          <span className="text-[11px] font-medium text-slate-300">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleSucculentIngredient('e', selectedKitchenElephant, item.id, item.defaultKg)}
                            disabled={!canInteract}
                            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                              !canInteract ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 cursor-pointer'
                            }`}
                          >
                            {curVal > 0 ? `${curVal} кг` : '+'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* NON-KEEPER READ-ONLY BANNER */}
            {!canInteract && (
              <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between">
                <span>🔒 Режим просмотра кухни: списывать рационы могут только киперы</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">{roleConfig.shortLabel}</span>
              </div>
            )}

            {/* 5. МИКРО-ПАМЯТКА ПО ЗАПАРКЕ И РЕГЛАМЕНТУ */}
            <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-xs font-medium flex items-center gap-1.5 leading-tight">
              <span className="whitespace-normal text-xs leading-tight">
                {activeMealTab === 'e'
                  ? '⚠️ Напоминание: Свежие мытые корнеплоды и нарезка (скармливать сразу в кормушки)'
                  : '⚠️ Напоминание: Запарка 1:2.5 кипятком под крышку. Настаивать 30 мин (скармливать теплым, не горячее 45°C)'}
              </span>
            </div>

            {/* 6. ACTION BUTTONS: SINGLE ELEPHANT & BATCH ALL 3 */}
            <div className="shrink-0 flex items-center gap-2 w-full">
              {isDispensed ? (
                <div className="flex-1 flex items-center gap-1.5 min-h-[44px] min-w-0">
                  <div className="flex-1 min-h-[44px] py-1 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 px-3 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-300 shadow-sm min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-emerald-400 font-black text-sm shrink-0">✓</span>
                      <span className="whitespace-normal leading-tight text-xs font-bold">{currentElephantName} готов</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-300 font-black shrink-0 bg-emerald-900/80 border border-emerald-500/50 px-2 py-0.5 rounded-lg ml-1">
                      {dispensedTime}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={!canInteract ? undefined : () => handleRevertDispense(activeMealTab, selectedKitchenElephant, 'cancel')}
                    disabled={!canInteract}
                    className={`min-h-[44px] px-3.5 rounded-2xl border font-bold text-xs flex items-center gap-1 shrink-0 transition-all shadow-sm ${
                      !canInteract
                        ? 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-slate-900 hover:bg-rose-950/60 active:scale-95 border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-200 cursor-pointer'
                    }`}
                    title={!canInteract ? 'Режим наблюдателя: отмена заблокирована' : 'Отменить замес и вернуть корма на склад'}
                  >
                    <span className="text-sm text-rose-400">↺</span>
                    <span>Отмена</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={!canInteract ? undefined : () => handleKitchenDispense(activeMealTab, selectedKitchenElephant)}
                  disabled={!canInteract}
                  className={`flex-1 min-h-[44px] py-1.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md min-w-0 leading-tight ${
                    !canInteract
                      ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-98 cursor-pointer'
                  }`}
                  title={!canInteract ? 'Только киперы могут проводить замес' : `Замесить рацион для ${currentElephantName}`}
                >
                  <span className="text-sm shrink-0">✓</span>
                  <span className="whitespace-normal text-center leading-tight text-[11px] sm:text-xs">
                    {!canInteract ? `${currentElephantName} (просмотр)` : `Замесить для ${currentElephantName} (${totalWeight.toFixed(1)} кг)`}
                  </span>
                </button>
              )}

              {/* GLOBAL BATCH BUTTON: 1 CLICK FOR ALL 3 ELEPHANTS */}
              <button
                type="button"
                onClick={!canInteract ? undefined : () => handleBatchDispenseAll(activeMealTab)}
                disabled={!canInteract || allDispensed}
                className={`min-h-[44px] py-1.5 px-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 leading-tight ${
                  !canInteract
                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                    : allDispensed
                    ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 opacity-80 cursor-default'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 active:scale-95 shadow-emerald-950/40 cursor-pointer'
                }`}
                title={!canInteract ? 'Только киперы могут проводить замес' : 'Списать рацион сразу для Марго, Одри и Прэтти по регламенту в 1 клик'}
              >
                <span className="shrink-0">{allDispensed ? '✓' : '🥣'}</span>
                <span className="whitespace-nowrap">{allDispensed ? 'Все 3 готовы' : 'На троих (по норме)'}</span>
              </button>
            </div>

      </div>
    </div>
  );
}
