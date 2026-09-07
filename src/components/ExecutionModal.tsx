import React, { useState, useRef } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { Assignment, Elephant, TreatmentRecord } from '../types';
import { useStore } from '../store';

interface ExecutionModalProps {
  assignment: Assignment;
  elephant: Elephant;
  onClose: () => void;
  onComplete: (record: Omit<TreatmentRecord, 'id' | 'createdAt' | 'keeperId'>) => void;
}

export function ExecutionModal({ assignment, elephant, onClose, onComplete }: ExecutionModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<string>('normal');
  const [needsCleaning, setNeedsCleaning] = useState<string>('no');
  const [result, setResult] = useState<string>('normal');
  const [comment, setComment] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple compression for mock
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (assignment.requiresPhoto && !photo) {
      alert('Пожалуйста, прикрепите фотографию');
      return;
    }

    let finalAssessment = assessment;
    if (assignment.assessmentType === 'needs_cleaning') {
      finalAssessment = needsCleaning === 'yes' ? 'Требуется чистка' : 'Норма';
    } else if (assignment.assessmentType === 'result') {
      finalAssessment = result === 'normal' ? 'Норма' : 'Требует наблюдения';
    } else if (assignment.assessmentType === 'normal_or_issue') {
      finalAssessment = assessment === 'normal' ? 'Норма' : 'Есть изменения';
    } else {
      finalAssessment = '';
    }

    const photos = [];
    if (photo) {
      photos.push({
        id: 'ph-' + Date.now(),
        treatmentRecordId: '',
        type: 'general' as const,
        dataUrl: photo,
        createdAt: Date.now()
      });
    }

    onComplete({
      assignmentId: assignment.id,
      elephantId: elephant.id,
      assessment: finalAssessment,
      comment,
      customFieldValues: customFields,
      photos
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{elephant.name}</div>
            <div className="text-lg font-black leading-tight">{assignment.title}</div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {assignment.description && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm font-medium text-blue-900">
              {assignment.description}
            </div>
          )}

          {/* Photo */}
          {assignment.requiresPhoto && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-700">Фотофиксация</label>
              
              {photo ? (
                <div className="relative rounded-2xl overflow-hidden bg-black flex justify-center border-2 border-zinc-200">
                  <img src={photo} alt="Снимок" className="max-h-64 object-contain" />
                  <button 
                    onClick={() => setPhoto(null)} 
                    className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-lg text-xs font-bold"
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl bg-zinc-50 flex flex-col items-center justify-center text-zinc-500 transition"
                >
                  <Camera size={32} className="mb-2" />
                  <span className="font-bold">Сделать снимок</span>
                </button>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoCapture}
              />
            </div>
          )}

          {/* Assessment */}
          {assignment.assessmentType !== 'none' && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-zinc-700">Состояние / Оценка</label>
              
              {assignment.assessmentType === 'normal_or_issue' && (
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

              {assignment.assessmentType === 'needs_cleaning' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setNeedsCleaning('no')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${needsCleaning === 'no' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Не требует чистки
                  </button>
                  <button 
                    onClick={() => setNeedsCleaning('yes')}
                    className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition ${needsCleaning === 'yes' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    Требует чистки
                  </button>
                </div>
              )}
              
              {assignment.assessmentType === 'result' && (
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

          {/* Custom Fields */}
          {assignment.customFields.map(field => (
            <div key={field} className="space-y-1">
              <label className="block text-sm font-bold text-zinc-700">{field}</label>
              <input 
                type="text" 
                value={customFields[field] || ''}
                onChange={(e) => handleCustomFieldChange(field, e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900"
                placeholder="Введите значение..."
              />
            </div>
          ))}

          {/* Comment */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-zinc-700">Комментарий (необязательно)</label>
            <input 
              type="text" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900"
              placeholder="Доп. информация..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0">
          <button 
            onClick={handleSubmit}
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Check size={20} />
            СОХРАНИТЬ ВЫПОЛНЕНИЕ
          </button>
        </div>
      </div>
    </div>
  );
}
