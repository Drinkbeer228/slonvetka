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
        {label && <span className="text-xs font-black text-slate-700 mb-1 text-center truncate">{label}</span>}
        <div
          className={`rounded-[22px] overflow-hidden w-full transition-all ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{
            boxShadow: hasValue
              ? '0 2px 12px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              : '0 1px 4px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            border: hasValue
              ? '1px solid rgba(132, 204, 22, 0.6)'
              : '1px solid rgba(203, 213, 225, 0.9)',
          }}
        >
          {/* Верхняя кнопка [+] */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || effectiveValue >= max}
            className="h-12 w-full flex items-center justify-center text-2xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target touch-manipulation"
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: hasValue ? '#3f6212' : '#334155',
            }}
            aria-label="Увеличить"
          >
            +
          </button>

          {/* Центральное значение */}
          <div
            className="py-2 px-1 text-center select-none flex flex-col items-center justify-center min-h-[58px]"
            style={{
              background: hasValue
                ? 'linear-gradient(180deg, rgba(236,252,203,0.75) 0%, rgba(217,249,157,0.55) 100%)'
                : 'rgba(248,250,252,0.85)',
            }}
          >
            <span className="text-2xl font-black text-slate-950 tracking-tight leading-none">
              {effectiveValue}
            </span>
            {unit && (
              <span className="text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">
                {unit}
              </span>
            )}
          </div>

          {/* Нижняя кнопка [-] */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || effectiveValue <= min}
            className="h-12 w-full flex items-center justify-center text-xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target touch-manipulation border-t border-slate-200/80"
            style={{
              background: 'rgba(241,245,249,0.95)',
              color: '#0f172a',
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
      {label && <span className="text-xs font-black text-slate-700">{label}</span>}
      <div className={`flex items-center bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200 w-full max-w-[260px] transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || effectiveValue <= min}
          className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-slate-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none text-slate-900 font-black shrink-0 touch-manipulation cursor-pointer"
          aria-label="Decrease"
        >
          <Minus size={22} className="stroke-[2.5]" />
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
          className="flex-1 w-full text-center font-black text-xl sm:text-2xl text-slate-950 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 rounded-xl py-2 px-1 mx-1 min-w-[40px] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || effectiveValue >= max}
          className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm hover:bg-slate-50 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none text-slate-900 font-black shrink-0 touch-manipulation cursor-pointer"
          aria-label="Increase"
        >
          <Plus size={22} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
