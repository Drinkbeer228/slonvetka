import React, { useState, useRef } from 'react';
import { Camera, Image, X, Check, Loader2 } from 'lucide-react';
import { Assignment, Elephant } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ExecutionModalProps {
  assignment: Assignment;
  elephant: Elephant;
  onClose: () => void;
  onComplete: (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => Promise<void>;
}

export function ExecutionModal({ assignment, elephant, onClose, onComplete }: ExecutionModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  
  const [assessment, setAssessment] = useState<string>('normal');
  const [needsCleaning, setNeedsCleaning] = useState<string>('no');
  const [result, setResult] = useState<string>('normal');
  
  const [medicineUsed, setMedicineUsed] = useState(assignment.medicine || '');
  const [comment, setComment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file);
      setPhotoBlob(compressedBlob);
      setPhotoUrl(URL.createObjectURL(compressedBlob));
    } catch (err) {
      console.error(err);
      alert('Ошибка при обработке фотографии');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (assignment.requires_photo && !photoBlob) {
      alert('Пожалуйста, прикрепите фотографию');
      return;
    }

    let finalAssessment = null;
    if (assignment.assessment_type === 'needs_cleaning') {
      finalAssessment = needsCleaning === 'yes' ? 'Требуется чистка' : 'Чисто';
    } else if (assignment.assessment_type === 'result') {
      finalAssessment = result === 'normal' ? 'Норма' : 'Требует наблюдения';
    } else if (assignment.assessment_type === 'normal_or_issue') {
      finalAssessment = assessment === 'normal' ? 'Норма' : 'Есть изменения';
    }

    setLoading(true);
    setError(null);
    try {
      await onComplete({
        assessment: finalAssessment,
        medicineUsed: medicineUsed.trim() || null,
        comment: comment.trim() || null,
        photoBlob
      });
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить. Попробуйте ещё раз.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{elephant.name}</div>
            <div className="text-lg font-black leading-tight">{assignment.title}</div>
          </div>
          <button onClick={onClose} disabled={loading} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center transition disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {assignment.description && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm font-medium text-blue-900">
              {assignment.description}
            </div>
          )}

          {assignment.requires_photo && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-700">Фотофиксация</label>
              
              {photoUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-black flex justify-center border-2 border-zinc-200">
                  <img src={photoUrl} alt="Снимок" className="max-h-64 object-contain" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setPhotoUrl(null); setPhotoBlob(null); }} 
                      className="bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 backdrop-blur-sm shadow"
                    >
                      <X size={14} />
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl bg-zinc-50 flex flex-col items-center justify-center text-zinc-700 transition active:scale-95"
                  >
                    <Camera size={28} className="mb-1.5 text-zinc-600" />
                    <span className="font-bold text-sm">Сделать фото</span>
                    <span className="text-[11px] font-medium text-zinc-400">Камера</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl bg-zinc-50 flex flex-col items-center justify-center text-zinc-700 transition active:scale-95"
                  >
                    <Image size={28} className="mb-1.5 text-zinc-600" />
                    <span className="font-bold text-sm">Из галереи</span>
                    <span className="text-[11px] font-medium text-zinc-400">Медиатека / Файл</span>
                  </button>
                </div>
              )}
              
              {/* Камера (с флагом capture="environment" для мгновенного запуска камеры) */}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={cameraInputRef}
                onChange={handlePhotoCapture}
              />
              {/* Выбор из галереи / файлов (без флага capture, чтобы на iPhone открывался выбор из Фото) */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={galleryInputRef}
                onChange={handlePhotoCapture}
              />
            </div>
          )}

          {assignment.assessment_type && assignment.assessment_type !== 'none' && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-zinc-700">Состояние / Оценка</label>
              
              {assignment.assessment_type === 'normal_or_issue' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setAssessment('normal')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${assessment === 'normal' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Норма
                  </button>
                  <button 
                    onClick={() => setAssessment('issue')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${assessment === 'issue' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Есть изменения
                  </button>
                </div>
              )}

              {assignment.assessment_type === 'needs_cleaning' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setNeedsCleaning('no')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${needsCleaning === 'no' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Чисто
                  </button>
                  <button 
                    onClick={() => setNeedsCleaning('yes')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${needsCleaning === 'yes' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Нужна чистка
                  </button>
                </div>
              )}
              
              {assignment.assessment_type === 'result' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setResult('normal')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${result === 'normal' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Норма
                  </button>
                  <button 
                    onClick={() => setResult('issue')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${result === 'issue' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Требует наблюдения
                  </button>
                </div>
              )}
            </div>
          )}

          {assignment.medicine && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-zinc-700">Чем обработано?</label>
              <input 
                type="text" 
                value={medicineUsed}
                onChange={(e) => setMedicineUsed(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900"
                placeholder={assignment.medicine}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-bold text-zinc-700">Есть что добавить? <span className="font-normal text-zinc-400">(необязательно)</span></label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900 resize-none"
              placeholder="Доп. информация..."
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:scale-100 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ВЫПОЛНЕНИЕ'}
          </button>
        </div>
      </div>
    </div>
  );
}
