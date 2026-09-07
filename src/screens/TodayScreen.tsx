import React, { useState } from 'react';
import { useStore } from '../store';
import { getTodayStr, formatTime } from '../utils/dates';
import { Assignment, Elephant, TreatmentRecord } from '../types';
import { ExecutionModal } from '../components/ExecutionModal';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface TodayScreenProps {
  onElephantClick: (id: string) => void;
}

export function TodayScreen({ onElephantClick }: TodayScreenProps) {
  const { elephants, assignments, records, activeKeeperId, addRecord } = useStore();
  const [selectedTask, setSelectedTask] = useState<{assignment: Assignment, elephant: Elephant} | null>(null);

  const activeElephants = elephants.filter(e => e.active);
  const activeAssignments = assignments.filter(a => a.active);

  // Filter records for today
  const todayBegin = new Date(getTodayStr() + 'T00:00:00').getTime();
  const todayEnd = todayBegin + 24 * 60 * 60 * 1000;
  const todayRecords = records.filter(r => r.createdAt >= todayBegin && r.createdAt < todayEnd);

  const handleCompleteTask = (recordData: Omit<TreatmentRecord, 'id' | 'createdAt' | 'keeperId'>) => {
    if (!activeKeeperId) return;
    
    addRecord({
      ...recordData,
      id: 'rec-' + Date.now(),
      createdAt: Date.now(),
      keeperId: activeKeeperId
    });
    setSelectedTask(null);
  };

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black tracking-tight">Задачи на сегодня</h1>
        <div className="text-sm font-bold text-zinc-500 bg-zinc-200 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {activeElephants.map(elephant => {
        const elAssignments = activeAssignments.filter(a => a.elephantId === elephant.id);
        if (elAssignments.length === 0) return null;

        return (
          <div key={elephant.id} className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => onElephantClick(elephant.id)}
            >
              <h2 className="text-xl font-black">{elephant.name}</h2>
              <button className="text-zinc-400 hover:text-zinc-900 transition">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {elAssignments.map(assignment => {
                const isDone = todayRecords.find(r => r.assignmentId === assignment.id);

                return (
                  <div key={assignment.id} className={`p-4 rounded-2xl border-2 transition ${isDone ? 'border-emerald-100 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400'}`}>
                    <div className="font-bold text-lg leading-tight mb-1">{assignment.title}</div>
                    
                    {assignment.customFields.length > 0 && !isDone && (
                      <div className="text-sm font-medium text-zinc-500 mb-3">
                        Требует: {assignment.customFields.join(', ')}
                      </div>
                    )}

                    {isDone ? (
                      <div className="flex items-center justify-between mt-3 text-sm font-bold text-emerald-700">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={16} />
                          <span>Выполнено</span>
                        </div>
                        <span>{formatTime(isDone.createdAt)}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedTask({ assignment, elephant })}
                        className="mt-3 w-full py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition active:scale-95"
                      >
                        {assignment.requiresPhoto ? 'ВЫПОЛНИТЬ + ФОТО' : 'ВЫПОЛНИТЬ'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedTask && (
        <ExecutionModal 
          assignment={selectedTask.assignment}
          elephant={selectedTask.elephant}
          onClose={() => setSelectedTask(null)}
          onComplete={handleCompleteTask}
        />
      )}
    </div>
  );
}
