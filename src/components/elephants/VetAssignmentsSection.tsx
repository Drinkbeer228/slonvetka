import React from 'react';
import { Plus } from 'lucide-react';
import type { Assignment, Elephant } from '../../types';
import { VeterinaryAssignmentCard } from '../daily-shift/VeterinaryAssignmentCard';

interface VetAssignmentsSectionProps {
  elephantName: string;
  assignments: Assignment[];
  isAssignmentDone: (id: string) => boolean;
  isLocked: boolean;
  canCreateAssignment: boolean;
  onExecute: (assignment: Assignment, elephant: Elephant) => void;
  onQuickExecute: (assignment: Assignment) => void;
  onUnmark: (assignmentId: string) => void;
  onCreateNew: () => void;
  activeElephant: Elephant;
  todayRecords: { id: string; assignment_id: string | null }[];
}

export function VetAssignmentsSection({
  elephantName,
  assignments,
  isAssignmentDone,
  isLocked,
  canCreateAssignment,
  onExecute,
  onQuickExecute,
  onUnmark,
  onCreateNew,
  activeElephant,
  todayRecords,
}: VetAssignmentsSectionProps) {
  const completedCount = assignments.filter(a => isAssignmentDone(a.id)).length;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Ветслужба • {elephantName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Назначения врача
            </h2>
            <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-xs font-mono font-bold text-zinc-400">
              {completedCount}/{assignments.length}
            </span>
          </div>
        </div>

        {canCreateAssignment && (
          <button
            type="button"
            onClick={onCreateNew}
            className="min-h-[44px] px-3.5 bg-white text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.97] cursor-pointer touch-manipulation shadow-md"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Назначить</span>
          </button>
        )}
      </div>

      {/* Assignment cards */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400 text-sm font-medium">
          Нет активных назначений для {elephantName}
        </div>
      ) : (
        <div className="space-y-2.5">
          {assignments.map((assignment, idx) => {
            const completed = isAssignmentDone(assignment.id);
            return (
              <VeterinaryAssignmentCard
                key={`${assignment.id || 'asgn'}-${idx}`}
                assignment={assignment}
                isCompletedToday={completed}
                isLocked={isLocked}
                onExecute={() => onExecute(assignment, activeElephant)}
                onQuickExecute={() => onQuickExecute(assignment)}
                onUnmark={() => {
                  const rec = todayRecords.find(r => r.assignment_id === assignment.id);
                  if (rec) onUnmark(rec.id);
                }}
                onEdit={() => onExecute(assignment, activeElephant)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
