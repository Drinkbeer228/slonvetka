import React from 'react';
import type { ElephantDailyMetrics, WashStatus, LimbCondition } from '../../types/shift';

interface BodyCareSectionProps {
  elephantName: string;
  metric: ElephantDailyMetrics;
  onSetWashStatus: (status: WashStatus) => void;
  onSetLimbCondition: (limb: 'front_right' | 'front_left' | 'rear_right' | 'rear_left', condition: LimbCondition) => void;
}

const WASH_OPTIONS: { value: WashStatus; label: string; emoji: string }[] = [
  { value: 'not_washed', label: 'Не мыта', emoji: '❌' },
  { value: 'rinsed', label: 'Ополоснута', emoji: '💦' },
  { value: 'full_wash', label: 'Со щёткой', emoji: '✨' },
];

const LIMB_LABELS: Record<string, string> = {
  front_right: 'ПП',
  front_left: 'ЛП',
  rear_right: 'ПЗ',
  rear_left: 'ЛЗ',
};

const LIMB_CONDITIONS: { value: LimbCondition; label: string }[] = [
  { value: 'ok', label: '✅ Норма' },
  { value: 'crack', label: '⚠️ Трещина' },
  { value: 'sole_issue', label: '⚠️ Подошва' },
  { value: 'lameness', label: '🔴 Хромота' },
];

const LIMB_KEYS = ['front_right', 'front_left', 'rear_right', 'rear_left'] as const;

export function BodyCareSection({
  elephantName,
  metric,
  onSetWashStatus,
  onSetLimbCondition,
}: BodyCareSectionProps) {
  const washStatus = metric.wash_status || 'not_washed';
  const limbs = metric.limb_status || { front_right: 'ok', front_left: 'ok', rear_right: 'ok', rear_left: 'ok' };

  const [expandedLimb, setExpandedLimb] = React.useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Уход • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Мойка · Копыта
          </h2>
        </div>
        <div className="text-2xl">🚿</div>
      </div>

      {/* ═══ МОЙКА ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <span className="text-sm font-bold text-zinc-100">🧽 Мойка</span>
        <div className="grid grid-cols-3 gap-2">
          {WASH_OPTIONS.map(opt => {
            const isActive = washStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSetWashStatus(opt.value)}
                className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 border font-bold text-xs transition active:scale-[0.97] cursor-pointer touch-manipulation ${
                  isActive
                    ? opt.value === 'full_wash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                      : opt.value === 'rinsed'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-zinc-800 border-zinc-600 text-zinc-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <span className="text-lg">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ НОГИ / КОПЫТА — Сетка 2×2 ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-100">🦶 Ноги / Копыта</span>
          <span className="text-[10px] text-zinc-500 font-medium">Тап = смена статуса</span>
        </div>

        {/* 2×2 grid: front row, rear row */}
        <div className="grid grid-cols-2 gap-2">
          {LIMB_KEYS.map(limb => {
            const condition = limbs[limb];
            const isExpanded = expandedLimb === limb;
            const hasProblem = condition !== 'ok';

            return (
              <div key={limb} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedLimb(null);
                    } else if (condition === 'ok') {
                      setExpandedLimb(limb);
                    } else {
                      // Toggle back to OK
                      onSetLimbCondition(limb, 'ok');
                      setExpandedLimb(null);
                    }
                  }}
                  className={`min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-sm transition active:scale-[0.97] cursor-pointer touch-manipulation ${
                    hasProblem
                      ? condition === 'lameness'
                        ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                        : 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-base font-black">{LIMB_LABELS[limb]}</span>
                  <span className="text-[10px]">
                    {condition === 'ok' ? '✅ Норма' : LIMB_CONDITIONS.find(c => c.value === condition)?.label}
                  </span>
                </button>

                {/* Expanded condition picker */}
                {isExpanded && (
                  <div className="flex flex-col gap-1 animate-slide-up">
                    {LIMB_CONDITIONS.filter(c => c.value !== 'ok').map(cond => (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => {
                          onSetLimbCondition(limb, cond.value);
                          setExpandedLimb(null);
                        }}
                        className="min-h-[40px] rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center justify-center transition active:scale-95 cursor-pointer touch-manipulation hover:bg-zinc-800"
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <span className="text-[9px] text-zinc-600">ПП = Передняя Правая · ЛП = Передняя Левая · ПЗ = Задняя Правая · ЛЗ = Задняя Левая</span>
        </div>
      </div>
    </section>
  );
}
