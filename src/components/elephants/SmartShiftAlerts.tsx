import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, Check, Plus, Camera, Sparkles, ChevronRight, X } from 'lucide-react';
import type { ElephantDailyMetrics } from '../../types/shift';
import type { ShiftEvent } from '../../hooks/useShiftEvents';
import { SHIFT_ALERTS_CONFIG } from '../../config/shiftAlerts';

interface SmartShiftAlertsProps {
  elephantName: string;
  elephantId: string;
  metric: ElephantDailyMetrics;
  events: ShiftEvent[];
  onQuickAddPoop: (delta: number) => void;
  onOpenObservationModal?: () => void;
  onLogShiftEvent: (title: string, icon: string) => void;
  triggerHaptic?: (ms?: number) => void;
}

export function SmartShiftAlerts({
  elephantName,
  elephantId,
  metric,
  events,
  onQuickAddPoop,
  onOpenObservationModal,
  onLogShiftEvent,
  triggerHaptic,
}: SmartShiftAlertsProps) {
  // Current time state
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date(currentTime);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // ─── 1. НАБЛЮДАТЕЛЬНЫЙ СИГНАЛ ПО ДЕФЕКАЦИИ ───
  const defecationAlert = useMemo(() => {
    // 1. Исключаем ночной период (23:00 - 06:00)
    const { startHour, endHour } = SHIFT_ALERTS_CONFIG.NIGHT_PERIOD;
    const isNight = currentHour >= startHour || currentHour < endHour;
    if (isNight) return null;

    // 2. Ищем последнее событие дефекации для данной слонихи
    const fecesEvents = events.filter((e) => {
      const isElephant =
        e.action_title.includes(elephantName) ||
        e.undo_payload?.elephant_id === elephantId;
      const isFeces =
        e.icon === '💩' ||
        e.action_title.toLowerCase().includes('дефекация') ||
        e.undo_payload?.type === 'feces';
      return isElephant && isFeces;
    });

    let lastTimestamp: number | null = null;
    let isFromShiftStart = false;

    if (fecesEvents.length > 0) {
      // Берём самое свежее событие
      lastTimestamp = Math.max(...fecesEvents.map((e) => e.timestamp));
    } else {
      // Если событий ещё нет, но poop_count > 0, считаем, что дефекации фиксировались
      if ((metric.poop_count ?? 0) > 0) {
        return null;
      }
      // Если poop_count === 0, считаем от начала смены (08:00 сегодня)
      const shiftStart = new Date(now);
      shiftStart.setHours(8, 0, 0, 0);
      // Если смена началась позже или это утро до 08:00
      if (now.getTime() > shiftStart.getTime()) {
        lastTimestamp = shiftStart.getTime();
        isFromShiftStart = true;
      }
    }

    if (!lastTimestamp) return null;

    const diffMinutes = Math.floor((now.getTime() - lastTimestamp) / 60000);
    const diffHours = diffMinutes / 60;

    if (diffHours >= SHIFT_ALERTS_CONFIG.DEFECATION_ALERT_THRESHOLD_HOURS) {
      const lastDate = new Date(lastTimestamp);
      const lastTimeStr = `${String(lastDate.getHours()).padStart(2, '0')}:${String(
        lastDate.getMinutes()
      ).padStart(2, '0')}`;
      const hoursPassed = Math.floor(diffMinutes / 60);
      const minsPassed = diffMinutes % 60;

      return {
        lastTimeStr,
        isFromShiftStart,
        elapsedText: `${hoursPassed} ч ${minsPassed} мин`,
        diffHours,
      };
    }

    return null;
  }, [currentTime, currentHour, events, elephantName, elephantId, metric.poop_count, now]);

  // ─── 2. НАПОМИНАНИЕ О ЗАПАРКЕ УТРЕННЕЙ КАШИ ───
  const porridgeAlert = useMemo(() => {
    const { startHour, startMinute, endHour, endMinute } = SHIFT_ALERTS_CONFIG.PORRIDGE_PREP_WINDOW;
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const inWindow = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
    if (!inWindow) return null;

    // Проверяем, зафиксирована ли уже запарка каши за сегодня
    const alreadyPreparedEvent = events.find((e) =>
      e.action_title.toLowerCase().includes('запарка') ||
      e.action_title.toLowerCase().includes('каша запарена')
    );

    return {
      isDone: Boolean(alreadyPreparedEvent),
      doneTime: alreadyPreparedEvent ? new Date(alreadyPreparedEvent.timestamp) : null,
    };
  }, [currentHour, currentMinute, events]);

  const handlePorridgePrepared = () => {
    triggerHaptic?.(25);
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    onLogShiftEvent(`Запарка утренней каши поставлена в ${timeStr} (вода 65°C)`, '🥣');
  };

  // If no alerts active, do not render wrapper
  if (!defecationAlert && !porridgeAlert) {
    return null;
  }

  return (
    <div className="space-y-2.5">

      {/* ═══ 1. НАБЛЮДАТЕЛЬНЫЙ СИГНАЛ: ДЕФЕКАЦИЯ ═══ */}
      {defecationAlert && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-950/25 p-3.5 shadow-md flex flex-col gap-2.5 animate-slide-up">
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 text-sm font-black shrink-0">
              ⚠️
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Наблюдательный сигнал • Дефекация
                </h4>
              </div>
              <p className="text-xs text-zinc-200 mt-0.5 leading-relaxed break-words">
                {defecationAlert.isFromShiftStart ? (
                  <>
                    С начала смены (08:00) нет отметок дефекации для{' '}
                    <strong className="text-white">{elephantName}</strong> (прошло{' '}
                    <span className="font-mono font-bold text-amber-300">{defecationAlert.elapsedText}</span>).
                  </>
                ) : (
                  <>
                    Последняя отметка для{' '}
                    <strong className="text-white">{elephantName}</strong> была в{' '}
                    <span className="font-mono font-bold text-amber-300">{defecationAlert.lastTimeStr}</span> (прошло{' '}
                    <span className="font-mono font-bold text-amber-300">{defecationAlert.elapsedText}</span>).
                  </>
                )}
                {' '}Проверьте состояние слонихи и внесите наблюдение.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(20);
                onQuickAddPoop(1);
              }}
              className="min-h-[46px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer touch-manipulation"
            >
              <span>💩</span>
              <span>+1 Кал (в норме)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(15);
                onOpenObservationModal?.();
              }}
              className="min-h-[46px] px-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 active:scale-95 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer touch-manipulation"
            >
              <Camera size={14} />
              <span>Внести наблюдение</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ 2. НАПОМИНАНИЕ: УТРЕННЯЯ ЗАПАРКА КАШИ (06:15–07:15) ═══ */}
      {porridgeAlert && (
        <div className={`rounded-2xl border p-3.5 shadow-md flex items-center justify-between gap-3 transition animate-slide-up ${
          porridgeAlert.isDone
            ? 'bg-zinc-950/80 border-emerald-500/40 text-zinc-300'
            : 'bg-emerald-950/25 border-emerald-500/60 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🥣</span>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white">
                {porridgeAlert.isDone
                  ? 'Запарка утренней каши выполнена ✓'
                  : 'Пора ставить запарку каши к 07:00'}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 break-words">
                {porridgeAlert.isDone && porridgeAlert.doneTime ? (
                  `Зафиксировано в ${String(porridgeAlert.doneTime.getHours()).padStart(2, '0')}:${String(
                    porridgeAlert.doneTime.getMinutes()
                  ).padStart(2, '0')} • Остывание до 38–42°C перед выдачей`
                ) : (
                  'Вода ~65°C, перемешать. Остывание до 38–42°C перед выдачей в 07:00'
                )}
              </p>
            </div>
          </div>

          {!porridgeAlert.isDone && (
            <button
              type="button"
              onClick={handlePorridgePrepared}
              className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition cursor-pointer touch-manipulation shrink-0"
            >
              <Check size={16} strokeWidth={3} />
              <span>Поставил</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
