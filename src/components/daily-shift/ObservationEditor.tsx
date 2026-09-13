import React, { useState } from 'react';
import { ElephantDailyMetrics, SleepInterval } from '../../types/shift';
import { Elephant } from '../../types';
import { Check, X, Trash2 } from 'lucide-react';
import { DefecationSection } from './DefecationSection';
import { UrinationSection } from './UrinationSection';
import { NightSleepSection } from './NightSleepSection';
import { ObservationJournal } from './ObservationJournal';
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
  elephants?: Elephant[];
  allMetrics?: Record<string, ElephantDailyMetrics>;
  metrics: ElephantDailyMetrics;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  onAllMetricChange?: (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => void;
  onTraitToggle: (field: 'feces_traits' | 'urination_traits', trait: string) => void;
  onNotesBlur: () => void;
  onClose?: () => void;
  assignmentsContent?: React.ReactNode;
}

export function ObservationEditor({
  elephant,
  elephants,
  allMetrics,
  metrics,
  isLocked,
  onMetricChange,
  onAllMetricChange,
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

  const handleDefecationUrinationMetricChange = (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => {
    if (onAllMetricChange) {
      onAllMetricChange(elephantId, field, value);
    } else if (elephantId === elephant.id) {
      onMetricChange(field as string, value);
    }
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
    <div className="space-y-4 relative">
      
      {onClose && (
        <div className="flex items-center justify-end">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* DEFECATION & URINATION 3-COLUMN SECTIONS */}
      {(() => {
        const effectiveMetrics = (allMetrics && Object.keys(allMetrics).length > 0)
          ? { ...allMetrics, [elephant.id]: { ...(allMetrics[elephant.id] || {}), ...metrics } }
          : { [elephant.id]: metrics };

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <DefecationSection
              elephants={elephants}
              metrics={effectiveMetrics}
              onMetricChange={handleDefecationUrinationMetricChange}
              isLocked={isLocked}
            />
            <UrinationSection
              elephants={elephants}
              metrics={effectiveMetrics}
              onMetricChange={handleDefecationUrinationMetricChange}
              isLocked={isLocked}
            />
          </div>
        );
      })()}

      <NightSleepSection 
        metrics={metrics} 
        isLocked={isLocked} 
        onMetricChange={onMetricChange} 
        photos={photos} 
        onAddPhoto={handleAddPhoto} 
        onRemovePhoto={handleRemovePhoto} 
      />

      {/* NOTES SECTION */}
      <ObservationJournal
        value={metrics.notes || ''}
        onChange={(val) => onMetricChange('notes', val)}
        onBlur={onNotesBlur}
        isLocked={isLocked}
        photos={photos}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
      />

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
