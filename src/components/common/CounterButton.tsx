import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterButtonProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}

export function CounterButton({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  disabled = false
}: CounterButtonProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const currentNum = parseInt(localValue, 10);
  const effectiveValue = isNaN(currentNum) ? value : currentNum;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (effectiveValue - step >= min) {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      const newValue = effectiveValue - step;
      setLocalValue(newValue.toString());
      onChange(newValue);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (effectiveValue + step <= max) {
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      const newValue = effectiveValue + step;
      setLocalValue(newValue.toString());
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleInputBlur = () => {
    let parsed = parseInt(localValue, 10);
    if (isNaN(parsed)) {
      parsed = min;
    } else {
      parsed = Math.min(Math.max(parsed, min), max);
    }
    setLocalValue(parsed.toString());
    onChange(parsed);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-bold text-zinc-500">{label}</span>}
      <div className={`flex items-center bg-zinc-100/80 rounded-2xl p-1.5 border border-zinc-200 w-full max-w-[240px] transition-opacity ${disabled ? 'opacity-60' : ''}`}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || effectiveValue <= min}
          className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 font-bold shrink-0 touch-manipulation"
          aria-label="Decrease"
        >
          <Minus size={22} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          className="flex-1 w-full text-center font-black text-2xl text-zinc-900 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 rounded-xl py-2 px-1 mx-1 min-w-[50px]"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || effectiveValue >= max}
          className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 font-bold shrink-0 touch-manipulation"
          aria-label="Increase"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
}
