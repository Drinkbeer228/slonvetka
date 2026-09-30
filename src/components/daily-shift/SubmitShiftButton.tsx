import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2, Clock } from 'lucide-react';

export interface SubmitShiftButtonProps {
  isIdeal?: boolean;
  hasMissingRequired?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  text?: string;
}

export function SubmitShiftButton({
  isIdeal = false,
  hasMissingRequired = false,
  isLoading = false,
  disabled = false,
  onClick,
  text,
}: SubmitShiftButtonProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (disabled || isLoading) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // ignore
      }
    }
    onClick?.();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl shadow-black/20 w-full">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Clock size={19} />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">До конца смены</div>
            <div className="text-lg font-bold text-white font-mono leading-tight">{timeLeft}</div>
          </div>
        </div>
        {!isIdeal && hasMissingRequired && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold uppercase px-2.5 py-1 rounded-xl">
            Есть пропуски
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`w-full min-h-[52px] rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-base font-bold active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation cursor-pointer ${
          disabled || isLoading
            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/60'
            : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-950/40'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Сохранение...</span>
          </>
        ) : (
          <>
            <Check className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span>{text || 'Сдать смену'}</span>
          </>
        )}
      </button>
    </div>
  );
}
