import React from 'react';
import { ElephantDailyMetrics } from '../../types/shift';
import { Elephant } from '../../types';
import { X } from 'lucide-react';
import { ExcretionControl } from './ExcretionControl';
import { ObservationJournal } from './ObservationJournal';
import { ShiftPhoto } from '../../types/shift';

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

  return (
    <div className="space-y-4 relative">
      
      {onClose && (
        <div className="flex items-center justify-end">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* DEFECATION, URINATION & SLEEP 3-COLUMN UNIFIED SECTIONS */}
      {(() => {
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
            className="w-full py-4 bg-slate-800 text-white rounded-[20px] font-bold text-sm shadow-xl shadow-slate-800/20 active:scale-95 transition-all cursor-pointer"
          >
            Сохранить и закрыть
          </button>
        </div>
      )}
    </div>
  );
}
