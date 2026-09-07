import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { Elephant } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ObservationModalProps {
  elephants: Elephant[];
  onClose: () => void;
  onComplete: (data: {
    elephantId: string;
    comment: string;
    photoBlob: Blob;
  }) => Promise<void>;
}

export function ObservationModal({ elephants, onClose, onComplete }: ObservationModalProps) {
  const [elephantId, setElephantId] = useState<string>(elephants[0]?.id || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [comment, setComment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const handleSubmit = async () => {
    if (!elephantId) {
      alert('Выберите слона');
      return;
    }
    if (!photoBlob) {
      alert('Пожалуйста, прикрепите фотографию');
      return;
    }
    if (!comment.trim()) {
      alert('Пожалуйста, добавьте комментарий');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onComplete({
        elephantId,
        comment: comment.trim(),
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
            <div className="text-lg font-black leading-tight">Наблюдение / Фото</div>
          </div>
          <button onClick={onClose} disabled={loading} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center transition disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-zinc-700">Слон</label>
            <select
              value={elephantId}
              onChange={e => setElephantId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900"
            >
              {elephants.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-zinc-700">Фотофиксация <span className="text-red-500">*</span></label>
            
            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black flex justify-center border-2 border-zinc-200">
                <img src={photoUrl} alt="Снимок" className="max-h-64 object-contain" />
                <button 
                  onClick={() => { setPhotoUrl(null); setPhotoBlob(null); }} 
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

          <div className="space-y-1">
            <label className="block text-sm font-bold text-zinc-700">Что заметили? <span className="text-red-500">*</span></label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50 border border-zinc-300 p-3 rounded-xl font-medium focus:outline-none focus:border-zinc-900 resize-none"
              placeholder="Описание наблюдения..."
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
            {loading ? 'СОХРАНЕНИЕ...' : 'ЗАФИКСИРОВАТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
}
