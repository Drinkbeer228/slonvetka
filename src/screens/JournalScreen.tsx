import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTime, formatDate } from '../utils/dates';
import { supabaseService } from '../services/supabaseService';
import { TreatmentRecordWithPhotos } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { saveDraft } from '../lib/offlineDb';
import { flushSyncQueue } from '../lib/syncManager';

import { PhotoPreview } from '../components/PhotoPreview';
import { ObservationModal } from '../components/ObservationModal';

export function JournalScreen() {
  const { elephants, assignments, profile } = useStore();
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  
  const loadHistory = async () => {
    try {
      const data = await supabaseService.getTreatmentHistory(50);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    
    const handleSyncComplete = () => {
      loadHistory();
    };
    window.addEventListener('syncComplete', handleSyncComplete);
    return () => window.removeEventListener('syncComplete', handleSyncComplete);
  }, []);

  const handleAddNote = async (data: { elephantId: string; comment: string; photoBlob: Blob }) => {
    if (!profile) return;
    
    await saveDraft({
      id: crypto.randomUUID(),
      assignmentId: null,
      elephantId: data.elephantId,
      keeperId: profile.id,
      performedAt: new Date().toISOString(),
      assessment: 'Наблюдение',
      medicineUsed: null,
      comment: data.comment,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }, [{ blob: data.photoBlob, photoType: 'single' }]);
    
    setObservationModalOpen(false);
    flushSyncQueue();
  };

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Журнал процедур</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">История всех выполненных задач</p>
        </div>
        {profile && (
          <button 
            onClick={() => setObservationModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-zinc-800 transition active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Наблюдение / Фото</span>
            <span className="sm:hidden">Наблюдение</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-200">
            Записей пока нет
          </div>
        ) : (
          records.map(record => {
            const elephant = elephants.find(e => e.id === record.elephant_id);
            const assignment = assignments.find(a => a.id === record.assignment_id);
            const title = assignment ? assignment.title : 'Внеплановая задача';
            
            // If keeper_id matches our profile, show our name. Otherwise just 'Коллега'.
            const keeperName = record.keeper_id === profile?.id ? profile.name : 'Сотрудник';
            
            const performedAt = new Date(record.performed_at).getTime();

            return (
              <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg leading-tight text-zinc-900">{title}</div>
                  <div className="text-xs font-bold text-zinc-500 text-right whitespace-nowrap ml-3">
                    <div>{formatDate(performedAt)}</div>
                    <div>{formatTime(performedAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black bg-zinc-100 px-2 py-1 rounded-md uppercase tracking-wider">{elephant?.name || 'Неизвестно'}</span>
                  <span className="text-xs font-medium text-zinc-500">•</span>
                  <span className="text-xs font-bold text-zinc-600">{keeperName}</span>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm space-y-2">
                  {record.assessment && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Статус:</span>
                      <span className={`font-bold ${record.assessment.toLowerCase().includes('норма') || record.assessment.toLowerCase().includes('чисто') ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {record.assessment}
                      </span>
                    </div>
                  )}
                  
                  {record.medicine_used && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Обработка:</span>
                      <span className="font-bold">{record.medicine_used}</span>
                    </div>
                  )}

                  {record.comment && (
                    <div className="pt-2 border-t border-zinc-200 mt-2">
                      <span className="text-zinc-500 font-medium">Комментарий: </span>
                      <span className="text-zinc-800">{record.comment}</span>
                    </div>
                  )}
                </div>

                {record.photos && record.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {record.photos.map(p => {
                      let typeStr = 'Одиночный снимок';
                      if (p.photo_type === 'before') typeStr = 'Снимок ДО';
                      if (p.photo_type === 'after') typeStr = 'Снимок ПОСЛЕ';
                      
                      const caption = `${elephant?.name || 'Слон'} • ${title} • ${formatDate(performedAt)} ${formatTime(performedAt)} • ${typeStr}`;
                      
                      return (
                        <PhotoPreview key={p.id} photo={p} caption={caption} />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {observationModalOpen && (
        <ObservationModal
          elephants={elephants}
          onClose={() => setObservationModalOpen(false)}
          onComplete={handleAddNote}
        />
      )}
    </div>
  );
}

