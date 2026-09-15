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
      className={`grid grid-cols-3 gap-2 p-1.5 w-full rounded-[24px] bg-slate-200/60 backdrop-blur-2xl border border-white/80 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ${className}`}
    >
      {elephants.map((elephant) => {
        const isActive = elephant.id === activeElephantId;
        const m = metrics ? metrics[elephant.id] : null;
        const health = evaluateElephantHealth(m, { saladAppetite });
        const hasNotes = m && m.notes && m.notes.trim().length > 0;
        const avatar = ELEPHANT_AVATARS[elephant.id] || '🐘';

        return (
          <button
            key={elephant.id}
            type="button"
            onClick={() => handleSelect(elephant.id)}
            className={`min-h-[52px] sm:min-h-[56px] py-2 px-2 rounded-[20px] transition-all duration-200 active:scale-[0.97] flex flex-col items-center justify-center relative select-none cursor-pointer text-center ${
              isActive
                ? 'bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)] border border-white text-slate-950 font-black ring-2 ring-slate-900/10'
                : 'bg-white/40 hover:bg-white/70 text-slate-700 font-bold border border-white/40'
            }`}
          >
            {/* Header: Avatar + Name */}
            <div className="flex items-center justify-center gap-1.5 w-full min-w-0">
              <span className="text-base leading-none shrink-0">{avatar}</span>
              <span className="text-xs sm:text-sm font-black truncate tracking-tight text-slate-900">
                {elephant.name}
              </span>
              {hasNotes && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white shrink-0"
                  title="Есть заметки за смену"
                />
              )}
            </div>

            {/* Status Traffic-Light Badge */}
            <div className="mt-1 flex items-center justify-center w-full">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-tight border shadow-xs ${
                  health.severity === 'alert'
                    ? 'bg-rose-500/20 text-rose-950 border-rose-400 font-black animate-pulse'
                    : health.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-950 border-amber-400'
                    : 'bg-emerald-500/15 text-emerald-950 border-emerald-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    health.severity === 'alert'
                      ? 'bg-rose-600'
                      : health.severity === 'warning'
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                  }`}
                />
                <span className="truncate max-w-[80px] sm:max-w-[100px]">
                  {health.severity === 'ok' ? 'Норма' : health.severity === 'alert' ? 'Тревога' : 'Внимание'}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
