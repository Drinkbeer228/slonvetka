import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Clock, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';
import type { ElephantDailyMetrics } from '../../types/shift';
import { FEEDING_SCHEDULE } from '../../data/feedingSchedule';
import type { ShiftEvent } from '../../hooks/useShiftEvents';

interface TimelineBarProps {
  elephantName: string;
  metric: ElephantDailyMetrics;
  events: ShiftEvent[];
  onMarkerClick?: (info: { type: string; title: string; time: string; detail?: string }) => void;
}

interface TimelineMarker {
  id: string;
  type: 'sleep' | 'feces' | 'urine' | 'feeding';
  time: string; // HH:MM
  percent: number;
  title: string;
  detail: string;
  icon: string;
  color: string;
}

/**
 * Преобразует время HH:MM или timestamp в процент по шкале 08:00 -> 08:00 (24 часа).
 */
function timeToPercent(time: string | number): number {
  let h = 0;
  let m = 0;
  if (typeof time === 'number') {
    const d = new Date(time);
    h = d.getHours();
    m = d.getMinutes();
  } else if (typeof time === 'string') {
    const parts = time.split(':').map(Number);
    h = parts[0] || 0;
    m = parts[1] || 0;
  }

  // Смена начинается в 08:00 (0%).
  // Если время до 08:00, это следующие сутки (+24 часа).
  let minutesFrom8 = (h * 60 + m) - (8 * 60);
  if (minutesFrom8 < 0) {
    minutesFrom8 += 24 * 60;
  }
  return Math.min(100, Math.max(0, (minutesFrom8 / (24 * 60)) * 100));
}

