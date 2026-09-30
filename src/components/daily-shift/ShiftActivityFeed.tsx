import React from 'react';
import { Undo2, Activity } from 'lucide-react';
import type { ShiftEvent } from '../../hooks/useShiftEvents';

/**
 * ShiftActivityFeed — живая лента действий текущей смены.
 * Показывает события (кормление, уборка, наблюдения), добавленные через
 * useShiftEvents, с возможностью отменить своё собственное действие.
 */
interface ShiftActivityFeedProps {
  events: ShiftEvent[];
  currentUserId?: string | null;
  onUndo?: (event: ShiftEvent) => void;
}

const formatEventTime = (timestamp: number): string => {
  try {
    const d = new Date(timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

export function ShiftActivityFeed({ events, currentUserId, onUndo }: ShiftActivityFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 flex items-center gap-3 text-zinc-500">
        <Activity size={16} className="shrink-0" />
        <p className="text-xs font-medium">
          Лента смены пуста. Действия (кормление, уборка, наблюдения) появятся здесь.
        </p>
      </div>
    );
  }

  // newest first
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {sorted.map((event) => {
        const isMine = Boolean(currentUserId) && event.keeper_id === currentUserId;
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2"
          >
            <span className="text-lg leading-none shrink-0" aria-hidden>{event.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-100 truncate">{event.action_title}</p>
              <p className="text-[10px] text-zinc-500 font-medium truncate">
                {event.keeper_name} • {formatEventTime(event.timestamp)}
              </p>
            </div>
            {isMine && onUndo && (
              <button
                type="button"
                onClick={() => onUndo(event)}
                title="Отменить действие"
                className="shrink-0 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition active:scale-95 cursor-pointer touch-manipulation"
              >
                <Undo2 size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
