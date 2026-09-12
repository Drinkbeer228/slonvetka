import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, RefreshCw, Trash2, ImageIcon } from 'lucide-react';

export interface SaladExtraItem {
  id: string;
  label: string;
  emoji: string;
}

export const SALAD_EXTRAS: SaladExtraItem[] = [
  { id: 'Тыква', label: 'Тыква', emoji: '🎃' },
  { id: 'Яблоки', label: 'Яблоки', emoji: '🍏' },
  { id: 'Кабачки', label: 'Кабачки', emoji: '🥒' },
  { id: 'Баклажаны', label: 'Баклажаны', emoji: '🍆' },
  { id: 'Перец', label: 'Перец', emoji: '🫑' },
  { id: 'Кукуруза', label: 'Кукуруза', emoji: '🌽' },
  { id: 'Арбуз', label: 'Арбуз', emoji: '🍉' },
  { id: 'Дыня', label: 'Дыня', emoji: '🍈' },
  { id: 'Сельдерей', label: 'Сельдерей', emoji: '🌿' },
  { id: 'Соль', label: 'Соль', emoji: '🧂' },
  { id: 'Мел', label: 'Мел', emoji: '⚪' }
];

export interface EveningSaladState {
  isBaseIssued: boolean;
  baseIssuedTime: string | null;
  selectedAdditives: string[];
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handleHaptic = (ms = 12) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const toggleBase = () => {
    if (isLocked) return;
    handleHaptic(15);
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    onChange({
      ...state,
      isBaseIssued: !state.isBaseIssued,
      baseIssuedTime: !state.isBaseIssued ? timeString : null
    });
  };

  const toggleAdditive = (id: string) => {
    if (isLocked) return;
    handleHaptic(10);
    
    const isSelected = state.selectedAdditives.includes(id);
    const newAdditives = isSelected
      ? state.selectedAdditives.filter(a => a !== id)
      : [...state.selectedAdditives, id];
      
    onChange({
      ...state,
      selectedAdditives: newAdditives
    });
  };

  const setAppetite = (appetite: 'all' | 'partial' | 'refused' | null) => {
    if (isLocked) return;
    handleHaptic(15);
    onChange({ ...state, appetite: state.appetite === appetite ? null : appetite });
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
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🥗
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base leading-tight">Вечерний салат</h2>
            <div className="text-xs text-slate-500 font-medium mt-0.5">таз ~120 л</div>
          </div>
        </div>

        {/* PHOTO TRIGGER */}
        <div className="shrink-0">
          {state.photoUrl ? (
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              <Check size={14} strokeWidth={3} />
              <span>Фото прикреплено</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLocked || isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 text-slate-600 border border-white/60 hover:bg-slate-50 text-[11px] uppercase tracking-wide font-bold transition-all active:scale-95 shadow-sm"
            >
              {isProcessingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>Фото</span>
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

      {/* 2. BASE STATUS TOGGLE */}
      <div>
        <button
          type="button"
          disabled={isLocked}
          onClick={toggleBase}
          className={`w-full min-h-[52px] rounded-2xl border transition-all flex items-center justify-center gap-2 px-3 active:scale-[0.98] ${
            state.isBaseIssued
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
        >
          {state.isBaseIssued ? (
            <div className="flex items-center gap-2 font-bold text-sm text-center flex-wrap justify-center">
              <div className="w-5 h-5 rounded-full bg-emerald-200/50 flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3} className="text-emerald-700" />
              </div>
              <span>База выдана (Морковь + Свёкла + Картофель) • {state.baseIssuedTime}</span>
            </div>
          ) : (
            <div className="font-bold text-sm">
              Базовый замес не выдавался
            </div>
          )}
        </button>
      </div>

      {/* 3. ADDITIVES CHIPS */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Добавлено сегодня
        </div>
        <div className="flex flex-wrap gap-2">
          {SALAD_EXTRAS.map((item) => {
            const isSelected = state.selectedAdditives.includes(item.id) || state.selectedAdditives.includes(item.label);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isLocked}
                onClick={() => toggleAdditive(item.id)}
                className={`h-8 sm:h-9 px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-950 font-semibold shadow-sm'
                    : 'bg-white/60 border border-slate-200/60 text-slate-700 font-medium hover:bg-white/80'
                }`}
              >
                <span className="text-sm leading-none drop-shadow-sm">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. APPETITE */}
      <div className={`space-y-3 pt-1 transition-all ${!state.isBaseIssued ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
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

      {/* 5. LIGHTBOX FULLSCREEN PREVIEW */}
      {isLightboxOpen && state.photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
            <img
              src={state.photoUrl}
              alt="Фото замеса салата"
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


