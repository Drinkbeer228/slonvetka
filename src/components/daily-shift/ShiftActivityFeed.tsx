import React, { useState, useEffect } from 'react';
import { History, Undo2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ShiftEvent } from '../../hooks/useShiftEvents';

interface ShiftActivityFeedProps {
  events: ShiftEvent[];
  currentUserId?: string;
  onUndo: (event: ShiftEvent) => void;
}

/**
 * Компактный оперативный журнал смены
 * Показывает 3 последних события с возможностью плавно развернуть всю ленту
 */
export function ShiftActivityFeed({ events, currentUserId, onUndo }: ShiftActivityFeedProps) {
  const [now, setNow] = useState(Date.now());
  const [isExpanded, setIsExpanded] = useState(false);

  // Update time every 10 seconds to refresh the 5-minute window
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (events.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center shadow-xl shadow-black/20">
        <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-zinc-300 font-semibold text-sm">Лента событий пуста</p>
        <p className="text-zinc-500 text-xs mt-1">Здесь будут отображаться действия дежурных сотрудников</p>
      </div>
    );
  }

  const displayedEvents = isExpanded ? events : events.slice(0, 3);
  const remainingCount = events.length - 3;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl shadow-black/20">
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <History size={16} className="text-emerald-400" />
          <h3 className="font-bold text-white text-xs">Лента событий смены</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {events.length}
          </span>
        </div>

        {events.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>{isExpanded ? 'Свернуть (3)' : `Показать все (${events.length})`}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="p-3 space-y-2">
        {displayedEvents.map((event) => {
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
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-sm shadow-sm mt-0.5">
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-100 leading-snug break-words">
                  {event.action_title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-zinc-400 flex-wrap">
                  <span className="text-zinc-300 font-medium">{event.keeper_name}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                    <Clock size={10} className="opacity-70" />
                    <span>{timeString}</span>
                  </span>
                </div>
              </div>

              {canUndo && event.undo_payload && (
                <button
                  type="button"
                  onClick={() => onUndo(event)}
                  className="min-h-[38px] px-2.5 bg-zinc-900 hover:bg-rose-950/40 text-rose-400 text-[11px] font-semibold rounded-xl border border-zinc-800 hover:border-rose-800/60 shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer touch-manipulation"
                >
                  <Undo2 size={12} />
                  <span>Отмена</span>
                </button>
              )}

              {isPerm && event.undo_payload && (
                <div className="h-6 px-1.5 flex items-center justify-center shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-zinc-700"
                    title="Запись перманентна (прошло 5 минут)"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom Expand Toggle Button if truncated */}
        {!isExpanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full min-h-[40px] rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer touch-manipulation mt-1"
          >
            <span>Показать ещё {remainingCount} событий</span>
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
