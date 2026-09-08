import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

interface VeterinaryAssignmentCardProps {
  key?: React.Key;
  assignment: any;
  isCompletedToday: boolean;
  isLocked: boolean;
  onExecute: () => void;
  onUnmark: () => void;
  onEdit: () => void;
}

export function VeterinaryAssignmentCard({ 
  assignment, 
  isCompletedToday, 
  isLocked, 
  onExecute, 
  onUnmark,
  onEdit 
}: VeterinaryAssignmentCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/60 shadow-sm backdrop-blur-sm mb-2 last:mb-0 group transition-all hover:bg-white/60">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">
          {isCompletedToday ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Circle size={18} className="text-amber-500 fill-amber-50" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-[13px] font-bold text-slate-800 truncate">{assignment.title}</div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${isCompletedToday ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isCompletedToday ? 'Выполнено' : 'Активно'}
          </div>
        </div>
      </div>
      
      {!isLocked && (
        <div className="flex gap-1.5 shrink-0 ml-2">
          {isCompletedToday ? (
            <>
              <button 
                onClick={onEdit} 
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
              >
                Изм.
              </button>
              <button 
                onClick={onUnmark} 
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition"
              >
                <Trash2 size={14}/>
              </button>
            </>
          ) : (
            <button 
              onClick={onExecute} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
            >
              Выполнить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
