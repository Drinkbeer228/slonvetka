import React from 'react';
import { useStore } from '../store';
import { formatTime, formatDate } from '../utils/dates';
import { ArrowLeft } from 'lucide-react';

interface ElephantDetailsScreenProps {
  elephantId: string;
  onBack: () => void;
}

export function ElephantDetailsScreen({ elephantId, onBack }: ElephantDetailsScreenProps) {
  const { elephants, records, assignments, keepers } = useStore();
  
  const elephant = elephants.find(e => e.id === elephantId);
  if (!elephant) return <div>Слон не найден</div>;

  const elRecords = records
    .filter(r => r.elephantId === elephantId)
    .sort((a, b) => b.createdAt - a.createdAt);

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
        {elRecords.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-medium bg-white rounded-3xl border border-zinc-200">
            Записей пока нет
          </div>
        ) : (
          elRecords.map(record => {
            const keeper = keepers.find(k => k.id === record.keeperId);
            const assignment = assignments.find(a => a.id === record.assignmentId);
            const title = assignment ? assignment.title : record.title || 'Внеплановая задача';
            
            return (
              <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg leading-tight text-zinc-900">{title}</div>
                  <div className="text-xs font-bold text-zinc-500 text-right whitespace-nowrap ml-3">
                    <div>{formatDate(record.createdAt)}</div>
                    <div>{formatTime(record.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-zinc-600">{keeper?.name || 'Неизвестный кипер'}</span>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Статус:</span>
                    <span className={`font-bold ${record.assessment === 'Норма' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {record.assessment}
                    </span>
                  </div>
                  
                  {Object.entries(record.customFieldValues).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-zinc-500 font-medium">{key}:</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  ))}
                  
                  {record.comment && (
                    <div className="pt-2 border-t border-zinc-200 mt-2">
                      <span className="text-zinc-500 font-medium">Комментарий: </span>
                      <span className="text-zinc-800">{record.comment}</span>
                    </div>
                  )}
                </div>

                {record.photos && record.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {record.photos.map(p => (
                      <div key={p.id} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-black">
                        <img src={p.dataUrl} alt="Фото" className="w-full h-full object-cover" />
                      </div>
                    ))}
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
