import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTime, formatDate } from '../utils/dates';
import { supabaseService } from '../services/supabaseService';
import { TreatmentRecordWithPhotos } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { SyncManager } from '../services/SyncManager';
import { getOfflineDb, TreatmentRecordQueueItem } from '../services/offlineDb';

import { PhotoPreview } from '../components/PhotoPreview';
import { ObservationModal } from '../components/ObservationModal';
import { TreatmentRecordCard } from '../components/TreatmentRecordCard';
import { EditRecordModal } from '../components/EditRecordModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function JournalScreen() {
  const { elephants, assignments, profile } = useStore();
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<TreatmentRecordQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  
  // Edit & Delete state for Vet
  const [editingRecord, setEditingRecord] = useState<TreatmentRecordWithPhotos | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<TreatmentRecordWithPhotos | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
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

  const loadDrafts = async () => {
    const db = await getOfflineDb();
    const drafts = await db.getAll('records_queue');
    setPendingDrafts(drafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  useEffect(() => {
    loadHistory();
    loadDrafts();
    
    const handleSyncComplete = () => {
      loadHistory();
      loadDrafts();
    };
    const handleSyncStatus = () => {
      loadDrafts();
    };

    window.addEventListener('syncComplete', handleSyncComplete);
    window.addEventListener('syncStatusChange', handleSyncStatus);
    return () => {
      window.removeEventListener('syncComplete', handleSyncComplete);
      window.removeEventListener('syncStatusChange', handleSyncStatus);
    };
  }, []);

  const handleAddNote = async (data: { elephantId: string; comment: string; photoBlob: Blob }) => {
    if (!profile) return;
    
    await SyncManager.saveRecordLocally({
      assignment_id: null,
      elephant_id: data.elephantId,
      keeper_id: profile.id,
      performed_at: new Date().toISOString(),
      assessment: 'Наблюдение',
      medicine_used: null,
      comment: data.comment,
    }, data.photoBlob, 'single');
    
    setObservationModalOpen(false);
    await loadDrafts();
  };

  const handleSaveEdit = async (updated: TreatmentRecordWithPhotos) => {
    await supabaseService.updateTreatmentRecord(updated.id, {
      assessment: updated.assessment,
      medicine_used: updated.medicine_used,
      comment: updated.comment,
    });

    setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await supabaseService.deleteTreatmentRecord(deletingRecord.id);
      setRecords(prev => prev.filter(r => r.id !== deletingRecord.id));
      setDeletingRecord(null);
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('Ошибка при удалении записи. Попробуйте еще раз.');
    } finally {
      setDeleteLoading(false);
    }
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
        ) : (
          <>
            {pendingDrafts.map(draft => {
              const elephant = elephants.find(e => e.id === draft.payload.elephant_id);
              const assignment = assignments.find(a => a.id === draft.payload.assignment_id);
              const title = assignment ? assignment.title : 'Внеплановая задача';
              
              const keeperName = profile?.name || 'Сотрудник';
              const performedAt = new Date(draft.created_at).getTime();

              const isError = draft.status === 'error';
              const isSyncing = draft.status === 'syncing';

              return (
                <div key={draft.temp_id} className={`rounded-2xl p-4 shadow-sm border-2 ${isError ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-lg leading-tight text-zinc-900">{title}</div>
                    <div className="text-xs font-bold text-zinc-500 text-right whitespace-nowrap ml-3">
                      <div>{formatDate(performedAt)}</div>
                      <div>{formatTime(performedAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black bg-zinc-100 px-2 py-1 rounded-md uppercase tracking-wider opacity-80">{elephant?.name || 'Неизвестно'}</span>
                    <span className="text-xs font-medium text-zinc-500">•</span>
                    <span className="text-xs font-bold text-zinc-600 opacity-80">{keeperName}</span>
                  </div>

                  <div className="bg-white/50 p-3 rounded-xl border border-white/50 text-sm space-y-2 mb-3">
                    {draft.payload.assessment && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Статус:</span>
                        <span className="font-bold">{draft.payload.assessment}</span>
                      </div>
                    )}
                    {draft.payload.medicine_used && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Обработка:</span>
                        <span className="font-bold">{draft.payload.medicine_used}</span>
                      </div>
                    )}
                    {draft.payload.comment && (
                      <div className="pt-2 border-t border-zinc-200/50 mt-2">
                        <span className="text-zinc-500 font-medium">Комментарий: </span>
                        <span className="text-zinc-800">{draft.payload.comment}</span>
                      </div>
                    )}
                  </div>

                  <div className={`text-xs font-bold flex items-center justify-center gap-2 py-2 rounded-xl ${isError ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isError ? (
                      <>Ошибка отправки. Ждем сеть...</>
                    ) : isSyncing ? (
                      <><Loader2 size={14} className="animate-spin" />Синхронизация...</>
                    ) : (
                      <>Ожидает отправки...</>
                    )}
                  </div>
                </div>
              );
            })}

            {records.length === 0 && pendingDrafts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-200">
                Записей пока нет
              </div>
            ) : (
              records.map(record => (
                <TreatmentRecordCard
                  key={record.id}
                  record={record}
                  elephants={elephants}
                  assignments={assignments}
                  currentProfile={profile}
                  onEdit={(rec) => setEditingRecord(rec)}
                  onDelete={(rec) => setDeletingRecord(rec)}
                />
              ))
            )}
          </>
        )}
      </div>

      {observationModalOpen && (
        <ObservationModal
          elephants={elephants}
          onClose={() => setObservationModalOpen(false)}
          onComplete={handleAddNote}
        />
      )}

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          elephantName={elephants.find(e => e.id === editingRecord.elephant_id)?.name}
          assignmentTitle={assignments.find(a => a.id === editingRecord.assignment_id)?.title || 'Внеплановая задача'}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingRecord && (
        <ConfirmDeleteModal
          title="Удалить запись из журнала?"
          description={`Запись слона «${elephants.find(e => e.id === deletingRecord.elephant_id)?.name || 'Слон'}» будет удалена безвозвратно.`}
          loading={deleteLoading}
          onClose={() => setDeletingRecord(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

