import React from 'react';
import { X } from 'lucide-react';
import { ElephantDailyMetrics, SleepInterval, ShiftPhoto } from '../../types/shift';
import { SectionPhotoTrigger } from './SectionPhotoTrigger';

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

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
};

const PRESETS = [
  { label: '+ 30 мин', minutes: 30 },
  { label: '+ 45 мин', minutes: 45 },
  { label: '+ 1 час', minutes: 60 },
  { label: '+ 1.5 часа', minutes: 90 },
  { label: '+ 2 часа', minutes: 120 }
];

interface Props {
  metrics: ElephantDailyMetrics;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  photos: ShiftPhoto[];
  onAddPhoto: (p: ShiftPhoto) => void;
  onRemovePhoto: (id: string) => void;
}

export function NightSleepSection({
  metrics,
  isLocked,
  onMetricChange,
  photos,
  onAddPhoto,
  onRemovePhoto
}: Props) {
  const intervals = metrics.sleep_intervals || [];

  // Only count valid intervals for total time
  const validIntervals = intervals.filter(i => i.start && i.end);
  const totalMinutes = validIntervals.reduce((acc, i) => acc + calculateDuration(i.start, i.end), 0);

  const handleIntervalsChange = (newIntervals: SleepInterval[]) => {
    onMetricChange('sleep_intervals', newIntervals);
    // Recalculate total for valid intervals to update sleep_minutes
    const total = newIntervals
      .filter(i => i.start && i.end)
      .reduce((acc, i) => acc + calculateDuration(i.start, i.end), 0);
    onMetricChange('sleep_minutes', total);
  };

  const handleAddPreset = (minutes: number) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    // Create a dummy start/end that results in the exact duration
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const endStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    const newIntervals = [
      ...intervals, 
      { id: Date.now().toString(), start: '00:00', end: endStr }
    ];
    handleIntervalsChange(newIntervals);
  };

  const handleRemoveInterval = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    handleIntervalsChange(intervals.filter(i => i.id !== id));
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[28px] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[28px] leading-none drop-shadow-sm">🌙</span>
          <div>
            <h3 className="font-bold text-slate-800 text-base tracking-wide leading-tight">Сон ночью</h3>
            <div className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
              {formatDuration(totalMinutes)} <span className="text-slate-500 font-medium text-xs font-normal">всего</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <SectionPhotoTrigger 
            section="sleep" 
            photos={photos} 
            onAddPhoto={onAddPhoto} 
            onRemovePhoto={onRemovePhoto} 
            totalElephantPhotos={photos.length} 
          />
        </div>
      </div>

      {/* List of Intervals */}
      <div className="pt-1">
        {validIntervals.length === 0 ? (
          <div className="text-center py-3 text-[13px] font-semibold text-slate-400">
            Слоны еще не ложились
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {validIntervals.map((interval, idx) => {
              const duration = calculateDuration(interval.start, interval.end);
              return (
                <div key={interval.id} className="flex items-center justify-between bg-white/70 border border-slate-200/50 rounded-[16px] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                  <div className="font-bold text-slate-500 text-sm">
                    Фаза {idx + 1}: <span className="text-slate-800 ml-1">{formatDuration(duration)}</span>
                  </div>
                  {!isLocked && (
                    <button 
                      onClick={() => handleRemoveInterval(interval.id)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors active:scale-90 -mr-1"
                      title="Удалить"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Presets */}
      {!isLocked && (
        <div className="flex flex-wrap gap-2 pt-1">
          {PRESETS.map((preset) => (
            <button 
              key={preset.minutes}
              onClick={() => handleAddPreset(preset.minutes)}
              className="flex-1 min-w-[30%] py-3.5 bg-white/70 hover:bg-white border border-white/60 rounded-[20px] text-slate-700 font-bold shadow-sm transition-all active:scale-95 text-[13px] flex items-center justify-center tracking-tight"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
