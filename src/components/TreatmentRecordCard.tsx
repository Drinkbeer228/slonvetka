import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { TreatmentRecordWithPhotos, Elephant, Assignment, Profile } from '../types';
import { formatDate, formatTime } from '../utils/dates';
import { PhotoPreview } from './PhotoPreview';

interface TreatmentRecordCardProps {
  key?: React.Key;
  record: TreatmentRecordWithPhotos;
  elephants: Elephant[];
  assignments: Assignment[];
  currentProfile: Profile | null;
  onEdit?: (record: TreatmentRecordWithPhotos) => void;
  onDelete?: (record: TreatmentRecordWithPhotos) => void;
}

export function TreatmentRecordCard({
  record,
  elephants,
  assignments,
  currentProfile,
  onEdit,
  onDelete,
}: TreatmentRecordCardProps) {
  const elephant = elephants.find((e) => e.id === record.elephant_id);
  const assignment = assignments.find((a) => a.id === record.assignment_id);
  const title = assignment ? assignment.title : 'Внеплановая задача';

  // Determine keeper name: from joined keeper relation or fallback
  const keeperName = record.keeper?.name 
    ? record.keeper.name 
    : (record.keeper_id === currentProfile?.id ? currentProfile.name : 'Сотрудник');

  const performedAt = new Date(record.performed_at).getTime();
  const isVet = currentProfile?.role === 'vet';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-zinc-200 transition hover:border-zinc-300">
      {/* Header with Title, Date and Vet Actions */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-lg leading-tight text-zinc-900 truncate">
            {title}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-bold text-zinc-500 text-right whitespace-nowrap">
            <div>{formatDate(performedAt)}</div>
            <div>{formatTime(performedAt)}</div>
          </div>

          {/* Action buttons visible ONLY for vet */}
          {isVet && (
            <div className="flex items-center gap-1 pl-1 border-l border-zinc-200 ml-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  title="Редактировать запись"
                  aria-label="Редактировать запись"
                  className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 flex items-center justify-center transition"
                >
                  <Pencil size={15} />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(record)}
                  title="Удалить запись"
                  aria-label="Удалить запись"
                  className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 flex items-center justify-center transition"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badges: Elephant & Keeper */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black bg-zinc-100 px-2 py-1 rounded-md uppercase tracking-wider text-zinc-800">
          {elephant?.name || 'Неизвестно'}
        </span>
        <span className="text-xs font-medium text-zinc-400">•</span>
        <span className="text-xs font-bold text-zinc-600">
          {keeperName}
        </span>
      </div>

      {/* Details: Status, Medicine, Comment */}
      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm space-y-2">
        {record.assessment && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-zinc-500 font-medium text-xs">Статус:</span>
            <span
              className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                record.assessment.toLowerCase().includes('норма') ||
                record.assessment.toLowerCase().includes('чисто')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {record.assessment}
            </span>
          </div>
        )}

        {record.medicine_used && (
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-zinc-500 font-medium text-xs shrink-0">Обработка:</span>
            <span className="font-bold text-xs text-zinc-800 text-right">
              {record.medicine_used}
            </span>
          </div>
        )}

        {record.comment && (
          <div className="pt-2 border-t border-zinc-200 mt-2">
            <span className="text-zinc-500 font-medium text-xs block mb-0.5">Комментарий:</span>
            <span className="text-zinc-800 text-xs font-medium leading-relaxed whitespace-pre-wrap">
              {record.comment}
            </span>
          </div>
        )}
      </div>

      {/* Photos */}
      {record.photos && record.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {record.photos.map((p) => {
            let typeStr = 'Одиночный снимок';
            if (p.photo_type === 'before') typeStr = 'Снимок ДО';
            if (p.photo_type === 'after') typeStr = 'Снимок ПОСЛЕ';

            const caption = `${elephant?.name || 'Слон'} • ${title} • ${formatDate(
              performedAt
            )} ${formatTime(performedAt)} • ${typeStr}`;

            return <PhotoPreview key={p.id} photo={p} caption={caption} />;
          })}
        </div>
      )}
    </div>
  );
}
