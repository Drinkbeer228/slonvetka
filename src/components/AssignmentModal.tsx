import React, { useState } from 'react';
import { Elephant, Assignment, ScheduleType, AssessmentType } from '../types';
import { X, Loader2, ChevronRight, Pill } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { useStore } from '../store';
import { ActionSelectModal } from './ActionSelectModal';
import { MedicineSelectModal } from './MedicineSelectModal';
import { MedicalActionDefinition, MEDICAL_ACTIONS } from '../data/medicalActions';

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
  const [selectedAction, setSelectedAction] = useState<MedicalActionDefinition | null>(() => {
    if (initialData) {
      return MEDICAL_ACTIONS.find(a => a.title === initialData.title) || {
        id: 'custom',
        title: initialData.title,
        category: 'custom',
        requiresMedicine: !!initialData.medicine,
        defaultSchedule: initialData.schedule_type,
        requiresPhoto: initialData.requires_before_after ? 'before_after' : initialData.requires_photo ? 'after' : 'none',
        assessmentType: initialData.assessment_type || 'none',
        availableFields: {}
      };
    }
    return MEDICAL_ACTIONS[0]; // Default to eye drops
  });

  const [title, setTitle] = useState(initialData?.title || MEDICAL_ACTIONS[0].title);
  const [description, setDescription] = useState(initialData?.description || '');
  const [medicine, setMedicine] = useState(initialData?.medicine || MEDICAL_ACTIONS[0].defaultMedicine || '');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(initialData?.schedule_type || 'daily');
  const [requiresPhoto, setRequiresPhoto] = useState(initialData?.requires_photo || false);
  const [requiresBeforeAfter, setRequiresBeforeAfter] = useState(initialData?.requires_before_after || false);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(initialData?.assessment_type || 'normal_or_issue');

  // Dynamic extra params for specific actions
  const [eyeSide, setEyeSide] = useState('Оба глаза');
  const [dosage, setDosage] = useState('2 капли');
  const [frequency, setFrequency] = useState('1 раз в день');
  const [limb, setLimb] = useState('Все');
  const [area, setArea] = useState('');

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);

  const handleSelectAction = (action: MedicalActionDefinition) => {
    setSelectedAction(action);
    setTitle(action.title);
    setMedicine(action.defaultMedicine || '');
    setScheduleType(action.defaultSchedule);
    setRequiresPhoto(action.requiresPhoto === 'after' || action.requiresPhoto === 'before_after' || action.requiresPhoto === 'optional');
    setRequiresBeforeAfter(action.requiresPhoto === 'before_after');
    setAssessmentType(action.assessmentType as AssessmentType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название процедуры обязательно');
      return;
    }

    // Format clean composite description / parameters for keeper
    let finalDesc = description.trim();
    const parts: string[] = [];
    if (selectedAction?.availableFields.eyeSide && eyeSide) parts.push(`Глаз: ${eyeSide}`);
    if (selectedAction?.availableFields.dosage && dosage) parts.push(`Доза: ${dosage}`);
    if (selectedAction?.availableFields.frequency && frequency) parts.push(`Кратность: ${frequency}`);
    if (selectedAction?.availableFields.limb && limb) parts.push(`Конечность: ${limb}`);
    if (selectedAction?.availableFields.area && area) parts.push(`Участок: ${area}`);

    if (parts.length > 0) {
      finalDesc = parts.join(' • ') + (finalDesc ? `\n${finalDesc}` : '');
    }

    setLoading(true);
    try {
      if (initialData) {
        await supabaseService.updateAssignment(initialData.id, {
          elephant_id: elephantId,
          title: title.trim(),
          description: finalDesc || null,
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
          description: finalDesc || null,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg">{initialData ? 'Редактировать назначение' : 'Новое назначение'}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
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

            {/* Action Selector Trigger */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Действие / Шаблон</label>
              <button
                type="button"
                onClick={() => setActionModalOpen(true)}
                className="w-full px-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 hover:border-zinc-900 rounded-xl font-bold flex items-center justify-between transition text-left"
              >
                <span className="text-zinc-900 text-base">{title || 'Выбрать действие...'}</span>
                <ChevronRight size={18} className="text-zinc-400" />
              </button>
            </div>

            {/* Medicine field if required by action */}
            {selectedAction?.requiresMedicine && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Препарат</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicine}
                    onChange={(e) => setMedicine(e.target.value)}
                    placeholder="Название препарата"
                    className="flex-1 px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMedicineModalOpen(true)}
                    className="px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Pill size={16} />
                    <span>Справочник</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic fields based on action availableFields */}
            {selectedAction?.availableFields.eyeSide && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Глаз</label>
                <select
                  value={eyeSide}
                  onChange={(e) => setEyeSide(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                >
                  <option value="Оба глаза">Оба глаза</option>
                  <option value="Левый глаз">Левый глаз</option>
                  <option value="Правый глаз">Правый глаз</option>
                </select>
              </div>
            )}

            {selectedAction?.availableFields.dosage && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Дозировка</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Например, 2 капли / 5 мл"
                  className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                />
              </div>
            )}

            {selectedAction?.availableFields.frequency && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Кратность</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                >
                  <option value="1 раз в день">1 раз в день</option>
                  <option value="2 раза в день">2 раза в день</option>
                  <option value="3 раза в день">3 раза в день</option>
                  <option value="Ежедневно">Ежедневно</option>
                  <option value="Еженедельно">Еженедельно</option>
                  <option value="По необходимости">По необходимости</option>
                </select>
              </div>
            )}

            {selectedAction?.availableFields.limb && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Конечность</label>
                <select
                  value={limb}
                  onChange={(e) => setLimb(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                >
                  <option value="Все">Все</option>
                  <option value="ПЛ передняя левая">ПЛ (передняя левая)</option>
                  <option value="ПП передняя правая">ПП (передняя правая)</option>
                  <option value="ЗЛ задняя левая">ЗЛ (задняя левая)</option>
                  <option value="ЗП задняя правая">ЗП (задняя правая)</option>
                </select>
              </div>
            )}

            {selectedAction?.availableFields.area && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Участок / Локализация</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Например, правое ухо, лопатка"
                  className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Периодичность (расписание)</label>
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
                <option value="foot_status">Статус стопы (Норма, Трещина, Повреждение)</option>
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

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Дополнительный комментарий</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Инструкции для кипера"
                className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-zinc-900 transition resize-none"
              />
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

      {actionModalOpen && (
        <ActionSelectModal
          onSelect={handleSelectAction}
          onClose={() => setActionModalOpen(false)}
        />
      )}

      {medicineModalOpen && (
        <MedicineSelectModal
          selected={medicine}
          onSelect={(med) => setMedicine(med)}
          onClose={() => setMedicineModalOpen(false)}
        />
      )}
    </div>
  );
}
