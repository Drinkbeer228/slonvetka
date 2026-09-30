import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { TreatmentRecordWithPhotos } from '../types';

interface EditRecordModalProps {
  record: TreatmentRecordWithPhotos;
  elephantName?: string;
  assignmentTitle?: string;
  onClose: () => void;
  onSave: (updatedRecord: TreatmentRecordWithPhotos) => Promise<void>;
}

const COMMON_ASSESSMENTS = [
  'В норме',
  'Есть изменения',
  'Требует внимания',
  'Наблюдение',
  'Чисто'
];

export function EditRecordModal({
  record,
  elephantName,
  assignmentTitle,
  onClose,
  onSave
}: EditRecordModalProps) {
  const [assessment, setAssessment] = useState(record.assessment || '');
  const [medicineUsed, setMedicineUsed] = useState(record.medicine_used || '');
  const [comment, setComment] = useState(record.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated: TreatmentRecordWithPhotos = {
        ...record,
        assessment: assessment.trim() || null,
        medicine_used: medicineUsed.trim() || null,
        comment: comment.trim() || null,
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update record:', err);
      setError(err?.message || 'Не удалось сохранить изменения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Редактирование записи</h2>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              {elephantName || 'Слон'} • {assignmentTitle || 'Процедура'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assessment / Статус */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Статус / Оценка состояния
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ASSESSMENTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAssessment(chip)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                    assessment === chip
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Например: В норме, Есть изменения..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white rounded-xl px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition"
            />
          </div>

          {/* Medicine Used / Препарат */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Препарат / Обработка
            </label>
            <input
              type="text"
              value={medicineUsed}
              onChange={(e) => setMedicineUsed(e.target.value)}
              placeholder="Например: Имунгель, мастумгель..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white rounded-xl px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Комментарий
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Заметки по процедуре, поведению слона..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-600 hover:bg-zinc-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Сохранить</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
