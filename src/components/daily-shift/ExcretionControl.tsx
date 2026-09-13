import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics, ShiftPhoto } from '../../types/shift';
import { createPortal } from 'react-dom';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';
import {
  SleepCycleSheet,
  formatTotalSleepHours,
  formatLaydownsCount
} from './SleepCycleSheet';

const DEFAULT_ELEPHANTS: { id: string; name: string }[] = [
  { id: 'margo', name: 'Марго' },
  { id: 'odri', name: 'Одри' },
  { id: 'pretty', name: 'Прэтти' }
];

export const STOOL_TRAITS = [
  'Сформирован (норма)',
  'Рассыпчатый / Сухой',
  'Жидкий / Понос ⚠️',
  'Слизь / Непереварен ⚠️'
];

export const URINE_TRAITS = [
  'Прозрачная (норма)',
  'Темная / Плотная',
  'Мутная / Осадок ⚠️',
  'Кровь / Натуживание ⚠️'
];

export const SLEEP_TRAITS = [
  'Спокойно (норма)',
  'Дремали стоя',
  'Беспокойно ⚠️',
  'Тяжело вставали ⚠️'
];

export const formatSleepHours = formatTotalSleepHours;

export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
};

interface ExcretionControlProps {
  elephants?: Elephant[];
  metrics?: Record<string, ElephantDailyMetrics>;
  onMetricChange?: (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => void;
  isLocked?: boolean;
}

export function ExcretionControl({
  elephants,
  metrics,
  onMetricChange,
  isLocked = false
}: ExcretionControlProps) {
  const [activeTab, setActiveTab] = useState<'stool' | 'urine' | 'sleep'>('stool');
  const [isSleepSheetOpen, setIsSleepSheetOpen] = useState(false);
  const [selectedElephantIdForSleep, setSelectedElephantIdForSleep] = useState<string>('');

  const displayElephants = elephants && elephants.length > 0 ? elephants : DEFAULT_ELEPHANTS;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<{ elephant: { id: string; name: string }; photo: ShiftPhoto } | null>(null);

  // Trait states
  const [localStoolTraits, setLocalStoolTraits] = useState<string[]>([]);
  const [localUrineTraits, setLocalUrineTraits] = useState<string[]>([]);
  const [localSleepTraits, setLocalSleepTraits] = useState<string[]>([]);

  useEffect(() => {
    if (metrics && displayElephants.length > 0) {
      const firstElephantId = displayElephants[0].id;
      if (metrics[firstElephantId]) {
        if (metrics[firstElephantId].feces_traits) {
          setLocalStoolTraits(metrics[firstElephantId].feces_traits);
        }
        if (metrics[firstElephantId].urination_traits) {
          setLocalUrineTraits(metrics[firstElephantId].urination_traits);
        }
        const notes = metrics[firstElephantId].notes || '';
        const found = SLEEP_TRAITS.filter(t => notes.includes(t));
        if (found.length > 0) {
          setLocalSleepTraits(found);
        }
      }
    }
  }, [metrics, displayElephants]);

  const activeStoolTraits = localStoolTraits.length > 0 ? localStoolTraits : ['Сформирован (норма)'];
  const activeUrineTraits = localUrineTraits.length > 0
    ? localUrineTraits.map(t => t === 'Светлая / Прозрачная' ? 'Прозрачная (норма)' : t)
    : ['Прозрачная (норма)'];
  const activeSleepTraits = localSleepTraits.length > 0 ? localSleepTraits : ['Спокойно (норма)'];

  const handleHaptic = (ms = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const toggleTrait = (trait: string) => {
    if (isLocked) return;
    handleHaptic(12);
    
    if (activeTab === 'stool') {
      let newTraits = activeStoolTraits.includes(trait)
        ? activeStoolTraits.filter(t => t !== trait)
        : [...activeStoolTraits, trait];
      if (newTraits.length === 0) newTraits = ['Сформирован (норма)'];
      setLocalStoolTraits(newTraits);
      displayElephants.forEach(e => onMetricChange?.(e.id, 'feces_traits', newTraits));
    } else if (activeTab === 'urine') {
      let newTraits = activeUrineTraits.includes(trait)
        ? activeUrineTraits.filter(t => t !== trait)
        : [...activeUrineTraits, trait];
      if (newTraits.length === 0) newTraits = ['Прозрачная (норма)'];
      setLocalUrineTraits(newTraits);
      displayElephants.forEach(e => onMetricChange?.(e.id, 'urination_traits', newTraits));
    } else {
      // sleep mode
      let newTraits: string[];
      if (trait === 'Спокойно (норма)') {
        newTraits = ['Спокойно (норма)'];
      } else {
        if (activeSleepTraits.includes(trait)) {
          newTraits = activeSleepTraits.filter(t => t !== trait);
          if (newTraits.length === 0) {
            newTraits = ['Спокойно (норма)'];
          }
        } else {
          newTraits = activeSleepTraits.filter(t => t !== 'Спокойно (норма)');
          newTraits.push(trait);
        }
      }
      setLocalSleepTraits(newTraits);
      displayElephants.forEach(e => {
        let currentNotes = metrics?.[e.id]?.notes || '';
        SLEEP_TRAITS.forEach(t => {
          currentNotes = currentNotes
            .replace(new RegExp(`\\s*\\[${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), '')
            .replace(new RegExp(`\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
        });
        const appended = newTraits.map(t => `[${t}]`).join(' ');
        const finalNotes = (currentNotes.trim() + (appended ? ` ${appended}` : '')).trim();
        onMetricChange?.(e.id, 'notes', finalNotes);
      });
    }
  };

  const handleIncrement = (elephantId: string) => {
    if (isLocked) return;
    handleHaptic(12);

    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = metrics?.[elephantId]?.[field] || 0;
    onMetricChange?.(elephantId, field, current + 1);
  };

  const handleDecrement = (elephantId: string) => {
    if (isLocked) return;
    handleHaptic(12);

    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = metrics?.[elephantId]?.[field] || 0;
    if (current > 0) {
      onMetricChange?.(elephantId, field, current - 1);
    }
  };

  // Photos
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
    e.target.value = '';
  };

  const handleAssignPhoto = (elephantId: string) => {
    if (!pendingPhotoUrl) return;

    const newPhoto: ShiftPhoto = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      section: activeTab,
      dataUrl: pendingPhotoUrl
    };

    const currentPhotos = metrics?.[elephantId]?.photos || [];
    onMetricChange?.(elephantId, 'photos', [...currentPhotos, newPhoto]);

    setIsModalOpen(false);
    setPendingPhotoUrl(null);
  };

  const allPhotos = displayElephants.flatMap(e => {
    const photos = metrics?.[e.id]?.photos || [];
    return photos.filter(p => p.section === activeTab).map(p => ({ elephant: e, photo: p }));
  });
  const latestPhoto = allPhotos[allPhotos.length - 1];

  const totalCount = displayElephants.reduce((acc, e) => {
    if (activeTab === 'sleep') {
      return acc + (metrics?.[e.id]?.sleep_minutes || 0);
    }
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    return acc + (metrics?.[e.id]?.[field] || 0);
  }, 0);

  const traitsForCurrentTab = activeTab === 'stool'
    ? STOOL_TRAITS
    : activeTab === 'urine'
      ? URINE_TRAITS
      : SLEEP_TRAITS;

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handlePhotoCapture}
        className="hidden"
      />

      {/* 1. Header & Segmented Control */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Segmented Control 3 tabs: Кучи, Лужи, Сон */}
        <div className="grid grid-cols-3 bg-slate-100/80 p-1 rounded-2xl flex-1 max-w-[280px]">
          <button
            type="button"
            onClick={() => setActiveTab('stool')}
            className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
              activeTab === 'stool' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 font-medium hover:text-slate-700'
            }`}
          >
            <span>💩</span>
            <span className="truncate">Кучи</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('urine')}
            className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
              activeTab === 'urine' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 font-medium hover:text-slate-700'
            }`}
          >
            <span>💧</span>
            <span className="truncate">Лужи</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sleep')}
            className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold text-center transition-all select-none cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
              activeTab === 'sleep' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 font-medium hover:text-slate-700'
            }`}
          >
            <span>🌙</span>
            <span className="truncate">Сон</span>
          </button>
        </div>

        {/* Center Total Badge */}
        <div className="text-xs sm:text-sm font-semibold text-slate-500 text-right shrink-0">
          Всего: <span className="font-black text-slate-800">{activeTab === 'sleep' ? formatTotalSleepHours(totalCount) : totalCount}</span> {activeTab === 'stool' ? 'куч' : activeTab === 'urine' ? 'луж' : ''}
        </div>

        {/* Photo Button */}
        <div className="shrink-0">
          <PhotoActionThumbnail
            photoUrl={latestPhoto?.photo.dataUrl}
            isProcessing={isProcessingPhoto}
            isLocked={isLocked}
            title={
              latestPhoto 
                ? `Фото ${activeTab === 'stool' ? 'дефекации' : activeTab === 'urine' ? 'мочи' : 'сна'} (${latestPhoto.elephant.name})`
                : 'Сделать фото'
            }
            onCaptureClick={() => fileInputRef.current?.click()}
            onPreviewClick={() => setPreviewModalPhoto(latestPhoto)}
          />
        </div>
      </div>

      {/* 2. Grid for Elephants (3 columns) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        {displayElephants.map(elephant => {
          const isSleep = activeTab === 'sleep';

          if (isSleep) {
            const sleepMinutes = metrics?.[elephant.id]?.sleep_minutes ?? 0;
            const intervals = metrics?.[elephant.id]?.sleep_intervals || [];
            const laydownsCount = intervals.length;

            return (
              <div key={elephant.id} className="flex flex-col">
                <div className="font-bold text-xs sm:text-sm text-slate-700 text-center py-1 truncate">
                  {elephant.name}
                </div>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setSelectedElephantIdForSleep(elephant.id);
                    setIsSleepSheetOpen(true);
                    handleHaptic(12);
                  }}
                  className="h-[104px] w-full rounded-2xl bg-white/70 hover:bg-white active:scale-95 border border-slate-200 p-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xs group"
                  aria-label={`Интервалы сна для ${elephant.name}`}
                >
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight select-none">
                    {formatTotalSleepHours(sleepMinutes)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 select-none">
                    {formatLaydownsCount(laydownsCount)}
                  </div>
                </button>
              </div>
            );
          }

          const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
          const count = metrics?.[elephant.id]?.[field] || 0;

          return (
            <div key={elephant.id} className="flex flex-col">
              <div className="font-bold text-xs sm:text-sm text-slate-700 text-center py-1 truncate">
                {elephant.name}
              </div>
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleIncrement(elephant.id)}
                  className="h-12 w-full rounded-t-2xl bg-white/70 hover:bg-white active:scale-95 border border-b-0 border-slate-200 text-xl font-bold text-slate-700 flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
                  aria-label={`Увеличить счетчик для ${elephant.name}`}
                >
                  +
                </button>
                <div className="py-2 text-2xl font-black text-slate-900 bg-slate-50/50 border-x border-slate-200 text-center select-none truncate">
                  {count}
                </div>
                <button
                  type="button"
                  disabled={isLocked || count === 0}
                  onClick={() => handleDecrement(elephant.id)}
                  className="h-10 w-full rounded-b-2xl bg-white/40 hover:bg-white/60 active:scale-95 border border-t-0 border-slate-200 text-lg font-bold text-slate-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
                  aria-label={`Уменьшить счетчик для ${elephant.name}`}
                >
                  −
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sleep Mode: [ ⏱ Добавить цикл сна ] Button */}
      {activeTab === 'sleep' && (
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            setSelectedElephantIdForSleep(displayElephants[0]?.id || '');
            setIsSleepSheetOpen(true);
            handleHaptic(12);
          }}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>⏱</span>
          <span>Добавить цикл сна</span>
        </button>
      )}

      {/* 3. Traits Block (Dynamic 2x2 grid) */}
      <div className="pt-2 border-t border-slate-100/50">
        <div className="grid grid-cols-2 gap-2 pt-1">
          {traitsForCurrentTab.map(trait => {
            const currentTraits = activeTab === 'stool'
              ? activeStoolTraits
              : activeTab === 'urine'
                ? activeUrineTraits
                : activeSleepTraits;
            const isSelected = currentTraits.includes(trait);
            const isWarning = trait.includes('⚠️');

            const stateClasses = isSelected
              ? isWarning
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'bg-slate-800 text-white shadow-xs border-transparent'
              : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/70';

            return (
              <button
                key={trait}
                type="button"
                disabled={isLocked}
                onClick={() => toggleTrait(trait)}
                className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center text-center leading-tight active:scale-95 touch-manipulation cursor-pointer ${stateClasses} ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {trait}
              </button>
            );
          })}
        </div>
      </div>

      {/* SleepCycleSheet Modal */}
      <SleepCycleSheet
        isOpen={isSleepSheetOpen}
        onClose={() => setIsSleepSheetOpen(false)}
        elephants={displayElephants}
        activeElephantId={selectedElephantIdForSleep || displayElephants[0]?.id || ''}
        onSelectElephant={(id) => setSelectedElephantIdForSleep(id)}
        metrics={metrics}
        onIntervalsChange={(elephantId, intervals, totalMinutes) => {
          onMetricChange?.(elephantId, 'sleep_intervals', intervals);
          onMetricChange?.(elephantId, 'sleep_minutes', totalMinutes);
        }}
        isLocked={isLocked}
      />

      {/* Photo Modals */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-800">
                Чья это {activeTab === 'stool' ? 'куча' : activeTab === 'urine' ? 'лужа' : 'зона сна'}?
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Выберите слона для привязки фото
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {displayElephants.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleAssignPhoto(e.id)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl">{e.id === 'margo' ? '👑' : e.id === 'odri' ? '🎀' : '🌸'}</span>
                  <span className="font-bold text-sm text-slate-700">{e.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setPendingPhotoUrl(null);
              }}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95 cursor-pointer"
            >
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}

      {previewModalPhoto && createPortal(
        <div className="fixed inset-0 z-[160] flex flex-col bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white max-w-lg mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeTab === 'stool' ? '💩' : activeTab === 'urine' ? '💧' : '🌙'}</span>
              <div>
                <div className="font-bold text-sm">
                  Фото ({previewModalPhoto.elephant.name})
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {new Date(previewModalPhoto.photo.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewModalPhoto(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 w-full p-4 flex items-center justify-center overflow-hidden">
            <img
              src={previewModalPhoto.photo.dataUrl}
              alt="Фото"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl"
            />
          </div>

          <div className="p-4 sm:p-6 bg-slate-900/95 border-t border-white/10 flex items-center justify-between gap-4 max-w-lg mx-auto w-full">
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
              Удалить фото
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
