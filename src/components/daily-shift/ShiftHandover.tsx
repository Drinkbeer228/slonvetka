import React from 'react';
import { Loader2 } from 'lucide-react';

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
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 sm:p-6 rounded-[24px] shadow-[0_4px_32px_rgba(0,0,0,0.04)] space-y-5">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-black text-slate-800">Передача смены</h3>
      </div>
      
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Что важно передать следующей смене?</label>
        <textarea
          rows={3}
          disabled={isLocked}
          value={handoverNotes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Например: Прэтти не доела сено, Марго ведет себя беспокойно..."
          className="w-full px-4 py-3 bg-white/50 border border-slate-200/60 rounded-2xl text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white resize-none shadow-sm transition"
        />
      </div>

      {!isLocked && (
        <button
          type="button"
          disabled={isSaving}
          onClick={onSubmit}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all shadow-[0_4px_16px_rgba(15,23,42,0.2)] active:scale-[0.98] uppercase tracking-widest flex justify-center items-center gap-2 mt-4"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
          СДАТЬ СМЕНУ
        </button>
      )}
    </div>
  );
}
