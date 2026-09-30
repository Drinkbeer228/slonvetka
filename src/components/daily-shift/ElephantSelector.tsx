import React from 'react';
import { Elephant } from '../../types';
import { evaluateElephantHealth } from '../../utils/elephantHealthStatus';

interface ElephantSelectorProps {
  elephants: Elephant[];
  activeElephantId: string;
  onSelect: (id: string) => void;
  metrics: any;
  saladAppetite?: string;
  className?: string;
}

const ELEPHANT_AVATARS: Record<string, string> = {
  margo: '🐘',
  odri: '🐘',
  audrey: '🐘',
  pretty: '🐘',
};

export function ElephantSelector({
  elephants,
  activeElephantId,
  onSelect,
  metrics,
  saladAppetite,
  className = '',
}: ElephantSelectorProps) {
  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    onSelect(id);
  };

  return (
    <div
      className={`grid grid-cols-3 gap-2 p-1.5 w-full rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl ${className}`}
    >
      {elephants.map((elephant) => {
        const isActive = elephant.id === activeElephantId;
        const m = metrics ? metrics[elephant.id] : null;
        const health = evaluateElephantHealth(m, { saladAppetite });
        const hasNotes = Boolean(m && m.notes && m.notes.trim().length > 0);
        const avatar = ELEPHANT_AVATARS[elephant.id] || '🐘';

        return (
          <button
            key={elephant.id}
            type="button"
            onClick={() => handleSelect(elephant.id)}
            className={`min-h-[52px] sm:min-h-[56px] py-2 px-2 rounded-xl transition-all duration-150 active:scale-[0.98] flex flex-col items-center justify-center relative select-none cursor-pointer text-center touch-manipulation ${
              isActive
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-md'
                : 'bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 font-medium border border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            {/* Header: Avatar + Name (NO TRUNCATE) */}
            <div className="flex items-center justify-center gap-1.5 w-full min-w-0">
              <span className="text-sm leading-none shrink-0">{avatar}</span>
              <span
                className={`text-xs sm:text-sm tracking-tight break-words text-center ${
                  isActive ? 'text-zinc-950 font-bold' : 'text-zinc-200 font-semibold'
                }`}
              >
                {elephant.name}
              </span>
              {hasNotes && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                  title="Есть заметки за смену"
                />
              )}
            </div>

            {/* Status Traffic-Light Badge (NO TRUNCATE) */}
            <div className="mt-1 flex items-center justify-center w-full">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  health.severity === 'alert'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : health.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isActive
                    ? 'bg-emerald-950/40 text-emerald-800 border-emerald-400/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    health.severity === 'alert'
                      ? 'bg-rose-500'
                      : health.severity === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="break-words">
                  {health.severity === 'ok'
                    ? 'Норма'
                    : health.severity === 'alert'
                    ? 'Тревога'
                    : 'Внимание'}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
