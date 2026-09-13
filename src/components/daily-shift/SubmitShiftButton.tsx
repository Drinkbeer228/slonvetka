import React from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

export interface SubmitShiftButtonProps {
  isIdeal?: boolean;
  hasMissingRequired?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  // Optional custom text overrides
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

  // Determine state:
  // If isIdeal is true (and no missing required), show green gradient "✓ Сдать идеальную смену"
  // Otherwise, if hasMissingRequired or not ideal, show dark slate "Завершить смену (есть пропуски)"
  const showIdeal = isIdeal && !hasMissingRequired;

  const defaultText = showIdeal
    ? '✓ Сдать идеальную смену'
    : 'Завершить смену (есть пропуски)';

  const label = text || defaultText;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 pointer-events-none">
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`pointer-events-auto w-full h-14 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 text-base font-bold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
          showIdeal
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25 ring-1 ring-emerald-400/40'
            : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/30 ring-1 ring-white/10'
        }`}
        aria-label={label}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Сохранение...</span>
          </>
        ) : showIdeal ? (
          <>
            <Check size={20} strokeWidth={3} className="shrink-0" />
            <span>{label}</span>
          </>
        ) : (
          <>
            <AlertCircle size={18} className="shrink-0 text-amber-400" />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}
