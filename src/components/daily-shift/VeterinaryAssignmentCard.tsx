import React from 'react';
import { Trash2, CheckCircle2, Circle, Camera, Pill, Edit3, ChevronRight } from 'lucide-react';
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
      className={`p-3.5 sm:p-4 rounded-[22px] backdrop-blur-xl border transition-all duration-200 ${
        isCompletedToday
          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-xs'
          : 'bg-white/80 border-white/90 shadow-xs hover:bg-white/90'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
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
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center">
                <Circle size={14} className="fill-amber-500/20" strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {assignment.title}
              </span>
              {requiresPhoto && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
                  <Camera size={11} />
                  <span>Фото</span>
                </span>
              )}
            </div>

            {/* Chips row */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {assignment.medicine && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/60">
                  <Pill size={11} className="text-emerald-600" />
                  <span className="truncate max-w-[170px]">{assignment.medicine}</span>
                </span>
              )}

              {assignment.description && !assignment.medicine && (
                <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                  {assignment.description}
                </span>
              )}
            </div>

            {/* Completed status line */}
            {isCompletedToday && (
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                <span>Выполнено ✓</span>
                {completedAt && <span>{completedAt}</span>}
                {completedByKeeperName && <span>• {completedByKeeperName}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right action area */}
        {!isLocked && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isCompletedToday ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-10 px-3 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer tap-target touch-manipulation"
                  title="Просмотреть или изменить запись"
                >
                  <Edit3 size={13} className="text-slate-500" />
                  <span className="hidden sm:inline">Изм.</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmark();
                  }}
                  className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/70 shadow-xs active:scale-95 transition flex items-center justify-center cursor-pointer tap-target touch-manipulation"
                  title="Снять отметку о выполнении"
                  aria-label="Снять отметку"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleActionClick}
                className="h-11 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-1.5 transition cursor-pointer tap-target touch-manipulation"
              >
                {requiresPhoto ? (
                  <>
                    <Camera size={14} />
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
