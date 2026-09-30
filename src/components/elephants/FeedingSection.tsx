import React, { useState } from 'react';
import {
  CheckCircle2, X, ChevronDown, ChevronUp, AlertTriangle, Archive, Plus, Minus,
  Package, Clock, Sparkles
} from 'lucide-react';
import type { ElephantDailyMetrics, FeedingSlot, DailyShift } from '../../types/shift';
import type { FodderItem } from '../../types';
import { FEEDING_SCHEDULE, getRecipeForElephant, type FeedingRecipe } from '../../data/feedingSchedule';
import { FodderStorageSlide } from '../daily-shift/FodderStorageSlide';
import { SHIFT_ALERTS_CONFIG } from '../../config/shiftAlerts';

interface FeedingSectionProps {
  elephantId: string;
  elephantName: string;
  metric: ElephantDailyMetrics;
  shift: DailyShift | null;
  fodderInventory: FodderItem[];
  onMarkServed: (slot: FeedingSlot) => void;
  onToggleWaterCheck: () => void;
  onUpdateFodder: (field: 'hay_bales_distributed' | 'hay_bags_distributed', delta: number) => void;
  triggerHaptic?: (ms?: number) => void;
}

/**
 * Единый блок «Кухня, Поение и Склад сена»
 * Объединяет:
 * 1. Слоты кормления (текущий слот + аккордеон всех рационов + техкарты)
 * 2. Тумблер поилки
 * 3. Раздачу тюков сена с авто-списанием и вечерней подсказкой
 */
