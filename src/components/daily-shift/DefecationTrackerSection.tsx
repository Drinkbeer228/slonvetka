import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Clock, 
  Check, 
  ShieldAlert
} from 'lucide-react';

export type DefecationAnomalyType = 
  | 'NORMAL' 
  | 'DIARRHEA' 
  | 'UNDIGESTED_GRAIN' 
  | 'MUCUS' 
  | 'PARASITES';

export interface DefecationLogEntry {
  id: string;
  timestamp: string; // "14:25"
  type: DefecationAnomalyType;
  createdAt: number; // Unix timestamp в мс для точного интервала
  createdDate?: string; // YYYY-MM-DD
}

export interface DefecationTrackerSectionProps {
  entries?: DefecationLogEntry[];
  onChange?: (entries: DefecationLogEntry[]) => void;
  elephantName?: string;
  isLocked?: boolean;
  initialCount?: number;
}

interface AnomalyMeta {
  type: DefecationAnomalyType;
  label: string;
  shortLabel: string;
  emoji: string;
  alertIcon?: string;
  colorClass: string;
  activeClass: string;
  badgeClass: string;
  description: string;
}

const ANOMALIES: AnomalyMeta[] = [
  {
    type: 'DIARRHEA',
    label: 'Понос / Жидкий',
    shortLabel: 'Понос',
    emoji: '💧',
    alertIcon: '⚠️',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
    activeClass: 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-300 shadow-sm',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Жидкая консистенция кала, риск обезвоживания'
  },
  {
    type: 'UNDIGESTED_GRAIN',
    label: 'Непереваренный овёс',
    shortLabel: 'Непереварен',
    emoji: '🌾',
    alertIcon: '⚠️',
    colorClass: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100',
    activeClass: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 shadow-sm',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Цельное зерно в кале, ферментная недостаточность'
  },
  {
    type: 'MUCUS',
    label: 'Слизь / Кровь',
    shortLabel: 'Слизь/Кровь',
    emoji: '🩸',
    alertIcon: '🚨',
    colorClass: 'text-red-800 bg-red-50 border-red-300 hover:bg-red-100 font-semibold',
    activeClass: 'bg-red-600 text-white border-red-700 ring-2 ring-red-400 shadow-sm',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 font-semibold',
    description: 'Острый симптом колита или раздражения слизистой ЖКТ'
  },
  {
    type: 'PARASITES',
    label: 'Паразиты',
    shortLabel: 'Паразиты',
    emoji: '🪱',
    alertIcon: '⚠️',
    colorClass: 'text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100',
    activeClass: 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300 shadow-sm',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Визуально заметные гельминты или их фрагменты'
  },
];

function pluralizePiles(count: number): string {
  const abs = Math.abs(count);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n100 >= 11 && n100 <= 19) return `${count} куч`;
  if (n10 === 1) return `${count} куча`;
  if (n10 >= 2 && n10 <= 4) return `${count} кучи`;
  return `${count} куч`;
}

