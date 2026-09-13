import React, { useState, useRef } from 'react';
import { Check, RotateCcw, X, Loader2, Camera, Trash2 } from 'lucide-react';
import { DailyRationData } from './FeedControl';
import { RecipeBottomSheet } from './RecipeBottomSheet';
import { SaladTechModal } from './SaladTechModal';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';

export interface DietSectionProps {
  ration: DailyRationData;
  isLocked?: boolean;
  dutyKeeperName?: string;
  onChange?: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
  onPorridgeFieldChange?: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
  onPhotoAdd?: (photo: { id: string; timestamp: string; section: string; dataUrl: string }) => void;
}

export function DietSection({
  ration,
  isLocked = false,
  dutyKeeperName,
  onChange,
  onPorridgeFieldChange,
  onPhotoAdd
}: DietSectionProps) {
  const updateRation = (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => {
    if (onChange) {
      onChange(field, value);
    } else if (onPorridgeFieldChange) {
      onPorridgeFieldChange(field, value);
    }
  };

  // --- Refs ---
  const morningFileInputRef = useRef<HTMLInputElement>(null);
  const eveningFileInputRef = useRef<HTMLInputElement>(null);

  // --- Modals State ---
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isSaladTechOpen, setIsSaladTechOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    type: 'morning' | 'evening';
  } | null>(null);

  // --- Loading States ---
  const [isProcessingMorningPhoto, setIsProcessingMorningPhoto] = useState(false);
  const [isProcessingEveningPhoto, setIsProcessingEveningPhoto] = useState(false);

  // --- Haptic Feedback Helper ---
  const handleHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // --- Image Compressor ---
  const processImageFile = (
    file: File,
    onSuccess: (dataUrl: string) => void,
    setLoading: (val: boolean) => void
  ) => {
    setLoading(true);
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
          onSuccess(compressed);
        }
        setLoading(false);
      };
      img.onerror = () => setLoading(false);
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 1. УТРЕННЯЯ КАША (Завтрак)
  // ==========================================
  const isMorningIssued = Boolean(ration.morning_porridge && ration.morning_porridge !== 'none');
  const morningConsumption = isMorningIssued ? ration.morning_porridge : null;
  const morningPhotoUrl = ration.morning_porridge_photo || null;
  const morningTime = ration.morning_porridge_time || null;
  const morningKeeper = ration.morning_porridge_keeper || dutyKeeperName || null;

  const handleMorningFeedClick = () => {
    if (isLocked || isProcessingMorningPhoto) return;
    handleHaptic(15);
    morningFileInputRef.current?.click();
  };

  const handleMorningPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(
      file,
      (compressed) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const keeper = morningKeeper || 'Дежурный кипер';
        handleHaptic(25);

        updateRation({
          morning_porridge: 'all',
          morning_porridge_photo: compressed,
          morning_porridge_time: timeStr,
          morning_porridge_keeper: keeper
        });

        onPhotoAdd?.({
          id: crypto.randomUUID(),
          timestamp: now.toISOString(),
          section: 'breakfast',
          dataUrl: compressed
        });
      },
      setIsProcessingMorningPhoto
    );

    e.target.value = '';
  };

  const handleMorningReset = () => {
    if (isLocked) return;
    handleHaptic(10);
    updateRation({
      morning_porridge: 'none',
      morning_porridge_photo: null,
      morning_porridge_time: null,
      morning_porridge_keeper: null
    });
  };

  const setMorningConsumption = (val: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    handleHaptic(15);
    updateRation('morning_porridge', val);
  };

  const getMorningConsumptionLabel = () => {
    if (morningConsumption === 'partial') return 'съедена частично';
    if (morningConsumption === 'refused') return 'отказ от каши';
    return 'съедена 100%';
  };

  // ==========================================
  // 2. УЖИН (Вечерний салат)
  // ==========================================
  const isEveningIssued = Boolean(ration.salad_base_included);
  const eveningConsumption = ration.salad_appetite || null;
  const eveningPhotoUrl = ration.salad_photo_url || null;
  const eveningTime = ration.salad_base_time || null;

  const handleEveningFeedClick = () => {
    if (isLocked || isProcessingEveningPhoto) return;
    handleHaptic(15);
    eveningFileInputRef.current?.click();
  };

  const handleEveningPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(
      file,
      (compressed) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        handleHaptic(25);

        updateRation({
          salad_base_included: true,
          salad_base_time: timeStr,
          salad_photo_url: compressed,
          salad_appetite: ration.salad_appetite || 'all'
        });

        onPhotoAdd?.({
          id: crypto.randomUUID(),
          timestamp: now.toISOString(),
          section: 'dinner',
          dataUrl: compressed
        });
      },
      setIsProcessingEveningPhoto
    );

    e.target.value = '';
  };

  const handleEveningReset = () => {
    if (isLocked) return;
    handleHaptic(10);
    updateRation({
      salad_base_included: false,
      salad_base_time: null,
      salad_appetite: null,
      salad_photo_url: null
    });
  };

  const setEveningConsumption = (val: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    handleHaptic(15);
    updateRation('salad_appetite', val);
  };

  const getEveningConsumptionLabel = () => {
    if (eveningConsumption === 'partial') return 'съедено частично';
    if (eveningConsumption === 'refused') return 'отказ от ужина';
    return 'съедено 100%';
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs for Cameras */}
      <input
        ref={morningFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleMorningPhotoCapture}
      />
      <input
        ref={eveningFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleEveningPhotoCapture}
      />

      {/* ======================================================== */}
      {/* КАРТОЧКА 1: УТРЕННЯЯ КАША                                 */}
      {/* ======================================================== */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 shadow-xs space-y-3">
        {/* Верхняя строка (flex items-center justify-between) */}
        <div className="flex items-center justify-between gap-2">
          {/* Слева: круглая иконка с миской + блок текста */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0 shadow-inner">
              🥣
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">
                Утренняя каша (08:30)
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                Запарка овса и отрубей
              </p>
            </div>
          </div>

          {/* Справа: кнопка [ Рецепт ℹ️ ] */}
          <button
            type="button"
            onClick={() => setIsRecipeOpen(true)}
            className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-xs font-semibold text-slate-600 active:scale-95 transition-all flex items-center gap-1 select-none cursor-pointer shrink-0"
          >
            <span>Рецепт</span>
            <span className="text-xs leading-none">ℹ️</span>
          </button>
        </div>

        {/* Нижняя строка (w-full mt-3) */}
        <div className="w-full">
          {!isMorningIssued ? (
            /* Если не выдано: кнопка [ 🥣 Кормить ] */
            <button
              type="button"
              onClick={handleMorningFeedClick}
              disabled={isLocked || isProcessingMorningPhoto}
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isProcessingMorningPhoto ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white/70" />
                  <span>Обработка фото...</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🥣</span>
                  <span>Кормить</span>
                </>
              )}
            </button>
          ) : (
            /* Если выдано: зеленая статусная плашка [ ✓ Выдано (08:30) ] с миниатюрой фото справа */
            <div className="space-y-2.5">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-sm text-emerald-950 truncate leading-tight">
                      ✓ Выдано ({morningTime || '08:30'})
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                      {morningKeeper ? `${morningKeeper} • ` : ''}
                      {getMorningConsumptionLabel()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PhotoActionThumbnail
                    photoUrl={morningPhotoUrl}
                    isProcessing={isProcessingMorningPhoto}
                    isLocked={isLocked}
                    title="Фото раздачи каши"
                    onCaptureClick={handleMorningFeedClick}
                    onPreviewClick={() =>
                      setPreviewPhoto({
                        url: morningPhotoUrl!,
                        title: 'Фото раздачи утренней каши',
                        type: 'morning'
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={handleMorningReset}
                    disabled={isLocked}
                    className="w-10 h-10 rounded-2xl bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100"
                    title="Сбросить статус"
                    aria-label="Сбросить статус"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* Выбор съеденного объема */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMorningConsumption('all')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    morningConsumption === 'all'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  100% съедено
                </button>
                <button
                  type="button"
                  onClick={() => setMorningConsumption('partial')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    morningConsumption === 'partial'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Остаток
                </button>
                <button
                  type="button"
                  onClick={() => setMorningConsumption('refused')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    morningConsumption === 'refused'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Отказ ⚠️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* КАРТОЧКА 2: УЖИН                                         */}
      {/* ======================================================== */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 shadow-xs space-y-3">
        {/* Верхняя строка (flex items-center justify-between) */}
        <div className="flex items-center justify-between gap-2">
          {/* Слева: круглая иконка с салатом + блок текста */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shrink-0 shadow-inner">
              🥗
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">
                Ужин (19:00)
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                Таз ~120 л
              </p>
            </div>
          </div>

          {/* Справа: кнопка [ Рецепт ℹ️ ] */}
          <button
            type="button"
            onClick={() => setIsSaladTechOpen(true)}
            className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-xs font-semibold text-slate-600 active:scale-95 transition-all flex items-center gap-1 select-none cursor-pointer shrink-0"
          >
            <span>Рецепт</span>
            <span className="text-xs leading-none">ℹ️</span>
          </button>
        </div>

        {/* Нижняя строка (w-full mt-3) */}
        <div className="w-full">
          {!isEveningIssued ? (
            /* Кнопка действия: [ 🥗 Кормить ] (по клику открывает камеру/фото таза) */
            <button
              type="button"
              onClick={handleEveningFeedClick}
              disabled={isLocked || isProcessingEveningPhoto}
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isProcessingEveningPhoto ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white/70" />
                  <span>Обработка фото...</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🥗</span>
                  <span>Кормить</span>
                </>
              )}
            </button>
          ) : (
            /* Зеленая плашка [ ✓ Выдано (19:00) ] с превью сделанного кадра */
            <div className="space-y-2.5">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-sm text-emerald-950 truncate leading-tight">
                      ✓ Выдано ({eveningTime || '19:00'})
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                      {getEveningConsumptionLabel()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PhotoActionThumbnail
                    photoUrl={eveningPhotoUrl}
                    isProcessing={isProcessingEveningPhoto}
                    isLocked={isLocked}
                    title="Фото таза с салатом"
                    onCaptureClick={handleEveningFeedClick}
                    onPreviewClick={() =>
                      setPreviewPhoto({
                        url: eveningPhotoUrl!,
                        title: 'Фото таза с вечерним салатом',
                        type: 'evening'
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={handleEveningReset}
                    disabled={isLocked}
                    className="w-10 h-10 rounded-2xl bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100"
                    title="Сбросить статус"
                    aria-label="Сбросить статус"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* Выбор съеденного объема */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEveningConsumption('all')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    eveningConsumption === 'all'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  100% съедено
                </button>
                <button
                  type="button"
                  onClick={() => setEveningConsumption('partial')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    eveningConsumption === 'partial'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Остаток
                </button>
                <button
                  type="button"
                  onClick={() => setEveningConsumption('refused')}
                  disabled={isLocked}
                  className={`flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${
                    eveningConsumption === 'refused'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                      : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Отказ ⚠️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно технологической карты каши */}
      <RecipeBottomSheet isOpen={isRecipeOpen} onClose={() => setIsRecipeOpen(false)} />

      {/* Модальное окно регламента салата */}
      <SaladTechModal isOpen={isSaladTechOpen} onClose={() => setIsSaladTechOpen(false)} />

      {/* Полноэкранный просмотр фото */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="flex-1 w-full h-full p-4 flex flex-col items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {previewPhoto.type === 'morning' ? '🥣' : '🥗'}
                </span>
                <span className="text-sm font-bold truncate">{previewPhoto.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Image */}
            <div className="relative max-w-lg w-full flex items-center justify-center max-h-[70vh]">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl drop-shadow-2xl"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 max-w-lg w-full flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-md transition active:scale-95 text-xs select-none"
              >
                Закрыть
              </button>
              {!isLocked && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const type = previewPhoto.type;
                      setPreviewPhoto(null);
                      if (type === 'morning') {
                        handleMorningFeedClick();
                      } else {
                        handleEveningFeedClick();
                      }
                    }}
                    className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-xl font-bold backdrop-blur-md transition active:scale-95 text-xs flex items-center justify-center gap-1.5 select-none"
                  >
                    <Camera size={14} />
                    <span>Переснять</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (previewPhoto.type === 'morning') {
                        updateRation('morning_porridge_photo', null);
                      } else {
                        updateRation('salad_photo_url', null);
                      }
                      setPreviewPhoto(null);
                    }}
                    className="py-3 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl font-bold backdrop-blur-md transition active:scale-95 text-xs flex items-center justify-center gap-1.5 select-none"
                    title="Удалить фото"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
