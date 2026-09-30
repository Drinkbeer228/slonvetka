import React from 'react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics } from '../../types/shift';

interface ElephantSummaryCardProps {
  elephant: Elephant;
  metrics: ElephantDailyMetrics;
  onEdit: () => void;
  assignmentsContent?: React.ReactNode;
}

export function ElephantSummaryCard({ elephant, metrics, onEdit, assignmentsContent }: ElephantSummaryCardProps) {
  const isPoopWarn = (metrics.feces_traits || []).some(t => t.includes('⚠️'));
  const isUrineWarn = (metrics.urination_traits || []).some(t => t.includes('⚠️') || t.includes('Темная') || t.includes('Мутная') || t.includes('Бурая'));
  
  const poopColor = isPoopWarn ? 'text-amber-400' : 'text-zinc-400';
  const urineColor = isUrineWarn ? 'text-amber-400' : 'text-zinc-400';

  const sleepText = metrics.sleep_state?.duration || 'Нет данных';

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-xl shadow-black/20 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-white text-xl tracking-tight break-words">{elephant.name}</h3>
        <button 
          type="button"
          onClick={onEdit}
          className="min-h-[44px] px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/80 text-xs font-semibold text-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer touch-manipulation"
        >
          Изменить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {/* Дефекация */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 leading-none">Дефекация</div>
          <div className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-zinc-200 min-w-0">
            <span className="text-base shrink-0 leading-none mt-0.5">💩</span>
            <span className="break-words">
              {metrics.poop_count}{' '}
              <span className={`text-xs font-normal ${poopColor}`}>
                · {(metrics.feces_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}
              </span>
            </span>
          </div>
        </div>

        {/* Мочеиспускание */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 leading-none">Мочеиспускание</div>
          <div className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-zinc-200 min-w-0">
            <span className="text-base shrink-0 leading-none mt-0.5">💧</span>
            <span className="break-words">
              {metrics.urination_count}{' '}
              <span className={`text-xs font-normal ${urineColor}`}>
                · {(metrics.urination_traits?.[0] || 'Норма').replace(' ⚠️', '').toLowerCase()}
              </span>
            </span>
          </div>
        </div>

        {/* Сон */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 leading-none">Сон</div>
          <div className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-zinc-200 min-w-0">
            <span className="text-base shrink-0 leading-none mt-0.5">😴</span>
            <span className="break-words">{sleepText}</span>
          </div>
        </div>

        {/* Состояние */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 leading-none">Состояние</div>
          <div className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-zinc-200 min-w-0">
            <span className="text-base shrink-0 leading-none mt-0.5">🙂</span>
            <span className="break-words">{metrics.behavior || 'Норма'}</span>
          </div>
        </div>
      </div>

      {assignmentsContent && (
        <div className="pt-3 border-t border-zinc-800/80 mt-1">
          {assignmentsContent}
        </div>
      )}
    </div>
  );
}
