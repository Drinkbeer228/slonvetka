import React from 'react';
import { CounterButton } from '../common/CounterButton';

interface FeedControlProps {
  hayBalesDistributed: number;
  hayBagsDistributed: number;
  onBalesChange: (val: number) => void;
  onBagsChange: (val: number) => void;
}

export function FeedControl({
  hayBalesDistributed,
  hayBagsDistributed,
  onBalesChange,
  onBagsChange
}: FeedControlProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-lg">🌾 Выдача корма</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/40 border border-white/60 p-4 rounded-2xl flex flex-col items-center justify-between shadow-sm backdrop-blur-sm gap-3">
          <div className="text-center w-full">
            <div className="text-sm font-bold text-slate-800">Тюки сена</div>
          </div>
          <CounterButton
            value={hayBalesDistributed}
            onChange={onBalesChange}
          />
        </div>

        <div className="bg-white/40 border border-white/60 p-4 rounded-2xl flex flex-col items-center justify-between shadow-sm backdrop-blur-sm gap-3">
          <div className="text-center w-full">
            <div className="text-sm font-bold text-slate-800">Рулоны / Мешки</div>
          </div>
          <CounterButton
            value={hayBagsDistributed}
            onChange={onBagsChange}
          />
        </div>
      </div>
    </div>
  );
}
