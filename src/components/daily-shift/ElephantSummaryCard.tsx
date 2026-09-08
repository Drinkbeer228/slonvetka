import React from 'react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics } from '../../types/shift';
import { formatDuration } from '../../utils/format'; // We'll create this utility

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

  const sleepText = metrics.sleep_minutes ? formatDuration(metrics.sleep_minutes) : 'Не указан';

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-xl tracking-tight">{elephant.name}</h3>
        <button 
          onClick={onEdit}
          className="text-blue-600 text-xs font-bold bg-blue-50/50 hover:bg-blue-100/50 px-3 py-1.5 rounded-full border border-blue-200/50 shadow-sm backdrop-blur transition-all active:scale-95"
        >
          Изменить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-slate-500">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Дефекация</div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="text-base">💩</span>
            <span>{metrics.poop_count} <span className={`text-xs font-medium ${poopColor}`}>· {(metrics.feces_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}</span></span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Мочеиспускание</div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="text-base">💧</span>
            <span>{metrics.urination_count} <span className={`text-xs font-medium ${urineColor}`}>· {(metrics.urination_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}</span></span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Сон</div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="text-base">😴</span>
            <span>{sleepText}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Состояние</div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="text-base">🙂</span>
            <span className="truncate" title={metrics.behavior}>{metrics.behavior}</span>
          </div>
        </div>
      </div>

      {assignmentsContent && (
        <div className="pt-4 border-t border-slate-200/50 mt-1">
          {assignmentsContent}
        </div>
      )}
    </div>
  );
}
