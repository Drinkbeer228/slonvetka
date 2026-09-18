import React, { useState, useEffect } from 'react';
import { FodderItem } from '../../types';

interface KitchenSlideProps {
  slideWrapperClass: string;
  fodderInventory: FodderItem[];
  updateFodderAmount: (id: string, delta: number) => void;
  deductFodderKg?: (id: string, kg: number) => void;
  addEvent: (title: string) => void;
}

// Biochemical Active Agents & Functional markers (Понятный язык киперов)
const BIOCHEMICAL_MARKERS: Record<string, { label: string; style: string }> = {
  // Крупяные и структурные маркеры
  starch: { label: "🌾 Крахмал (энергия)", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  rutin: { label: "🌱 Рутин / Без глютена", style: "text-yellow-300 bg-yellow-950/40 border-yellow-800/50" },
  microbiota_fiber: { label: "🌿 Клетчатка ЖКТ", style: "text-emerald-300 bg-emerald-950/40 border-emerald-800/50" },
  mucins: { label: "🛡️ Слизистый барьер", style: "text-sky-300 bg-sky-950/40 border-sky-800/50" },
  // Добавки и фитотерапия (Контрастные фиолетовые бейджи понятным языком)
  nacl: { label: "💧 Для водопоя", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  calcium_mineral: { label: "💅 Ногти и подошва", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  chondro_msm: { label: "🦴 Суставы и связки", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  psyllium_gel: { label: "🧹 Вывод песка", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  anethole: { label: "💨 От вздутия / колик", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  silymarin: { label: "🛡️ Защита печени", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  harpagoside: { label: "🌿 Боль в суставах", style: "text-purple-200 bg-purple-950/90 border-purple-500/70 shadow-sm" },
  // Сочные корма (ужин)
  carotene: { label: "🥕 Каротин (вит. А)", style: "text-orange-300 bg-orange-950/40 border-orange-800/50" },
  betaine: { label: "🍠 Бетаин / Кровь", style: "text-fuchsia-300 bg-fuchsia-950/40 border-fuchsia-800/50" },
  vit_c: { label: "🍎 Витамин C", style: "text-rose-300 bg-rose-950/40 border-rose-800/50" },
  zinc_antiox: { label: "🎃 Цинк / Антиоксиданты", style: "text-amber-300 bg-amber-950/40 border-amber-800/50" },
  hydration: { label: "🍉 Гидратация", style: "text-teal-300 bg-teal-950/40 border-teal-800/50" },
  water_balance: { label: "🥒 Баланс жидкости", style: "text-emerald-300 bg-emerald-950/40 border-emerald-800/50" }
};

const INGREDIENT_TO_MARKER: Record<string, string> = {
  c1: 'starch',           // Овёс
  c5: 'starch',           // Ячмень
  c11: 'starch',          // Геркулес
  c12: 'rutin',           // Гречка
  c2: 'microbiota_fiber', // Отруби
  c3: 'microbiota_fiber', // ВТМ
  c6: 'microbiota_fiber', // Жом
  c4: 'mucins',           // Льняной жмых
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

// Clinical baseline presets per elephant and meal
const ELEPHANT_PRESETS: Record<'m' | 'n' | 'e', Record<'margo' | 'audrey' | 'pretty', { ingredients: Record<string, number>; additives: string[] }>> = {
  m: {
    margo: {
      ingredients: { c3: 1.5, c2: 1.0 },
      additives: ['calcium']
    },
    audrey: {
      ingredients: { c11: 2.0, c2: 1.0, c5: 0.5 },
      additives: ['calcium', 'salt']
    },
    pretty: {
      ingredients: { c12: 1.5, c1: 1.5, c2: 1.0 },
      additives: ['chondro']
    }
  },
  n: {
    margo: {
      ingredients: { c3: 1.0, c6: 0.5, c2: 0.5 },
      additives: ['salt', 'fennel']
    },
    audrey: {
      ingredients: { c3: 1.2, c4: 0.8, c2: 0.5 },
      additives: ['salt']
    },
    pretty: {
      ingredients: { c4: 0.8, c6: 0.8, c2: 0.5 },
      additives: ['salt', 'devils_claw', 'psyllium']
    }
  },
  e: {
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
  addEvent
}: KitchenSlideProps) {
  const [activeMealTab, setActiveMealTab] = useState<'m' | 'n' | 'e'>('m');
  const [selectedKitchenElephant, setSelectedKitchenElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');

  const KITCHEN_ELEPHANTS = [
    { id: 'margo', name: 'Марго', focus: 'Контроль массы', icon: '🐘' },
    { id: 'audrey', name: 'Одри', focus: 'Подросток / Рост', icon: '🐘' },
    { id: 'pretty', name: 'Прэтти', focus: 'Возрастная / Суставы', icon: '🐘' }
  ] as const;

  // Grains & Fiber (Breakfast & Lunch)
  const GRAIN_INGREDIENTS = [
    { id: 'c1', name: 'Овёс', icon: '🌾', defaultKg: 2.0, forbiddenInLunch: true },
    { id: 'c2', name: 'Отруби', icon: '🌾', defaultKg: 1.0 },
    { id: 'c5', name: 'Ячмень', icon: '🌾', defaultKg: 0.5, forbiddenInLunch: true },
    { id: 'c11', name: 'Геркулес', icon: '🌾', defaultKg: 2.0, forbiddenInLunch: true },
    { id: 'c12', name: 'Гречка', icon: '🥣', defaultKg: 1.5, forbiddenInLunch: true },
    { id: 'c3', name: 'ВТМ', icon: '🌿', defaultKg: 1.2 },
    { id: 'c4', name: 'Льняной жмых', icon: '🥥', defaultKg: 0.8 },
    { id: 'c6', name: 'Жом', icon: '🪵', defaultKg: 0.8 }
  ];

  // Succulent vegetables (Dinner)
  const SUCCULENT_INGREDIENTS = [
    { id: 'j1', name: 'Морковь', icon: '🥕', defaultKg: 5.0 },
    { id: 'j2', name: 'Свёкла', icon: '🟣', defaultKg: 3.5 },
    { id: 'j3', name: 'Яблоки', icon: '🍎', defaultKg: 1.5 },
    { id: 'j4', name: 'Тыква', icon: '🎃', defaultKg: 2.0 },
    { id: 'j6', name: 'Арбуз', icon: '🍉', defaultKg: 3.0 },
    { id: 'j5', name: 'Кабачки', icon: '🥒', defaultKg: 2.0 }
  ];

  // Additives / Premixes & Phytotherapy
  const KITCHEN_ADDITIVES = [
    // Базовые минералы
    { id: 'salt', label: 'Соль кормовая', sub: 'Для водопоя (жажда)', icon: '🧂', fodderId: 'c7' },
    { id: 'calcium', label: 'Кальций', sub: 'Ногти и подошва', icon: '💊', fodderId: 'c9' },
    { id: 'chondro', label: 'Хондро + МСМ', sub: 'Суставы и связки', icon: '🦴', fodderId: 'c9' },
    // Фитокурсы и гастропротекция
    { id: 'devils_claw', label: 'Дьявольский коготь', sub: 'Боль в суставах (Обед)', icon: '🌿', fodderId: 'c10' },
    { id: 'psyllium', label: 'Псиллиум', sub: 'Вывод песка', icon: '🌾', fodderId: 'c7' },
    { id: 'fennel', label: 'Фенхель / Анис', sub: 'От вздутия и колик', icon: '🌱', fodderId: 'c10' },
    { id: 'milk_thistle', label: 'Расторопша', sub: 'Защита печени', icon: '🌺', fodderId: 'c10' }
  ];

  // Current ingredients in bowl: meal -> elephantId -> ingredientId -> kg (initialized with clinical presets)
  const [kitchenIngredients, setKitchenIngredients] = useState<Record<string, Record<string, Record<string, number>>>>({
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
    e: {
      margo: { ...ELEPHANT_PRESETS.e.margo.ingredients },
      audrey: { ...ELEPHANT_PRESETS.e.audrey.ingredients },
      pretty: { ...ELEPHANT_PRESETS.e.pretty.ingredients }
    }
  });

  // Active additives in bowl: meal -> elephantId -> string[]
  const [kitchenAdditives, setKitchenAdditives] = useState<Record<string, Record<string, string[]>>>({
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
    e: {
      margo: [...ELEPHANT_PRESETS.e.margo.additives],
      audrey: [...ELEPHANT_PRESETS.e.audrey.additives],
      pretty: [...ELEPHANT_PRESETS.e.pretty.additives]
    }
  });

  // Track initialized elephants in meals so switching immediately populates preset if empty
  const [initializedBowls, setInitializedBowls] = useState<Record<string, boolean>>({
    'm-margo': true,
    'n-margo': true,
    'n-audrey': true,
    'n-pretty': true
  });

  // Zero-Error Guard against caecum acidosis and fasting devils claw
  useEffect(() => {
    if (activeMealTab === 'n') {
      setKitchenIngredients(prev => {
        let changed = false;
        const nextN = { ...(prev.n || {}) };
        for (const elId of ['margo', 'audrey', 'pretty']) {
          if (nextN[elId]?.c1 || nextN[elId]?.c5 || nextN[elId]?.c11 || nextN[elId]?.c12) {
            nextN[elId] = { ...nextN[elId] };
            delete nextN[elId].c1;
            delete nextN[elId].c5;
            delete nextN[elId].c11;
            delete nextN[elId].c12;
            changed = true;
          }
        }
        return changed ? { ...prev, n: nextN } : prev;
      });
    }

    // Devil's claw safety: strictly forbidden on empty stomach / breakfast
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

  // Dispensed timestamps per meal and elephant
  const [dispensedPortions, setDispensedPortions] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const s = localStorage.getItem('kitchen_dispensed_portions');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kitchen_dispensed_portions', JSON.stringify(dispensedPortions));
    } catch {}
  }, [dispensedPortions]);

  // Fast 1-tap reset to clinical baseline
  const applyElephantPreset = (meal: 'm' | 'n' | 'e', elephantId: 'margo' | 'audrey' | 'pretty') => {
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
    const elName = KITCHEN_ELEPHANTS.find(e => e.id === elephantId)?.name || elephantId;
    addEvent(`📋 Загружена клиническая норма для ${elName} (${meal === 'm' ? 'Завтрак' : meal === 'n' ? 'Обед' : 'Ужин'})`);
  };

  const handleSelectElephant = (elId: 'margo' | 'audrey' | 'pretty') => {
    setSelectedKitchenElephant(elId);
    const key = `${activeMealTab}-${elId}`;
    if (!initializedBowls[key]) {
      applyElephantPreset(activeMealTab, elId);
      setInitializedBowls(prev => ({ ...prev, [key]: true }));
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleKitchenIngredient = (meal: 'm' | 'n' | 'e', elephantId: string, id: string, defaultKg: number) => {
    // Zero-Error Guard against caecum acidosis: strictly forbidden in lunch
    if (meal === 'n' && (id === 'c1' || id === 'c5' || id === 'c11' || id === 'c12')) {
      if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
      addEvent(`⚠️ Риск ацидоза! Зерновые с крахмалом категорически запрещены в обед (риск колик и гибели микробиоты).`);
      return;
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

  const toggleKitchenAdditive = (meal: 'm' | 'n' | 'e', elephantId: string, addId: string) => {
    // Safety check for Devil's claw on empty stomach / breakfast
    if (addId === 'devils_claw' && meal === 'm') {
      if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
      addEvent(`⚠️ Ошибка: Дьявольский коготь запрещён натощак! Применяется только в обед со слизистым мэшем (льняной жмых).`);
      return;
    }

    setKitchenAdditives(prev => {
      const mealMap = { ...(prev[meal] || {}) };
      const list = mealMap[elephantId] || [];
      const updated = list.includes(addId)
        ? list.filter(x => x !== addId)
        : [...list, addId];
      mealMap[elephantId] = updated;
      return { ...prev, [meal]: mealMap };
    });
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const getFodderStock = (fodderId: string) => {
    const item = fodderInventory.find(f => f.id === fodderId);
    if (!item) return 0;
    if (item.fullBagsCount !== undefined && item.currentBagKg !== undefined) {
      return item.fullBagsCount * (item.bagCapacityKg || 30) + item.currentBagKg;
    }
    return item.amount;
  };

  const getSelectedElephantBowl = (meal: 'm' | 'n' | 'e', elephantId: string) => {
    const ings = kitchenIngredients[meal]?.[elephantId] || {};
    const adds = kitchenAdditives[meal]?.[elephantId] || [];

    const totalWeight = Object.values(ings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    // 1. КРАХМАЛЬНАЯ НАГРУЗКА (Starch / NSC): Овёс (c1) + Геркулес (c11) + Ячмень (c5) + Гречка (c12)
    const starchKg = (ings.c1 || 0) + (ings.c11 || 0) + (ings.c5 || 0) + (ings.c12 || 0);

    // 2. СТРУКТУРНОЕ ВОЛОКНО (Fiber / NDF): Отруби (c2) + ВТМ (c3) + Свекловичный жом (c6)
    const fiberKg = (ings.c2 || 0) + (ings.c3 || 0) + (ings.c6 || 0);

    // 3. СЛИЗИСТЫЙ ГАСТРО-БАРЬЕР (Mucins / Защита): Льняной жмых (c4) и/или Псиллиум (psyllium)
    const hasMucilage = ((ings.c4 || 0) > 0) || adds.includes('psyllium');

    // Все активные действующие вещества и добавки без дублей:
    const activeMarkers: string[] = [];

    // 1. Все выбранные премиксы и фитодобавки (фиолетовые бейджи)
    KITCHEN_ADDITIVES.forEach(add => {
      if (adds.includes(add.id)) {
        const marker = INGREDIENT_TO_MARKER[add.id];
        if (marker && BIOCHEMICAL_MARKERS[marker] && !activeMarkers.includes(marker)) {
          activeMarkers.push(marker);
        }
      }
    });

    // 2. Зерновая основа или сочные корма
    const currentFeedList = meal === 'e' ? SUCCULENT_INGREDIENTS : GRAIN_INGREDIENTS;
    currentFeedList.forEach(item => {
      if ((ings[item.id] || 0) > 0) {
        const marker = INGREDIENT_TO_MARKER[item.id];
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

  const handleKitchenDispense = (meal: 'm' | 'n' | 'e', elephantId: string) => {
    const ings = kitchenIngredients[meal]?.[elephantId] || {};
    const adds = kitchenAdditives[meal]?.[elephantId] || [];
    const elName = KITCHEN_ELEPHANTS.find(e => e.id === elephantId)?.name || elephantId;

    const logItems: string[] = [];
    let hasShortage = false;

    // Deduct base ingredients
    Object.entries(ings).forEach(([id, val]) => {
      if (val > 0) {
        const item = fodderInventory.find(f => f.id === id);
        const name = item ? item.name.split('(')[0].trim() : id;
        const isConcentrateBag = item?.fullBagsCount !== undefined;
        const totalStockKg = isConcentrateBag
          ? ((item?.fullBagsCount || 0) * (item?.bagCapacityKg || 30) + (item?.currentBagKg || 0))
          : (item ? item.amount : 0);

        if (totalStockKg <= 0) hasShortage = true;

        if (deductFodderKg) {
          deductFodderKg(id, val);
        } else if (meal === 'e') {
          // kg
          updateFodderAmount(id, -val);
        } else {
          // bags (25kg per bag)
          const deltaBags = Number((val / 25).toFixed(3));
          updateFodderAmount(id, -deltaBags);
        }
        logItems.push(`${name} ${val} кг`);
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

    setDispensedPortions(prev => {
      return {
        ...prev,
        [meal]: {
          ...(prev[meal] || {}),
          [elephantId]: timeStr
        }
      };
    });

    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);

    const totalWeight = Object.values(ings).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const mealLabel = meal === 'm' ? 'Завтрак' : meal === 'n' ? 'Обед' : 'Ужин';

    if (hasShortage) {
      addEvent(`⚠️ Списание при нулевом остатке! Замешано для ${elName} (${mealLabel}, ${totalWeight.toFixed(1)} кг): ${logItems.join(', ')}.`);
    } else {
      addEvent(`✓ Замешано для ${elName} (${mealLabel}, ${totalWeight.toFixed(1)} кг): ${logItems.join(', ')}. Списано со склада.`);
    }
  };

  return (
    <div className={slideWrapperClass}>
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <span>🥣</span>
            <span>Кухня</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
            Фуражная & Замес
          </span>
        </div>

        {/* 1. MEAL TABS */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'm', label: '🌅 Завтрак' },
            { id: 'n', label: '☀️ Обед' },
            { id: 'e', label: '🌙 Ужин' }
          ].map(tab => {
            const isActive = activeMealTab === tab.id;
            const allDone = KITCHEN_ELEPHANTS.every(e => Boolean(dispensedPortions[tab.id]?.[e.id]));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMealTab(tab.id as any)}
                className={`py-1.5 px-1 rounded-lg text-center transition-all flex items-center justify-center gap-1 font-bold text-xs cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {allDone && <span className="text-emerald-400 text-[11px]">✓</span>}
              </button>
            );
          })}
        </div>

        {/* 2. ELEPHANT SWITCHER (1-TAP) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl">
          {KITCHEN_ELEPHANTS.map(el => {
            const isSelected = selectedKitchenElephant === el.id;
            const isDispensed = Boolean(dispensedPortions[activeMealTab]?.[el.id]);
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => handleSelectElephant(el.id)}
                className={`py-1.5 px-1.5 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white bg-slate-950/60 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs leading-none">
                  <span>{el.icon}</span>
                  <span>{el.name}</span>
                  {isDispensed && (
                    <span className={`text-[10px] font-black ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>✓</span>
                  )}
                </div>
                <span className={`text-[8.5px] font-medium leading-none truncate max-w-full ${isSelected ? 'text-slate-950/80 font-bold' : 'text-slate-400'}`}>
                  {el.focus}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. INGREDIENTS GENERATOR (CHIPS FROM WAREHOUSE) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5">
          {/* Grains / Base */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
                {activeMealTab === 'e' ? 'Основа: Сочные корма' : 'Зерновые и клетчатка:'}
              </span>
              <button
                type="button"
                onClick={() => applyElephantPreset(activeMealTab, selectedKitchenElephant)}
                className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Сбросить к научно обоснованной норме слонихи"
              >
                <span>📋</span>
                <span>Норма слонихи</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(activeMealTab === 'e' ? SUCCULENT_INGREDIENTS : GRAIN_INGREDIENTS).map(item => {
                // Zero-Error Guard against caecum acidosis: Oats, Barley, Hercules, Buckwheat disabled in lunch
                const isLunchForbidden = activeMealTab === 'n' && (item as any).forbiddenInLunch;

                if (isLunchForbidden) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
                        addEvent(`⚠️ Риск колик! Зерновые с крахмалом категорически запрещены в обед (риск ацидоза слепой кишки).`);
                      }}
                      className="py-1.5 px-2 rounded-xl text-xs font-bold border border-red-900/40 bg-red-950/20 text-red-400/50 flex flex-col justify-between gap-0.5 cursor-not-allowed select-none opacity-60 transition-opacity hover:opacity-80"
                      title="Запрещено днём: риск ацидоза слепой кишки и колик"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span>{item.icon}</span>
                        <span className="truncate line-through decoration-red-500/50">{item.name}</span>
                      </div>
                      <span className="text-[8px] font-black text-red-400/90 tracking-tight leading-none">
                        ⚠️ Риск ацидоза / Блок
                      </span>
                    </div>
                  );
                }

                const currentKg = kitchenIngredients[activeMealTab]?.[selectedKitchenElephant]?.[item.id] || 0;
                const isSelected = currentKg > 0;
                const stock = getFodderStock(item.id);
                const isZero = stock <= 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleKitchenIngredient(activeMealTab, selectedKitchenElephant, item.id, item.defaultKg)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between gap-1 text-left cursor-pointer ${
                      isSelected
                        ? isZero
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                          : 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                        : isZero
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isZero ? (
                      <span className="text-[9px] text-amber-400 font-black shrink-0">⚠️0</span>
                    ) : (
                      <span className="text-[9.5px] opacity-75 font-mono shrink-0">
                        {isSelected ? `${currentKg}к` : `+`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additives & Premixes */}
          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
              Премиксы / Добавки и фитотерапия:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {KITCHEN_ADDITIVES.map(add => {
                const isDevilsClawInBreakfast = add.id === 'devils_claw' && activeMealTab === 'm';

                if (isDevilsClawInBreakfast) {
                  return (
                    <div
                      key={add.id}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
                        addEvent(`⚠️ Ошибка: Дьявольский коготь запрещён натощак на завтрак! Только в обед со слизистым мэшем.`);
                      }}
                      className="py-1 px-2 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400/50 flex items-center justify-between gap-1.5 cursor-not-allowed select-none opacity-60 transition-opacity hover:opacity-80"
                      title="Только в обед со слизистым мэшем (риск гастрита натощак)"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">{add.icon}</span>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-xs font-medium line-through decoration-red-500/50">{add.label}</span>
                          <span className="whitespace-normal text-[10px] leading-[11px] text-red-400/80 font-bold">Только в обед</span>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-black text-red-400/90 shrink-0 border border-red-800/40 px-1 py-0.5 rounded bg-red-950/40">
                        Обед
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
                    className={`py-1 px-2 rounded-xl border transition-all flex items-center justify-between gap-1.5 cursor-pointer text-left ${
                      isSelected
                        ? isZero
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-purple-950/70 border-purple-500 text-purple-100 shadow-sm shadow-purple-950/50 ring-1 ring-purple-500/50'
                        : isZero
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{add.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {add.label}
                        </span>
                        <span className={`whitespace-normal text-[10px] leading-[11px] ${isSelected ? 'text-purple-300 opacity-90' : 'text-slate-400 opacity-75'}`}>
                          {add.sub}
                        </span>
                      </div>
                    </div>
                    {isZero ? (
                      <span className="text-[8px] text-amber-400 font-bold shrink-0">⚠️ 0</span>
                    ) : (
                      <span className={`text-xs font-black shrink-0 px-1 py-0.5 rounded ${
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

          // Крахмал: 0-2.5 (зеленый), 2.5-3.5 (желтый), >3.5 (красный перегруз)
          const isStarchOverload = starchKg > 3.5;
          const isStarchWarning = starchKg > 2.5 && !isStarchOverload;
          const starchPct = Math.min(100, Math.round((starchKg / 5.0) * 100));

          // Структурное волокно: < 1.0 низкий (серый/amber), >= 1.0 норма (изумрудный)
          const isFiberOptimum = fiberKg >= 1.0;
          const fiberPct = Math.min(100, Math.round((fiberKg / 3.0) * 100));

          return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm space-y-1">
              {/* Строка 1: Вес замеса + предупреждающий бейдж при перегрузе */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Вес замеса:</span>
                  <span className="font-black text-white text-xs">{totalWeight.toFixed(1)} кг</span>
                </div>

                {isStarchOverload ? (
                  <span className="animate-pulse px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/80 text-red-300 text-[9px] font-black tracking-tight shrink-0 shadow-sm flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Перегруз крахмалом!</span>
                  </span>
                ) : isStarchWarning ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[9px] font-bold shrink-0">
                    Повышенная нагрузка
                  </span>
                ) : (
                  <span className="text-[9.5px] font-medium text-slate-500">
                    {activeMealTab === 'e' ? 'Сочный рацион' : 'Баланс ЖКТ в норме'}
                  </span>
                )}
              </div>

              {/* Строка 2: Три микро-шкалы нагрузки на кишечник */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5 border-t border-slate-800/60 shrink-0">
                {/* Шкала 1: Крахмальная нагрузка (Starch / NSC) */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9px] leading-tight">
                    <span className="font-bold text-slate-400">Крахмал:</span>
                    <span className={`font-mono font-bold ${
                      isStarchOverload ? 'text-red-400' : isStarchWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {starchKg.toFixed(1)}к
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
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

                {/* Шкала 2: Структурное волокно (Fiber / NDF) */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9px] leading-tight">
                    <span className="font-bold text-slate-400">Клетчатка:</span>
                    <span className={`font-mono font-bold ${isFiberOptimum ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {fiberKg.toFixed(1)}к
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFiberOptimum ? 'bg-emerald-500' : fiberKg > 0 ? 'bg-slate-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${fiberPct}%` }}
                    />
                  </div>
                </div>

                {/* Шкала 3: Слизистый гастро-барьер (Mucilage) */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9px] leading-tight">
                    <span className="font-bold text-slate-400 truncate">Слиз. барьер:</span>
                    <span className={`font-bold ${hasMucilage ? 'text-sky-400' : 'text-slate-500'}`}>
                      {hasMucilage ? 'Активен' : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hasMucilage ? 'bg-sky-400 shadow-sm shadow-sky-400/40 w-full' : 'w-0 bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Строка 3: Компактная лента ВСЕХ активных маркеров (без ограничений и обрезания) */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/40">
                {activeMarkers.length === 0 ? (
                  <span className="text-[9.5px] text-slate-500 font-medium">Действующие вещества не выбраны</span>
                ) : (
                  activeMarkers.map(markerKey => {
                    const marker = BIOCHEMICAL_MARKERS[markerKey];
                    if (!marker) return null;
                    return (
                      <span
                        key={markerKey}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] leading-tight font-bold border shrink-0 ${marker.style}`}
                      >
                        {marker.label}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* 5. TECH CARD (ПАМЯТКА ПО ТЕХНИКЕ ЗАПАРИВАНИЯ) */}
        <div className="px-2.5 py-1 bg-slate-900/70 border border-slate-800/80 rounded-xl text-[10px] text-slate-300 font-medium leading-snug flex items-start gap-1.5">
          <span className="shrink-0 text-xs mt-0.5">💧</span>
          <div className="flex flex-col">
            <span className="font-bold text-slate-200">
              Техкарта:
            </span>
            <span className="text-slate-300 text-[9.5px]">
              {activeMealTab === 'm' && '💧 Кипяток 100°C (1:2.5) на 2.5–3 ч под крышку (Геркулес: быстрая запарка 30 мин). Скормить за 40 мин после остывания.'}
              {activeMealTab === 'n' && '💧 Тёплая вода 25–30°C (1:6). Жидкая гидрофильная болтушка. Стимуляция перистальтики.'}
              {activeMealTab === 'e' && 'Проверить корнеплоды на отсутствие песка и гнили. Нарезать крупными кусками.'}
            </span>
          </div>
        </div>

        {/* Active Alerts (Psyllium & Devil's claw) under Techcard */}
        {(() => {
          const currentAdds = kitchenAdditives[activeMealTab]?.[selectedKitchenElephant] || [];
          const currentIngs = kitchenIngredients[activeMealTab]?.[selectedKitchenElephant] || {};
          const hasPsyllium = currentAdds.includes('psyllium');
          const hasDevilsClaw = currentAdds.includes('devils_claw');
          const hasFlax = (currentIngs.c4 || 0) > 0;

          return (
            <div className="flex flex-col gap-1">
              {hasPsyllium && (
                <div className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/60 rounded-xl text-[10px] text-amber-200 font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="shrink-0 text-xs">⚠️</span>
                  <span>Засыпать псиллиум строго за 1 мин до подачи слону! (не давать зажелироваться в тазу)</span>
                </div>
              )}
              {hasDevilsClaw && !hasFlax && (
                <div className="px-2.5 py-1 bg-red-950/50 border border-red-500/60 rounded-xl text-[10px] text-red-200 font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="shrink-0 text-xs">⚠️</span>
                  <span>Дьявольский коготь давать строго со слизистым мэшем! (добавьте льняной жмых)</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* 6. ACTION BUTTON */}
        {(() => {
          const isDispensed = Boolean(dispensedPortions[activeMealTab]?.[selectedKitchenElephant]);
          const timeStr = dispensedPortions[activeMealTab]?.[selectedKitchenElephant];
          const elName = KITCHEN_ELEPHANTS.find(e => e.id === selectedKitchenElephant)?.name || selectedKitchenElephant;

          return (
            <button
              type="button"
              onClick={() => handleKitchenDispense(activeMealTab, selectedKitchenElephant)}
              className={`w-full h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-98 cursor-pointer ${
                isDispensed
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 shadow-slate-950/50'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
              }`}
            >
              {isDispensed ? (
                <>
                  <span>✓ Замешано для {elName} в {timeStr}</span>
                  <span className="opacity-70 text-[10px] font-bold">• Повторить</span>
                </>
              ) : (
                <>
                  <span>✓ Замесить и списать со склада</span>
                </>
              )}
            </button>
          );
        })()}

      </div>
    </div>
  );
}
