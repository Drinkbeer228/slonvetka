import React, { useRef, useState } from 'react';
import { Camera, Check, Sparkles, Trash2, X, RefreshCw } from 'lucide-react';

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

export interface EveningSaladSectionProps {
  baseIncluded?: boolean;
  extras?: string[];
  notes?: string;
  photoUrl?: string;
  isLocked?: boolean;
  onBaseToggle?: (included: boolean) => void;
  onExtraToggle?: (id: string) => void;
  onNotesChange?: (notes: string) => void;
  onPhotoChange?: (photoUrl?: string) => void;
}

export function EveningSaladSection({
  baseIncluded = true,
  extras = [],
  notes = '',
  photoUrl,
  isLocked = false,
  onBaseToggle,
  onExtraToggle,
  onNotesChange,
  onPhotoChange
}: EveningSaladSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handleHaptic = (ms = 12) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleBaseClick = () => {
    if (isLocked || !onBaseToggle) return;
    handleHaptic(15);
    onBaseToggle(!baseIncluded);
  };

  const handleExtraClick = (id: string) => {
    if (isLocked || !onExtraToggle) return;
    handleHaptic(12);
    onExtraToggle(id);
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
          onPhotoChange?.(compressed);
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
    onPhotoChange?.(undefined);
    setIsLightboxOpen(false);
  };

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4">
      {/* 1. HEADER WITH TITLE, STATUS & PHOTO TRIGGER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-xl shadow-inner shrink-0">
            🥗
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base tracking-wide leading-tight">
                Вечерний салат
              </h3>
              {extras.length > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20">
                  +{extras.length} доп.
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Сочный вечерний рацион
            </div>
          </div>
        </div>

        {/* 📷 ФОТО ТАЗИКА/ЗАМЕСА В ПРАВОМ ВЕРХНЕМ УГЛУ */}
        <div className="shrink-0 flex items-center gap-2">
          {photoUrl ? (
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-10 h-10 rounded-2xl overflow-hidden cursor-pointer border border-white shadow-sm ring-2 ring-amber-500/20 active:scale-95 transition-transform"
              title="Нажмите для просмотра фото"
            >
              <img src={photoUrl} alt="Тазик салата" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <span className="text-white text-xs drop-shadow">🔍</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLocked || isProcessingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/70 hover:bg-white border border-white/60 text-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Сделать фото замеса / тазика"
            >
              {isProcessingPhoto ? (
                <RefreshCw size={15} className="animate-spin text-amber-600" />
              ) : (
                <Camera size={15} className="text-amber-600" />
              )}
              <span className="hidden sm:inline">Фото тазика</span>
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

      {/* 2. БЛОК «ПОСТОЯННАЯ БАЗА» */}
      <div className="pt-1">
        <button
          type="button"
          disabled={isLocked}
          onClick={handleBaseClick}
          className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 active:scale-[0.99] ${
            baseIncluded
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 shadow-sm'
              : 'bg-white/40 border-slate-200/60 text-slate-500 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                baseIncluded
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Check size={18} strokeWidth={baseIncluded ? 3 : 2} />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Базовый замес: Морковь + Свёкла + Картофель</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {baseIncluded ? 'Выдается по умолчанию каждый вечер' : 'Базовый замес отключен'}
              </div>
            </div>
          </div>

          <div
            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
              baseIncluded
                ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                : 'bg-slate-200/80 text-slate-500'
            }`}
          >
            {baseIncluded ? 'Выдано' : 'Не выдано'}
          </div>
        </button>
      </div>

      {/* 3. БЛОК «ДОБАВКИ И СЕЗОНКА» */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Добавлено сегодня
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            по сезону или предписанию врача
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SALAD_EXTRAS.map((item) => {
            const isSelected = extras.includes(item.id) || extras.includes(item.label);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleExtraClick(item.id)}
                className={`min-h-[44px] px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30 border border-amber-400/60 ring-2 ring-amber-500/20'
                    : 'bg-white/50 text-slate-700 hover:bg-white/80 border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                }`}
              >
                <span className="text-lg leading-none drop-shadow-sm">{item.emoji}</span>
                <span className="truncate">{item.label}</span>
                {isSelected && (
                  <Check size={14} strokeWidth={3} className="ml-auto shrink-0 opacity-90" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ЗАМЕТКА ПО АППЕТИТУ (ОПЦИОНАЛЬНО) */}
      <div className="pt-1">
        <input
          type="text"
          disabled={isLocked}
          value={notes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="Заметка по аппетиту (напр. «тыкву съели первой, яблоки оставили»)..."
          className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all shadow-inner placeholder:text-slate-400 text-slate-800"
        />
      </div>

      {/* 5. LIGHTBOX FULLSCREEN PREVIEW */}
      {isLightboxOpen && photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
            <img
              src={photoUrl}
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
