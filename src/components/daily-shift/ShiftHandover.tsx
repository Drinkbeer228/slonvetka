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
  onSubmit
}: ShiftHandoverProps) {
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 p-5 sm:p-6 rounded-[28px] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">Передача смены</h3>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">Финальный отчет и комментарии сменщику</p>
        </div>
        <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
          🤝
        </span>
      </div>
      
      <div>
        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
          Что важно передать следующей смене?
        </label>
        <textarea
          rows={3}
          disabled={isLocked}
          value={handoverNotes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Например: Прэтти не доела сено, Марго берегла правую ногу на утренней прогулке..."
          className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white resize-none shadow-inner transition"
        />
      </div>

      {!isLocked && (
        <button
          type="button"
          disabled={isSaving}
          onClick={onSubmit}
          className="w-full min-h-[52px] py-3.5 px-6 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-md active:scale-[0.98] uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} className="stroke-[2.5]" />}
          <span>СДАТЬ СМЕНУ</span>
        </button>
      )}
    </div>
  );
}
