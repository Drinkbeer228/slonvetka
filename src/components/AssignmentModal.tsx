import React, { useState } from 'react';
import { Elephant, Assignment, ScheduleType, AssessmentType } from '../types';
import { X, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { useStore } from '../store';

interface AssignmentModalProps {
  onClose: () => void;
  onSaved: () => void;
  elephants: Elephant[];
  initialData?: Assignment | null;
}

export function AssignmentModal({ onClose, onSaved, elephants, initialData }: AssignmentModalProps) {
  const { profile } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [elephantId, setElephantId] = useState(initialData?.elephant_id || (elephants[0]?.id || ''));
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [medicine, setMedicine] = useState(initialData?.medicine || '');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(initialData?.schedule_type || 'daily');
  const [requiresPhoto, setRequiresPhoto] = useState(initialData?.requires_photo || false);
  const [requiresBeforeAfter, setRequiresBeforeAfter] = useState(initialData?.requires_before_after || false);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(initialData?.assessment_type || 'none');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название процедуры обязательно');
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await supabaseService.updateAssignment(initialData.id, {
          elephant_id: elephantId,
          title: title.trim(),
          description: description.trim() || null,
          medicine: medicine.trim() || null,
          schedule_type: scheduleType,
          requires_photo: requiresPhoto,
          requires_before_after: requiresBeforeAfter,
          assessment_type: assessmentType,
        });
      } else {
        await supabaseService.createAssignment({
          elephant_id: elephantId,
          title: title.trim(),
          description: description.trim() || null,
          medicine: medicine.trim() || null,
          schedule_type: scheduleType,
          requires_photo: requiresPhoto,
          requires_before_after: requiresBeforeAfter,
          assessment_type: assessmentType,
          is_active: true,
          created_by: profile!.id,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении назначения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg">{initialData ? 'Редактировать назначение' : 'Новое назначение'}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Слон</label>
              <select
                value={elephantId}
                onChange={(e) => setElephantId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
              >
                {elephants.map(el => (
                  <option key={el.id} value={el.id}>{el.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Название процедуры</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, Обработка подошвы..."
                className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Описание / Инструкция</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Подробные указания для киперов"
                className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-zinc-900 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Препарат / Материалы</label>
              <input
                type="text"
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                placeholder="Например, Хлоргексидин 0.05%"
                className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Периодичность</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
              >
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="as_needed">По необходимости</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Тип оценки кипером</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
              >
                <option value="none">Без оценки</option>
                <option value="normal_or_issue">Норма / Есть проблема</option>
                <option value="needs_cleaning">Требует чистки / Чисто</option>
                <option value="result">Зафиксировать текстовый результат</option>
              </select>
            </div>

            <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresPhoto}
                  onChange={(e) => setRequiresPhoto(e.target.checked)}
                  className="w-5 h-5 accent-zinc-900"
                />
                <span className="font-bold text-sm">Обязательно фото</span>
              </label>

              {requiresPhoto && (
                <label className="flex items-center gap-3 cursor-pointer pl-2 border-l-2 border-zinc-300 ml-2">
                  <input
                    type="checkbox"
                    checked={requiresBeforeAfter}
                    onChange={(e) => setRequiresBeforeAfter(e.target.checked)}
                    className="w-5 h-5 accent-zinc-900"
                  />
                  <span className="font-bold text-sm">Фото ДО и ПОСЛЕ</span>
                </label>
              )}
            </div>

            {error && (
              <p className="text-red-500 font-bold text-sm bg-red-50 py-2 px-3 rounded-lg border border-red-100">{error}</p>
            )}
          </form>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold bg-white border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition"
          >
            Отмена
          </button>
          <button
            form="assignment-form"
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-black bg-zinc-900 text-white hover:bg-zinc-800 transition flex items-center gap-2 min-w-[140px] justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'СОХРАНИТЬ' : 'СОЗДАТЬ')}
          </button>
        </div>
      </div>
    </div>
  );
}
