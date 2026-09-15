import React, { useState } from 'react';
import { 
  X, Check, AlertCircle, AlertTriangle, Sparkles, Loader2, 
  ShieldCheck, HelpCircle, CheckSquare, Square
} from 'lucide-react';
import { DailyShift } from '../../types/shift';
import { shiftService } from '../../services/shiftService';

export interface HandoverQuestionItem {
  id: string;
  question: string;
  isPositive: boolean | null; // true = Да, false = Нет, null = не выбрано
}

interface HandoverAcceptModalProps {
  pendingShift: DailyShift;
  senderName: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_QUESTIONS = [
  { id: 'washed', question: '1. Слоны замыты (чистые)?' },
  { id: 'bedding', question: '2. Подстилка сухая?' },
  { id: 'swept', question: '3. Слоновник подметён?' },
  { id: 'drinkers', question: '4. Поилки и кормушки вымыты?' },
  { id: 'inventory', question: '5. Инвентарь целый (ущерб сходится)?' },
];

export function HandoverAcceptModal({
  pendingShift,
  senderName,
  currentUserId,
  onClose,
  onSuccess,
}: HandoverAcceptModalProps) {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({
    washed: null,
    bedding: null,
    swept: null,
    drinkers: null,
    inventory: null,
  });

  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectAnswer = (qId: string, value: boolean) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setAnswers(prev => ({
      ...prev,
      [qId]: value
    }));
    setErrorMessage(null);
  };

  // Проверяем: есть ли хотя бы один пункт "Нет"
  const hasNegativeAnswer = Object.values(answers).some(ans => ans === false);

  // Проверяем: все ли 5 вопросов отвечены
  const allAnswered = Object.values(answers).every(ans => ans !== null);

  // Валидация: если есть "Нет", комментарий обязателен (не менее 3 символов)
  const isCommentValid = !hasNegativeAnswer || comment.trim().length >= 3;

  const canSubmit = allAnswered && isCommentValid;

  const handleSubmit = async () => {
    if (!allAnswered) {
      setErrorMessage('Пожалуйста, ответьте на все 5 пунктов опросника');
      return;
    }

    if (hasNegativeAnswer && comment.trim().length < 3) {
      setErrorMessage('При наличии замечаний («Нет») укажите обязательный комментарий сменщика');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Собираем результаты опросника в читаемый лог
      const summaryItems: string[] = [];
      DEFAULT_QUESTIONS.forEach(q => {
        const val = answers[q.id];
        summaryItems.push(`${q.question.replace(/^\d+\.\s*/, '')}: ${val ? 'Да (Норма)' : 'НЕТ ⚠️'}`);
      });

      let handoverAuditNotes = `[Приёмка дежурства]:\n${summaryItems.join('\n')}`;
      if (comment.trim()) {
        handoverAuditNotes += `\nЗамечания сменщика: ${comment.trim()}`;
      }

      // Сохраняем в handover_notes смены через update или при закрытии
      // acceptHandover закрывает смену и передает дежурство
      // Для прозрачности дополним handover_notes
      const fullNotes = pendingShift.handover_notes 
        ? `${pendingShift.handover_notes}\n\n${handoverAuditNotes}`
        : handoverAuditNotes;

      // Обновляем pendingShift с новыми заметками перед финализацией
      await shiftService.acceptHandover({
        ...pendingShift,
        handover_notes: fullNotes,
      }, currentUserId);

      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 30, 15]);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to accept handover with checklist:', err);
      setErrorMessage(err.message || 'Ошибка при приёме смены');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/80 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-slate-50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                Опросник приёмки дежурства
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Сдающий кипер: <span className="font-bold text-slate-800">{senderName}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800">
          
          {pendingShift.handover_notes && (
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-950">
              <span className="font-bold block text-amber-900 mb-0.5">Заметки сдавшего кипера:</span>
              «{pendingShift.handover_notes}»
            </div>
          )}

          <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Чек-лист состояния объекта:
          </div>

          <div className="space-y-2.5">
            {DEFAULT_QUESTIONS.map((q) => {
              const currentVal = answers[q.id];
              return (
                <div 
                  key={q.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    currentVal === null 
                      ? 'bg-slate-50/70 border-slate-200/70' 
                      : currentVal === true 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                        : 'bg-rose-50/80 border-rose-300 shadow-2xs'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 leading-snug">
                    {q.question}
                  </div>

                  {/* Крупные эргономичные кнопки Да / Нет */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, true)}
                      className={`min-h-[42px] px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                        currentVal === true
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>Да</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, false)}
                      className={`min-h-[42px] px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                        currentVal === false
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <X size={14} strokeWidth={3} />
                      <span>Нет</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Поле комментария с обязательным заполнением при выборе "Нет" */}
          <div className="pt-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 px-1">
              Комментарий сменщика {hasNegativeAnswer ? <span className="text-rose-600 font-extrabold">(Обязательно при замечаниях «Нет») *</span> : '(необязательно)'}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                setErrorMessage(null);
              }}
              placeholder={hasNegativeAnswer ? "Укажите, что не замыто, где сыро или какой инвентарь сломан..." : "Любые уточнения или особенности приёмки смены..."}
              className={`w-full p-3 bg-slate-50/80 border rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white resize-none transition ${
                hasNegativeAnswer && comment.trim().length < 3
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-400/50 bg-rose-50/30'
                  : 'border-slate-200/90 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              }`}
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-2xl transition cursor-pointer"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className={`w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer ${
              canSubmit && !isSubmitting
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Check size={18} strokeWidth={2.8} />
                <span>Подтвердить приёмку смены</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
