import React, { useState, useRef } from 'react';
import { Check, Camera, RotateCcw, X, Loader2 } from 'lucide-react';
import { DailyRationData } from './FeedControl';
import { RecipeBottomSheet } from './RecipeBottomSheet';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';

export interface BreakfastSectionProps {
  ration: DailyRationData;
  isLocked?: boolean;
  dutyKeeperName?: string;
  onChange: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
  onPhotoAdd?: (photo: { id: string; timestamp: string; section: string; dataUrl: string }) => void;
}

export function BreakfastSection({
  ration,
  isLocked = false,
  dutyKeeperName,
  onChange,
  onPhotoAdd
}: BreakfastSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const isIssued = Boolean(ration.morning_porridge && ration.morning_porridge !== 'none');
  const consumption = isIssued ? ration.morning_porridge : null;
  const photoUrl = ration.morning_porridge_photo || null;
  const issueTime = ration.morning_porridge_time || null;
  const keeperName = ration.morning_porridge_keeper || dutyKeeperName || null;

  const handleHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Trigger camera / file picker
  const handleFeedClick = () => {
    if (isLocked || isProcessingPhoto) return;
    handleHaptic(15);
    fileInputRef.current?.click();
  };

  // Compress & save photo proof, then mark issued
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

          const now = new Date();
          const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const keeper = keeperName || 'Дежурный кипер';

          handleHaptic(25);

          // Update ration atomically
          onChange({
            morning_porridge: 'all',
            morning_porridge_photo: compressed,
            morning_porridge_time: timeStr,
            morning_porridge_keeper: keeper
          });

          // Also trigger general photo callback if passed
          onPhotoAdd?.({
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            section: 'breakfast',
            dataUrl: compressed
          });
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

    // Reset input so re-selection fires onChange
    e.target.value = '';
  };

  const handleReset = () => {
    if (isLocked) return;
    handleHaptic(10);
    onChange({
      morning_porridge: 'none',
      morning_porridge_photo: null,
      morning_porridge_time: null,
      morning_porridge_keeper: null
    });
  };

  const setConsumption = (val: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    handleHaptic(15);
    onChange('morning_porridge', val);
  };

  const getConsumptionLabel = () => {
    if (consumption === 'partial') return 'съедена частично';
    if (consumption === 'refused') return 'отказ от каши';
    return 'съедена 100%';
  };

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[28px] p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
      {/* Hidden File Input with Camera Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCapture}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shadow-inner shrink-0">
            🥣
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                Утренняя каша (08:30)
              </h2>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Запарка овса и отрубей
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRecipeOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/60 text-slate-600 active:scale-95 transition-all text-xs font-semibold select-none cursor-pointer"
        >
          <span>Рецепт</span>
          <span className="text-sm leading-none">ℹ️</span>
        </button>
      </div>

      {/* Main Action or Completed Status */}
      <div>
        {!isIssued ? (
          <button
            type="button"
            onClick={handleFeedClick}
            disabled={isLocked || isProcessingPhoto}
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-slate-900/10 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation select-none cursor-pointer"
          >
            {isProcessingPhoto ? (
              <>
                <Loader2 size={18} className="animate-spin text-white/70" />
                <span>Обработка фото...</span>
              </>
            ) : (
              <>
                <span className="text-lg leading-none">🥣</span>
                <span>Кормить</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Status Panel with Left Info & Right Photo Preview */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
              {/* Left Side: Checkmark, Status & Timestamp */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-950 truncate leading-tight">
                    ✓ Выдана ({getConsumptionLabel()})
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                    {issueTime ? `в ${issueTime}` : 'отмечено'}
                    {keeperName ? ` • ${keeperName}` : ''}
                  </div>
                </div>
              </div>

              {/* Right Side: Photo Action & Reset Option */}
              <div className="flex items-center gap-2 shrink-0">
                <PhotoActionThumbnail
                  photoUrl={photoUrl}
                  isProcessing={isProcessingPhoto}
                  isLocked={isLocked}
                  title="Фото раздачи каши"
                  onCaptureClick={handleFeedClick}
                  onPreviewClick={() => setIsPreviewModalOpen(true)}
                />

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLocked}
                  className="w-11 h-11 rounded-2xl bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Сбросить статус"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Consumption Adjustment Chips */}
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setConsumption('all')}
                disabled={isLocked}
                className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer ${
                  consumption === 'all'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                100% съедено
              </button>
              <button
                type="button"
                onClick={() => setConsumption('partial')}
                disabled={isLocked}
                className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer ${
                  consumption === 'partial'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                Остаток
              </button>
              <button
                type="button"
                onClick={() => setConsumption('refused')}
                disabled={isLocked}
                className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 select-none cursor-pointer ${
                  consumption === 'refused'
                    ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                Отказ ⚠️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Bottom Sheet */}
      <RecipeBottomSheet isOpen={isRecipeOpen} onClose={() => setIsRecipeOpen(false)} />

      {/* Full Photo Preview Modal */}
      {isPreviewModalOpen && photoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-950 border border-white/20 rounded-[28px] overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-base">🥣</span>
                <span className="text-xs sm:text-sm font-bold">Фото раздачи утренней каши</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[65vh]">
              <img
                src={photoUrl}
                alt="Раздача каши"
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[65vh] object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-white/60">
                {issueTime ? `Время: ${issueTime}` : ''}
                {keeperName ? ` • ${keeperName}` : ''}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  handleFeedClick();
                }}
                disabled={isLocked}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Camera size={14} />
                <span>Переснять</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
