import React, { useState } from 'react';
import { ElephantDailyMetrics } from '../../types/shift';
import { Elephant } from '../../types';
import { Check, X } from 'lucide-react';
import { CounterButton } from '../common/CounterButton';
import { ELEPHANT_MOODS } from '../../screens/DailyShiftPage';

const FECES_OPTIONS = [
  'Сформирован (норма)',
  'Рассыпчатый / Сухой',
  'Жидкий / Понос ⚠️',
  'Со слизью ⚠️',
  'Плохо переварен ⚠️'
];

const URINATION_OPTIONS = [
  'Светлая / Прозрачная',
  'Темная / Концентрированная',
  'Мутная / С осадком ⚠️',
  'Бурая / Красноватая ⚠️',
  'Малыми порциями ⚠️'
];

const MOOD_GLASS_STYLES: Record<string, { selected: string; unselected: string }> = {
  'Грустная / Вялая': {
    selected: 'bg-sky-50 text-sky-950 border-sky-300 ring-2 ring-sky-200/80 shadow-[0_4px_16px_rgba(56,189,248,0.18)] font-black',
    unselected: 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-sky-50/40 hover:border-sky-200'
  },
  'Спокойная / В норме': {
    selected: 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-2 ring-emerald-200/80 shadow-[0_4px_16px_rgba(16,185,129,0.18)] font-black',
    unselected: 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-emerald-50/40 hover:border-emerald-200'
  },
  'Бодрая / Отличный аппетит': {
    selected: 'bg-teal-50 text-teal-950 border-teal-300 ring-2 ring-teal-200/80 shadow-[0_4px_16px_rgba(20,184,166,0.18)] font-black',
    unselected: 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-teal-50/40 hover:border-teal-200'
  },
  'Игривая / Контактная': {
    selected: 'bg-purple-50 text-purple-950 border-purple-300 ring-2 ring-purple-200/80 shadow-[0_4px_16px_rgba(168,85,247,0.18)] font-black',
    unselected: 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-purple-50/40 hover:border-purple-200'
  },
  'Беспокойная / Настороже': {
    selected: 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.18)] font-black',
    unselected: 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-amber-50/40 hover:border-amber-200'
  },
};

interface Props {
  elephant: Elephant;
  metrics: ElephantDailyMetrics;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  onTraitToggle: (field: 'feces_traits' | 'urination_traits', trait: string) => void;
  onNotesBlur: () => void;
  onClose?: () => void;
  assignmentsContent?: React.ReactNode;
}

