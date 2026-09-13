import React from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Clock, AlertTriangle } from 'lucide-react';
import { ElephantDailyMetrics, SleepInterval, clampSleepMinutes } from '../../types/shift';

export const calculateIntervalMinutes = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  let startMins = h1 * 60 + m1;
  let endMins   = h2 * 60 + m2;
  if (endMins < startMins) endMins += 24 * 60; // through midnight
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
  if (Number.isInteger(hours)) return `${hours} ч`;
  return `${parseFloat(hours.toFixed(1))} ч`;
};

export const formatLaydownsCount = (count: number): string => {
  if (count === 1) return '1 раз';
  if (count >= 2 && count <= 4) return `${count} раза`;
  return `${count} раз`;
};

const ELEPHANT_EMOJI: Record<string, string> = {
  margo:  '👑',
  odri:   '🎀',
  pretty: '🌸',
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

  const activeElephant = elephants.find(e => e.id === activeElephantId) || elephants[0];
  const activeMetrics  = activeElephant ? metrics?.[activeElephant.id] : undefined;
  const currentIntervals: SleepInterval[] = activeMetrics?.sleep_intervals ?? [];
  const totalMins = currentIntervals.reduce((s, i) => s + calculateIntervalMinutes(i.start, i.end), 0);

  const handleHaptic = (ms = 12) => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch { /* ignore */ }
    }
  };

  const handleAddInterval = () => {
    if (isLocked || !activeElephant) return;
    handleHaptic(12);

    let defaultStart = '01:00';
    let defaultEnd   = '03:30';
    if (currentIntervals.length > 0) {
      const last = currentIntervals[currentIntervals.length - 1];
      if (last.end) {
        const [h, m] = last.end.split(':').map(Number);
        const ns = (h + 1) % 24;
        const ne = (ns + 2) % 24;
        defaultStart = `${String(ns).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
        defaultEnd   = `${String(ne).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }

    const newInterval: SleepInterval = {
      id:    `interval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      start: defaultStart,
      end:   defaultEnd,
    };

    const next = [...currentIntervals, newInterval];
    const total = clampSleepMinutes(next.reduce((s, i) => s + calculateIntervalMinutes(i.start, i.end), 0));
    onIntervalsChange(activeElephant.id, next, total);
  };

  const handleUpdateInterval = (index: number, field: 'start' | 'end', value: string) => {
    if (isLocked || !activeElephant) return;
    const next = currentIntervals.map((item, idx) =>
      idx !== index ? item : { ...item, [field]: value }
    );
    const total = clampSleepMinutes(next.reduce((s, i) => s + calculateIntervalMinutes(i.start, i.end), 0));
    onIntervalsChange(activeElephant.id, next, total);
  };

  const handleRemoveInterval = (index: number) => {
    if (isLocked || !activeElephant) return;
    handleHaptic(15);
    const next = currentIntervals.filter((_, idx) => idx !== index);
    const total = clampSleepMinutes(next.reduce((s, i) => s + calculateIntervalMinutes(i.start, i.end), 0));
    onIntervalsChange(activeElephant.id, next, total);
  };

  /** Warn if total exceeds 12 hours (potentially erroneous) */
  const isOverLimit = totalMins > 720;

  return createPortal(
    <div
      className="fixed inset-0 z-[160] flex flex-col justify-end"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}
    >
      {/* Backdrop dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Sheet */}
      <div
        className="w-full max-w-lg mx-auto p-5 pb-8 max-h-[90vh] flex flex-col animate-slide-up"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 -8px 40px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        {/* Handle */}
        <div
          className="w-10 h-1 mx-auto mb-4 rounded-full shrink-0"
          style={{ background: 'rgba(148,163,184,0.4)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Интервалы сна
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Учёт укладок и точного времени отдыха
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 transition-colors hover:text-slate-800 cursor-pointer active:scale-95 tap-target"
            style={{
              background: 'rgba(148,163,184,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
            aria-label="Закрыть шторку"
          >
            <X size={17} />
          </button>
        </div>

        {/* Elephant Selector */}
        {elephants.length > 1 && (
          <div
            className="grid p-1 mb-4 shrink-0"
            style={{
              gridTemplateColumns: `repeat(${elephants.length}, 1fr)`,
              background: 'rgba(148,163,184,0.1)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.06)',
            }}
          >
            {elephants.map(e => {
              const isActive = e.id === activeElephant?.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { onSelectElephant(e.id); handleHaptic(10); }}
                  className={`py-2 px-1 rounded-[14px] text-xs font-bold text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 tap-target ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  style={isActive ? {
                    background: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 1px 6px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,1)',
                  } : {}}
                >
                  <span>{ELEPHANT_EMOJI[e.id] ?? '🐘'}</span>
                  <span className="truncate">{e.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Summary bar */}
        <div
          className="flex items-center justify-between px-4 py-3 mb-4 shrink-0 rounded-[18px]"
          style={{
            background: isOverLimit ? 'rgba(254,242,242,0.8)' : 'rgba(248,250,252,0.8)',
            border: isOverLimit ? '1px solid rgba(252,165,165,0.5)' : '1px solid rgba(203,213,225,0.5)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <div className="text-xs font-semibold text-slate-600">
            Слон: <span className="font-black text-slate-900">{activeElephant?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOverLimit && (
              <AlertTriangle size={14} className="text-rose-500" />
            )}
            <div className={`text-xs font-bold ${isOverLimit ? 'text-rose-700' : 'text-slate-900'}`}>
              Итого: <span className={`font-black ${isOverLimit ? 'text-rose-600' : 'text-violet-600'}`}>
                {formatTotalSleepHours(totalMins)}
              </span>{' '}
              <span className="text-slate-500 font-medium">({formatLaydownsCount(currentIntervals.length)})</span>
            </div>
          </div>
        </div>

        {isOverLimit && (
          <div
            className="px-4 py-2.5 mb-3 rounded-[14px] text-xs font-semibold text-rose-700 flex items-start gap-2 shrink-0"
            style={{ background: 'rgba(254,226,226,0.6)', border: '1px solid rgba(252,165,165,0.4)' }}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Суммарное время сна превышает 12 ч — проверьте интервалы.
          </div>
        )}

        {/* Intervals list */}
        <div className="flex-1 overflow-y-auto space-y-3 thin-scroll pr-0.5">
          {currentIntervals.length === 0 ? (
            <div
              className="text-center py-10 px-4 rounded-[22px] flex flex-col items-center gap-2"
              style={{
                background: 'rgba(248,250,252,0.6)',
                border: '2px dashed rgba(203,213,225,0.7)',
              }}
            >
              <Clock size={28} className="text-slate-400" />
              <div className="text-sm font-bold text-slate-700">Нет добавленных циклов сна</div>
              <p className="text-xs text-slate-500 max-w-[220px]">
                Нажмите «Добавить интервал», чтобы зафиксировать время укладки
              </p>
            </div>
          ) : (
            currentIntervals.map((interval, index) => {
              const durationMins = calculateIntervalMinutes(interval.start, interval.end);
              const isLongInterval = durationMins > 360; // warn if > 6h single interval

              return (
                <div
                  key={interval.id || `interval-${index}`}
                  className="p-4 relative rounded-[20px]"
                  style={{
                    background: 'rgba(248,250,252,0.8)',
                    border: isLongInterval ? '1px solid rgba(252,165,165,0.5)' : '1px solid rgba(203,213,225,0.5)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleRemoveInterval(index)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors active:scale-95 cursor-pointer disabled:opacity-40 tap-target"
                    style={{ background: 'rgba(203,213,225,0.25)' }}
                    aria-label="Удалить цикл сна"
                  >
                    <X size={15} />
                  </button>

                  {/* Label */}
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Укладка #{index + 1}
                  </div>

                  {/* Time pickers */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Легла спать:</span>
                      <input
                        type="time"
                        disabled={isLocked}
                        value={interval.start || ''}
                        onChange={e => handleUpdateInterval(index, 'start', e.target.value)}
                        className="h-11 px-3 rounded-[12px] text-base font-bold text-slate-900 focus:outline-none disabled:opacity-50 tap-target"
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(203,213,225,0.7)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Проснулась:</span>
                      <input
                        type="time"
                        disabled={isLocked}
                        value={interval.end || ''}
                        onChange={e => handleUpdateInterval(index, 'end', e.target.value)}
                        className="h-11 px-3 rounded-[12px] text-base font-bold text-slate-900 focus:outline-none disabled:opacity-50 tap-target"
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(203,213,225,0.7)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Duration footer */}
                  <div
                    className="mt-3 pt-2.5 flex items-center justify-between text-xs font-bold"
                    style={{ borderTop: '1px solid rgba(203,213,225,0.4)' }}
                  >
                    <span className="text-slate-500">Продолжительность:</span>
                    <span className={isLongInterval ? 'text-rose-600 font-black' : 'text-violet-600 font-black'}>
                      {formatIntervalDurationText(durationMins)}
                      {isLongInterval && ' ⚠️'}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Add interval button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleAddInterval}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-[20px] font-bold text-sm text-slate-600 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"
            style={{
              border: '2px dashed rgba(148,163,184,0.4)',
              background: 'transparent',
            }}
          >
            <Plus size={16} />
            <span>Добавить интервал сна</span>
          </button>
        </div>

        {/* Footer done button */}
        <div className="pt-4 mt-3 shrink-0" style={{ borderTop: '1px solid rgba(203,213,225,0.2)' }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-13 rounded-[18px] font-black text-base text-white transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center tap-target"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 6px 24px rgba(109,40,217,0.35)',
              minHeight: '52px',
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
