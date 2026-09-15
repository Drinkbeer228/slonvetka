import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, RefreshCw, Trash2, X } from 'lucide-react';
import { ShiftPhoto } from '../../types/shift';
import { SectionPhotoTrigger } from './SectionPhotoTrigger';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

export interface ObservationJournalProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  isLocked?: boolean;
  shiftDate?: string;
  // Photo integration options
  photos?: ShiftPhoto[];
  onAddPhoto?: (photo: ShiftPhoto) => void;
  onRemovePhoto?: (id: string) => void;
  totalElephantPhotos?: number;
  // Standalone photo
  photoUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
}

export function ObservationJournal({
  value: propValue,
  onChange,
  onBlur,
  isLocked = false,
  shiftDate,
  photos,
  onAddPhoto,
  onRemovePhoto,
  totalElephantPhotos,
  photoUrl: propPhotoUrl,
  onPhotoChange,
}: ObservationJournalProps) {
  // Local fallback states
  const [localValue, setLocalValue] = useState('');
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const value = propValue !== undefined ? propValue : localValue;
  const photoUrl = propPhotoUrl !== undefined ? propPhotoUrl : localPhotoUrl;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHaptic = (ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore haptic failure
      }
    }
  };

  // Auto-expand textarea height without stiff scrollbar
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(100, el.scrollHeight)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    onChange?.(newVal);
  };

  // Standalone Photo Capture Logic
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    handleHaptic(20);

    try {
      const blob = await compressImage(file);
      const sDate = shiftDate || new Date().toISOString().split('T')[0];
      const storagePath = await supabaseService.uploadShiftMedia(blob, sDate, 'general_observation');
      
      onPhotoChange?.(storagePath);
      setLocalPhotoUrl(storagePath);
    } catch (err) {
      console.error('Failed to upload observation photo', err);
      alert('Ошибка загрузки фото');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    handleHaptic(15);
    onPhotoChange?.(null);
    setLocalPhotoUrl(null);
    setIsLightboxOpen(false);
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl shadow-inner shrink-0">
            📝
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-base leading-tight">Журнал наблюдений</h2>
            <div className="text-xs text-slate-600 font-semibold mt-0.5">Свободные заметки за смену</div>
          </div>
        </div>

        {/* PHOTO BUTTON / TRIGGER */}
        <div className="shrink-0">
          {photos && onAddPhoto && onRemovePhoto ? (
            <SectionPhotoTrigger
              section="general"
              photos={photos}
              onAddPhoto={onAddPhoto}
              onRemovePhoto={onRemovePhoto}
              totalElephantPhotos={totalElephantPhotos ?? photos.length}
            />
          ) : photoUrl ? (
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs uppercase tracking-wider font-black transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Check size={16} strokeWidth={3} className="text-emerald-700" />
              <span>✓ Фото</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLocked || isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs uppercase tracking-wider font-black transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isProcessingPhoto ? <RefreshCw size={16} className="animate-spin text-slate-700" /> : <Camera size={16} className="text-slate-700 stroke-[2.4]" />}
              <span>Фото</span>
            </button>
          )}

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoCapture}
            className="hidden"
          />
        </div>
      </div>

      {/* 2. TEXTAREA */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onBlur={onBlur}
          disabled={isLocked}
          placeholder="Например: Марго и Прэтти конфликтовали из-за веток, Одри неохотно ела ужин..."
          className="w-full min-h-[110px] px-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-inner resize-none overflow-hidden"
        />
      </div>

      {/* 3. LIGHTBOX PREVIEW */}
      {isLightboxOpen && photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
            <img
              src={photoUrl.startsWith('data:image') || photoUrl.startsWith('blob:') || photoUrl.startsWith('http') ? photoUrl : supabaseService.getPublicUrl(photoUrl)}
              alt="Фото к заметкам"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-white/10 flex items-center justify-between gap-4 max-w-lg mx-auto w-full">
            <button
              type="button"
              disabled={isLocked}
              onClick={handleRemovePhoto}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-black transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Удалить фото</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-black border border-white/25 transition-all active:scale-95 cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
