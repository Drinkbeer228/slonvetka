import React, { useRef, useState } from 'react';
import { Camera, Check, RefreshCw, Trash2 } from 'lucide-react';
import { SaladTechModal } from './SaladTechModal';

export interface EveningSaladState {
  isBaseIssued: boolean;
  baseIssuedTime: string | null;
  selectedAdditives?: string[];
  appetite: 'all' | 'partial' | 'refused' | null;
  photoUrl?: string | null;
}

interface EveningSaladSectionProps {
  state: EveningSaladState;
  isLocked?: boolean;
  onChange: (newState: EveningSaladState) => void;
}

export function EveningSaladSection({
  state,
  isLocked = false,
  onChange
}: EveningSaladSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handleHaptic = (ms = 12) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleMarkIssued = () => {
    if (isLocked) return;
    handleHaptic(15);
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    onChange({
      ...state,
      isBaseIssued: true,
      baseIssuedTime: timeString,
      appetite: state.appetite || 'all'
    });
  };

  const handleReset = () => {
    if (isLocked) return;
    handleHaptic(10);
    onChange({
      ...state,
      isBaseIssued: false,
      baseIssuedTime: null,
      appetite: null
    });
  };

  const setAppetite = (appetite: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    handleHaptic(15);
    onChange({ ...state, appetite });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
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
          onChange({ ...state, photoUrl: compressed });
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
    onChange({ ...state, photoUrl: null });
    setIsLightboxOpen(false);
  };

  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/60 rounded-[32px] p-5 sm:p-6 shadow-lg space-y-5">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] bg-slate-100 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
            🥗
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Ужин (19:00)</h2>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Таз ~120 л</div>
          </div>
        </div>

        {/* Action Buttons: Рецепт ℹ️ and 📷 Фото */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => setIsTechModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-[11px] font-bold uppercase tracking-wide">Рецепт ℹ️</span>
          </button>
          {state.photoUrl ? (
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              <Check size={14} strokeWidth={3} />
              <span>✓ Фото</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLocked || isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-slate-600 hover:bg-slate-50 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              {isProcessingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>📷 Фото</span>
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
      </div>

      {/* 2. Main Status Toggle & Appetite Row */}
      <div>
        {!state.isBaseIssued ? (
          <button
            type="button"
            onClick={handleMarkIssued}
            disabled={isLocked}
            className={`w-full h-12 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isLocked 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-white/60 hover:bg-white/90 border border-white/80 text-slate-800 shadow-sm backdrop-blur-md active:scale-[0.98]'
            }`}
          >
            <span className="text-base">🥗</span>
            <span>Отметить выдачу ужина</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-between px-4 sm:px-5 shadow-md shadow-emerald-600/20">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span>Ужин выдан {state.baseIssuedTime ? `в ${state.baseIssuedTime}` : 'в 19:00'}</span>
              </div>
              <button 
                type="button"
                onClick={handleReset}
                disabled={isLocked}
                className="h-8 px-3 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95 shrink-0 text-xs font-bold bg-white/20"
                aria-label="Сброс"
              >
                Сброс
              </button>
            </div>

            {/* Appetite Row (only appears after issuance) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAppetite('all')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border ${
                  state.appetite === 'all'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Съедено 100%
              </button>
              <button
                type="button"
                onClick={() => setAppetite('partial')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border ${
                  state.appetite === 'partial'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Остаток
              </button>
              <button
                type="button"
                onClick={() => setAppetite('refused')}
                disabled={isLocked}
                className={`flex-1 h-10 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  state.appetite === 'refused'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white/90'
                }`}
              >
                Отказ ⚠️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Tech Card Regulation Bottom Sheet */}
      <SaladTechModal 
        isOpen={isTechModalOpen} 
        onClose={() => setIsTechModalOpen(false)} 
      />

      {/* 4. Lightbox Fullscreen Preview */}
      {isLightboxOpen && state.photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
            <img
              src={state.photoUrl}
              alt="Фото вечернего салата"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="p-6 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent flex gap-3 max-w-lg mx-auto w-full">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95 text-sm"
            >
              Закрыть
            </button>
            {!isLocked && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-3.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95 border border-amber-500/30 flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw size={16} />
                  Переснять
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex-1 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95 border border-red-500/30 flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  Удалить
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



