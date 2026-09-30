import React, { useState, useRef } from 'react';
import { FodderItem } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useStore } from '../../store';
import { normalizeElephantSlug, getElephantName, ElephantSlug, ELEPHANTS_META } from '../../utils/elephantUtils';
import { useRole } from '../../context/RoleContext';
import { Camera, BookOpen, X, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

interface KitchenSlideProps {
  slideWrapperClass?: string;
  fodderInventory: FodderItem[];
  updateFodderAmount: (id: string, delta: number) => void;
  deductFodderKg?: (id: string, kg: number) => void;
  addEvent: (title: string) => void;
  feedSubTab?: 'kitchen' | 'roughage';
  onFeedSubTabChange?: (tab: 'kitchen' | 'roughage') => void;
  roughageContent?: React.ReactNode;
}

export type MealTab = 'm' | 'n' | 's' | 'e';

interface RationDetailItem {
  id: string;
  name: string;
  icon: string;
  amountText: string;
  isWarning?: boolean;
}

// Техкарты и справочные рецепты зоопарка для каждого приема пищи
const ELEPHANT_RATION_EXPLANATIONS: Record<MealTab, Record<ElephantSlug, {
  normKg: number;
  items: RationDetailItem[];
}>> = {
  m: {
    pretty: {
      normKg: 5.9,
      items: [
        { id: 'c11', name: 'Геркулес хлопья', icon: '🥣', amountText: '2 гарнца (~2 кг)' },
        { id: 'c2', name: 'Отруби пшеничные', icon: '🌾', amountText: '2 гарнца (~2 кг)' },
        { id: 'c1', name: 'Овёс плющеный', icon: '🌾', amountText: '1 гарнец (~1 кг)' },
        { id: 'c13', name: 'Кукуруза дроблёная', icon: '🌽', amountText: '0.5 гарнца (300 г)' },
        { id: 'c14', name: 'Семечки подсолнечника', icon: '🌻', amountText: '300 г' },
        { id: 'c17', name: 'Mono Grass гранулы', icon: '🌿', amountText: '300 г' }
      ]
    },
    margo: {
      normKg: 3.3,
      items: [
        { id: 'c11', name: 'Геркулес хлопья', icon: '🥣', amountText: '1 гарнец (~1 кг)' },
        { id: 'c2', name: 'Отруби пшеничные', icon: '🌾', amountText: '1 гарнец (~1 кг)' },
        { id: 'c1', name: 'Овёс плющеный', icon: '🌾', amountText: '0.5 гарнца (500 г)' },
        { id: 'c13', name: 'Кукуруза дроблёная', icon: '🌽', amountText: '300 г' },
        { id: 'c14', name: 'Семечки подсолнечника', icon: '🌻', amountText: '200 г' },
        { id: 'c17', name: 'Mono Grass гранулы', icon: '🌿', amountText: '300 г' }
      ]
    },
    audrey: {
      normKg: 2.9,
      items: [
        { id: 'c11', name: 'Геркулес хлопья', icon: '🥣', amountText: '1 гарнец (~1 кг)' },
        { id: 'c2', name: 'Отруби пшеничные', icon: '🌾', amountText: '1 гарнец (~1 кг)' },
        { id: 'c1', name: 'Овёс плющеный', icon: '🌾', amountText: '0.5 гарнца (500 г)' },
        { id: 'c13', name: 'Кукуруза', icon: '🚫', amountText: '0 г (ЗАПРЕТ)', isWarning: true },
        { id: 'c14', name: 'Семечки подсолнечника', icon: '🌻', amountText: '200 г' },
        { id: 'c17', name: 'Mono Grass гранулы', icon: '🌿', amountText: '200 г' }
      ]
    }
  },
  n: {
    pretty: {
      normKg: 2.0,
      items: [
        { id: 'c15', name: 'ФормаМакс Каша (спец-микс)', icon: '🥣', amountText: '2.0 кг' }
      ]
    },
    margo: {
      normKg: 1.5,
      items: [
        { id: 'c16', name: 'ОптиФорм + Мэш готовый', icon: '🥣', amountText: '1.5 кг' }
      ]
    },
    audrey: {
      normKg: 0.5,
      items: [
        { id: 'c16', name: 'ОптиФорм + Мэш готовый', icon: '🥣', amountText: '0.5 кг' }
      ]
    }
  },
  s: {
    pretty: {
      normKg: 2.0,
      items: [
        { id: 'c15', name: 'ФормаМакс Каша (спец-микс)', icon: '🥣', amountText: '2.0 кг' }
      ]
    },
    margo: {
      normKg: 1.5,
      items: [
        { id: 'c16', name: 'ОптиФорм + Мэш готовый', icon: '🥣', amountText: '1.5 кг' }
      ]
    },
    audrey: {
      normKg: 0.5,
      items: [
        { id: 'c16', name: 'ОптиФорм + Мэш готовый', icon: '🥣', amountText: '0.5 кг' }
      ]
    }
  },
  e: {
    pretty: {
      normKg: 13.0,
      items: [
        { id: 'j1', name: 'Морковь мытая', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла столовая', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j6', name: 'Арбуз сезонный / Тыква', icon: '🍉', amountText: '3.0 кг' },
        { id: 'j3', name: 'Яблоки сладкие', icon: '🍎', amountText: '1.5 кг' }
      ]
    },
    margo: {
      normKg: 12.0,
      items: [
        { id: 'j1', name: 'Морковь мытая', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла столовая', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j4', name: 'Тыква спелая', icon: '🎃', amountText: '2.0 кг' },
        { id: 'j3', name: 'Яблоки сладкие', icon: '🍎', amountText: '1.5 кг' }
      ]
    },
    audrey: {
      normKg: 12.0,
      items: [
        { id: 'j1', name: 'Морковь мытая', icon: '🥕', amountText: '5.0 кг' },
        { id: 'j2', name: 'Свёкла столовая', icon: '🟣', amountText: '3.5 кг' },
        { id: 'j5', name: 'Кабачки диетические', icon: '🥒', amountText: '2.0 кг' },
        { id: 'j3', name: 'Яблоки сладкие', icon: '🍎', amountText: '1.5 кг' }
      ]
    }
  }
};

// Нормативы списания склада на троих слонов за один приём
const MEAL_TOTAL_AMOUNTS: Record<MealTab, Record<string, number>> = {
  m: { c11: 4.0, c2: 4.0, c1: 2.0, c13: 0.6, c14: 0.7, c17: 0.8 },
  n: { c15: 2.0, c16: 2.0 },
  s: { c15: 2.0, c16: 2.0 },
  e: { j1: 15.0, j2: 10.5, j3: 4.5, j4: 2.0, j5: 2.0, j6: 3.0 }
};

export function KitchenSlide({
  slideWrapperClass,
  fodderInventory,
  updateFodderAmount,
  deductFodderKg,
  addEvent
}: KitchenSlideProps) {
  const { elephants: storeElephants, setActiveElephantId } = useStore();
  const { isKeeper } = useRole();
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

  // Фото-подтверждения выдачи по приёмам пищи: { m: { time, photoUrl }, n: ... }
  const [mealConfirmations, setMealConfirmations] = useLocalStorage<Record<string, { time: string; photoUrl?: string }>>(
    'slonovet_meal_confirmations_v1',
    {}
  );

  // Модалка базы знаний и ТБ
  const [kbOpen, setKbOpen] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Normalize selected elephant to canonical 'margo' | 'audrey' | 'pretty'
  const selectedKitchenElephant: ElephantSlug = React.useMemo(() => {
    return normalizeElephantSlug(storedActiveElephant, storeElephants);
  }, [storedActiveElephant, storeElephants]);

  const handleSelectElephant = (slug: ElephantSlug) => {
    setStoredActiveElephant(slug);
    const matched = storeElephants.find(e => normalizeElephantSlug(e.id, storeElephants) === slug);
    if (matched) {
      setActiveElephantId(matched.id);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const getMealLabel = (meal: MealTab) => {
    switch (meal) {
      case 'm': return 'Завтрак 7:00';
      case 'n': return 'Обед 13:00';
      case 's': return 'Полдник 17:00';
      case 'e': return 'Ужин 19:00';
    }
  };

  // Автоматическое списание со склада порций всех 3 слоних за этот приём
  const deductMealInventory = (meal: MealTab) => {
    const items = MEAL_TOTAL_AMOUNTS[meal];
    if (!items) return;

    Object.entries(items).forEach(([id, val]) => {
      if (deductFodderKg) {
        deductFodderKg(id, val);
      } else {
        updateFodderAmount(id, -val);
      }
    });
  };

  // Возврат на склад при отмене
  const revertMealInventory = (meal: MealTab) => {
    const items = MEAL_TOTAL_AMOUNTS[meal];
    if (!items) return;

    Object.entries(items).forEach(([id, val]) => {
      if (deductFodderKg) {
        deductFodderKg(id, -val);
      } else {
        updateFodderAmount(id, val);
      }
    });
  };

  const handlePhotoCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mealLabel = getMealLabel(activeMealTab);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const photoUrl = reader.result as string;
        setMealConfirmations(prev => ({
          ...prev,
          [activeMealTab]: { time: timeStr, photoUrl }
        }));
        deductMealInventory(activeMealTab);
        addEvent(`📷 Зафиксирована выдача: ${mealLabel} в ${timeStr} (фото тазов сохранено)`);
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      };
      reader.readAsDataURL(file);
    } else {
      // Подтверждение без фото (если диалог камеры был закрыт без снимка)
      setMealConfirmations(prev => ({
        ...prev,
        [activeMealTab]: { time: timeStr }
      }));
      deductMealInventory(activeMealTab);
      addEvent(`✓ Зафиксирована выдача: ${mealLabel} в ${timeStr}`);
      if (navigator.vibrate) navigator.vibrate(20);
    }
    e.target.value = '';
  };

  const handleCancelConfirmation = (meal: MealTab) => {
    revertMealInventory(meal);
    setMealConfirmations(prev => {
      const next = { ...prev };
      delete next[meal];
      return next;
    });
    addEvent(`↺ Отменена фиксация выдачи: ${getMealLabel(meal)} (корма возвращены на склад)`);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const currentRationSpec = ELEPHANT_RATION_EXPLANATIONS[activeMealTab]?.[selectedKitchenElephant];
  const selectedElephantMeta = ELEPHANTS_META.find(e => e.id === selectedKitchenElephant);
  const currentConfirmation = mealConfirmations[activeMealTab];
  const isMealConfirmed = Boolean(currentConfirmation);

  return (
    <div className={slideWrapperClass || "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-zinc-100"}>
      <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full h-full justify-between">
        
        {/* Hidden Camera Input for photo reporting */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={photoInputRef}
          className="hidden"
          onChange={handlePhotoCaptured}
        />

        {/* 0. HEADER С КНОПКОЙ «ПРАВИЛА И ТБ КУХНИ» */}
        <div className="flex items-center justify-between shrink-0 mb-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>🥣</span>
              <span>Кухня и Рационы</span>
            </h1>
          </div>
          
          <button
            type="button"
            onClick={() => setKbOpen(true)}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="База знаний: Правила запаривания и безопасность кухни"
          >
            <span>📖</span>
            <span>Правила и ТБ кухни</span>
          </button>
        </div>

        {/* 1. ВЫБОР ПРИЕМА ПИЩИ (4 ТАБА ПО РАСПИСАНИЮ) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl shrink-0">
          {[
            { id: 'm' as MealTab, time: '7:00', label: 'Завтрак', icon: '🌅' },
            { id: 'n' as MealTab, time: '13:00', label: 'Обед', icon: '☀️' },
            { id: 's' as MealTab, time: '17:00', label: 'Полдник', icon: '🌇' },
            { id: 'e' as MealTab, time: '19:00', label: 'Овощи', icon: '🌙' }
          ].map(tab => {
            const isActive = activeMealTab === tab.id;
            const isDone = Boolean(mealConfirmations[tab.id]);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMealTab(tab.id);
                  if (navigator.vibrate) navigator.vibrate(8);
                }}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center font-bold cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold leading-tight">
                  <span>{tab.icon}</span>
                  <span>{tab.time}</span>
                  {isDone && <span className="text-emerald-400 text-[10px] font-black">✓</span>}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. ЛАКОНИЧНЫЙ ВЫБОР СЛОНИХИ (БЕЗ ВЕСА, СТАТУСОВ И БЕЙДЖЕЙ) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl shrink-0">
          {ELEPHANTS_META.map(el => {
            const isSelected = selectedKitchenElephant === el.id;
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => handleSelectElephant(el.id)}
                className={`py-2 px-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white font-black shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 border border-zinc-800/80'
                }`}
              >
                <span className="text-sm">{el.icon}</span>
                <span className="text-xs font-bold">{el.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. НЕКЛИКАБЕЛЬНЫЙ СПРАВОЧНИК-РЕЦЕПТ (ВИЗУАЛЬНАЯ ШПАРГАЛКА) */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden justify-between">
          
          {/* Шапка рецепта */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base">{selectedElephantMeta?.icon}</span>
              <span className="text-sm font-black text-white">{selectedElephantMeta?.name}</span>
              <span className="text-xs text-zinc-400 font-bold">• {getMealLabel(activeMealTab)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 shrink-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Норма:</span>
              <span className="font-mono font-black text-emerald-400 text-xs">
                {currentRationSpec?.normKg ? `${currentRationSpec.normKg} кг` : '—'}
              </span>
            </div>
          </div>

          {/* Список ингредиентов: ЧИСТЫЙ ТЕКСТ ДЛЯ ЧТЕНИЯ */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 py-1 my-1 pr-0.5">
            {currentRationSpec?.items.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 px-1.5 flex items-center justify-between gap-2 select-text">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="text-xs font-bold text-zinc-200 truncate">{item.name}</span>
                </div>
                <span
                  className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border shrink-0 ${
                    item.isWarning
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-zinc-950 border-zinc-800 text-emerald-400'
                  }`}
                >
                  {item.amountText}
                </span>
              </div>
            ))}
          </div>

          {/* Лаконичная технологическая подсказка */}
          <div className="pt-2 border-t border-zinc-800/80 shrink-0 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-amber-400 text-xs shrink-0">💡</span>
            <span className="truncate">
              {activeMealTab === 'e'
                ? 'Мытые свежие корнеплоды, скармливать сразу в чистые кормушки'
                : activeMealTab === 'm'
                ? 'Запарка кипятком 1:2.5, настаивание под крышкой 30–40 мин'
                : 'Спец-микс теплой каши (38–42°C), раздача строго по тазам'}
            </span>
          </div>
        </div>

        {/* 4. ЕДИНСТВЕННОЕ ДЕЙСТВИЕ: МАССИВНАЯ КНОПКА ФОТО-ОТЧЕТА */}
        <div className="shrink-0 w-full pt-1">
          {isMealConfirmed ? (
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 min-h-[52px] py-2 px-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentConfirmation?.photoUrl ? (
                    <img
                      src={currentConfirmation.photoUrl}
                      alt="Фото тазов"
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-white leading-tight">Выдача зафиксирована</span>
                    <span className="text-[10px] text-emerald-300 font-mono font-bold leading-tight mt-0.5">
                      ✓ {getMealLabel(activeMealTab)} • {currentConfirmation?.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    title="Переснять фото тазов"
                  >
                    📷 Переснять
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancelConfirmation(activeMealTab)}
                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/60 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
                    title="Отменить подтверждение и вернуть корма"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5 shrink-0 text-zinc-950" />
              <span>📷 Подтвердить выдачу (Фото тазов)</span>
            </button>
          )}
        </div>

      </div>

      {/* 5. МОДАЛЬНОЕ ОКНО: БАЗА ЗНАНИЙ И ТБ КУХНИ */}
      {kbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setKbOpen(false)} />
          
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <div>
                  <h2 className="text-sm font-black text-white leading-tight">Правила и ТБ кухни</h2>
                  <p className="text-[10px] text-zinc-400 font-medium">Инструкция для киперов и стажеров</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKbOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs select-text">
              
              {/* Card 1: Запаривание */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-black">
                  <span>🥣</span>
                  <span>1. Правила запаривания каш</span>
                </div>
                <ul className="text-zinc-300 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                  <li><strong>Температура воды:</strong> строго 60–70°C (горячая вода, не кипящий пар).</li>
                  <li><strong>Пропорция:</strong> 1 часть сухой зерносмеси на 2.5 части воды.</li>
                  <li><strong>Экспозиция:</strong> настаивать под плотной крышкой 30–40 минут до полного размягчения зерна.</li>
                  <li><strong>Температура подачи:</strong> теплая (38–42°C). Категорически запрещено давать горячее 45°C.</li>
                </ul>
              </div>

              {/* Card 2: Запрет сырого овса */}
              <div className="bg-rose-950/20 border border-rose-500/40 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 font-black">
                  <span>⚠️</span>
                  <span>2. Категорический запрет сырого зерна</span>
                </div>
                <p className="text-rose-200/90 text-[11px] leading-relaxed">
                  Запрещено скармливать сырой цельный овес и ячмень в сухом виде. Необработанное зерно в ЖКТ слона вызывает брожение, метеоризм и смертельно опасный заворот кишечника.
                </p>
              </div>

              {/* Card 3: Добавки */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-black">
                  <span>💊</span>
                  <span>3. Добавки и подкормки (соль, кальций)</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Премиксы, соль и кальций вмешиваются <strong>только в уже остывшую кашу</strong> перед самой раздачей. Кипяток разрушает термолабильные витаминные комплексы.
                </p>
              </div>

              {/* Card 4: Дьявольский коготь */}
              <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-black">
                  <span>🚫</span>
                  <span>4. Дьявольский коготь (Devil's Claw)</span>
                </div>
                <p className="text-amber-200/90 text-[11px] leading-relaxed">
                  Строго запрещено давать натощак на утренний завтрак (7:00). Может вызывать эрозивное раздражение слизистой желудка. Дается только в обед или полдник с основным кормом.
                </p>
              </div>

              {/* Card 5: Санитария */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-black">
                  <span>🧼</span>
                  <span>5. Санитария и дезинфекция тазов</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  После каждого кормления тазы тщательно моются горячей водой щетками без применения токсичной химии и просушиваются <strong>вверх дном</strong> на вентилируемых решетках.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setKbOpen(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs transition-colors cursor-pointer"
              >
                Понятно, закрыть
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
