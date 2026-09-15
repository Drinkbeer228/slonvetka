import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { formatTime, formatDate } from '../utils/dates';
import { supabaseService } from '../services/supabaseService';
import { TreatmentRecordWithPhotos } from '../types';
import { AlertTriangle, Loader2, Plus, Search, WifiOff } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [elephantFilter, setElephantFilter] = useState('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'observation' | 'assignment'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'pending' | 'syncing' | 'error' | 'synced'>('all');
  
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

  const draftSummary = useMemo(() => {
    return pendingDrafts.reduce<Record<'pending' | 'syncing' | 'error' | 'synced', number>>((acc, draft) => {
      acc[draft.status] += 1;
      return acc;
    }, { pending: 0, syncing: 0, error: 0, synced: 0 });
  }, [pendingDrafts]);

  const filteredPendingDrafts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pendingDrafts.filter(draft => {
      const elephant = elephants.find(e => e.id === draft.payload.elephant_id);
      const assignment = assignments.find(a => a.id === draft.payload.assignment_id);
      const matchesQuery = !query || [
        elephant?.name,
        assignment?.title,
        draft.payload.comment,
        draft.payload.assessment,
        draft.errorMessage,
      ].some(value => value?.toLowerCase().includes(query));
      const matchesElephant = elephantFilter === 'all' || draft.payload.elephant_id === elephantFilter;
      const matchesType =
        entryTypeFilter === 'all' ||
        (entryTypeFilter === 'observation' ? !draft.payload.assignment_id : Boolean(draft.payload.assignment_id));
      const matchesSync = syncFilter === 'all' || draft.status === syncFilter;
      return matchesQuery && matchesElephant && matchesType && matchesSync;
    });
  }, [assignments, elephants, elephantFilter, entryTypeFilter, pendingDrafts, searchQuery, syncFilter]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (syncFilter !== 'all' && syncFilter !== 'synced') {
      return [];
    }
    return [...records]
      .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
      .filter(record => {
        const elephant = elephants.find(e => e.id === record.elephant_id);
        const assignment = assignments.find(a => a.id === record.assignment_id);
        const keeperName = record.keeper?.name || (record.keeper_id === profile?.id ? profile.name : '');
        const matchesQuery = !query || [
          elephant?.name,
          assignment?.title,
          record.comment,
          record.assessment,
          record.medicine_used,
          keeperName,
        ].some(value => value?.toLowerCase().includes(query));
        const matchesElephant = elephantFilter === 'all' || record.elephant_id === elephantFilter;
        const matchesType =
          entryTypeFilter === 'all' ||
          (entryTypeFilter === 'observation' ? !record.assignment_id : Boolean(record.assignment_id));
        return matchesQuery && matchesElephant && matchesType;
      });
  }, [assignments, elephants, elephantFilter, entryTypeFilter, profile, records, searchQuery]);

  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce<Array<{ label: string; items: TreatmentRecordWithPhotos[] }>>((acc, record) => {
      const timestamp = new Date(record.performed_at).getTime();
      const label = formatDate(timestamp);
      const existing = acc.find(group => group.label === label);
      if (existing) {
        existing.items.push(record);
      } else {
        acc.push({ label, items: [record] });
      }
      return acc;
    }, []);
  }, [filteredRecords]);

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Архив смен и хроника</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">Сквозная хроника по слонам: динамика симптомов, отеки ног, стереотипии и история процедур</p>
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

      {/* Быстрые фильтры симптомов */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mt-2">
        {[
          { label: 'Все записи', query: '' },
          { label: '🦶 Ноги & Отеки', query: 'ног' },
          { label: '🌀 Стереотипии', query: 'стереотип' },
          { label: '💩 ЖКТ & Стул', query: 'стул' },
          { label: '🥣 Аппетит & Корм', query: 'корм' },
          { label: '🐘 Тонус хобота', query: 'хобот' },
        ].map(filter => {
          const isActive = searchQuery === filter.query;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => setSearchQuery(filter.query)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap border cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-slate-500" />
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Фильтры журнала</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Поиск</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Слон, комментарий, препарат…"
              className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Слон</span>
            <select
              value={elephantFilter}
              onChange={(e) => setElephantFilter(e.target.value)}
              className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300"
            >
              <option value="all">Все слоны</option>
              {elephants.map(elephant => (
                <option key={elephant.id} value={elephant.id}>{elephant.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Тип записи</span>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value as typeof entryTypeFilter)}
              className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300"
            >
              <option value="all">Все типы</option>
              <option value="assignment">Назначения</option>
              <option value="observation">Наблюдения</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Синхронизация</span>
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value as typeof syncFilter)}
              className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-300"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидают сеть</option>
              <option value="syncing">Синхронизация</option>
              <option value="error">Есть ошибки</option>
              <option value="synced">Уже синхронизировано</option>
            </select>
          </label>
        </div>
      </div>

      {(pendingDrafts.length > 0 || draftSummary.error > 0) && (
        <div className={`rounded-3xl border p-4 shadow-lg backdrop-blur-xl ${draftSummary.error > 0 ? 'border-amber-200 bg-amber-50/90' : 'border-sky-200 bg-sky-50/90'}`}>
          <div className="flex items-start gap-3">
            {draftSummary.error > 0 ? (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            ) : (
              <WifiOff size={18} className="mt-0.5 shrink-0 text-sky-700" />
            )}
            <div className="space-y-2">
              <div>
                <h2 className="text-sm font-black text-slate-900">Состояние офлайн-синхронизации</h2>
                <p className="text-sm text-slate-600">
                  {draftSummary.error > 0
                    ? 'Есть записи, которым нужна повторная синхронизация.'
                    : 'Часть журнала пока сохранена локально и будет отправлена при появлении сети.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white/90 px-3 py-1 text-slate-700">Ожидают: {draftSummary.pending}</span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-slate-700">Синхронятся: {draftSummary.syncing}</span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-slate-700">Ошибки: {draftSummary.error}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
          </div>
        ) : (
          <>
            {filteredPendingDrafts.map(draft => {
              const elephant = elephants.find(e => e.id === draft.payload.elephant_id);
              const assignment = assignments.find(a => a.id === draft.payload.assignment_id);
              const title = assignment ? assignment.title : 'Внеплановая задача';
              
              const keeperName = profile?.name || 'Сотрудник';
              const performedAt = new Date(draft.created_at).getTime();

              const isError = draft.status === 'error';
              const isSyncing = draft.status === 'syncing';

              return (
                <div key={draft.temp_id} className={`rounded-2xl p-4 shadow-sm border-2 ${isError ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
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

                  <div className={`text-xs font-bold flex items-center justify-center gap-2 py-2 rounded-xl ${isError ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                    {isError ? (
                      <>⚠️ Ошибка синхронизации — запись сохранена локально</>
                    ) : isSyncing ? (
                      <><Loader2 size={14} className="animate-spin" />Синхронизация...</>
                    ) : (
                      <>⏳ Сохранено локально (ожидает сети...)</>
                    )}
                  </div>
                </div>
              );
            })}

            {groupedRecords.length === 0 && filteredPendingDrafts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-200">
                По текущим фильтрам записей не найдено
              </div>
            ) : (
              groupedRecords.map(group => (
                <section key={group.label} className="space-y-3">
                  <div className="sticky top-[72px] z-10 inline-flex rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-xl">
                    {group.label}
                  </div>
                  {group.items.map(record => (
                    <TreatmentRecordCard
                      key={record.id}
                      record={record}
                      elephants={elephants}
                      assignments={assignments}
                      currentProfile={profile}
                      onEdit={(rec) => setEditingRecord(rec)}
                      onDelete={(rec) => setDeletingRecord(rec)}
                    />
                  ))}
                </section>
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
