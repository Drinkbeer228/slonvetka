import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterButtonProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function CounterButton({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label
}: CounterButtonProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value - step >= min) {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onChange(value - step);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value + step <= max) {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onChange(value + step);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-bold text-zinc-500">{label}</span>}
      <div className="flex items-center bg-zinc-100 rounded-2xl p-1.5 border border-zinc-200 w-full max-w-[240px]">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 font-bold shrink-0"
          aria-label="Decrease"
        >
          <Minus size={22} />
        </button>

        <div className="flex-1 text-center font-black text-2xl text-zinc-900 select-none px-2">
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 font-bold shrink-0"
          aria-label="Increase"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
}
