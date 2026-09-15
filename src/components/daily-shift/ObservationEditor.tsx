import React from 'react';
import { ElephantDailyMetrics } from '../../types/shift';
import { Elephant } from '../../types';
import { X } from 'lucide-react';
import { ExcretionControl } from './ExcretionControl';
import { ObservationJournal } from './ObservationJournal';
import { CircusElephantMonitoring } from './CircusElephantMonitoring';
import { ShiftPhoto } from '../../types/shift';

interface Props {
  elephant: Elephant;
  elephants?: Elephant[];
  allMetrics?: Record<string, ElephantDailyMetrics>;
  metrics: ElephantDailyMetrics;
  selectedDate?: string;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  onAllMetricChange?: (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => void;
  onTraitToggle: (field: 'feces_traits' | 'urination_traits', trait: string) => void;
  onNotesBlur: () => void;
  onClose?: () => void;
  assignmentsContent?: React.ReactNode;
  showExcretion?: boolean;
}

export function ObservationEditor({
  elephant,
  elephants,
  allMetrics,
  metrics,
  selectedDate,
  isLocked,
  onMetricChange,
  onAllMetricChange,
  onTraitToggle,
  onNotesBlur,
  onClose,
  assignmentsContent,
  showExcretion = false
}: Props) {
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

  const handleAppendLogToNotes = (logText: string) => {
    const current = (metrics.notes || '').trim();
    const nextNotes = current ? `${current}\n${logText}` : logText;
    onMetricChange('notes', nextNotes);
  };

  const handleAddMediaLog = (_caption: string, photoUrl: string) => {
    const newPhoto: ShiftPhoto = {
      id: `circus_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      section: 'general',
      storage_path: photoUrl,
    };
    onMetricChange('photos', [...photos, newPhoto]);
  };

  return (
    <div className="space-y-4 relative">
      
      {onClose && (
        <div className="flex items-center justify-end">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/80 border border-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* DEFECATION, URINATION & SLEEP 3-COLUMN UNIFIED SECTIONS */}
      {showExcretion && (() => {
        const effectiveMetrics = (allMetrics && Object.keys(allMetrics).length > 0)
          ? { ...allMetrics, [elephant.id]: { ...(allMetrics[elephant.id] || {}), ...metrics } }
          : { [elephant.id]: metrics };

        return (
          <ExcretionControl
            elephants={elephants}
            metrics={effectiveMetrics}
            onMetricChange={handleDefecationUrinationMetricChange}
            isLocked={isLocked}
          />
        );
      })()}

      {/* ЦИРКОВАЯ СПЕЦИФИКА НАБЛЮДЕНИЙ ДЛЯ ВЫБРАННОГО СЛОНА: ЗАМЫВКА, СТЕРЕОТИПИИ, МОНИТОРИНГ НОГ */}
      <CircusElephantMonitoring
        elephant={elephant}
        selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
        notes={metrics.notes || ''}
        isLocked={isLocked}
        onAppendLog={handleAppendLogToNotes}
        onAddMediaLog={handleAddMediaLog}
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
        <div className="pt-2 mt-2 border-t border-slate-200/50">
          {assignmentsContent}
        </div>
      )}

      {onClose && (
        <div className="pt-4">
          <button 
            onClick={onClose}
            className="w-full min-h-12 rounded-[18px] bg-slate-900 text-white font-bold text-[14px] shadow-[0_8px_20px_rgba(15,23,42,0.16)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center"
          >
            Сохранить и закрыть
          </button>
        </div>
      )}
    </div>
  );
}
