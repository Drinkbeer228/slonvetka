import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface ShiftHandoverProps {
  handoverNotes: string;
  isLocked: boolean;
  isSaving: boolean;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

export function ShiftHandover({
  handoverNotes,
  isLocked,
  isSaving,
  onChange,
  onSubmit,
}: ShiftHandoverProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-xl shadow-black/20 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">Передача смены</h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Финальный отчет и комментарии сменщику</p>
        </div>
        <span className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
          🤝
        </span>
      </div>
      
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Что важно передать следующей смене?
        </label>
        <textarea
          rows={3}
          disabled={isLocked}
          value={handoverNotes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Например: Прэтти не доела сено, Марго берегла правую ногу на утренней прогулке..."
          className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition resize-none shadow-inner"
        />
      </div>

      {!isLocked && (
        <button
          type="button"
          disabled={isSaving}
          onClick={onSubmit}
          className="w-full min-h-[52px] py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-950/40 active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 touch-manipulation"
        >
          {isSaving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ArrowRight size={20} className="stroke-[2.5]" />
          )}
          <span>СДАТЬ СМЕНУ</span>
        </button>
      )}
    </div>
  );
}
