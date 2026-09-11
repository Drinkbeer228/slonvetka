const fs = require('fs');

const code = `import React, { useState } from 'react';
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
  if (h > 0 && m > 0) return \`\${h} ч \${m} мин\`;
  if (h > 0) return \`\${h} ч\`;
  return \`\${m} мин\`;
};

const addMinutesToTime = (timeStr: string, minsToAdd: number) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minsToAdd, 0, 0);
  return \`\${String(date.getHours()).padStart(2, '0')}:\${String(date.getMinutes()).padStart(2, '0')}\`;
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
  const [isAdding, setIsAdding] = useState(false);
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  const intervals = metrics.sleep_intervals || [];

  // Filter out any garbage intervals (like old incomplete stopwatch ones) and those < 15m
  const validIntervals = intervals.filter(i => {
    if (!i.start || !i.end) return false;
    return calculateDuration(i.start, i.end) >= 15;
  });

  const totalMinutes = validIntervals.reduce((acc, i) => acc + calculateDuration(i.start, i.end), 0);

  const handleIntervalsChange = (newIntervals: SleepInterval[]) => {
    onMetricChange('sleep_intervals', newIntervals);
    const total = newIntervals.reduce((acc, i) => acc + calculateDuration(i.start, i.end), 0);
    onMetricChange('sleep_minutes', total);
  };

  const handleRemove = (id: string) => {
    handleIntervalsChange(validIntervals.filter(i => i.id !== id));
  };

  const handleSave = () => {
    const dur = calculateDuration(manualStart, manualEnd);
    if (dur >= 15) {
      handleIntervalsChange([...validIntervals, { id: Date.now().toString(), start: manualStart, end: manualEnd }]);
      setIsAdding(false);
      setManualStart('');
      setManualEnd('');
    }
  };

  const handleQuickAdd = (mins: number) => {
    if (!manualStart) {
      const now = new Date();
      const timeStr = \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;
      setManualStart(timeStr);
      setManualEnd(addMinutesToTime(timeStr, mins));
    } else {
      setManualEnd(addMinutesToTime(manualStart, mins));
    }
  };

  const quickButtons = [
    { label: '+15м', val: 15 },
    { label: '+30м', val: 30 },
    { label: '+1ч', val: 60 },
    { label: '+1.5ч', val: 90 },
    { label: '+2ч', val: 120 }
  ];

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/40 rounded-[32px] p-5 shadow-sm space-y-5">
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

      {/* List of Intervals (iOS Style) */}
      {validIntervals.length > 0 && (
        <div className="divide-y divide-white/40">
          {validIntervals.map(interval => (
            <div key={interval.id} className="flex items-center justify-between py-3 px-1">
              <div className="flex items-center gap-3">
                <div className="text-base font-black text-slate-800 tracking-tight">
                  {interval.start} <span className="text-slate-400 font-normal mx-1">—</span> {interval.end}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <div className="text-xs font-bold text-slate-500">
                  {formatDuration(calculateDuration(interval.start, interval.end))}
                </div>
              </div>
              {!isLocked && (
                <button 
                  onClick={() => handleRemove(interval.id)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors active:scale-90"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Button / Inline Form */}
      {!isLocked && (
        <div className="pt-2">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3.5 bg-white/40 hover:bg-white/60 rounded-2xl text-blue-600 font-bold backdrop-blur-md transition-all active:scale-95 shadow-sm border border-white/60"
            >
              + Зафиксировать сон
            </button>
          ) : (
            <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-[24px] p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">От</label>
                  <input 
                    type="time" 
                    value={manualStart}
                    onChange={e => setManualStart(e.target.value)}
                    className="w-full bg-white/80 border border-white rounded-xl px-3 py-2.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">До</label>
                  <input 
                    type="time" 
                    value={manualEnd}
                    onChange={e => setManualEnd(e.target.value)}
                    className="w-full bg-white/80 border border-white rounded-xl px-3 py-2.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-5">
                {quickButtons.map(btn => (
                  <button
                    key={btn.label}
                    onClick={() => handleQuickAdd(btn.val)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-colors border border-blue-100"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white/50 hover:bg-white/80 active:scale-95 transition-all border border-white/60"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSave}
                  disabled={calculateDuration(manualStart, manualEnd) < 15}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-600/20"
                >
                  Сохранить
                </button>
              </div>
              {manualStart && manualEnd && calculateDuration(manualStart, manualEnd) < 15 && (
                <div className="text-center mt-3 text-[10px] text-red-500 font-bold">
                  Минимум 15 минут
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/daily-shift/NightSleepSection.tsx', code);
