import React from 'react';
import { useStore } from '../store';
import { ChevronRight } from 'lucide-react';

interface ElephantsScreenProps {
  onElephantClick: (id: string) => void;
}

export function ElephantsScreen({ onElephantClick }: ElephantsScreenProps) {
  const { elephants } = useStore();

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Слоны</h1>
        <p className="text-zinc-500 font-medium text-sm mt-1">Карточки и история процедур</p>
      </div>

      <div className="space-y-3">
        {elephants.map(elephant => (
          <button
            key={elephant.id}
            onClick={() => onElephantClick(elephant.id)}
            className="w-full bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 flex items-center justify-between hover:border-zinc-400 transition text-left active:scale-95"
          >
            <div>
              <h2 className="text-xl font-black">{elephant.name}</h2>
              <div className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${elephant.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                {elephant.active ? 'Активен' : 'Неактивен'}
              </div>
            </div>
            <ChevronRight className="text-zinc-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
