import React, { useState } from 'react';
import { ElephantDailyMetrics, SleepInterval } from '../../types/shift';
import { Elephant } from '../../types';
import { Check, X, Trash2 } from 'lucide-react';
import { CounterButton } from '../common/CounterButton';
import { SectionPhotoTrigger } from './SectionPhotoTrigger';
import { NightSleepSection } from './NightSleepSection';
import { ShiftPhoto } from '../../types/shift';
import { ELEPHANT_MOODS } from '../../screens/DailyShiftPage';

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  let startMins = h1 * 60 + m1;
  let endMins = h2 * 60 + m2;
  
  if (endMins < startMins) {
    endMins += 24 * 60; // Cross midnight
  }
  
  return endMins - startMins;
};

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

  const photos = metrics.photos || [];
  
  const handleAddPhoto = (photo: ShiftPhoto) => {
    onMetricChange('photos', [...photos, photo]);
  };

  const handleRemovePhoto = (id: string) => {
    onMetricChange('photos', photos.filter(p => p.id !== id));
  };


  const handleIntervalsChange = (newIntervals: SleepInterval[]) => {
    onMetricChange('sleep_intervals', newIntervals);
    
    // Auto-sum total
    const totalMins = newIntervals.reduce((acc, i) => acc + calculateDuration(i.start, i.end), 0);
    if (totalMins > 0 || newIntervals.length === 0) {
      onMetricChange('sleep_minutes', totalMins);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 p-5 rounded-[32px] shadow-lg space-y-6 relative">
      
      {onClose && (
        <div className="flex items-center justify-end mb-[-12px]">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 hover:bg-white/80"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* DEFECATION */}
        <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 space-y-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <CounterButton
              label="💩 Дефекация (раз)"
              value={metrics.poop_count}
              onChange={(val) => onMetricChange('poop_count', val)}
            />
            <div className="pb-1 shrink-0">
              <SectionPhotoTrigger 
                section="stool" 
                photos={photos} 
                onAddPhoto={handleAddPhoto} 
                onRemovePhoto={handleRemovePhoto} 
                totalElephantPhotos={photos.length} 
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {FECES_OPTIONS.map(trait => {
              const isSelected = fecesTraits.includes(trait);
              const isWarning = trait.includes('⚠️');
              const isNormal = trait.includes('норма');
              
              let btnStyle = 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white/90';
              if (isSelected) {
                if (isWarning) btnStyle = 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 border-transparent';
                else if (isNormal) btnStyle = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border-transparent';
                else btnStyle = 'bg-slate-700 text-white shadow-lg shadow-slate-900/20 border-transparent';
              }
              
              return (
                <button
                  key={trait}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onTraitToggle('feces_traits', trait)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 ${btnStyle}`}
                >
                  <span>{trait.replace(' ⚠️', '')}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* URINATION */}
        <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 space-y-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <CounterButton
              label="💧 Мочеиспускание (раз)"
              value={metrics.urination_count}
              onChange={(val) => onMetricChange('urination_count', val)}
            />
            <div className="pb-1 shrink-0">
              <SectionPhotoTrigger 
                section="urine" 
                photos={photos} 
                onAddPhoto={handleAddPhoto} 
                onRemovePhoto={handleRemovePhoto} 
                totalElephantPhotos={photos.length} 
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {URINATION_OPTIONS.map(trait => {
              const isSelected = urinationTraits.includes(trait);
              const isWarning = trait.includes('⚠️') || trait.includes('Темная') || trait.includes('Мутная') || trait.includes('Бурая');
              const isNormal = trait.includes('Светлая / Прозрачная');
              
              let btnStyle = 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white/90';
              if (isSelected) {
                if (isNormal) btnStyle = 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-transparent';
                else if (isWarning) btnStyle = 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 border-transparent';
                else btnStyle = 'bg-slate-700 text-white shadow-lg shadow-slate-900/20 border-transparent';
              }
              
              return (
                <button
                  key={trait}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onTraitToggle('urination_traits', trait)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 ${btnStyle}`}
                >
                  <span>{trait.replace(' ⚠️', '')}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <NightSleepSection 
        metrics={metrics} 
        isLocked={isLocked} 
        onMetricChange={onMetricChange} 
        photos={photos} 
        onAddPhoto={handleAddPhoto} 
        onRemovePhoto={handleRemovePhoto} 
      />

      {/* NOTES SECTION */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center text-xl shadow-inner">
            📝
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm tracking-wide">Журнал наблюдений</div>
            <div className="text-[11px] text-slate-500 font-medium">Подробные заметки за смену</div>
          </div>
        </div>
        <div className="absolute top-5 right-5">
          <SectionPhotoTrigger 
            section="general" 
            photos={photos} 
            onAddPhoto={handleAddPhoto} 
            onRemovePhoto={handleRemovePhoto} 
            totalElephantPhotos={photos.length} 
          />
        </div>
        <textarea
          disabled={isLocked}
          value={metrics.notes || ''}
          onChange={(e) => onMetricChange('notes', e.target.value)}
          onBlur={onNotesBlur}
          placeholder="например: марго\претти\одри плохо хавала овощи на ужин, потом дристала утром сразу как проснулась"
          rows={4}
          className="w-full px-5 py-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all shadow-inner placeholder:text-slate-400/80 text-slate-800 resize-none"
        />
      </div>

      {/* VETERINARY ASSIGNMENTS IF ANY */}
      {assignmentsContent && (
        <div className="pt-4 mt-4 border-t border-white/40">
          {assignmentsContent}
        </div>
      )}

      {onClose && (
        <div className="pt-4">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-800 text-white rounded-[20px] font-bold text-sm shadow-xl shadow-slate-800/20 active:scale-95 transition-all"
          >
            Сохранить и закрыть
          </button>
        </div>
      )}
    </div>
  );
}
