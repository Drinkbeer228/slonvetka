import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTime, formatDate } from '../utils/dates';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { TreatmentRecordWithPhotos } from '../types';
import { PhotoPreview } from '../components/PhotoPreview';

interface ElephantDetailsScreenProps {
  elephantId: string;
  onBack: () => void;
}

export function ElephantDetailsScreen({ elephantId, onBack }: ElephantDetailsScreenProps) {
  const { elephants, assignments, profile } = useStore();
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  
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
          records.map(record => {
            const assignment = assignments.find(a => a.id === record.assignment_id);
            const title = assignment ? assignment.title : 'Внеплановая задача';
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
    </div>
  );
}

