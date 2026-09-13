import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Check, Loader2, RotateCcw, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Assignment, Elephant } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

export interface ExecutionBottomSheetProps {
  assignment: Assignment;
  elephant: Elephant;
  onClose: () => void;
  onComplete: (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => Promise<void>;
  initialData?: {
    assessment?: string | null;
    medicineUsed?: string | null;
    comment?: string | null;
  };
}

const QUICK_NOTES = [
  'Штатно',
  'Слон беспокоился',
  'Повторить вечером',
  'Легкая гиперемия',
  'Промыто физраствором'
];

type AssessmentOption = 'В норме' | 'Внимание' | 'Патология';

export function ExecutionBottomSheet({
  assignment,
  elephant,
  onClose,
  onComplete,
  initialData
}: ExecutionBottomSheetProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Status assessment: default is "В норме"
  const [assessment, setAssessment] = useState<AssessmentOption>(
    (initialData?.assessment as AssessmentOption) || 'В норме'
  );

  // Quick notes & comments
  const [selectedQuickNote, setSelectedQuickNote] = useState<string | null>(
    initialData?.comment ? initialData.comment : 'Штатно'
  );
  const [showCustomComment, setShowCustomComment] = useState<boolean>(
    Boolean(initialData?.comment && !QUICK_NOTES.includes(initialData.comment))
  );
  const [customComment, setCustomComment] = useState<string>(
    initialData?.comment && !QUICK_NOTES.includes(initialData.comment) ? initialData.comment : ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setError(null);
      const compressedBlob = await compressImage(file);
      setPhotoBlob(compressedBlob);
      setPhotoUrl(URL.createObjectURL(compressedBlob));
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при обработке фотографии');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoUrl(null);
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isCompressing) return;

    if (assignment.requires_photo && !photoBlob && !photoUrl) {
      setError('Для этого назначения обязательно фото с камеры');
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const finalComment = showCustomComment && customComment.trim()
      ? customComment.trim()
      : selectedQuickNote || 'Штатно';

    try {
      await onComplete({
        assessment,
        medicineUsed: assignment.medicine || null,
        comment: finalComment,
        photoBlob,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить запись');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-t-[32px] p-5 pb-8 shadow-2xl z-[101] border-t border-white/60 animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 -8px 36px rgba(15, 23, 42, 0.15)',
        }}
      >
        {/* Grabber handle */}
        <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto mb-3.5" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🩺</span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Вет. фиксация
              </h2>
              <span className="text-xs font-bold text-slate-600 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                🐘 {elephant.name}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1 line-clamp-1">
              {assignment.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition tap-target cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. ПРЕПАРАТ (готовый чип, без клавиатуры) */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
              Назначенный препарат
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-950">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-emerald-900 truncate">
                  {assignment.medicine ? assignment.medicine : 'Штатная обработка (без спецпрепарата)'}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold truncate">
                  Применено согласно ветеринарному протоколу
                </div>
              </div>
            </div>
          </div>

          {/* 2. СТАТУС ОЦЕНКИ: 3 КРУПНЫЕ ПЛИТКИ h-12 */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
              Оценка состояния
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* В норме */}
              <button
                type="button"
                onClick={() => {
                  setAssessment('В норме');
                  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                }}
                className={`h-12 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation border ${
                  assessment === 'В норме'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100/90 text-slate-600 border-slate-200/80 hover:bg-slate-200/70'
                }`}
              >
                <CheckCircle2 size={16} className={assessment === 'В норме' ? 'text-white' : 'text-emerald-600'} />
                <span>В норме</span>
              </button>

              {/* Внимание */}
              <button
                type="button"
                onClick={() => {
                  setAssessment('Внимание');
                  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                }}
                className={`h-12 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation border ${
                  assessment === 'Внимание'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100/90 text-slate-600 border-slate-200/80 hover:bg-slate-200/70'
                }`}
              >
                <AlertTriangle size={16} className={assessment === 'Внимание' ? 'text-white' : 'text-amber-600'} />
                <span>Внимание</span>
              </button>

              {/* Патология */}
              <button
                type="button"
                onClick={() => {
                  setAssessment('Патология');
                  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                }}
                className={`h-12 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation border ${
                  assessment === 'Патология'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'bg-slate-100/90 text-slate-600 border-slate-200/80 hover:bg-slate-200/70'
                }`}
              >
                <AlertCircle size={16} className={assessment === 'Патология' ? 'text-white' : 'text-rose-600'} />
                <span>Патология</span>
              </button>
            </div>
          </div>

          {/* 3. ФОТОФИКСАЦИЯ: ОДНА ШИРОКАЯ КНОПКА h-14 */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Фотофиксация {assignment.requires_photo && <span className="text-rose-500">*</span>}
              </span>
              {!photoUrl && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 active:scale-95 cursor-pointer"
                >
                  или из галереи
                </button>
              )}
            </div>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCapture}
            />

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-between p-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Фото процедуры"
                    className="w-16 h-16 rounded-xl object-cover border border-white/80 shadow-xs"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Снимок готов</div>
                    <div className="text-[11px] text-emerald-600 font-semibold">Сжато для быстрой отправки</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Переснять</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 flex items-center justify-center transition cursor-pointer"
                    aria-label="Удалить фото"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full h-14 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 active:scale-[0.99] border-2 border-dashed border-slate-300/80 font-extrabold text-slate-700 flex items-center justify-center gap-2.5 text-sm transition touch-manipulation cursor-pointer"
              >
                {isCompressing ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-slate-600" />
                    <span>Обработка снимка...</span>
                  </>
                ) : (
                  <>
                    <Camera size={20} className="text-slate-600" />
                    <span>Сделать снимок (Камера)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 4. БЫСТРЫЕ ЧИПСЫ ЗАМЕТОК В ОДИН ТАП */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
              Быстрая отметка
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((note) => {
                const isSelected = selectedQuickNote === note && !showCustomComment;
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      setSelectedQuickNote(note);
                      setShowCustomComment(false);
                      if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    }}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer touch-manipulation border ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white/90 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>

            {/* Custom comment spoiler */}
            {!showCustomComment ? (
              <button
                type="button"
                onClick={() => setShowCustomComment(true)}
                className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer py-1"
              >
                <span>+ Добавить свой комментарий</span>
              </button>
            ) : (
              <div className="mt-2 space-y-1 animate-in fade-in duration-200">
                <textarea
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Опишите особенности поведения или состояние раны..."
                  rows={2}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomComment(false);
                    setCustomComment('');
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕ Скрыть свое примечание
                </button>
              </div>
            )}
          </div>

          {/* 5. КНОПКА ФИКСАЦИИ: h-13 w-full */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isCompressing}
              className="h-13 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  <span>Зафиксировать обработку</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
