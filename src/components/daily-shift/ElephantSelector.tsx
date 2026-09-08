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
    <div className="flex bg-white/40 p-1.5 rounded-2xl w-full backdrop-blur-xl border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
      {elephants.map((elephant) => {
        const isActive = elephant.id === activeElephantId;
        const m = metrics[elephant.id];
        const hasNotes = m && m.notes && m.notes.trim().length > 0;
        
        return (
          <button
            key={elephant.id}
            type="button"
            onClick={() => onSelect(elephant.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-sm transition-all relative z-10 ${
              isActive 
                ? 'text-slate-900 font-bold' 
                : 'text-slate-500 hover:text-slate-700 font-semibold'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100/50 -z-10" />
            )}
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
