import React from 'react';
import { useStore } from '../store';

interface KeeperSelectionScreenProps {
  onComplete: () => void;
}

export function KeeperSelectionScreen({ onComplete }: KeeperSelectionScreenProps) {
  const { keepers, activeKeeperId, setActiveKeeper } = useStore();

  const activeKeepers = keepers.filter(k => k.active);

  const handleSelect = (id: string) => {
    setActiveKeeper(id);
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🐘</div>
        <h1 className="text-3xl font-black mb-2">Слоновник Вет</h1>
        <p className="text-zinc-500 font-medium">Кто сейчас дежурит?</p>
      </div>

      <div className="w-full space-y-3">
        {activeKeepers.map(k => (
          <button
            key={k.id}
            onClick={() => handleSelect(k.id)}
            className={`w-full p-4 rounded-2xl border-2 transition text-lg font-bold flex items-center justify-between ${
              activeKeeperId === k.id 
                ? 'border-zinc-900 bg-zinc-900 text-white' 
                : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-800'
            }`}
          >
            <span>{k.name}</span>
            {activeKeeperId === k.id && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
