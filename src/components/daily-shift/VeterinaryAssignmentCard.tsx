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
    <div className="flex items-center justify-between p-4 rounded-[20px] bg-white/60 border border-white/40 shadow-sm backdrop-blur-md mb-2 last:mb-0 group transition-all hover:bg-white/80">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0 drop-shadow-sm">
          {isCompletedToday ? (
            <CheckCircle2 size={20} className="text-emerald-500" />
          ) : (
            <Circle size={20} className="text-amber-500 fill-amber-500/10" />
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
        <div className="flex gap-2 shrink-0 ml-3">
          {isCompletedToday ? (
            <>
              <button 
                onClick={onEdit} 
                className="px-3 py-2 bg-white/50 border border-white/40 hover:bg-white text-slate-600 text-xs font-bold rounded-2xl transition-all shadow-sm active:scale-95"
              >
                Изм.
              </button>
              <button 
                onClick={onUnmark} 
                className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-600 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <Trash2 size={16}/>
              </button>
            </>
          ) : (
            <button 
              onClick={onExecute} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              Выполнить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
