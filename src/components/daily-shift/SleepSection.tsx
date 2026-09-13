import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, X, RotateCcw } from 'lucide-react';
import { ElephantDailyMetrics, SleepInterval, ShiftPhoto } from '../../types/shift';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';

export interface SleepPhase {
  id: string;
  minutes: number;
  start?: string;
  end?: string;
}

export interface SleepSectionProps {
  phases?: SleepPhase[];
  intervals?: SleepInterval[];
  metrics?: ElephantDailyMetrics;
  isLocked?: boolean;
  onPhasesChange?: (phases: SleepPhase[]) => void;
  onIntervalsChange?: (intervals: SleepInterval[]) => void;
  onMetricChange?: (field: string, value: any) => void;
  photos?: ShiftPhoto[];
  onAddPhoto?: (photo: ShiftPhoto) => void;
  onRemovePhoto?: (id: string) => void;
  totalElephantPhotos?: number;
  photoUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
}

const PRESET_BUTTONS = [
  { label: '+15 мин', minutes: 15 },
  { label: '+30 мин', minutes: 30 },
  { label: '+45 мин', minutes: 45 },
  { label: '+1 час', minutes: 60 },
];

const SLEEP_POSTURES = [
  'Левый бок',
  'Правый бок',
  'Без судорог (норма)',
];

export const calculateIntervalMinutes = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let startMins = (h1 || 0) * 60 + (m1 || 0);
  let endMins = (h2 || 0) * 60 + (m2 || 0);
  if (endMins < startMins) {
    endMins += 24 * 60; // Over midnight
  }
  return endMins - startMins;
};

export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
};

