import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, X } from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics, ShiftPhoto } from '../../types/shift';
import { createPortal } from 'react-dom';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';

const DEFAULT_ELEPHANTS: { id: string; name: string }[] = [
  { id: 'margo', name: 'Марго' },
  { id: 'odri', name: 'Одри' },
  { id: 'pretty', name: 'Прэтти' }
];

const URINATION_OPTIONS = [
  'Светлая / Прозрачная',
  'Темная / Концентрированная',
  'Мутная / С осадком ⚠️',
  'Бурая / Красноватая ⚠️',
  'Натуживание ⚠️'
];

interface UrinationSectionProps {
  elephants?: Elephant[];
  metrics?: Record<string, ElephantDailyMetrics>;
  onMetricChange?: (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => void;
  isLocked?: boolean;
}

export function UrinationSection({
  elephants,
  metrics,
  onMetricChange,
  isLocked = false
}: UrinationSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<{ elephant: { id: string; name: string }; photo: ShiftPhoto } | null>(null);

  // 1. Separate counter state per elephant (optimistic local state)
  const [localCounts, setLocalCounts] = useState<{ [elephantId: string]: number }>({});
  const [localTraits, setLocalTraits] = useState<string[]>([]);

  // Keep state synced with external metrics if provided
  useEffect(() => {
    if (metrics) {
      setLocalCounts(prev => {
        const next = { ...prev };
        Object.entries(metrics).forEach(([id, m]) => {
          if (m?.urination_count !== undefined) {
            next[id] = m.urination_count;
            if (m.elephant_id) {
              next[m.elephant_id] = m.urination_count;
            }
          }
        });
        return next;
      });
    }
  }, [metrics]);

  const displayElephants = (elephants && elephants.length > 0) ? elephants : DEFAULT_ELEPHANTS;

  // Resolve count for elephant
  const getCount = (elephantId: string): number => {
    if (localCounts[elephantId] !== undefined) {
      return localCounts[elephantId];
    }
    if (metrics?.[elephantId]?.urination_count !== undefined) {
      return metrics[elephantId].urination_count;
    }
    const found = Object.values(metrics || {}).find(m => m?.elephant_id === elephantId);
    if (found?.urination_count !== undefined) {
      return found.urination_count;
    }
    return 0;
  };

  // Total urination count across all 3 elephants
  const totalUrination = displayElephants.reduce((sum, el) => sum + getCount(el.id), 0);

  // Sync traits with metrics
  useEffect(() => {
    const firstElephantId = displayElephants[0]?.id;
    if (firstElephantId && metrics?.[firstElephantId]?.urination_traits) {
      setLocalTraits(metrics[firstElephantId].urination_traits);
    }
  }, [metrics, displayElephants]);

  // Unified traits based on localTraits or first elephant or default
  const activeTraits = localTraits.length > 0
    ? localTraits
    : (metrics && displayElephants[0] && metrics[displayElephants[0].id]?.urination_traits) || ['Светлая / Прозрачная'];

  const handleIncrement = (elephantId: string) => {
    if (isLocked) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    const current = getCount(elephantId);
    const nextVal = current + 1;
    setLocalCounts(prev => ({ ...prev, [elephantId]: nextVal }));
    onMetricChange?.(elephantId, 'urination_count', nextVal);
  };

  const handleDecrement = (elephantId: string) => {
    if (isLocked) return;
    const current = getCount(elephantId);
    if (current <= 0) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    const nextVal = current - 1;
    setLocalCounts(prev => ({ ...prev, [elephantId]: nextVal }));
    onMetricChange?.(elephantId, 'urination_count', nextVal);
  };

  const toggleTrait = (trait: string) => {
    if (isLocked) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    let newTraits = activeTraits.includes(trait)
      ? activeTraits.filter(t => t !== trait)
      : [...activeTraits, trait];

    if (newTraits.length === 0) {
      newTraits = ['Светлая / Прозрачная'];
    }

    setLocalTraits(newTraits);

    // Update for all elephants if onMetricChange is available
    displayElephants.forEach(e => {
      onMetricChange?.(e.id, 'urination_traits', newTraits);
    });
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
          setPendingPhotoUrl(compressed);
          setIsModalOpen(true);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmPhoto = (elephantId: string) => {
    if (!pendingPhotoUrl) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }

    const newPhoto: ShiftPhoto = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      section: 'urine',
      dataUrl: pendingPhotoUrl
    };

    const currentPhotos = metrics?.[elephantId]?.photos || [];
    onMetricChange?.(elephantId, 'photos', [...currentPhotos, newPhoto]);

    setIsModalOpen(false);
    setPendingPhotoUrl(null);
  };

  // Find urine photos across all elephants
  const urinePhotos = displayElephants.flatMap(e => {
    const photos = metrics?.[e.id]?.photos || [];
    return photos.filter(p => p.section === 'urine').map(p => ({ elephant: e, photo: p }));
  });

  const latestPhoto = urinePhotos[urinePhotos.length - 1];

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[28px] p-3.5 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
      {/* Hidden File Input with Camera Capture */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handlePhotoCapture}
      />

