const fs = require('fs');

const code = `import React from 'react';
import { X, Plus } from 'lucide-react';
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
  if (h > 0 && m > 0) return \`\${h} ч \${m} мин\`;
  if (h > 0) return \`\${h} ч\`;
  return \`\${m} мин\`;
};

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

  const handleAddInterval = () => {
    const newIntervals = [...intervals, { id: Date.now().toString(), start: '', end: '' }];
    handleIntervalsChange(newIntervals);
  };

  const handleUpdateInterval = (id: string, field: 'start' | 'end', value: string) => {
    const newIntervals = intervals.map(i => i.id === id ? { ...i, [field]: value } : i);
    handleIntervalsChange(newIntervals);
  };

  const handleRemoveInterval = (id: string) => {
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

      {/* List of Intervals (Inline editing) */}
      <div className="pt-2">
        {intervals.length === 0 ? (
          <div className="text-center py-4 text-sm font-medium text-slate-400">
            Нет записей за ночь
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {intervals.map(interval => {
              const duration = calculateDuration(interval.start, interval.end);
              return (
                <div key={interval.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/40 border border-white/50 rounded-2xl p-2 sm:px-3 sm:py-2 gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      type="time" 
                      value={interval.start}
                      onChange={(e) => handleUpdateInterval(interval.id, 'start', e.target.value)}
                      disabled={isLocked}
                      className="bg-white/70 border border-slate-200/60 rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/30 transition-all flex-1 sm:flex-none text-center"
                    />
                    <span className="text-slate-400 font-bold">—</span>
                    <input 
                      type="time" 
                      value={interval.end}
                      onChange={(e) => handleUpdateInterval(interval.id, 'end', e.target.value)}
                      disabled={isLocked}
                      className="bg-white/70 border border-slate-200/60 rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/30 transition-all flex-1 sm:flex-none text-center"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pl-1 sm:pl-3">
                    <div className="text-xs font-bold text-slate-500 w-16 text-center sm:text-right">
                      {interval.start && interval.end ? formatDuration(duration) : '—'}
                    </div>
                    {!isLocked && (
                      <button 
                        onClick={() => handleRemoveInterval(interval.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors active:scale-90 ml-2"
                        title="Удалить"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      {!isLocked && (
        <button 
          onClick={handleAddInterval}
          className="w-full py-3 mt-1 bg-white/40 hover:bg-white/60 rounded-[20px] text-slate-600 font-bold backdrop-blur-md transition-all active:scale-95 shadow-sm border border-white/60 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>Добавить интервал сна</span>
        </button>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/daily-shift/NightSleepSection.tsx', code);
