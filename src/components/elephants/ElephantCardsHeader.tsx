import React from 'react';
import { ElephantChecklistMeta, ELEPHANTS_CHECKLIST_CONFIG } from '../../types/conservation';
import { ChecklistEvaluationResult } from '../../utils/conservationStandard';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ElephantCardsHeaderProps {
  activeElephantId: string;
  onSelect: (elephantId: string) => void;
  evaluations: Record<string, ChecklistEvaluationResult>;
  triggerHaptic?: (ms?: number) => void;
}

/**
 * Верхний блок экрана «Слоны»: 3 карточки слоних в ряд
 * Показывает статус-точку, категорию и прогресс X/9 блоков.
 */
export function ElephantCardsHeader({
  activeElephantId,
  onSelect,
  evaluations,
  triggerHaptic,
}: ElephantCardsHeaderProps) {
  const elephantList = Object.values(ELEPHANTS_CHECKLIST_CONFIG);

  return (
    <div className="grid grid-cols-3 gap-2">
      {elephantList.map((meta) => {
        const isActive = activeElephantId === meta.id;
        const evaluation = evaluations[meta.id];
        const dot = evaluation?.dot || 'green';
        const completed = evaluation?.completedBlocksCount ?? 0;
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
            className={`relative flex flex-col justify-between p-2.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[96px] ${
              isActive
                ? isAlert
                  ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30 ring-2 ring-rose-500/40'
                  : isWarning
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/30 ring-2 ring-amber-500/40'
                  : 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-2 ring-emerald-500/40'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 opacity-90'
            }`}
          >
            {/* Top row: Avatar + Dot */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-xl leading-none">{meta.avatarEmoji}</span>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isAlert
                    ? 'bg-rose-500 animate-pulse ring-2 ring-rose-400'
                    : isWarning
                    ? 'bg-amber-400 ring-2 ring-amber-300/40'
                    : 'bg-emerald-400'
                }`} />
              </div>
            </div>

            {/* Name + Age Category */}
            <div className="mt-1 min-w-0">
              <h3 className="text-sm font-black text-white leading-tight break-words">
                {meta.name}
              </h3>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 break-words">
                {meta.categoryLabel.split(' ')[0]}
              </p>
            </div>

            {/* Progress: X/9 */}
            <div className="mt-2 pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500 font-bold">Блоки:</span>
              <span className={`font-black ${
                completed >= 7 ? 'text-emerald-400' : 'text-zinc-300'
              }`}>
                {completed}/9
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
