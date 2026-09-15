const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/SubmitShiftButton.tsx', 'utf8');

const newComponent = `import React, { useState, useEffect } from 'react';
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
      setTimeLeft(\`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`);
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
    <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-4 flex flex-col gap-4 shadow-sm w-full">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">До конца смены</div>
            <div className="text-lg font-black text-slate-900 leading-none">{timeLeft}</div>
          </div>
        </div>
        {!isIdeal && hasMissingRequired && (
          <div className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
            Есть пропуски
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className="w-full h-14 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-base font-bold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 text-white shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Сохранение...</span>
          </>
        ) : (
          <>
            <Check className="w-5 h-5 shrink-0" />
            <span>Сдать смену</span>
          </>
        )}
      </button>
    </div>
  );
}
`;

fs.writeFileSync('src/components/daily-shift/SubmitShiftButton.tsx', newComponent);
