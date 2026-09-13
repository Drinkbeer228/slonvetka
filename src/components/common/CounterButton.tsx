import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface CounterButtonProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  variant?: 'horizontal' | 'vertical';
}

export function CounterButton({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  unit,
  disabled = false,
  variant = 'horizontal'
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

  if (variant === 'vertical') {
    const hasValue = effectiveValue > 0;
    return (
      <div className="w-full flex flex-col select-none">
        {label && <span className="text-[11px] font-bold text-slate-500 mb-1 text-center truncate">{label}</span>}
        <div
          className={`rounded-[20px] overflow-hidden w-full transition-all ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{
            boxShadow: hasValue
              ? '0 2px 10px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
              : '0 1px 4px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: hasValue
              ? '1px solid rgba(132, 204, 22, 0.4)'
              : '1px solid rgba(203, 213, 225, 0.7)',
          }}
        >
          {/* Верхняя кнопка [+] */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || effectiveValue >= max}
            className="h-11 w-full flex items-center justify-center text-xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target touch-manipulation"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: hasValue ? '#4d7c0f' : '#64748b',
            }}
            aria-label="Увеличить"
          >
            +
          </button>

          {/* Центральное значение */}
          <div
            className="py-2 px-1 text-center select-none flex flex-col items-center justify-center min-h-[54px]"
            style={{
              background: hasValue
                ? 'linear-gradient(180deg, rgba(236,252,203,0.65) 0%, rgba(217,249,157,0.45) 100%)'
                : 'rgba(248,250,252,0.6)',
            }}
          >
            <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {effectiveValue}
            </span>
            {unit && (
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">
                {unit}
              </span>
            )}
          </div>

          {/* Нижняя кнопка [-] */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || effectiveValue <= min}
            className="h-11 w-full flex items-center justify-center text-lg font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target touch-manipulation"
            style={{
              background: 'rgba(248,250,252,0.8)',
              color: '#94a3b8',
            }}
            aria-label="Уменьшить"
          >
            −
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="text-xs font-bold text-zinc-500">{label}</span>}
      <div className={`flex items-center bg-zinc-100/80 rounded-2xl p-1.5 border border-zinc-200 w-full max-w-[240px] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || effectiveValue <= min}
          className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-zinc-800 font-bold shrink-0 touch-manipulation cursor-pointer"
          aria-label="Decrease"
        >
          <Minus size={20} />
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
          className="flex-1 w-full text-center font-black text-xl sm:text-2xl text-zinc-900 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 rounded-xl py-2 px-1 mx-1 min-w-[36px] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || effectiveValue >= max}
          className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-zinc-800 font-bold shrink-0 touch-manipulation cursor-pointer"
          aria-label="Increase"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
