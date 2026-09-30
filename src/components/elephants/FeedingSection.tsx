import React, { useState } from 'react';
import { CheckCircle2, X, ChevronDown } from 'lucide-react';
import type { ElephantDailyMetrics, FeedingSlot } from '../../types/shift';
import { FEEDING_SCHEDULE, getRecipeForElephant, type FeedingRecipe } from '../../data/feedingSchedule';

interface FeedingSectionProps {
  elephantId: string;
  elephantName: string;
  metric: ElephantDailyMetrics;
  onMarkServed: (slot: FeedingSlot) => void;
  onToggleWaterCheck: () => void;
}

export function FeedingSection({
  elephantId,
  elephantName,
  metric,
  onMarkServed,
  onToggleWaterCheck,
}: FeedingSectionProps) {
  const [recipeOpen, setRecipeOpen] = useState<FeedingRecipe | null>(null);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isServed = (slot: FeedingSlot) =>
    metric.feeding_records?.find(r => r.slot === slot)?.served || false;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Кормление • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Рационы дня
          </h2>
        </div>
        <div className="text-2xl">🥣</div>
      </div>

      {/* Feeding slots */}
      <div className="space-y-2.5">
        {FEEDING_SCHEDULE.map(scheduleSlot => {
          const [h, m] = scheduleSlot.time.split(':').map(Number);
          const slotMinutes = h * 60 + m;
          const isCurrent = Math.abs(slotMinutes - currentMinutes) < 120 && slotMinutes >= currentMinutes - 30;
          const served = isServed(scheduleSlot.slot);
          const recipe = getRecipeForElephant(elephantId, scheduleSlot.slot);

          return (
            <div
              key={scheduleSlot.slot}
              className={`rounded-2xl border p-3.5 transition-all ${
                served
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : isCurrent
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: time + title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                    served
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    <span className="text-xs font-black font-mono">{scheduleSlot.time}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold leading-snug ${served ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>
                      {scheduleSlot.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                      {scheduleSlot.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 mt-3">
                {/* Recipe button */}
                {recipe && (
                  <button
                    type="button"
                    onClick={() => setRecipeOpen(recipe)}
                    className="min-h-[44px] px-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation hover:border-zinc-600"
                  >
                    <span>📋</span>
                    <span>Рецепт</span>
                    <ChevronDown size={12} />
                  </button>
                )}

                {/* ВЫДАНО button */}
                <button
                  type="button"
                  onClick={() => onMarkServed(scheduleSlot.slot)}
                  className={`flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.97] cursor-pointer touch-manipulation ${
                    served
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                      : 'bg-white text-zinc-950 shadow-lg shadow-black/20 hover:bg-zinc-100'
                  }`}
                >
                  {served ? (
                    <>
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                      <span>ВЫДАНО ✓</span>
                    </>
                  ) : (
                    <span>ВЫДАТЬ</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Water check */}
      <button
        type="button"
        onClick={onToggleWaterCheck}
        className={`w-full min-h-[52px] rounded-2xl border font-bold text-sm flex items-center justify-center gap-3 transition active:scale-[0.98] cursor-pointer touch-manipulation ${
          metric.water_checked
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
        }`}
      >
        <span>{metric.water_checked ? '✅' : '💧'}</span>
        <span>Поилка вымыта и заполнена</span>
      </button>

      {/* ═══ Recipe Modal ═══ */}
      {recipeOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRecipeOpen(null)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Техкарта • {recipeOpen.elephantName}
                </p>
                <h3 className="text-base font-black text-white mt-0.5">
                  {FEEDING_SCHEDULE.find(s => s.slot === recipeOpen.slot)?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecipeOpen(null)}
                className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <span className="text-sm">🌡️</span>
              <span className="text-xs font-bold text-amber-300">
                Температура подачи: {recipeOpen.temperature}
              </span>
            </div>

            {/* Ingredients */}
            <div className="space-y-2 mb-4">
              {recipeOpen.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-zinc-200">{ing.name}</span>
                    {ing.note && (
                      <p className="text-[10px] text-amber-400 font-medium mt-0.5">{ing.note}</p>
                    )}
                  </div>
                  <span className="text-sm font-black text-emerald-400 font-mono shrink-0">{ing.amount}</span>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="px-3 py-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20">
              <p className="text-xs text-blue-300 font-medium leading-relaxed">
                📝 {recipeOpen.instructions}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
