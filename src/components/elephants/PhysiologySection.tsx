import React from 'react';
import { Plus, Minus, Camera } from 'lucide-react';
import type { ElephantDailyMetrics } from '../../types/shift';

interface PhysiologySectionProps {
  elephantName: string;
  metric: ElephantDailyMetrics;
  onUpdateFeces: (delta: number) => void;
  onUpdateUrine: (delta: number) => void;
  onToggleFecesAnomaly: (trait: string) => void;
  onToggleUrineAnomaly: (trait: string) => void;
  onSetSleepState: (duration: '🟢 3-4ч (норма)' | '⏱️ 1-2ч' | '❌ Не легла') => void;
  onSetBehavior: (behavior: string) => void;
}

const FECES_ANOMALIES = ['Сухой', 'Жидкий', 'Слизь', 'Кровь', 'Непереваренное'];
const URINE_ANOMALIES = ['Мутная', 'Тёмная', 'Мало пьёт', 'Часто'];
const BEHAVIORS = ['Спокойное', 'Активное', 'Игривое', 'Настороженное', 'Угнетённое'];

export function PhysiologySection({
  elephantName,
  metric,
  onUpdateFeces,
  onUpdateUrine,
  onToggleFecesAnomaly,
  onToggleUrineAnomaly,
  onSetSleepState,
  onSetBehavior,
}: PhysiologySectionProps) {
  const hasFecesAnomaly = metric.feces_traits?.some(t => t !== 'Сформирован (норма)') || false;
  const hasUrineAnomaly = metric.urination_traits?.some(t => t !== 'Прозрачная (норма)') || false;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/20 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Физиология • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Кал · Моча · Сон
          </h2>
        </div>
        <div className="text-2xl">🩺</div>
      </div>

      {/* ═══ COUNTERS GRID ═══ */}
      <div className="grid grid-cols-2 gap-3">
        {/* 💩 КАЛ */}
        <div className={`rounded-2xl border p-3.5 flex flex-col gap-3 transition-colors ${
          hasFecesAnomaly
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-100">💩 Кал</span>
            {hasFecesAnomaly && (
              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Сфоткать аномалию"
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onUpdateFeces(-1)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-300 active:scale-90 cursor-pointer touch-manipulation transition"
              aria-label="Минус кал"
            >
              <Minus size={22} strokeWidth={2.5} />
            </button>
            <div className="text-center flex-1">
              <span className="text-4xl font-black font-mono text-white">{metric.poop_count ?? 0}</span>
              <div className="text-[10px] text-zinc-500 font-bold mt-0.5">куч</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateFeces(1)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 active:scale-90 cursor-pointer touch-manipulation shadow-lg transition font-bold"
              aria-label="Плюс кал"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
          </div>

          {/* Anomaly chips */}
          <div className="flex flex-wrap gap-1.5">
            {FECES_ANOMALIES.map(trait => {
              const isOn = metric.feces_traits?.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => onToggleFecesAnomaly(trait)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    isOn
                      ? 'bg-amber-500/25 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>

        {/* 💧 МОЧА */}
        <div className={`rounded-2xl border p-3.5 flex flex-col gap-3 transition-colors ${
          hasUrineAnomaly
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-100">💧 Моча</span>
            {hasUrineAnomaly && (
              <button
                type="button"
                className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Сфоткать аномалию"
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onUpdateUrine(-1)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-300 active:scale-90 cursor-pointer touch-manipulation transition"
              aria-label="Минус моча"
            >
              <Minus size={22} strokeWidth={2.5} />
            </button>
            <div className="text-center flex-1">
              <span className="text-4xl font-black font-mono text-white">{metric.urination_count ?? 0}</span>
              <div className="text-[10px] text-zinc-500 font-bold mt-0.5">луж</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateUrine(1)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 active:scale-90 cursor-pointer touch-manipulation shadow-lg transition font-bold"
              aria-label="Плюс моча"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
          </div>

          {/* Anomaly chips */}
          <div className="flex flex-wrap gap-1.5">
            {URINE_ANOMALIES.map(trait => {
              const isOn = metric.urination_traits?.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => onToggleUrineAnomaly(trait)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    isOn
                      ? 'bg-amber-500/25 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ СОН ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-100">😴 Сон</span>
          <span className="text-xs text-zinc-500 font-medium">
            {metric.sleep_state?.duration || 'Не указан'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: '🟢 3-4ч (норма)' as const, label: 'Норма 3-4ч', color: 'emerald' },
            { key: '⏱️ 1-2ч' as const, label: 'Беспокойно', color: 'amber' },
            { key: '❌ Не легла' as const, label: 'Не спала', color: 'rose' },
          ]).map(opt => {
            const isSelected = metric.sleep_state?.duration === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSetSleepState(opt.key)}
                className={`min-h-[52px] px-2 rounded-xl text-xs font-bold border flex items-center justify-center transition cursor-pointer touch-manipulation active:scale-[0.97] ${
                  isSelected
                    ? opt.color === 'emerald'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : opt.color === 'amber'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ ПОВЕДЕНИЕ ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-100">🙂 Поведение</span>
          <span className="text-xs text-emerald-400 font-bold">{metric.behavior || 'Спокойное'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BEHAVIORS.map(mood => {
            const isSelected = metric.behavior === mood;
            return (
              <button
                key={mood}
                type="button"
                onClick={() => onSetBehavior(mood)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-bold border transition cursor-pointer touch-manipulation active:scale-[0.97] ${
                  isSelected
                    ? 'bg-white text-zinc-950 shadow-md border-zinc-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