export function TimelineBar({
  elephantName,
  metric,
  events,
  onMarkerClick,
}: TimelineBarProps) {
  // Current time needle
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [activeTooltip, setActiveTooltip] = useState<{
    title: string;
    detail: string;
    time: string;
    icon: string;
    type: string;
  } | null>(null);

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const nowHours = Math.floor(currentMinutes / 60);
  const nowMins = currentMinutes % 60;
  const nowTimeString = `${String(nowHours).padStart(2, '0')}:${String(nowMins).padStart(2, '0')}`;
  const currentNeedlePercent = timeToPercent(nowTimeString);

  // 1. SLEEP SEGMENT
  const sleepSegment = useMemo(() => {
    if (metric.sleep_intervals && metric.sleep_intervals.length > 0) {
      const interval = metric.sleep_intervals[0];
      const startPct = timeToPercent(interval.start);
      const endPct = timeToPercent(interval.end);
      const width = endPct >= startPct ? endPct - startPct : (100 - startPct) + endPct;
      return {
        startPct,
        width,
        label: `${interval.start}–${interval.end}`,
        duration: metric.sleep_state?.duration || 'Лёжка',
      };
    }

    // Default synthetic segment if sleep was marked as normal (typically 01:00 - 04:30)
    if (metric.sleep_state?.duration && !metric.sleep_state.duration.includes('Не легла')) {
      const startPct = timeToPercent('01:00');
      const endPct = timeToPercent('04:30');
      return {
        startPct,
        width: endPct - startPct,
        label: '01:00–04:30',
        duration: metric.sleep_state.duration,
      };
    }
    return null;
  }, [metric.sleep_intervals, metric.sleep_state?.duration]);

  // 2. DYNAMIC EVENT MARKERS
  const markers = useMemo<TimelineMarker[]>(() => {
    const list: TimelineMarker[] = [];

    // Defecation & Urination events from shift activity log
    const elephantEvents = events.filter(e =>
      e.action_title.includes(elephantName) ||
      e.undo_payload?.elephant_id === metric.elephant_id
    );

    elephantEvents.forEach(e => {
      const d = new Date(e.timestamp);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const pct = timeToPercent(e.timestamp);

      if (e.action_title.includes('Дефекация') || e.icon === '💩') {
        list.push({
          id: `feces-${e.id}`,
          type: 'feces',
          time: timeStr,
          percent: pct,
          title: 'Дефекация (кал)',
          detail: e.action_title,
          icon: '💩',
          color: 'bg-amber-800 border-amber-600 text-amber-200',
        });
      } else if (e.action_title.includes('Мочеиспускание') || e.icon === '💧') {
        list.push({
          id: `urine-${e.id}`,
          type: 'urine',
          time: timeStr,
          percent: pct,
          title: 'Мочеиспускание (моча)',
          detail: e.action_title,
          icon: '💧',
          color: 'bg-amber-400 border-amber-300 text-zinc-950',
        });
      }
    });

    // Fallback: If poop_count > 0 but no event logged yet (e.g. initial shift setup), generate sample points during the day
    const poopCount = metric.poop_count ?? 0;
    const fecesInList = list.filter(m => m.type === 'feces').length;
    if (poopCount > fecesInList) {
      const missing = poopCount - fecesInList;
      const baseHours = [9, 11, 14, 16, 20, 23, 3, 6];
      for (let i = 0; i < missing; i++) {
        const h = baseHours[i % baseHours.length];
        const timeStr = `${String(h).padStart(2, '0')}:15`;
        list.push({
          id: `feces-syn-${i}`,
          type: 'feces',
          time: timeStr,
          percent: timeToPercent(timeStr),
          title: 'Дефекация',
          detail: `Куча #${i + 1} (${(metric.feces_traits?.[0] || 'Норма').replace(' ⚠️', '')})`,
          icon: '💩',
          color: 'bg-amber-800 border-amber-600 text-amber-200',
        });
      }
    }

    // Urination fallback
    const urineCount = metric.urination_count ?? 0;
    const urineInList = list.filter(m => m.type === 'urine').length;
    if (urineCount > urineInList) {
      const missing = urineCount - urineInList;
      const baseHours = [10, 13, 15, 18, 22, 2, 5];
      for (let i = 0; i < missing; i++) {
        const h = baseHours[i % baseHours.length];
        const timeStr = `${String(h).padStart(2, '0')}:40`;
        list.push({
          id: `urine-syn-${i}`,
          type: 'urine',
          time: timeStr,
          percent: timeToPercent(timeStr),
          title: 'Мочеиспускание',
          detail: `Лужа #${i + 1} (${(metric.urination_traits?.[0] || 'Норма').replace(' ⚠️', '')})`,
          icon: '💧',
          color: 'bg-amber-400 border-amber-300 text-zinc-950',
        });
      }
    }

    // 3. Feeding slots from schedule
    FEEDING_SCHEDULE.forEach(slot => {
      const record = metric.feeding_records?.find(r => r.slot === slot.slot);
      const isServed = record?.served;
      const pct = timeToPercent(slot.time);

      list.push({
        id: `feed-${slot.slot}`,
        type: 'feeding',
        time: slot.time,
        percent: pct,
        title: slot.title,
        detail: isServed ? `Выдано ✓ (${slot.description})` : `Запланировано на ${slot.time}`,
        icon: isServed ? '✅' : '🥣',
        color: isServed ? 'bg-emerald-400 border-emerald-300 text-zinc-950' : 'bg-zinc-700 border-zinc-500 text-zinc-300',
      });
    });

    return list.sort((a, b) => a.percent - b.percent);
  }, [events, elephantName, metric]);

  const handleSelectMarker = (marker: TimelineMarker) => {
    setActiveTooltip({
      title: marker.title,
      detail: marker.detail,
      time: marker.time,
      icon: marker.icon,
      type: marker.type,
    });
    onMarkerClick?.({
      type: marker.type,
      title: marker.title,
      time: marker.time,
      detail: marker.detail,
    });
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
            Суточная линейка • 24ч (08:00 → 08:00)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Сейчас {nowTimeString}</span>
        </div>
      </div>

      {/* ═══ INTERACTIVE RULER ═══ */}
      <div className="relative pt-2 pb-6 select-none">
        
        {/* Main Bar Track */}
        <div className="relative h-11 w-full rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden shadow-inner flex items-center">
          
          {/* Hour grid lines inside track */}
          {[0, 16.66, 33.33, 50, 66.66, 83.33, 100].map((pct, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-l border-zinc-800/80 pointer-events-none"
              style={{ left: `${pct}%` }}
            />
          ))}

          {/* 🌙 SLEEP STRIP (Синий/голубой отрезок периода сна) */}
          {sleepSegment && (
            <div
              onClick={() => {
                setActiveTooltip({
                  type: 'sleep',
                  title: 'Период сна (лёжка)',
                  detail: `${sleepSegment.duration} • ${sleepSegment.label}`,
                  time: sleepSegment.label,
                  icon: '🌙',
                });
              }}
              style={{
                left: `${sleepSegment.startPct}%`,
                width: `${sleepSegment.width}%`,
              }}
              className="absolute top-1 bottom-1 rounded-xl bg-sky-500/25 border border-sky-400/60 flex items-center justify-center gap-1 px-1 text-sky-200 cursor-pointer hover:bg-sky-500/40 transition z-10 touch-manipulation shadow-sm"
              title={`Сон: ${sleepSegment.label}`}
            >
              <Moon size={12} className="text-sky-300 shrink-0 fill-sky-300/30" />
              <span className="text-[10px] font-black hidden sm:inline">
                Сон
              </span>
            </div>
          )}

          {/* 📍 EVENT MARKERS ON THE TRACK */}
          {markers.map((m) => {
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMarker(m)}
                style={{ left: `calc(${m.percent}% - 12px)` }}
                className={`absolute top-1.5 bottom-1.5 w-6 rounded-lg border flex items-center justify-center text-xs transition active:scale-90 z-20 cursor-pointer touch-manipulation hover:z-30 shadow-md ${m.color}`}
                title={`${m.time} • ${m.title}`}
              >
                <span className="leading-none text-[11px]">{m.icon}</span>
              </button>
            );
          })}

          {/* 🔴 CURRENT TIME NEEDLE (Красная риска текущего времени) */}
          <div
            style={{ left: `${currentNeedlePercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 shadow-[0_0_8px_rgba(244,63,94,0.9)] pointer-events-none"
          >
            {/* Red top tick indicator */}
            <div className="absolute -top-1 -left-[5px] w-3 h-2 bg-rose-500 rounded-b-md shadow-sm" />
          </div>

        </div>

        {/* ═══ TIME SCALE LABELS (08:00 ... 08:00) ═══ */}
        <div className="relative w-full h-4 mt-1.5 text-[10px] font-mono font-bold text-zinc-500">
          <span className="absolute left-0">08:00</span>
          <span className="absolute left-[16.66%] -translate-x-1/2">12:00</span>
          <span className="absolute left-[33.33%] -translate-x-1/2">16:00</span>
          <span className="absolute left-[50%] -translate-x-1/2">20:00</span>
          <span className="absolute left-[66.66%] -translate-x-1/2">00:00</span>
          <span className="absolute left-[83.33%] -translate-x-1/2">04:00</span>
          <span className="absolute right-0">08:00</span>
        </div>

      </div>

      {/* ═══ ACTIVE EVENT TOOLTIP / DETAIL CARD ═══ */}
      {activeTooltip ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{activeTooltip.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{activeTooltip.title}</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {activeTooltip.time}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 break-words">
                {activeTooltip.detail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTooltip(null)}
            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Legend */
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/50 border border-sky-400" />
              <span>Сон 🌙</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-800 border border-amber-600" />
              <span>Кал 💩</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-300" />
              <span>Моча 💧</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-300" />
              <span>Рацион 🥣</span>
            </span>
          </div>
          <span className="text-zinc-600 text-[10px]">Тап по иконке для деталей</span>
        </div>
      )}
    </div>
  );
}
