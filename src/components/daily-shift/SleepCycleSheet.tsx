import React from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Clock } from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics, SleepInterval } from '../../types/shift';

export const calculateIntervalMinutes = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  let startMins = h1 * 60 + m1;
  let endMins = h2 * 60 + m2;
  if (endMins < startMins) {
    endMins += 24 * 60; // sleep over midnight
  }
  return Math.max(0, endMins - startMins);
};

export const formatIntervalDurationText = (minutes: number): string => {
  if (minutes <= 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
};

export const formatTotalSleepHours = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0 ч';
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours} ч`;
  }
  return `${parseFloat(hours.toFixed(1))} ч`;
};

export const formatLaydownsCount = (count: number): string => {
  if (count === 1) return '1 раз';
  if (count >= 2 && count <= 4) return `${count} раза`;
  return `${count} раз`;
};

interface SleepCycleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  elephants: { id: string; name: string }[];
  activeElephantId: string;
  onSelectElephant: (elephantId: string) => void;
  metrics?: Record<string, ElephantDailyMetrics>;
  onIntervalsChange: (elephantId: string, intervals: SleepInterval[], totalMinutes: number) => void;
  isLocked?: boolean;
}

export function SleepCycleSheet({
  isOpen,
  onClose,
  elephants,
  activeElephantId,
  onSelectElephant,
  metrics,
  onIntervalsChange,
  isLocked = false,
}: SleepCycleSheetProps) {
  if (!isOpen) return null;

  const activeElephant = elephants.find((e) => e.id === activeElephantId) || elephants[0];
  const activeMetrics = activeElephant ? metrics?.[activeElephant.id] : undefined;
  const currentIntervals: SleepInterval[] = activeMetrics?.sleep_intervals || [];

  const handleHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const handleAddInterval = () => {
    if (isLocked || !activeElephant) return;
    handleHaptic(12);

    let defaultStart = '01:00';
    let defaultEnd = '03:30';

    if (currentIntervals.length > 0) {
      const last = currentIntervals[currentIntervals.length - 1];
      if (last.end) {
        const [h, m] = last.end.split(':').map(Number);
        const nextStartHour = (h + 1) % 24;
        const nextEndHour = (nextStartHour + 2) % 24;
        defaultStart = `${String(nextStartHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
        defaultEnd = `${String(nextEndHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }

    const newInterval: SleepInterval = {
      id: `interval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      start: defaultStart,
      end: defaultEnd,
    };

    const nextIntervals = [...currentIntervals, newInterval];
    const totalMins = nextIntervals.reduce(
      (sum, item) => sum + calculateIntervalMinutes(item.start, item.end),
      0
    );

    onIntervalsChange(activeElephant.id, nextIntervals, totalMins);
  };

  const handleUpdateInterval = (index: number, field: 'start' | 'end', value: string) => {
    if (isLocked || !activeElephant) return;

    const nextIntervals = currentIntervals.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    });

    const totalMins = nextIntervals.reduce(
      (sum, item) => sum + calculateIntervalMinutes(item.start, item.end),
      0
    );

    onIntervalsChange(activeElephant.id, nextIntervals, totalMins);
  };

  const handleRemoveInterval = (index: number) => {
    if (isLocked || !activeElephant) return;
    handleHaptic(15);

    const nextIntervals = currentIntervals.filter((_, idx) => idx !== index);
    const totalMins = nextIntervals.reduce(
      (sum, item) => sum + calculateIntervalMinutes(item.start, item.end),
      0
    );

    onIntervalsChange(activeElephant.id, nextIntervals, totalMins);
  };

  const totalCalculatedMinutes = currentIntervals.reduce(
    (sum, item) => sum + calculateIntervalMinutes(item.start, item.end),
    0
  );

  return createPortal(
    <div className="fixed inset-0 z-[160] flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Sheet Container */}
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-[32px] p-5 pb-7 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[88vh] flex flex-col">
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌙</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Интервалы сна
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Учет укладок и точного времени отдыха
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="Закрыть шторку"
          >
            <X size={18} />
          </button>
        </div>

        {/* Elephant Selector (Segmented Control) */}
        {elephants.length > 1 && (
          <div className="grid grid-cols-3 bg-slate-100/80 p-1 rounded-2xl mb-4 shrink-0">
            {elephants.map((e) => {
              const isActive = e.id === activeElephant?.id;
              const emoji = e.id === 'margo' ? '👑' : e.id === 'odri' ? '🎀' : '🌸';
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onSelectElephant(e.id);
                    handleHaptic(10);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-white shadow-xs text-slate-900'
                      : 'text-slate-500 font-medium hover:text-slate-700'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="truncate">{e.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Summary bar for active elephant */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 shrink-0">
          <div className="text-xs font-semibold text-slate-600">
            Слон: <span className="font-bold text-slate-900">{activeElephant?.name}</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            Итого:{' '}
            <span className="text-indigo-600 font-black">
              {formatTotalSleepHours(totalCalculatedMinutes)}
            </span>{' '}
            <span className="text-slate-500 font-medium">
              ({formatLaydownsCount(currentIntervals.length)})
            </span>
          </div>
        </div>

        {/* Scrollable Intervals List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {currentIntervals.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Clock className="mx-auto text-slate-400 mb-2" size={32} />
              <div className="text-sm font-bold text-slate-700">
                Нет добавленных циклов сна
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                Нажмите «Добавить интервал сна», чтобы зафиксировать время укладки
              </p>
            </div>
          ) : (
            currentIntervals.map((interval, index) => {
              const durationMins = calculateIntervalMinutes(interval.start, interval.end);
              return (
                <div
                  key={interval.id || `interval-${index}`}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative"
                >
                  {/* Delete Button (✕) top-right */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleRemoveInterval(index)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-200/60 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40"
                    title="Удалить этот цикл сна"
                    aria-label="Удалить цикл сна"
                  >
                    <X size={16} />
                  </button>

                  {/* Header info */}
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Укладка #{index + 1}
                  </div>

                  {/* Row 1: Легла спать */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      Легла спать:
                    </span>
                    <input
                      type="time"
                      disabled={isLocked}
                      value={interval.start || ''}
                      onChange={(e) => handleUpdateInterval(index, 'start', e.target.value)}
                      className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                    />
                  </div>

                  {/* Row 2: Проснулась */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-slate-700">
                      Проснулась:
                    </span>
                    <input
                      type="time"
                      disabled={isLocked}
                      value={interval.end || ''}
                      onChange={(e) => handleUpdateInterval(index, 'end', e.target.value)}
                      className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                    />
                  </div>

                  {/* Auto-calculated duration */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Продолжительность:</span>
                    <span className="text-slate-900 font-extrabold">
                      Итого: {formatIntervalDurationText(durationMins)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Interval Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleAddInterval}
            className="w-full h-11 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus size={16} />
            <span>Добавить интервал сна</span>
          </button>
        </div>

        {/* Footer Done Button */}
        <div className="pt-3 mt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base shadow-lg shadow-slate-900/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            Готово
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
