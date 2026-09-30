import React from 'react';
import { Trash2, CheckCircle2, Circle, Camera, Pill, Edit3 } from 'lucide-react';
import { Assignment } from '../../types';

export interface VeterinaryAssignmentCardProps {
  assignment: Assignment;
  isCompletedToday: boolean;
  isLocked: boolean;
  completedAt?: string;
  completedByKeeperName?: string;
  onExecute: () => void;
  onQuickExecute?: () => void;
  onUnmark: () => void;
  onEdit: () => void;
}

export function VeterinaryAssignmentCard({
  assignment,
  isCompletedToday,
  isLocked,
  completedAt,
  completedByKeeperName,
  onExecute,
  onQuickExecute,
  onUnmark,
  onEdit
}: VeterinaryAssignmentCardProps) {
  const requiresPhoto = Boolean(assignment.requires_photo);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;

    if (requiresPhoto) {
      // Photo is required -> open bottom sheet
      onExecute();
    } else {
      // One-Tap scenario: immediately complete in place without opening sheet!
      if (onQuickExecute) {
        onQuickExecute();
      } else {
        onExecute();
      }
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-150 touch-manipulation ${
        isCompletedToday
          ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700/80'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left icon and description */}
        <div
          className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (isCompletedToday) {
              onEdit();
            } else {
              onExecute();
            }
          }}
        >
          <div className="mt-0.5 shrink-0">
            {isCompletedToday ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-sm">
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Circle size={14} className="fill-amber-500/20" strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-semibold tracking-tight break-words ${
                isCompletedToday ? 'text-zinc-400 line-through' : 'text-zinc-100'
              }`}>
                {assignment.title}
              </span>
              {requiresPhoto && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/60 shrink-0">
                  <Camera size={11} />
                  <span>Фото</span>
                </span>
              )}
            </div>

            {/* Chips row (NO TRUNCATE) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {assignment.medicine && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/40 break-words">
                  <Pill size={12} className="text-emerald-400 shrink-0" />
                  <span className="break-words">{assignment.medicine}</span>
                </span>
              )}

              {assignment.description && !assignment.medicine && (
                <span className="text-xs text-zinc-400 break-words leading-relaxed">
                  {assignment.description}
                </span>
              )}
            </div>

            {/* Completed status line */}
            {isCompletedToday && (
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>Выполнено ✓</span>
                {completedAt && <span className="text-zinc-500 font-mono text-[11px]">{completedAt}</span>}
                {completedByKeeperName && <span className="text-zinc-400">• {completedByKeeperName}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right action area */}
        {!isLocked && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {isCompletedToday ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="min-h-[44px] px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl border border-zinc-700/80 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
                  title="Просмотреть или изменить запись"
                >
                  <Edit3 size={14} className="text-zinc-400" />
                  <span>Изм.</span>
                </button>
                {completedAt && (Date.now() - new Date().setHours(parseInt(completedAt.split(':')[0], 10), parseInt(completedAt.split(':')[1], 10), 0, 0)) < 5 * 60 * 1000 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmark();
                  }}
                  className="min-h-[44px] min-w-[44px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-xl border border-rose-800/60 transition-all flex items-center justify-center cursor-pointer touch-manipulation active:scale-[0.98]"
                  title="Снять отметку о выполнении (доступно 5 минут)"
                  aria-label="Снять отметку"
                >
                  <Trash2 size={16} />
                </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleActionClick}
                className="min-h-[44px] px-5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer touch-manipulation shadow-md shadow-black/30"
              >
                {requiresPhoto ? (
                  <>
                    <Camera size={15} />
                    <span>Выполнить + Фото</span>
                  </>
                ) : (
                  <span>Выполнить</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
