import React from 'react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics } from '../../types/shift';
import { formatDuration } from '../../utils/format';

interface ElephantSummaryCardProps {
  elephant: Elephant;
  metrics: ElephantDailyMetrics;
  onEdit: () => void;
  assignmentsContent?: React.ReactNode;
}

export function ElephantSummaryCard({ elephant, metrics, onEdit, assignmentsContent }: ElephantSummaryCardProps) {
  const isPoopWarn = (metrics.feces_traits || []).some(t => t.includes('⚠️'));
  const isUrineWarn = (metrics.urination_traits || []).some(t => t.includes('⚠️') || t.includes('Темная') || t.includes('Мутная') || t.includes('Бурая'));
  
  const poopColor = isPoopWarn ? 'text-amber-500' : 'text-slate-600';
  const urineColor = isUrineWarn ? 'text-amber-500' : 'text-slate-600';

  const sleepText = metrics.sleep_state?.duration || 'Нет данных';

  return (
    <div className="bg-white/72 backdrop-blur-2xl border border-white/85 p-5 rounded-[26px] shadow-[0_10px_28px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.9)] flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900 text-[21px] leading-tight tracking-[-0.025em]">{elephant.name}</h3>
        <button 
          type="button"
          onClick={onEdit}
          className="min-h-11 px-4 rounded-full bg-white/80 hover:bg-white border border-white/90 shadow-[0_3px_12px_rgba(15,23,42,0.06)] text-[13px] font-bold text-blue-600 backdrop-blur-xl transition-[transform,background-color,box-shadow] active:scale-[0.97] flex items-center justify-center cursor-pointer"
        >
          Изменить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        {/* Дефекация */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">Дефекация</div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold leading-tight text-slate-800 min-w-0">
            <span className="text-base shrink-0">💩</span>
            <span className="truncate">{metrics.poop_count} <span className={`text-xs font-medium ${poopColor}`}>· {(metrics.feces_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}</span></span>
          </div>
        </div>

        {/* Мочеиспускание */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">Мочеиспускание</div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold leading-tight text-slate-800 min-w-0">
            <span className="text-base shrink-0">💧</span>
            <span className="truncate">{metrics.urination_count} <span className={`text-xs font-medium ${urineColor}`}>· {(metrics.urination_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}</span></span>
          </div>
        </div>

        {/* Сон */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">Сон</div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold leading-tight text-slate-800 min-w-0">
            <span className="text-base shrink-0">😴</span>
            <span className="truncate">{sleepText}</span>
          </div>
        </div>

        {/* Состояние */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">Состояние</div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold leading-tight text-slate-800 min-w-0">
            <span className="text-base shrink-0">🙂</span>
            <span className="truncate" title={metrics.behavior}>{metrics.behavior || 'Норма'}</span>
          </div>
        </div>
      </div>

      {assignmentsContent && (
        <div className="pt-3 border-t border-slate-200/50 mt-1">
          {assignmentsContent}
        </div>
      )}
    </div>
  );
}
