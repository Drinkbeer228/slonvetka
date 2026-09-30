import React, { useEffect, useMemo, useState } from 'react';
import { X, Dices, Loader2 } from 'lucide-react';
import { Profile } from '../../types';
import { supabaseService } from '../../services/supabaseService';

/**
 * ShiftWheelModal — «Жребий смены».
 * Честный случайный выбор дежурного кипера из активных сотрудников
 * (роль keeper), чтобы определить, кто сегодня в слоновнике.
 */
interface ShiftWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KEEPERS_ONLY = ['keeper', 'brigadier'];

export function ShiftWheelModal({ isOpen, onClose }: ShiftWheelModalProps) {
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    supabaseService
      .getProfiles()
      .then((profiles) => {
        if (cancelled) return;
        setCandidates(profiles.filter((p) => p.active && KEEPERS_ONLY.includes(p.role)));
      })
      .catch((err) => {
        console.warn('Wheel: failed to load profiles (offline?):', err);
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const canSpin = candidates.length > 1;

  const handleSpin = () => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setWinner(null);

    // Simple animated random pick
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks += 1;
      const idx = Math.floor(Math.random() * candidates.length);
      setWinner(candidates[idx]);
      if (ticks >= 14) {
        window.clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * candidates.length);
        setWinner(candidates[finalIdx]);
        setSpinning(false);
      }
    }, 90);
  };

  const listItems = useMemo(() => candidates, [candidates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Dices size={20} />
            Жребий смены
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-4">
          Случайный выбор дежурного среди активных киперов. Используется, когда график
          не назначен вручную.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-zinc-400 text-sm font-bold">
            <Loader2 size={16} className="animate-spin" />
            Загрузка сотрудников…
          </div>
        ) : listItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-5 text-center text-sm text-slate-500 dark:text-zinc-400 font-medium">
            Нет активных киперов для жребия. Проверьте соединение с сервером.
          </div>
        ) : (
          <>
            <ul className="space-y-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
              {listItems.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                    winner?.id === p.id
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {p.name}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin || spinning}
              className="w-full min-h-[48px] rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              {spinning ? <Loader2 size={16} className="animate-spin" /> : <Dices size={16} />}
              {winner && !spinning ? `Дежурит: ${winner.name}` : 'Крутить жребий'}
            </button>

            {!canSpin && (
              <p className="mt-2 text-[11px] font-medium text-slate-400 text-center">
                Нужен хотя бы один дополнительный активный кипер для жребия.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