export const formatChipDuration = (minutes: number): string => {
  if (minutes === 60) return '1 ч';
  if (minutes === 90) return '1.5 ч';
  if (minutes === 120) return '2 ч';
  if (minutes > 60 && minutes % 60 === 30) return `${(minutes / 60).toFixed(1)} ч`;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ч`;
  return formatDuration(minutes);
};

export function SleepSection({
  phases: propPhases,
  intervals: propIntervals,
  metrics,
  isLocked = false,
  onPhasesChange,
  onIntervalsChange,
  onMetricChange,
  photos,
  onAddPhoto,
  onRemovePhoto,
  photoUrl: propPhotoUrl,
  onPhotoChange,
}: SleepSectionProps) {
  const [localPhases, setLocalPhases] = useState<SleepPhase[]>([]);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse selected postures from notes (if any exist) or maintain in local state
  const [selectedPostures, setSelectedPostures] = useState<string[]>([]);

  useEffect(() => {
    if (metrics?.notes) {
      const active = SLEEP_POSTURES.filter((p) => metrics.notes?.includes(`[${p}]`));
      if (active.length > 0) {
        setSelectedPostures(active);
      }
    }
  }, []);

  const handleHaptic = (ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore haptic failure
      }
    }
  };

  const activeIntervals: SleepInterval[] =
    propIntervals !== undefined
      ? propIntervals
      : metrics?.sleep_intervals !== undefined
      ? metrics.sleep_intervals
      : [];

  const currentPhases: SleepPhase[] = (() => {
    if (propPhases !== undefined) return propPhases;
    if (activeIntervals.length > 0) {
      return activeIntervals.map((int) => ({
        id: int.id,
        minutes: calculateIntervalMinutes(int.start, int.end),
        start: int.start,
        end: int.end,
      }));
    }
    return localPhases;
  })();

  const totalMinutes = currentPhases.reduce((acc, p) => acc + (p.minutes || 0), 0);
  const sleepCount = currentPhases.length;
  const currentPhotoUrl = propPhotoUrl !== undefined ? propPhotoUrl : localPhotoUrl;

  const sleepPhotos = photos?.filter((p) => p.section === 'sleep') || [];
  const latestSleepPhoto = sleepPhotos[sleepPhotos.length - 1];
  const activePhotoUrl = latestSleepPhoto?.dataUrl || currentPhotoUrl;

  const handlePostureToggle = (posture: string) => {
    if (isLocked) return;
    handleHaptic(10);
    
    let newPostures = [...selectedPostures];
    if (newPostures.includes(posture)) {
      newPostures = newPostures.filter((p) => p !== posture);
    } else {
      newPostures.push(posture);
    }
    setSelectedPostures(newPostures);

    if (onMetricChange) {
      let currentNotes = metrics?.notes || '';
      
      // Remove exactly the formatted posture strings
      SLEEP_POSTURES.forEach((p) => {
        currentNotes = currentNotes.replace(new RegExp(`\\s*\\[${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), '');
      });
      
      const appended = newPostures.map((p) => ` [${p}]`).join('');
      onMetricChange('notes', (currentNotes + appended).trim());
    }
  };

  const handleAddPreset = (minutes: number) => {
    if (isLocked) return;
    handleHaptic(15);

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const endStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newPhase: SleepPhase = {
      id: newId,
      minutes,
      start: '00:00',
      end: endStr,
    };

    if (onPhasesChange) {
      onPhasesChange([...currentPhases, newPhase]);
    } else if (onIntervalsChange) {
      const newInterval: SleepInterval = {
        id: newId,
        start: '00:00',
        end: endStr,
      };
      onIntervalsChange([...activeIntervals, newInterval]);
    } else if (onMetricChange) {
      const newInterval: SleepInterval = {
        id: newId,
        start: '00:00',
        end: endStr,
      };
      const updatedIntervals = [...activeIntervals, newInterval];
      onMetricChange('sleep_intervals', updatedIntervals);
      
      const totalM = updatedIntervals.reduce(
        (acc, item) => acc + calculateIntervalMinutes(item.start, item.end),
        0
      );
      onMetricChange('total_sleep_minutes', totalM);
      onMetricChange('sleep_episodes_count', updatedIntervals.length);
    } else {
      setLocalPhases((prev) => [...prev, newPhase]);
    }
  };

  const handleRemovePhase = (id: string) => {
    if (isLocked) return;
    handleHaptic(10);

    if (onPhasesChange) {
      onPhasesChange(currentPhases.filter((p) => p.id !== id));
    } else if (onIntervalsChange) {
      onIntervalsChange(activeIntervals.filter((int) => int.id !== id));
    } else if (onMetricChange) {
      const updatedIntervals = activeIntervals.filter((int) => int.id !== id);
      onMetricChange('sleep_intervals', updatedIntervals);
      const totalM = updatedIntervals.reduce(
        (acc, item) => acc + calculateIntervalMinutes(item.start, item.end),
        0
      );
      onMetricChange('total_sleep_minutes', totalM);
      onMetricChange('sleep_episodes_count', updatedIntervals.length);
    } else {
      setLocalPhases((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleUndoLastPhase = () => {
    if (isLocked || currentPhases.length === 0) return;
    handleHaptic(10);
    const lastPhase = currentPhases[currentPhases.length - 1];
    handleRemovePhase(lastPhase.id);
  };

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
          if (onPhotoChange) onPhotoChange(compressed);
          setLocalPhotoUrl(compressed);
          if (onAddPhoto) {
            onAddPhoto({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              section: 'sleep',
              dataUrl: compressed
            });
          }
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

  const handleRemovePhotoUrl = () => {
    handleHaptic(15);
    if (latestSleepPhoto && onRemovePhoto) {
      onRemovePhoto(latestSleepPhoto.id);
    }
    if (onPhotoChange) onPhotoChange(null);
    setLocalPhotoUrl(null);
    setIsLightboxOpen(false);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[28px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. HEADER & MAIN COUNTER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🌙
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base leading-tight">Сон ночью</h2>
            <div className="text-sm font-semibold text-slate-500 mt-0.5 tracking-tight flex items-center gap-1.5">
              <span>Всего:</span>
              <span className="font-black text-indigo-950 text-base">{formatDuration(totalMinutes)}</span>
              <span className="text-slate-400">•</span>
              <span>{sleepCount} {sleepCount === 1 ? 'укладка' : (sleepCount >= 2 && sleepCount <= 4) ? 'укладки' : 'укладок'}</span>
            </div>
          </div>
        </div>

        {/* PHOTO TRIGGER (Unified PhotoActionThumbnail standard w-11 h-11) */}
        <div className="shrink-0">
          <PhotoActionThumbnail
            photoUrl={activePhotoUrl}
            isProcessing={isProcessingPhoto}
            isLocked={isLocked}
            title={activePhotoUrl ? 'Фото ночного сна' : 'Сделать фото места сна'}
            onCaptureClick={() => fileInputRef.current?.click()}
            onPreviewClick={() => setIsLightboxOpen(true)}
          />
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

      {/* 2. POSTURE SELECTOR CHIPS */}
      <div className="flex flex-wrap gap-2">
        {SLEEP_POSTURES.map((posture) => (
          <button
            key={posture}
            type="button"
            disabled={isLocked}
            onClick={() => handlePostureToggle(posture)}
            className={`h-9 px-3.5 rounded-2xl text-xs font-bold transition-all border select-none cursor-pointer flex-shrink-0 ${
              selectedPostures.includes(posture)
                ? 'bg-slate-700 border-slate-700 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {posture}
          </button>
        ))}
      </div>

      {/* 3. QUICK ADD BUTTONS */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap gap-2 items-center">
          {PRESET_BUTTONS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={isLocked}
              onClick={() => handleAddPreset(preset.minutes)}
              className="h-9 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 font-bold text-xs border border-slate-200/60 flex items-center justify-center shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
          {!isLocked && currentPhases.length > 0 && (
            <button
              type="button"
              onClick={handleUndoLastPhase}
              className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 active:scale-95 transition-all border border-slate-200/60 hover:border-rose-200 flex items-center justify-center shadow-xs cursor-pointer ml-auto sm:ml-0"
              title="Отменить последнее добавление"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* 4. COMPACT TAPE OF RECORDED PHASES */}
      {currentPhases.length > 0 && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2 items-center">
            {currentPhases.map((phase) => (
              <div
                key={phase.id}
                className="group flex items-center gap-1.5 px-3 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-bold shadow-xs animate-in zoom-in-95 duration-150"
              >
                <span>{formatChipDuration(phase.minutes)}</span>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(phase.id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors -mr-1 cursor-pointer"
                    title="Удалить фазу"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LIGHTBOX PREVIEW */}
      {isLightboxOpen && activePhotoUrl && (
        <div className="fixed inset-0 z-[160] flex flex-col bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white max-w-lg mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌙</span>
              <span className="font-bold text-sm">Фото ночного сна</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative overflow-hidden">
            <img
              src={activePhotoUrl}
              alt="Фото ночного сна"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          <div className="p-4 sm:p-6 bg-slate-900/95 border-t border-white/10 flex items-center justify-between gap-4 max-w-lg mx-auto w-full">
            <button
              type="button"
              disabled={isLocked}
              onClick={handleRemovePhotoUrl}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>Удалить фото</span>
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                setIsLightboxOpen(false);
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Camera size={16} />
              <span>Переснять</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