function getCurrentTimeString(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function DefecationTrackerSection({
  entries: controlledEntries,
  onChange,
  elephantName,
  isLocked = false,
  initialCount = 0,
}: DefecationTrackerSectionProps) {
  const [internalEntries, setInternalEntries] = useState<DefecationLogEntry[]>(() => {
    if (controlledEntries && controlledEntries.length > 0) return controlledEntries;
    if (initialCount > 0) {
      const now = Date.now();
      return Array.from({ length: initialCount }, (_, i) => ({
        id: `seed-${now}-${i}`,
        timestamp: getCurrentTimeString(),
        type: 'NORMAL' as const,
        createdAt: now - i * 60000,
        createdDate: new Date().toISOString().split('T')[0],
      }));
    }
    return [];
  });

  useEffect(() => {
    if (controlledEntries) {
      setInternalEntries(controlledEntries);
    }
  }, [controlledEntries]);

  const activeEntries = controlledEntries || internalEntries;
  const [pendingAnomaly, setPendingAnomaly] = useState<DefecationAnomalyType>('NORMAL');
  const [currentTime, setCurrentTime] = useState<string>(() => getCurrentTimeString());
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  // Обновление живых часов на кнопке раз в 15 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const triggerHaptic = useCallback((pattern: number | number[] = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Fallback для неподдерживаемых устройств
      }
    }
  }, []);

  const updateEntries = useCallback(
    (newEntries: DefecationLogEntry[]) => {
      if (!controlledEntries) {
        setInternalEntries(newEntries);
      }
      onChange?.(newEntries);
    },
    [controlledEntries, onChange]
  );

  // Тап: +1 куча
  const handleAddDefecation = () => {
    if (isLocked) return;

    const now = new Date();
    const newEntry: DefecationLogEntry = {
      id: `def-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: getCurrentTimeString(now),
      type: pendingAnomaly,
      createdAt: now.getTime(),
      createdDate: now.toISOString().split('T')[0],
    };

    const updated = [newEntry, ...activeEntries];
    updateEntries(updated);
    triggerHaptic(pendingAnomaly === 'NORMAL' ? 14 : [20, 40, 20]);

    setPendingAnomaly('NORMAL');
    setUndoToast(null);
  };

  // Отмена последнего ввода
  const handleUndoLast = () => {
    if (isLocked || activeEntries.length === 0) return;

    const removed = activeEntries[0];
    const updated = activeEntries.slice(1);
    updateEntries(updated);
    triggerHaptic(18);

    const typeMeta = ANOMALIES.find((a) => a.type === removed.type);
    const label = typeMeta ? `${typeMeta.emoji} ${typeMeta.label}` : 'Норма';
    setUndoToast(`Отменено: ${removed.timestamp} (${label})`);

    setTimeout(() => {
      setUndoToast((prev) => (prev?.startsWith('Отменено') ? null : prev));
    }, 3500);
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    const updated = activeEntries.filter((item) => item.id !== id);
    updateEntries(updated);
    triggerHaptic(10);
  };

  // Смарт-аларм риска колик (> 3.5 часов в дневное время)
  const colicAlarmInfo = useMemo(() => {
    if (activeEntries.length === 0) return null;

    const latest = activeEntries[0];
    const now = Date.now();
    
    // Рассчитываем точную разницу по миллисекундам
    const diffMinutes = latest.createdAt 
      ? Math.max(0, Math.floor((now - latest.createdAt) / 60000))
      : 0;

    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 7 && currentHour < 23;

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const formattedDiff = mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;

    return {
      isWarning: diffMinutes >= 210 && isDaytime,
      diffMinutes,
      formattedDiff,
      lastTimestamp: latest.timestamp,
    };
  }, [activeEntries]);

  const anomalyCount = useMemo(() => {
    return activeEntries.filter((e) => e.type !== 'NORMAL').length;
  }, [activeEntries]);

  return (
    <section 
      aria-label="Мониторинг дефекации и ЖКТ"
      className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl transition-all [data-theme='dark']:border-slate-800/80 [data-theme='dark']:bg-slate-900/85"
    >
      {/* Шапка и счетчик */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl select-none" role="img" aria-label="Стул">💩</span>
            <h3 className="text-base font-bold text-slate-900 [data-theme='dark']:text-slate-100 tracking-tight">
              Дефекация за смену
            </h3>
            {elephantName && (
              <span className="text-xs font-medium text-slate-500 [data-theme='dark']:text-slate-400">
                • {elephantName}
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-500 [data-theme='dark']:text-slate-400 mt-0.5">
            Норма: 12–18 раз в сутки. Фиксируй каждую кучу в 1 тап.
          </p>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 [data-theme='dark']:bg-amber-500/20">
            <span className="text-base font-black text-amber-900 [data-theme='dark']:text-amber-200">
              {pluralizePiles(activeEntries.length)}
            </span>
          </div>
          {anomalyCount > 0 && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 [data-theme='dark']:text-rose-400">
              <AlertTriangle size={11} /> {anomalyCount} с отклонением
            </span>
          )}
        </div>
      </div>

      {/* Смарт-аларм риска колик */}
      {colicAlarmInfo?.isWarning && (
        <div 
          role="alert"
          className="mb-3.5 flex items-start gap-2.5 rounded-2xl border border-amber-400/50 bg-amber-500/15 p-3 text-amber-950 shadow-sm backdrop-blur-md animate-pulse [data-theme='dark']:bg-amber-950/40 [data-theme='dark']:border-amber-500/40 [data-theme='dark']:text-amber-200"
        >
          <div className="rounded-xl bg-amber-500 p-1.5 text-white shadow-xs shrink-0 mt-0.5">
            <ShieldAlert size={18} strokeWidth={2.4} />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>Риск колик: нет дефекации {colicAlarmInfo.formattedDiff}!</span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed opacity-95">
              Крайняя куча была в <strong>{colicAlarmInfo.lastTimestamp}</strong>. Осмотри слона: проверь перистальтику с обоих боков, позу натуживания и интерес к сену.
            </p>
          </div>
        </div>
      )}

      {/* Главная кнопка + отмена */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          disabled={isLocked}
          onClick={handleAddDefecation}
          className={`flex-1 min-h-[50px] px-4 py-2.5 rounded-2xl font-bold text-sm tracking-tight transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm select-none ${
            pendingAnomaly === 'NORMAL'
              ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-amber-900/20 hover:brightness-105 active:brightness-95'
              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white shadow-rose-900/25 ring-2 ring-rose-300 ring-offset-1'
          } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="text-lg leading-none">💩</span>
          <span className="font-extrabold text-base">+1 куча</span>
          <span className="rounded-lg bg-black/20 px-2 py-0.5 text-xs font-mono font-semibold text-white/95">
            {currentTime}
          </span>
          {pendingAnomaly !== 'NORMAL' && (
            <span className="ml-1 rounded-md bg-white/25 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              {ANOMALIES.find(a => a.type === pendingAnomaly)?.shortLabel}
            </span>
          )}
        </button>

        <button
          type="button"
          disabled={isLocked || activeEntries.length === 0}
          onClick={handleUndoLast}
          aria-label="Отменить последний ввод"
          className="h-[50px] w-[50px] min-w-[50px] rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 hover:bg-slate-50 active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs shrink-0 [data-theme='dark']:border-slate-700 [data-theme='dark']:bg-slate-800/90 [data-theme='dark']:text-slate-200"
        >
          <RotateCcw size={18} strokeWidth={2.3} />
        </button>
      </div>

      {undoToast && (
        <div className="mb-2 text-center text-xs font-medium text-amber-800 [data-theme='dark']:text-amber-300 animate-fadeIn">
          {undoToast}
        </div>
      )}

      {/* Чипсы аномалий */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 [data-theme='dark']:text-slate-400 px-0.5">
          <span>Особенности стула (выбери перед тапом):</span>
          {pendingAnomaly !== 'NORMAL' && (
            <button
              type="button"
              onClick={() => setPendingAnomaly('NORMAL')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 [data-theme='dark']:text-slate-300 underline"
            >
              Сброс на норму
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ANOMALIES.map((anomaly) => {
            const isSelected = pendingAnomaly === anomaly.type;
            return (
              <button
                key={anomaly.type}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  triggerHaptic(8);
                  setPendingAnomaly(cur => (cur === anomaly.type ? 'NORMAL' : anomaly.type));
                }}
                className={`min-h-[44px] px-2.5 py-2 rounded-2xl border text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 select-none ${
                  isSelected
                    ? anomaly.activeClass
                    : `${anomaly.colorClass} [data-theme='dark']:bg-slate-800 [data-theme='dark']:border-slate-700`
                } ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-sm">{anomaly.emoji}</span>
                <span className="truncate">{anomaly.label}</span>
                {anomaly.alertIcon && <span className="text-[10px]">{anomaly.alertIcon}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Раскрывающаяся лента истории */}
      <div className="mt-3.5 border-t border-slate-200/60 pt-2 [data-theme='dark']:border-slate-800">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((v) => !v)}
          className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition-colors [data-theme='dark']:text-slate-300 [data-theme='dark']:hover:bg-slate-800/60"
        >
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            История отметок ({activeEntries.length})
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 [data-theme='dark']:text-slate-400">
            {isHistoryOpen ? 'Свернуть' : 'Показать'}
            {isHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {isHistoryOpen && (
          <div className="mt-2 space-y-1.5  overflow-visible pr-1 thin-scroll animate-fadeIn">
            {activeEntries.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                За эту смену дефекация еще не отмечалась
              </div>
            ) : (
              activeEntries.map((entry) => {
                const anomaly = ANOMALIES.find((a) => a.type === entry.type);
                const isNormal = entry.type === 'NORMAL';

                return (
                  <div
                    key={entry.id}
                    className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-3 py-1.5 shadow-2xs backdrop-blur-xs transition-colors [data-theme='dark']:border-slate-800 [data-theme='dark']:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-900 [data-theme='dark']:text-slate-100">
                        {entry.timestamp}
                      </span>
                      <span className="text-slate-300 select-none">•</span>
                      {isNormal ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 [data-theme='dark']:bg-emerald-950/40 [data-theme='dark']:text-emerald-300 [data-theme='dark']:border-emerald-800">
                          <Check size={11} strokeWidth={3} /> Норма
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${anomaly?.badgeClass || 'bg-rose-50 text-rose-700'}`}>
                          <span>{anomaly?.emoji}</span>
                          <span>{anomaly?.label}</span>
                          {anomaly?.alertIcon}
                        </span>
                      )}
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEntry(entry.id, e)}
                        aria-label={`Удалить запись ${entry.timestamp}`}
                        className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-rose-600 rounded-lg active:scale-90 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
