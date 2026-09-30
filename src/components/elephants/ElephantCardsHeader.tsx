import React from 'react';
import { ElephantChecklistMeta, ELEPHANTS_CHECKLIST_CONFIG } from '../../types/conservation';
import { ChecklistEvaluationResult } from '../../utils/conservationStandard';
import { ChevronLeft, ChevronRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ElephantCardsHeaderProps {
  activeElephantId: string;
  onSelect: (elephantId: string) => void;
  evaluations: Record<string, ChecklistEvaluationResult>;
  triggerHaptic?: (ms?: number) => void;
}

/**
 * Адаптивный селектор слоних
 * Выбранная слониха крупнее и информативнее, соседние — компактные табы.
 * Идеально подходит для мобильных экранов 375–414px.
 */
export function ElephantCardsHeader({
  activeElephantId,
  onSelect,
  evaluations,
  triggerHaptic,
}: ElephantCardsHeaderProps) {
  const elephantList = Object.values(ELEPHANTS_CHECKLIST_CONFIG);
  const currentIndex = elephantList.findIndex((e) => e.id === activeElephantId);

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + elephantList.length) % elephantList.length;
    triggerHaptic?.(12);
    onSelect(elephantList[nextIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % elephantList.length;
    triggerHaptic?.(12);
    onSelect(elephantList[nextIdx].id);
  };

  const activeMeta = elephantList[currentIndex] || elephantList[0];
  const activeEval = evaluations[activeMeta.id];

  return (
    <div className="space-y-2">
      {/* Horizontal Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
        <button
          type="button"
          onClick={handlePrev}
          className="h-10 w-8 rounded-xl bg-zinc-950/60 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 active:scale-90 cursor-pointer"
          aria-label="Предыдущая слониха"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {elephantList.map((meta) => {
            const isActive = meta.id === activeElephantId;
            const ev = evaluations[meta.id];
            const dot = ev?.dot || 'green';
            const count = ev?.completedBlocksCount ?? 0;
            const isAlert = dot === 'red';
            const isWarning = dot === 'yellow';

            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => {
                  triggerHaptic?.(12);
                  onSelect(meta.id);
                }}
                className={`min-h-[46px] rounded-xl px-2 py-1.5 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer touch-manipulation border ${
                  isActive
                    ? isAlert
                      ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-950/40 text-white'
                      : isWarning
                      ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-950/40 text-white'
                      : 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                    : 'bg-zinc-950/50 border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{meta.avatarEmoji}</span>
                  <span className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                    {meta.name}
                  </span>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${
                    isAlert
                      ? 'bg-rose-500 animate-pulse'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`} />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {count}/9 бл.
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="h-10 w-8 rounded-xl bg-zinc-950/60 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 active:scale-90 cursor-pointer"
          aria-label="Следующая слониха"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Prominent Active Elephant Summary Card */}
      <div className={`p-3 rounded-2xl border transition-all ${
        activeEval?.dot === 'red'
          ? 'bg-rose-950/30 border-rose-500/80 shadow-lg shadow-rose-950/20'
          : activeEval?.dot === 'yellow'
          ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-950/20'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{activeMeta.avatarEmoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{activeMeta.name}</h3>
                <span className="text-[11px] text-zinc-400 font-medium">({activeMeta.categoryLabel})</span>
              </div>
              <p className="text-[11px] text-zinc-400">{activeMeta.focus}</p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activeEval?.dotBgClass} ${activeEval?.dotBorderClass} ${
              activeEval?.dot === 'red' ? 'text-rose-300' : activeEval?.dot === 'yellow' ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {activeEval?.statusLabel}
            </span>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              Заполнено: <strong>{activeEval?.completedBlocksCount ?? 0} из 9</strong>
            </div>
          </div>
        </div>

        {/* Notice if any critical reasons exist */}
        {activeEval && activeEval.criticalReasons.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <ShieldAlert size={14} className="shrink-0 text-rose-400" />
            <span className="font-bold">{activeEval.criticalReasons[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
