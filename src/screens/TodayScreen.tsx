import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Assignment, Elephant, TreatmentRecordWithPhotos } from '../types';
import { ExecutionModal } from '../components/ExecutionModal';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { formatTime } from '../utils/dates';

interface TodayScreenProps {
  onElephantClick: (id: string) => void;
}

export function TodayScreen({ onElephantClick }: TodayScreenProps) {
  const { elephants, assignments, profile } = useStore();
  const [selectedTask, setSelectedTask] = useState<{assignment: Assignment, elephant: Elephant} | null>(null);
  
  const [todayRecords, setTodayRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const fetchRecords = async () => {
    try {
      const records = await supabaseService.getTodayRecords();
      setTodayRecords(records);
    } catch (err) {
      console.error('Failed to load today records', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCompleteTask = async (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => {
    if (!profile || !selectedTask) return;
    
    // Create record first
    const newRecord = await supabaseService.createTreatmentRecord({
      assignment_id: selectedTask.assignment.id,
      elephant_id: selectedTask.elephant.id,
      keeper_id: profile.id,
      assessment: data.assessment,
      medicine_used: data.medicineUsed,
      comment: data.comment
    });

    // Upload photo if present
    if (data.photoBlob) {
      await supabaseService.uploadTreatmentPhoto(
        data.photoBlob, 
        newRecord.id, 
        selectedTask.elephant.id, 
        'single'
      );
    }

    // Refresh UI
    setSelectedTask(null);
    await fetchRecords();
  };

  const activeAssignments = assignments.filter(a => a.is_active);

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black tracking-tight">Задачи на сегодня</h1>
        <div className="text-sm font-bold text-zinc-500 bg-zinc-200 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {loadingRecords ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : (
        elephants.map(elephant => {
          const elAssignments = activeAssignments.filter(a => a.elephant_id === elephant.id);
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
                  const doneRecord = todayRecords.find(r => r.assignment_id === assignment.id);
                  const isDone = !!doneRecord;

                  return (
                    <div key={assignment.id} className={`p-4 rounded-2xl border-2 transition ${isDone ? 'border-emerald-100 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400'}`}>
                      <div className="font-bold text-lg leading-tight mb-1">{assignment.title}</div>
                      
                      {assignment.medicine && !isDone && (
                        <div className="text-sm font-medium text-zinc-500 mb-3">
                          Требует: {assignment.medicine}
                        </div>
                      )}

                      {isDone ? (
                        <div className="flex items-center justify-between mt-3 text-sm font-bold text-emerald-700">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} />
                            <span>Выполнено</span>
                          </div>
                          <span>{formatTime(new Date(doneRecord.performed_at).getTime())}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedTask({ assignment, elephant })}
                          className="mt-3 w-full py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition active:scale-95"
                        >
                          {assignment.requires_photo ? 'ВЫПОЛНИТЬ + ФОТО' : 'ВЫПОЛНИТЬ'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

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

