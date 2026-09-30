import React from 'react';
import { Pill, Camera, Image, Clock, Check, Pencil } from 'lucide-react';
import type { Assignment } from '../../types';

/**
 * VeterinaryAssignmentCard — карточка ветеринарного назначения.
 * Используется в VetAssignmentsSection на экране «Слоны»:
 * показывает назначение врача, статус выполнения за сегодня и действия
 * (выполнить / быстрый отмет / снять отметку).
 */
interface VeterinaryAssignmentCardProps {
  assignment: Assignment;
  isCompletedToday: boolean;
  isLocked: boolean;
  onExecute: () => void;
  onQuickExecute: () => void;
  onUnmark: () => void;
  onEdit: () => void;
}

const scheduleLabel: Record<string, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  as_needed: 'По необходимости',
};

export function VeterinaryAssignmentCard({
  assignment,
  isCompletedToday,
  isLocked,
  onExecute,
  onQuickExecute,
  onUnmark,
  onEdit,
}: VeterinaryAssignmentCardProps) {
  const urgent = assignment.priority === 'urgent';

  return (
    <article
      className={`rounded-2xl border p-3.5 transition-colors ${
        isCompletedToday
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : urgent
            ? 'border-rose-500/40 bg-rose-500/5'
            : 'border-zinc-800 bg-zinc-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
            isCompletedToday
              ? 'bg-emerald-500 text-zinc-950'
              : 'bg-zinc-800 text-rose-300'
          }`}
        >
          {isCompletedToday ? <Check size={17} strokeWidth={3} /> : <Pill size={16} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white leading-snug break-words">
              {assignment.title}
            </h3>
            {urgent && !isCompletedToday && (
              <span className="shrink-0 rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-rose-300">
                Срочно
              </span>
            )}
          </div>

          {assignment.description && (
            <p className="text-xs text-zinc-400 mt-1 leading-snug break-words">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
              <Clock size={10} />
              {scheduleLabel[assignment.schedule_type] ?? assignment.schedule_type}
            </span>
            {assignment.medicine && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                <Pill size={10} />
                {assignment.medicine}
              </span>
            )}
            {assignment.requires_photo && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                <Camera size={10} />
                Фото обязательно
              </span>
            )}
            {assignment.requires_before_after && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                <Image size={10} />
                До / После
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {isCompletedToday ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400">
                  <Check size={14} strokeWidth={3} />
                  Выполнено сегодня
                </span>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={onUnmark}
                    className="min-h-[36px] px-3 rounded-lg border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 text-[11px] font-bold transition active:scale-95 cursor-pointer touch-manipulation"
                  >
                    Снять отметку
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={onExecute}
                  className="min-h-[38px] px-3.5 rounded-xl bg-white text-zinc-950 text-[11px] font-black flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation"
                >
                  {assignment.requires_photo ? <Camera size={13} /> : <Check size={13} />}
                  Выполнить
                </button>
                {!assignment.requires_photo && (
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={onQuickExecute}
                    className="min-h-[38px] px-3 rounded-xl border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation"
                  >
                    Штатно ✓
                  </button>
                )}
              </>
            )}
            {!isCompletedToday && (
              <button
                type="button"
                disabled={isLocked}
                onClick={onEdit}
                title="Детали / редактировать"
                className="ml-auto w-8 h-8 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
