import React, { useState } from 'react';
import { Info, Check, RotateCcw, AlertOctagon } from 'lucide-react';
import { DailyRationData } from './FeedControl';
import { RecipeBottomSheet } from './RecipeBottomSheet';

interface MorningPorridgeSectionProps {
  ration: DailyRationData;
  isLocked?: boolean;
  onChange: (field: keyof DailyRationData, value: any) => void;
}

export function MorningPorridgeSection({
  ration,
  isLocked,
  onChange
}: MorningPorridgeSectionProps) {
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [issueTime, setIssueTime] = useState<string | null>(null);

  const isIssued = ration.morning_porridge && ration.morning_porridge !== 'none';
  const consumption = isIssued ? ration.morning_porridge : null;

  const handleHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  };

  const handleMarkIssued = () => {
    if (isLocked) return;
    handleHaptic(15);
    const now = new Date();
    setIssueTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    onChange('morning_porridge', 'all');
  };

  const handleReset = () => {
    if (isLocked) return;
    handleHaptic(10);
    setIssueTime(null);
    onChange('morning_porridge', 'none');
  };

  const setConsumption = (val: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    handleHaptic(15);
    onChange('morning_porridge', val);
  };

  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/60 rounded-[32px] p-5 sm:p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-slate-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🥣
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base leading-tight">Утренняя каша (08:30)</h2>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Строго 1 раз в день</div>
          </div>
        </div>
        <button 
          onClick={() => setIsRecipeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm shrink-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-wide">Рецепт ℹ️</span>
        </button>
      </div>

      {/* Main Status Toggle */}
      <div>
        {!isIssued ? (
          <button
            onClick={handleMarkIssued}
            disabled={isLocked}
            className={`w-full h-[52px] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isLocked 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98]'
            }`}
          >
            Отметить выдачу каши
          </button>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-[52px] rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-between px-4 sm:px-5 shadow-md shadow-emerald-600/20">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span>Каша выдана {issueTime && `в ${issueTime}`}</span>
              </div>
              <button 
                onClick={handleReset}
                disabled={isLocked}
                className="h-8 px-3 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95 shrink-0 text-xs font-bold bg-white/20"
                aria-label="Сброс"
              >
                Сброс
              </button>
            </div>

            {/* Consumption Chips */}
            <div className="flex gap-2">
              <button
                onClick={() => setConsumption('all')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border ${
                  consumption === 'all'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Съедено 100%
              </button>
              <button
                onClick={() => setConsumption('partial')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border ${
                  consumption === 'partial'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Остаток
              </button>
              <button
                onClick={() => setConsumption('refused')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  consumption === 'refused'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Отказ ⚠️
              </button>
            </div>
          </div>
        )}
      </div>

      <RecipeBottomSheet isOpen={isRecipeOpen} onClose={() => setIsRecipeOpen(false)} />
    </div>
  );
}