export function ObservationEditor({
  elephant,
  metrics,
  isLocked,
  onMetricChange,
  onTraitToggle,
  onNotesBlur,
  onClose,
  assignmentsContent
}: Props) {
  const fecesTraits = metrics.feces_traits || [];
  const urinationTraits = metrics.urination_traits || [];
  const currentBehavior = metrics.behavior || 'Спокойная / В норме';
  
  // Sleep state in minutes
  const sleepMinutes = metrics.sleep_minutes ?? 420; // Default to 7 hours if not set

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] space-y-6 relative">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-2">
            <span>🐘</span> {elephant.name}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {isLocked ? 'Просмотр' : 'Ввод данных активен'}
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            title="Закрыть"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* DEFECATION */}
        <div className="bg-white/50 border border-white/80 rounded-[20px] p-4 space-y-4 shadow-sm">
          <CounterButton
            label="💩 Дефекация (раз)"
            value={metrics.poop_count}
            onChange={(val) => onMetricChange('poop_count', val)}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            {FECES_OPTIONS.map(trait => {
              const isSelected = fecesTraits.includes(trait);
              const isWarning = trait.includes('⚠️');
              const isNormal = trait.includes('норма');
              
              let btnStyle = 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50';
              if (isSelected) {
                if (isWarning) btnStyle = 'bg-amber-500 text-white border-amber-500 shadow-sm';
                else if (isNormal) btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-sm';
                else btnStyle = 'bg-slate-700 text-white border-slate-700 shadow-sm';
              }
              
              return (
                <button
                  key={trait}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onTraitToggle('feces_traits', trait)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 ${btnStyle}`}
                >
                  <span>{trait.replace(' ⚠️', '')}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* URINATION */}
        <div className="bg-white/50 border border-white/80 rounded-[20px] p-4 space-y-4 shadow-sm">
          <CounterButton
            label="💧 Мочеиспускание (раз)"
            value={metrics.urination_count}
            onChange={(val) => onMetricChange('urination_count', val)}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            {URINATION_OPTIONS.map(trait => {
              const isSelected = urinationTraits.includes(trait);
              const isWarning = trait.includes('⚠️') || trait.includes('Темная') || trait.includes('Мутная') || trait.includes('Бурая');
              const isNormal = trait.includes('Светлая / Прозрачная');
              
              let btnStyle = 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50';
              if (isSelected) {
                if (isNormal) btnStyle = 'bg-blue-500 text-white border-blue-500 shadow-sm';
                else if (isWarning) btnStyle = 'bg-amber-500 text-white border-amber-500 shadow-sm';
                else btnStyle = 'bg-slate-700 text-white border-slate-700 shadow-sm';
              }
              
              return (
                <button
                  key={trait}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onTraitToggle('urination_traits', trait)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 ${btnStyle}`}
                >
                  <span>{trait.replace(' ⚠️', '')}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SLEEP (NEW METRIC) */}
      <div className="bg-white/50 border border-white/80 rounded-[20px] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <span className="text-base">😴</span> Сон ночью
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            disabled={isLocked || sleepMinutes <= 0}
            onClick={() => onMetricChange('sleep_minutes', Math.max(0, sleepMinutes - 15))}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center font-bold text-lg text-slate-700 active:scale-95 disabled:opacity-50"
          >
            -
          </button>
          <div className="w-24 text-center font-black text-slate-800 text-lg">
            {Math.floor(sleepMinutes / 60)} ч {sleepMinutes % 60 > 0 ? `${sleepMinutes % 60} м` : ''}
          </div>
          <button 
            type="button"
            disabled={isLocked}
            onClick={() => onMetricChange('sleep_minutes', sleepMinutes + 15)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center font-bold text-lg text-slate-700 active:scale-95 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* BEHAVIOR */}
      <div className="bg-white/50 border border-white/80 rounded-[20px] p-4 shadow-sm space-y-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">🙂 Состояние</div>
        <div className="grid grid-cols-5 gap-2">
          {ELEPHANT_MOODS.map(mood => {
            const isSelected = currentBehavior === mood.id;
            const style = MOOD_GLASS_STYLES[mood.id] || {
              selected: 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-2 ring-emerald-200 shadow-sm font-black',
              unselected: 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50'
            };
            return (
              <button
                key={mood.id}
                type="button"
                disabled={isLocked}
                onClick={() => onMetricChange('behavior', mood.id)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isSelected 
                    ? `${style.selected} scale-105` 
                    : `${style.unselected} active:scale-95`
                }`}
              >
                <span className="text-2xl mb-1 shrink-0">{mood.emoji}</span>
                <span className={`text-[9px] font-bold leading-tight text-center ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                  {mood.label.split(' / ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <input
          type="text"
          disabled={isLocked}
          value={metrics.notes || ''}
          onChange={(e) => onMetricChange('notes', e.target.value)}
          onBlur={onNotesBlur}
          placeholder="Краткие заметки по слону..."
          className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-400 transition shadow-sm"
        />
      </div>

      {/* VETERINARY ASSIGNMENTS IF ANY */}
      {assignmentsContent && (
        <div className="pt-2 border-t border-slate-200/60">
          {assignmentsContent}
        </div>
      )}

      {onClose && (
        <div className="pt-2">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-[0.98] transition-transform"
          >
            Готово
          </button>
        </div>
      )}
    </div>
  );
}
