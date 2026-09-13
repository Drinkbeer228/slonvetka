import React from 'react';
import { Elephant } from '../../types';

interface ElephantSelectorProps {
  elephants: Elephant[];
  activeElephantId: string;
  onSelect: (id: string) => void;
  metrics: any;
}

export function ElephantSelector({ elephants, activeElephantId, onSelect, metrics }: ElephantSelectorProps) {
  return (
    <div className="flex bg-slate-200/45 p-1 w-full rounded-[20px] backdrop-blur-2xl border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] relative overflow-hidden">
      {elephants.map((elephant) => {
        const isActive = elephant.id === activeElephantId;
        const m = metrics[elephant.id];
        const hasNotes = m && m.notes && m.notes.trim().length > 0;
        
        return (
          <button
            key={elephant.id}
            type="button"
            onClick={() => onSelect(elephant.id)}
            className={`min-h-11 flex-1 rounded-[16px] px-2 text-[13px] transition-[background-color,color,box-shadow,transform] active:scale-[0.98] flex items-center justify-center relative select-none cursor-pointer ${
              isActive 
                ? 'bg-white/95 shadow-[0_4px_14px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)] border border-white text-slate-900 font-bold' 
                : 'text-slate-500 hover:text-slate-700 font-semibold border border-transparent'
            }`}
          >
            <span className="truncate">{elephant.name}</span>
            {hasNotes && (
              <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
