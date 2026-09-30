import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { TreatmentRecordWithPhotos } from '../types';
import { TreatmentRecordCard } from '../components/TreatmentRecordCard';
import { EditRecordModal } from '../components/EditRecordModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface ElephantDetailsScreenProps {
  elephantId: string;
  onBack: () => void;
}

export function ElephantDetailsScreen({ elephantId, onBack }: ElephantDetailsScreenProps) {
  const { elephants, assignments, profile } = useStore();
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit & Delete state for Vet
  const [editingRecord, setEditingRecord] = useState<TreatmentRecordWithPhotos | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<TreatmentRecordWithPhotos | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const elephant = elephants.find(e => e.id === elephantId);
  
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await supabaseService.getElephantHistory(elephantId, 50);
        setRecords(data);
      } catch (err) {
        console.error('Failed to load elephant history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [elephantId]);

  if (!elephant) return <div>Слон не найден</div>;

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
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{elephant.name}</h1>
          <p className="text-zinc-500 font-medium text-sm">История процедур</p>
        </div>
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
      </div>

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          elephantName={elephant.name}
          assignmentTitle={assignments.find(a => a.id === editingRecord.assignment_id)?.title || 'Внеплановая задача'}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingRecord && (
        <ConfirmDeleteModal
          title="Удалить запись из журнала?"
          description={`Запись слона «${elephant.name}» будет удалена безвозвратно.`}
          loading={deleteLoading}
          onClose={() => setDeletingRecord(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

