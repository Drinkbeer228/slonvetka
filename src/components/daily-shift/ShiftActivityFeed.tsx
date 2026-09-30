import React, { useState, useEffect } from 'react';
import { History, Undo2, Clock } from 'lucide-react';
import { ShiftEvent } from '../../hooks/useShiftEvents';

interface ShiftActivityFeedProps {
  events: ShiftEvent[];
  currentUserId?: string;
  onUndo: (event: ShiftEvent) => void;
}

export function ShiftActivityFeed({ events, currentUserId, onUndo }: ShiftActivityFeedProps) {
  const [now, setNow] = useState(Date.now());

  // Update time every 10 seconds to refresh the 5-minute window
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center shadow-xl shadow-black/20">
        <History className="w-9 h-9 text-zinc-600 mx-auto mb-2.5" />
        <p className="text-zinc-300 font-semibold text-sm">Лента событий пуста</p>
        <p className="text-zinc-500 text-xs mt-1">Здесь будут отображаться действия дежурных сотрудников</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center gap-2 bg-zinc-950/40">
        <History size={17} className="text-emerald-400" />
        <h3 className="font-semibold text-white text-sm">Лента смены (события)</h3>
      </div>
      <div className="p-3 space-y-2">
        {events.map((event) => {
          const isAuthor = event.keeper_id === currentUserId;
          const ageMinutes = (now - event.timestamp) / 1000 / 60;
          const canUndo = isAuthor && ageMinutes <= 5;
          const isPerm = ageMinutes > 5;
          const timeString = new Date(event.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-base shadow-sm mt-0.5">
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 leading-snug break-words">
                  {event.action_title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs font-medium text-zinc-400 flex-wrap">
                  <span className="text-zinc-300">{event.keeper_name}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                    <Clock size={11} className="opacity-70" />
                    <span>{timeString}</span>
                  </span>
                </div>
              </div>
              {canUndo && event.undo_payload && (
                <button
                  type="button"
                  onClick={() => onUndo(event)}
                  className="min-h-[44px] px-3 bg-zinc-900 hover:bg-rose-950/40 text-rose-400 text-xs font-semibold rounded-xl border border-zinc-800 hover:border-rose-800/60 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation"
                >
                  <Undo2 size={13} />
                  <span>Отменить</span>
                </button>
              )}
              {isPerm && event.undo_payload && (
                <div className="h-8 px-2 flex items-center justify-center shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-zinc-700"
                    title="Запись перманентна (прошло 5 минут)"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