      {/* Header with Title, Total Count Badge, and PhotoActionPattern in the top-right corner */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none shrink-0">💧</span>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h2 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
              Мочеиспускание
            </h2>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 border border-slate-200/70 text-slate-700 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Всего:</span>
              <span className="text-xs font-black text-slate-900">{totalUrination}</span>
            </div>
          </div>
        </div>

        {/* Photo Button / Thumbnail (Unified Standard) */}
        <div className="shrink-0">
          <PhotoActionThumbnail
            photoUrl={latestPhoto?.photo.dataUrl}
            isProcessing={isProcessingPhoto}
            isLocked={isLocked}
            title={latestPhoto ? `Фото мочи (${latestPhoto.elephant.name})` : 'Зафиксировать на фото'}
            onCaptureClick={() => fileInputRef.current?.click()}
            onPreviewClick={() => setPreviewModalPhoto(latestPhoto)}
          />
        </div>
      </div>

      {/* Three Vertical Counters Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        {displayElephants.map(elephant => {
          const count = getCount(elephant.id);
          return (
            <div key={elephant.id} className="flex flex-col">
              {/* Column Header: Elephant Name */}
              <div className="font-bold text-xs sm:text-sm text-slate-700 text-center py-1 truncate">
                {elephant.name}
              </div>

              {/* PLUS Button (Top) */}
              <button
                type="button"
                disabled={isLocked}
                onClick={() => handleIncrement(elephant.id)}
                className="h-12 w-full rounded-t-2xl bg-white/80 hover:bg-white active:scale-95 active:bg-sky-100/60 border border-b-0 border-slate-200/80 flex items-center justify-center text-2xl font-bold text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation cursor-pointer select-none shadow-sm"
                aria-label={`Увеличить мочеиспускание для ${elephant.name}`}
              >
                +
              </button>

              {/* Number Indicator (Middle) */}
              <div className="py-2.5 w-full bg-slate-50/70 border-x border-slate-200/80 text-center text-2xl font-black text-slate-900 select-none tabular-nums tracking-tight">
                {count}
              </div>

              {/* MINUS Button (Bottom) */}
              <button
                type="button"
                disabled={isLocked || count <= 0}
                onClick={() => handleDecrement(elephant.id)}
                className="h-10 w-full rounded-b-2xl bg-white/50 hover:bg-white/70 active:scale-95 active:bg-slate-100 border border-t-0 border-slate-200/80 flex items-center justify-center text-xl font-bold text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation cursor-pointer select-none"
                aria-label={`Уменьшить мочеиспускание для ${elephant.name}`}
              >
                -
              </button>
            </div>
          );
        })}
      </div>

      {/* Consistency / Urination Traits Chips */}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Цвет и прозрачность
        </div>
        <div className="flex flex-wrap gap-2">
          {URINATION_OPTIONS.map(trait => {
            const isSelected = activeTraits.includes(trait);
            const isWarning = trait.includes('⚠️') || trait.includes('Темная') || trait.includes('Мутная') || trait.includes('Бурая');
            return (
              <button
                key={trait}
                type="button"
                disabled={isLocked}
                onClick={() => toggleTrait(trait)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 touch-manipulation ${
                  isSelected
                    ? isWarning 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                      : 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                    : 'bg-white/70 text-slate-600 border-slate-200/80 hover:bg-white'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {trait}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal for selecting which elephant the photo belongs to */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-800">Чья моча на фото?</h3>
              <p className="text-xs font-medium text-slate-500">Укажите слониху для сохранения снимка в медкарту</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {displayElephants.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => confirmPhoto(e.id)}
                  className="w-full min-h-[50px] py-3 bg-white/80 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50 text-slate-800 hover:text-blue-800 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {e.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setPendingPhotoUrl(null);
              }}
              className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-2xl font-bold text-xs transition-all cursor-pointer"
            >
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox / Preview Modal for Urine Photo */}
      {previewModalPhoto && createPortal(
        <div className="fixed inset-0 z-[160] flex flex-col bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <div>
                <div className="font-bold text-sm">
                  Фото мочеиспускания ({previewModalPhoto.elephant.name})
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {new Date(previewModalPhoto.photo.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewModalPhoto(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Full Image */}
          <div className="flex-1 w-full p-4 flex items-center justify-center overflow-hidden">
            <img
              src={previewModalPhoto.photo.dataUrl}
              alt={`Мочеиспускание ${previewModalPhoto.elephant.name}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl"
            />
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-3 max-w-lg mx-auto w-full">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                const elephantId = previewModalPhoto.elephant.id;
                const photoId = previewModalPhoto.photo.id;
                const currentPhotos = metrics?.[elephantId]?.photos || [];
                onMetricChange?.(elephantId, 'photos', currentPhotos.filter(p => p.id !== photoId));
                setPreviewModalPhoto(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>Удалить</span>
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                setPreviewModalPhoto(null);
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Camera size={16} />
              <span>Переснять</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
