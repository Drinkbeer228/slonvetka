import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Mic, MicOff, RefreshCw, Trash2, X } from 'lucide-react';
import { ShiftPhoto } from '../../types/shift';
import { SectionPhotoTrigger } from './SectionPhotoTrigger';

export interface ObservationJournalProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  isLocked?: boolean;
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
  const [isRecording, setIsRecording] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const value = propValue !== undefined ? propValue : localValue;
  const photoUrl = propPhotoUrl !== undefined ? propPhotoUrl : localPhotoUrl;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Speech-to-text / Voice Dictation toggle
  const toggleVoiceRecording = () => {
    if (isLocked) return;
    handleHaptic(20);

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'ru-RU';

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let recognizedText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              recognizedText += event.results[i][0].transcript;
            }
          }
          if (recognizedText) {
            const separator = value ? (value.endsWith(' ') || value.endsWith('\n') ? '' : ' ') : '';
            const updated = `${value}${separator}${recognizedText.trim()}`;
            setLocalValue(updated);
            onChange?.(updated);
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        return;
      } catch {
        // Fallback to visual pulsing mode below
      }
    }

    // Visual pulsing mode toggle (for browsers where native keyboard dictation is active)
    setIsRecording((prev) => !prev);
  };

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Standalone Photo Capture Logic
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    handleHaptic(20);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxSize = 1200;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.75);
          onPhotoChange?.(compressed);
          setLocalPhotoUrl(compressed);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => setIsProcessingPhoto(false);
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => setIsProcessingPhoto(false);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    handleHaptic(15);
    onPhotoChange?.(null);
    setLocalPhotoUrl(null);
    setIsLightboxOpen(false);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[28px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
            📝
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base leading-tight">Журнал наблюдений</h2>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Свободные заметки за смену</div>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              <Check size={14} strokeWidth={3} />
              <span>✓ Фото</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLocked || isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-slate-600 hover:bg-slate-50 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              {isProcessingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>📷 Фото</span>
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

      {/* 2. TEXTAREA WITH EMBEDDED MICROPHONE BUTTON */}
      <div className="relative group">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onBlur={onBlur}
          disabled={isLocked}
          placeholder="Например: Марго и Прэтти конфликтовали из-за веток, Одри неохотно ела ужин..."
          className="w-full min-h-[100px] pl-4 pr-14 py-3.5 bg-white/60 border border-slate-200/60 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400/90 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400/80 transition-all shadow-inner resize-none overflow-hidden"
        />

        {/* Microphone Button (Killer Feature for Keepers with dirty hands) */}
        <div className="absolute right-2.5 bottom-3">
          <button
            type="button"
            disabled={isLocked}
            onClick={toggleVoiceRecording}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md ${
              isRecording
                ? 'bg-rose-500 text-white ring-4 ring-rose-400/30 animate-pulse shadow-rose-500/40'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-800 border border-slate-200/70'
            }`}
            title={isRecording ? 'Идёт голосовая запись (нажмите для остановки)' : 'Голосовой ввод'}
            aria-label={isRecording ? 'Остановить запись' : 'Начать голосовой ввод'}
          >
            {isRecording ? <MicOff size={18} className="animate-bounce" /> : <Mic size={18} />}
          </button>
        </div>
      </div>

      {/* Visual recording status caption */}
      {isRecording && (
        <div className="flex items-center gap-2 px-1 text-xs font-semibold text-rose-600 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Слушаю... Говорите заметку, текст подставится автоматически</span>
        </div>
      )}

      {/* 3. LIGHTBOX PREVIEW */}
      {isLightboxOpen && photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
            <img
              src={photoUrl}
              alt="Фото к заметкам"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-white/10 flex items-center justify-between gap-4 max-w-lg mx-auto w-full">
            <button
              type="button"
              disabled={isLocked}
              onClick={handleRemovePhoto}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-all active:scale-95"
            >
              <Trash2 size={16} />
              <span>Удалить фото</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all active:scale-95"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
