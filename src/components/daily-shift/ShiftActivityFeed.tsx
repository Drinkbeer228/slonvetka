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
      <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-center shadow-inner">
        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 font-medium text-sm">Лента событий пуста</p>
        <p className="text-slate-400 text-xs mt-1">Здесь будут отображаться действия дежурных</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[24px] overflow-hidden shadow-sm">
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <History size={18} className="text-slate-500" />
        <h3 className="font-bold text-slate-700 text-sm">Лента смены (события)</h3>
      </div>
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {events.map(event => {
          const isAuthor = event.keeper_id === currentUserId;
          const ageMinutes = (now - event.timestamp) / 1000 / 60;
          const canUndo = isAuthor && ageMinutes <= 5;
          const isPerm = ageMinutes > 5;
          const timeString = new Date(event.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-lg shadow-sm">
                {event.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {event.action_title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500">
                  <span className="text-slate-700">{event.keeper_name}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <Clock size={10} className="opacity-70" />
                  <span>{timeString}</span>
                </div>
              </div>
              {canUndo && event.undo_payload && (
                <button
                  type="button"
                  onClick={() => onUndo(event)}
                  className="h-8 px-3 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-slate-200 hover:border-rose-200 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Undo2 size={14} />
                  <span>Отменить</span>
                </button>
              )}
              {isPerm && event.undo_payload && (
                <div className="h-8 px-2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" title="Запись перманентна (прошло 5 минут)" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