export function FeedingSection({
  elephantId,
  elephantName,
  metric,
  shift,
  fodderInventory,
  onMarkServed,
  onToggleWaterCheck,
  onUpdateFodder,
  triggerHaptic,
}: FeedingSectionProps) {
  const [recipeOpen, setRecipeOpen] = useState<FeedingRecipe | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isServed = (slot: FeedingSlot) =>
    metric.feeding_records?.find(r => r.slot === slot)?.served || false;

  // Evening hay calculation
  const currentHour = now.getHours();
  const isEvening = currentHour >= SHIFT_ALERTS_CONFIG.EVENING_HAY_CHECK_HOUR;
  const distributedBales = shift?.hay_bales_distributed ?? 0;
  const targetBales = SHIFT_ALERTS_CONFIG.DAILY_HAY_BALES_TARGET;
  const missingBales = Math.max(0, targetBales - distributedBales);

  // Hay bales stock from warehouse
  const hayBalesItem = fodderInventory.find(
    (item) => item.parentId === 'bales' || item.name.toLowerCase().includes('тюк')
  );
  const currentBalesStock = hayBalesItem?.amount ?? 180;
  const isLowStock = currentBalesStock < 25;

  // Find the active schedule slot closest to current time
  const currentSlot = FEEDING_SCHEDULE.reduce((prev, curr) => {
    const [ph, pm] = prev.time.split(':').map(Number);
    const [ch, cm] = curr.time.split(':').map(Number);
    const prevDiff = Math.abs(ph * 60 + pm - currentMinutes);
    const currDiff = Math.abs(ch * 60 + cm - currentMinutes);
    return currDiff < prevDiff ? curr : prev;
  }, FEEDING_SCHEDULE[0]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Кормокухня и поение • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Рационы, Поилка и Сено
          </h2>
        </div>
        <div className="text-2xl">🥣</div>
      </div>

      {/* ═══ 1. ТЕКУЩИЙ СЛОТ КОРМЛЕНИЯ + АККОРДЕОН ═══ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">
            {showAllSlots ? 'Все рационы дня (4):' : 'Текущее кормление по расписанию:'}
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.(10);
              setShowAllSlots(!showAllSlots);
            }}
            className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>{showAllSlots ? 'Свернуть' : 'Все рационы (4)'}</span>
            {showAllSlots ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Display either all slots or just current slot */}
        {(showAllSlots ? FEEDING_SCHEDULE : [currentSlot]).map((scheduleSlot) => {
          const served = isServed(scheduleSlot.slot);
          const recipe = getRecipeForElephant(elephantId, scheduleSlot.slot);
          const icon = scheduleSlot.slot === 'breakfast' ? '🥣' : scheduleSlot.slot === 'lunch' ? '🥕' : scheduleSlot.slot === 'snack' ? '🍌' : '🌾';

          return (
            <div
              key={scheduleSlot.slot}
              className={`rounded-2xl border p-3.5 transition-all flex flex-col gap-2.5 ${
                served
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white leading-tight">
                        {scheduleSlot.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {scheduleSlot.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 break-words">
                      {scheduleSlot.description}
                    </p>
                  </div>
                </div>

                {/* Served toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(15);
                    onMarkServed(scheduleSlot.slot);
                  }}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation shrink-0 ${
                    served
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                      : 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-md'
                  }`}
                >
                  {served && <CheckCircle2 size={16} className="text-emerald-400" />}
                  <span>{served ? 'Выдано ✓' : 'Отметить'}</span>
                </button>
              </div>

              {/* Recipe button & preview */}
              {recipe && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px] break-words flex-1 pr-2">
                    Норма: <strong className="text-zinc-200">{recipe.ingredients.map(i => `${i.name} ${i.amount}`).join(', ')}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      setRecipeOpen(recipe);
                    }}
                    className="text-[11px] text-emerald-400 font-bold shrink-0 hover:underline cursor-pointer"
                  >
                    Техкарта
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ 2. ПОИЛКА ВЫМЫТА И ЗАПОЛНЕНА ═══ */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic?.(15);
          onToggleWaterCheck();
        }}
        className={`w-full min-h-[48px] rounded-2xl border p-3 flex items-center justify-between gap-3 transition active:scale-[0.99] cursor-pointer touch-manipulation ${
          metric.water_checked
            ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-sm shadow-sky-500/10'
            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`}
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          <span className="text-base">💧</span>
          <span>Поилка вымыта и заполнена свежей водой</span>
        </span>
        <span className={`text-xs font-black px-2.5 py-1 rounded-xl font-mono ${
          metric.water_checked
            ? 'bg-sky-500 text-zinc-950'
            : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
        }`}>
          {metric.water_checked ? 'ДА ✓' : 'НЕТ'}
        </span>
      </button>

      {/* ═══ 3. РАЗДАЧА СЕНА В ТЮКАХ И СКЛАД ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <span>🌾</span>
              <span>Раздача сена в тюках (списание со склада)</span>
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Остаток на складе:{' '}
              <span className={`font-mono font-bold ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentBalesStock} тюков
              </span>
            </p>
          </div>
          {isLowStock && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black flex items-center gap-1">
              <AlertTriangle size={10} /> Мало
            </span>
          )}
        </div>

        {/* Counter row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.(15);
              onUpdateFodder('hay_bales_distributed', -1);
            }}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 active:scale-95 cursor-pointer touch-manipulation"
            aria-label="Минус тюк"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>

          <div className="text-center min-w-[70px]">
            <span className="text-3xl font-black font-mono text-emerald-400 leading-none">
              {shift?.hay_bales_distributed ?? 0}
            </span>
            <div className="text-[10px] text-zinc-500 font-bold mt-0.5">тюков выдано</div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic?.(20);
              onUpdateFodder('hay_bales_distributed', 1);
            }}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-white text-zinc-950 font-black transition hover:bg-zinc-100 active:scale-95 cursor-pointer touch-manipulation shadow-md"
            aria-label="Плюс тюк"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Evening hay guidance */}
        {isEvening && (
          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 ${
            missingBales > 0
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          }`}>
            <span className="text-base shrink-0">{missingBales > 0 ? '🌾' : '✅'}</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-white">
                {missingBales > 0 ? 'Вечерняя норма сена' : 'Суточная норма сена закрыта'}
              </span>
              <p className="text-[11px] text-zinc-300 mt-0.5 break-words">
                {missingBales > 0
                  ? `Выдано ${distributedBales} из ${targetBales} тюков. Рекомендуется ещё ${missingBales} ${missingBales === 1 ? 'тюк' : missingBales < 5 ? 'тюка' : 'тюков'} на ночь.`
                  : `Выдано ${distributedBales} из ${targetBales} тюков. Поголовье обеспечено сеном.`}
              </p>
            </div>
            {missingBales > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(20);
                  onUpdateFodder('hay_bales_distributed', 1);
                }}
                className="min-h-[38px] px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-xs shrink-0 transition cursor-pointer touch-manipulation"
              >
                +1 тюк
              </button>
            )}
          </div>
        )}

        {/* Button to open full warehouse inventory */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.(12);
            setWarehouseModalOpen(true);
          }}
          className="w-full min-h-[42px] rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer touch-manipulation"
        >
          <Package size={14} />
          <span>Склад фуража (рулоны, мешки, добавки)</span>
        </button>
      </div>

      {/* ═══ RECIPE MODAL ═══ */}
      {recipeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Техкарта кормления
                </p>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {elephantName} • {recipeOpen.slot === 'breakfast' ? 'Завтрак' : recipeOpen.slot === 'lunch' ? 'Обед' : recipeOpen.slot === 'snack' ? 'Полдник' : 'Ужин'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecipeOpen(null)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <span className="text-xs font-bold text-zinc-400">Ингредиенты и навеска:</span>
              <div className="space-y-1.5">
                {recipeOpen.ingredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <span className="text-zinc-200 font-medium">
                      {item.name} {item.note && <span className="text-zinc-500 text-[10px]">({item.note})</span>}
                    </span>
                    <span className="font-mono font-black text-emerald-400">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {recipeOpen.instructions && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-200">
                <p className="font-bold">Инструкция (t° {recipeOpen.temperature}):</p>
                <p className="mt-0.5 text-zinc-300 break-words">{recipeOpen.instructions}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setRecipeOpen(null)}
              className="w-full min-h-[46px] rounded-xl bg-emerald-500 font-black text-zinc-950 text-xs active:scale-95 cursor-pointer touch-manipulation"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* ═══ WAREHOUSE STORAGE MODAL ═══ */}
      {warehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="text-sm font-black text-white">Склад фуража и кормов</h3>
              <button
                type="button"
                onClick={() => setWarehouseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <FodderStorageSlide />
          </div>
        </div>
      )}
    </section>
  );
}
