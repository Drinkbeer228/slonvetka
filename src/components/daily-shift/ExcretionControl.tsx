import React, { useRef, useState, useEffect } from 'react';
import { Trash2, X, Moon, Waves, Leaf, Clock } from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics, ShiftPhoto, clampCount } from '../../types/shift';
import { createPortal } from 'react-dom';
import { useCooldown } from '../../hooks/useCooldown';
import { PhotoActionThumbnail } from './PhotoActionThumbnail';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

const DEFAULT_ELEPHANTS: { id: string; name: string }[] = [
  { id: 'margo',  name: 'Марго'  },
  { id: 'odri',   name: 'Одри'   },
  { id: 'pretty', name: 'Прэтти' },
];

export const STOOL_TRAITS = [
  'Сформирован (норма)',
  'Рассыпчатый / Сухой',
  'Жидкий / Понос ⚠️',
  'Слизь / Непереварен ⚠️',
];

export const URINE_TRAITS = [
  'Прозрачная (норма)',
  'Темная / Плотная',
  'Мутная / Осадок ⚠️',
  'Кровь / Натуживание ⚠️',
];

export const SLEEP_TRAITS = [
  'Спокойно (норма)',
  'Дремали стоя',
  'Беспокойно ⚠️',
  'Тяжело вставали ⚠️',
];

export const formatTotalSleepHours = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0 ч';
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} ч`;
  return `${parseFloat(hours.toFixed(1))} ч`;
};

export const formatLaydownsCount = (count: number): string => {
  if (count === 1) return '1 раз';
  if (count >= 2 && count <= 4) return `${count} раза`;
  return `${count} раз`;
};

export const formatSleepHours = formatTotalSleepHours;

export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0 мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
};

const ELEPHANT_EMOJI: Record<string, string> = {
  margo:  '🐘',
  odri:   '🐘',
  pretty: '🐘',
};

type Tab = 'stool' | 'urine' | 'sleep';

interface TabConfig {
  id: Tab;
  emoji: string;
  label: string;
  icon: React.FC<{ size: number; strokeWidth?: number; className?: string }>;
  accentColor: string;
  headerBg: string;
}

const TABS: TabConfig[] = [
  {
    id: 'stool',
    emoji: '💩',
    label: 'Кучи',
    icon: Leaf,
    accentColor: 'from-amber-400 to-orange-500',
    headerBg: 'from-amber-50 to-orange-50',
  },
  {
    id: 'urine',
    emoji: '💧',
    label: 'Лужи',
    icon: Waves,
    accentColor: 'from-sky-400 to-blue-500',
    headerBg: 'from-sky-50 to-blue-50',
  },
  {
    id: 'sleep',
    emoji: '🌙',
    label: 'Сон',
    icon: Moon,
    accentColor: 'from-violet-400 to-indigo-500',
    headerBg: 'from-violet-50 to-indigo-50',
  },
];

interface ExcretionControlProps {
  elephants?: Elephant[];
  metrics?: Record<string, ElephantDailyMetrics>;
  onMetricChange?: (elephantId: string, field: keyof ElephantDailyMetrics, value: unknown) => void;
  isLocked?: boolean;
  onAddEvent?: (title: string, icon: string, undoPayload: any) => void;
}

export function ExcretionControl({
  elephants,
  metrics,
  onMetricChange,
  isLocked = false,
  onAddEvent,
}: ExcretionControlProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stool');

  const displayElephants = elephants && elephants.length > 0 ? elephants : DEFAULT_ELEPHANTS;

  // Активный слон (для контекстной подсветки и явного выбора)
  const [activeElephantId, setActiveElephantId] = useState<string>(displayElephants[0]?.id || 'margo');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [isPhotoAttribOpen, setIsPhotoAttribOpen] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<{
    elephant: { id: string; name: string };
    photo: ShiftPhoto;
  } | null>(null);

  // Текущие выбранные чипсы
  // По умолчанию: 'Сформирован (норма)'
  const [selectedStoolTrait, setSelectedStoolTrait] = useState<string>('Сформирован (норма)');
  const [selectedUrineTrait, setSelectedUrineTrait] = useState<string>('Прозрачная (норма)');
  const [selectedSleepTrait, setSelectedSleepTrait] = useState<string>('Спокойно (норма)');

  const currentTab = TABS.find(t => t.id === activeTab)!;

  // Обновляем activeElephantId, если список слонов изменился
  useEffect(() => {
    if (displayElephants.length > 0 && !displayElephants.some(e => e.id === activeElephantId)) {
      setActiveElephantId(displayElephants[0].id);
    }
  }, [displayElephants, activeElephantId]);

  const handleHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Fallback for unsupported devices
      }
    }
  };

  const handleSelectTrait = (trait: string) => {
    if (isLocked) return;
    handleHaptic(12);

    if (activeTab === 'stool') {
      setSelectedStoolTrait(trait);
    } else if (activeTab === 'urine') {
      setSelectedUrineTrait(trait);
    } else {
      setSelectedSleepTrait(trait);
    }
  };

  const cdMargoPoop = useCooldown('margo_poop', 3);
  const cdOdriPoop = useCooldown('odri_poop', 3);
  const cdPrettyPoop = useCooldown('pretty_poop', 3);
  const cdMargoUrine = useCooldown('margo_urine', 3);
  const cdOdriUrine = useCooldown('odri_urine', 3);
  const cdPrettyUrine = useCooldown('pretty_urine', 3);
  const cdMargoSleep = useCooldown('margo_sleep', 3);
  const cdOdriSleep = useCooldown('odri_sleep', 3);
  const cdPrettySleep = useCooldown('pretty_sleep', 3);

  const getCooldownHook = (elephantId: string, tab: string) => {
    if (elephantId === 'margo' && tab === 'stool') return cdMargoPoop;
    if (elephantId === 'odri' && tab === 'stool') return cdOdriPoop;
    if (elephantId === 'pretty' && tab === 'stool') return cdPrettyPoop;
    if (elephantId === 'margo' && tab === 'urine') return cdMargoUrine;
    if (elephantId === 'odri' && tab === 'urine') return cdOdriUrine;
    if (elephantId === 'pretty' && tab === 'urine') return cdPrettyUrine;
    if (elephantId === 'margo' && tab === 'sleep') return cdMargoSleep;
    if (elephantId === 'odri' && tab === 'sleep') return cdOdriSleep;
    if (elephantId === 'pretty' && tab === 'sleep') return cdPrettySleep;
    return null;
  };

  // НАЖАТИЕ НА "+" У КОНКРЕТНОГО СЛОНА:
  // 1. Увеличиваем счетчик этого слона
  // 2. Записываем выбранный характер в feces_traits/urination_traits слона
  // 3. АВТОСБРОС выбранного чипса обратно на «Сформирован (норма)»
  const handleIncrement = (elephantId: string, elephantName: string) => {
    if (isLocked) return;
    const cd = getCooldownHook(elephantId, activeTab);
    if (cd && cd.isBlocked) return;
    
    // Переключаем активную колонку на того слона, которому нажали "+"
    setActiveElephantId(elephantId);

    const isAnomaly = activeTab === 'stool' 
      ? selectedStoolTrait !== 'Сформирован (норма)' 
      : selectedUrineTrait !== 'Прозрачная (норма)';

    handleHaptic(isAnomaly ? [15, 30, 15] : 10);

    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    const next = clampCount(current + 1);
    onMetricChange?.(elephantId, field, next);

    if (activeTab === 'stool') {
      const traitToSave = selectedStoolTrait;
      const prevTraits = metrics?.[elephantId]?.feces_traits || [];
      const updatedTraits = Array.from(new Set([...prevTraits, traitToSave]));
      onMetricChange?.(elephantId, 'feces_traits', updatedTraits);

      // АВТОСБРОС НА ДЕФОЛТНУЮ НОРМУ
      setSelectedStoolTrait('Сформирован (норма)');

      cd?.triggerCooldown();
      const actionName = traitToSave === 'Сформирован (норма)' ? 'куча' : `куча (${traitToSave})`;
      onAddEvent?.(`+1 ${actionName} для ${elephantName}`, '💩', {
        type: 'physiology',
        elephant_id: elephantId,
        field,
        value: current,
        trait: traitToSave
      });
    } else if (activeTab === 'urine') {
      const traitToSave = selectedUrineTrait;
      const prevTraits = metrics?.[elephantId]?.urination_traits || [];
      const updatedTraits = Array.from(new Set([...prevTraits, traitToSave]));
      onMetricChange?.(elephantId, 'urination_traits', updatedTraits);

      // АВТОСБРОС НА ДЕФОЛТНУЮ НОРМУ
      setSelectedUrineTrait('Прозрачная (норма)');

      cd?.triggerCooldown();
      const actionName = traitToSave === 'Прозрачная (норма)' ? 'лужа' : `лужа (${traitToSave})`;
      onAddEvent?.(`+1 ${actionName} для ${elephantName}`, '💦', {
        type: 'physiology',
        elephant_id: elephantId,
        field,
        value: current,
        trait: traitToSave
      });
    }
  };

  const handleDecrement = (elephantId: string) => {
    if (isLocked) return;
    setActiveElephantId(elephantId);
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    if (current > 0) {
      const next = clampCount(current - 1);
      onMetricChange?.(elephantId, field, next);

      // Если счетчик упал в 0, сбрасываем особенности на дефолт
      if (next === 0) {
        if (activeTab === 'stool') {
          onMetricChange?.(elephantId, 'feces_traits', ['Сформирован (норма)']);
        } else if (activeTab === 'urine') {
          onMetricChange?.(elephantId, 'urination_traits', ['Прозрачная (норма)']);
        }
      }
    }
  };

  const handleIncrementSleep = (elephantId: string, elephantName: string) => {
    if (isLocked) return;
    const cd = getCooldownHook(elephantId, 'sleep');
    if (cd && cd.isBlocked) return;
    
    setActiveElephantId(elephantId);
    handleHaptic(10);
    const current = metrics?.[elephantId]?.sleep_minutes ?? 0;
    const next = Math.min(720, current + 30);
    onMetricChange?.(elephantId, 'sleep_minutes', next);
    if (next > 0) {
      const currentIntervals = metrics?.[elephantId]?.sleep_intervals ?? [];
      if (currentIntervals.length === 0) {
        onMetricChange?.(elephantId, 'sleep_intervals', [
          { id: `sleep-${Date.now()}`, start: '01:00', end: '01:00' },
        ]);
      }
    }

    if (selectedSleepTrait !== 'Спокойно (норма)') {
      let currentNotes = metrics?.[elephantId]?.notes || '';
      const appended = `[${selectedSleepTrait}]`;
      if (!currentNotes.includes(appended)) {
        onMetricChange?.(elephantId, 'notes', (currentNotes.trim() + ' ' + appended).trim());
      }
      setSelectedSleepTrait('Спокойно (норма)');
    }
  };

  const handleDecrementSleep = (elephantId: string) => {
    if (isLocked) return;
    setActiveElephantId(elephantId);
    handleHaptic(10);
    const current = metrics?.[elephantId]?.sleep_minutes ?? 0;
    const next = Math.max(0, current - 30);
    onMetricChange?.(elephantId, 'sleep_minutes', next);
    if (next === 0) {
      onMetricChange?.(elephantId, 'sleep_intervals', []);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    handleHaptic(20);

    try {
      const compressed = await compressImage(file);
      const todayStr = new Date().toISOString().split('T')[0];
      const path = await supabaseService.uploadShiftMedia(compressed, todayStr, activeTab);
      setPendingPhotoUrl(path);
      setIsPhotoAttribOpen(true);
    } catch (err) {
      console.error('Photo error:', err);
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAssignPhoto = (elephantId: string) => {
    if (!pendingPhotoUrl) return;
    const newPhoto: ShiftPhoto = {
      id: `photo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      section: activeTab,
      storage_path: pendingPhotoUrl,
    };
    const currentPhotos = metrics?.[elephantId]?.photos ?? [];
    onMetricChange?.(elephantId, 'photos', [...currentPhotos, newPhoto]);
    setIsPhotoAttribOpen(false);
    setPendingPhotoUrl(null);
  };

  const allPhotos = displayElephants.flatMap(e => {
    const photos = metrics?.[e.id]?.photos ?? [];
    return photos.filter(p => p.section === activeTab).map(p => ({ elephant: e, photo: p }));
  });
  const latestPhoto = allPhotos[allPhotos.length - 1];

  const totalCount = displayElephants.reduce((acc, e) => {
    if (activeTab === 'sleep') return acc + (metrics?.[e.id]?.sleep_minutes ?? 0);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    return acc + ((metrics?.[e.id]?.[field] as number) ?? 0);
  }, 0);

  const currentSelectedTrait = activeTab === 'stool' 
    ? selectedStoolTrait 
    : activeTab === 'urine' 
    ? selectedUrineTrait 
    : selectedSleepTrait;

  const traitsForCurrentTab = activeTab === 'stool' ? STOOL_TRAITS : activeTab === 'urine' ? URINE_TRAITS : SLEEP_TRAITS;

  const isCurrentTraitAnomaly = currentSelectedTrait.includes('⚠️') || currentSelectedTrait.includes('Понос') || currentSelectedTrait.includes('Непереварен');

  const activeElephantName = displayElephants.find(e => e.id === activeElephantId)?.name || 'слона';

  return (
    <div
      className="rounded-[26px] overflow-hidden border border-white/70 shadow-[0_2px_16px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] bg-white/80 backdrop-blur-2xl transition-colors dark:border-slate-800 dark:bg-slate-900/85"
    >
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef} 
        onChange={handlePhotoCapture} 
        className="hidden"
      />

      {/* ─── SECTION HEADER ─── */}
      <div className={`px-5 pt-4 pb-3 bg-gradient-to-br ${currentTab.headerBg} border-b border-white/60 dark:bg-slate-800/60 dark:border-slate-700/60`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl bg-gradient-to-br ${currentTab.accentColor} shadow-md`}
            >
              {currentTab.emoji}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight dark:text-slate-100">
                Физиология
              </h3>
            </div>
          </div>

          {/* Total badge + photo button */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`px-3 py-1.5 rounded-full bg-gradient-to-br ${currentTab.accentColor} text-white text-xs font-black shadow-md`}
            >
              {activeTab === 'sleep' ? formatTotalSleepHours(totalCount) : totalCount}
            </div>
            <PhotoActionThumbnail
              photoUrl={latestPhoto?.photo.dataUrl}
              isProcessing={isProcessingPhoto}
              isLocked={isLocked}
              title={
                latestPhoto
                  ? `Фото (${latestPhoto.elephant.name})`
                  : 'Сделать фото'
              }
              onCaptureClick={() => fileInputRef.current?.click()}
              onPreviewClick={() => setPreviewModalPhoto(latestPhoto!)}
            />
          </div>
        </div>

        {/* Segmented Tab Control */}
        <div
          className="mt-3.5 grid grid-cols-3 p-1.5 rounded-[20px] bg-slate-500/10 dark:bg-slate-950/40 gap-1"
          style={{
            boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.06)',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                handleHaptic(8);
              }}
              className={`min-h-[46px] flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-[16px] text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer select-none tap-target ${
                activeTab === tab.id
                  ? 'text-slate-950 bg-white shadow-md ring-1 ring-slate-900/10 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 font-bold dark:text-slate-400'
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── ELEPHANT CARDS (3 КОЛОНКИ СЛОНОВ: МАРГО, ОДРИ, ПРЭТТИ) ─── */}
      <div className="px-4 pt-3.5 pb-2.5">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {displayElephants.map(elephant => {
            const isSelectedElephant = elephant.id === activeElephantId;

            if (activeTab === 'sleep') {
              const sleepMinutes = metrics?.[elephant.id]?.sleep_minutes ?? 0;
              const hasSleep = sleepMinutes > 0;

              return (
                <div 
                  key={elephant.id} 
                  onClick={() => setActiveElephantId(elephant.id)}
                  className={`flex flex-col gap-1.5 cursor-pointer transition-all ${
                    isSelectedElephant ? 'scale-[1.01]' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-black text-slate-700 text-center flex items-center justify-center gap-1 select-none dark:text-slate-300">
                    <span>{ELEPHANT_EMOJI[elephant.id] ?? '🐘'}</span>
                    <span className={isSelectedElephant ? 'text-violet-700 font-black' : ''}>{elephant.name}</span>
                  </div>

                  {/* Карточка слона для сна */}
                  <div
                    className={`rounded-[22px] overflow-hidden transition-all duration-150 ${
                      isSelectedElephant 
                        ? 'ring-2 ring-violet-500/80 border-violet-400 shadow-md' 
                        : hasSleep
                        ? 'border-violet-300/60 shadow-xs'
                        : 'border-slate-200/80 shadow-xs dark:border-slate-700'
                    }`}
                    style={{
                      borderWidth: '1px',
                      background: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {/* Кнопка [+] */}
                    <button
                      type="button"
                      disabled={isLocked || sleepMinutes >= 720}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIncrementSleep(elephant.id, elephant.name);
                      }}
                      className="h-12 w-full flex items-center justify-center text-2xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target bg-white text-violet-600 dark:bg-slate-800 dark:text-violet-400"
                      aria-label={`Добавить 30 мин сна для ${elephant.name}`}
                    >
                      +
                    </button>

                    {/* Центральное значение */}
                    <div
                      className={`py-2 text-center select-none flex flex-col items-center justify-center gap-0.5 min-h-[60px] ${
                        hasSleep
                          ? 'bg-violet-100/70 dark:bg-violet-950/40'
                          : 'bg-slate-50/80 dark:bg-slate-900/60'
                      }`}
                    >
                      
                      <span className="text-3xl font-mono font-black text-slate-950 leading-none dark:text-slate-100">{formatTotalSleepHours(sleepMinutes)}</span>
                    </div>

                    {/* Кнопка [-] */}
                    <button
                      type="button"
                      disabled={isLocked || sleepMinutes <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecrementSleep(elephant.id);
                      }}
                      className="h-12 w-full flex items-center justify-center text-xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-t border-slate-200/80 dark:bg-slate-800 dark:text-slate-200"
                      aria-label={`Уменьшить 30 мин сна для ${elephant.name}`}
                    >
                      −
                    </button>
                  </div>

                  
                </div>
              );
            }

            const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
            const count = (metrics?.[elephant.id]?.[field] as number) ?? 0;
            const hasCount = count > 0;
            const cd = getCooldownHook(elephant.id, activeTab);
            const isBlocked = cd?.isBlocked || false;
            const remaining = cd?.remaining || 0;

            const incrementBtnBgClass = isBlocked
              ? 'bg-slate-100/90 text-slate-400 dark:bg-slate-800'
              : hasCount
              ? activeTab === 'stool'
                ? 'bg-white/90 text-amber-600 dark:bg-slate-800/90 dark:text-amber-400'
                : 'bg-white/90 text-sky-600 dark:bg-slate-800/90 dark:text-sky-400'
              : 'bg-white/90 text-slate-400 hover:text-slate-600 dark:bg-slate-800/90 dark:text-slate-400';

            const displayCardBgClass = hasCount
              ? activeTab === 'stool'
                ? 'bg-amber-100/60 dark:bg-amber-950/40'
                : 'bg-sky-100/60 dark:bg-sky-950/40'
              : 'bg-slate-50/60 dark:bg-slate-900/60';

            const labelTextColorClass = activeTab === 'stool' 
              ? 'text-amber-700 dark:text-amber-300' 
              : 'text-sky-700 dark:text-sky-300';

            const elephantNameColorClass = isSelectedElephant
              ? activeTab === 'stool'
                ? 'text-amber-700 font-black dark:text-amber-400'
                : 'text-sky-700 font-black dark:text-sky-400'
              : 'text-slate-600 dark:text-slate-300';

            return (
              <div 
                key={elephant.id} 
                onClick={() => setActiveElephantId(elephant.id)}
                className={`flex flex-col gap-1.5 cursor-pointer transition-all ${
                  isSelectedElephant ? 'scale-[1.01]' : 'opacity-90 hover:opacity-100'
                }`}
              >
                {/* Имя слона с иконкой */}
                <div className="text-xs sm:text-sm font-black text-slate-700 text-center flex items-center justify-center gap-1 dark:text-slate-300">
                  <span className="text-base">{ELEPHANT_EMOJI[elephant.id] ?? '🐘'}</span>
                  <span className={`transition-colors ${elephantNameColorClass}`}>
                    {elephant.name}
                  </span>
                </div>

                {/* Вертикальная карточка: [+] -> [Счетчик] -> [-] */}
                <div
                  className={`rounded-[22px] overflow-hidden transition-all duration-150 ${
                    isSelectedElephant
                      ? activeTab === 'stool'
                        ? 'ring-2 ring-amber-500/90 border-amber-400 shadow-md'
                        : 'ring-2 ring-sky-500/90 border-sky-400 shadow-md'
                      : hasCount
                      ? activeTab === 'stool'
                        ? 'border-amber-300/70 shadow-xs'
                        : 'border-sky-300/70 shadow-xs'
                      : 'border-slate-200/80 shadow-xs dark:border-slate-700'
                  }`}
                  style={{
                    borderWidth: '1px',
                    background: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {/* Кнопка инкремента [+] */}
                  <button
                    type="button"
                    disabled={isLocked || isBlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIncrement(elephant.id, elephant.name);
                    }}
                    className={`h-12 w-full flex items-center justify-center text-2xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target ${incrementBtnBgClass}`}
                    aria-label={`Увеличить для ${elephant.name}`}
                  >
                    {isBlocked ? (
                      <span className="text-sm font-black flex items-center gap-1">
                        <Clock size={16} className="animate-pulse" />
                        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      '+'
                    )}
                  </button>

                  {/* Центральный дисплей с плашкой «КУЧИ / ЛУЖИ» */}
                  <div
                    className={`py-2 text-center select-none flex flex-col items-center justify-center gap-0.5 min-h-[60px] transition-colors ${displayCardBgClass}`}
                  >
                    
                    <span className="text-4xl font-mono font-black text-slate-950 leading-none dark:text-slate-100">{count}</span>
                  </div>

                  {/* Кнопка декремента [-] */}
                  <button
                    type="button"
                    disabled={isLocked || count === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDecrement(elephant.id);
                    }}
                    className="h-12 w-full flex items-center justify-center text-xl font-black transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-t border-slate-200/80 dark:bg-slate-800 dark:text-slate-200"
                    aria-label={`Уменьшить для ${elephant.name}`}
                  >
                    −
                  </button>
                </div>

                
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ХАРАКТЕР И ОСОБЕННОСТИ СТУЛА / МОЧИ / СНА ─── */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
        {/* Заголовок секции с бейджем статуса */}
        <div className="font-bold text-slate-900 text-sm tracking-tight px-1 mb-2">
            Характер и особенности
          </div>

        {/* Сетка из 4 чипсов (2х2, как на скриншоте) */}
        <div className="grid grid-cols-2 gap-2">
          {traitsForCurrentTab.map(trait => {
            const isSelected = currentSelectedTrait === trait;
            const isWarning = trait.includes('⚠️');

            let chipClasses = 'bg-white text-slate-700 border border-slate-200 shadow-sm';
            if (isSelected) {
              if (isWarning) {
                chipClasses = 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300';
              } else {
                chipClasses = 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300';
              }
            } else if (isWarning) {
              chipClasses = 'bg-rose-50 text-rose-800 border border-rose-200';
            }
            return (
              <button
                key={trait}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectTrait(trait)}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-[18px] text-xs sm:text-sm font-black transition-all flex items-center justify-center text-center leading-tight active:scale-95 cursor-pointer tap-target select-none ${chipClasses} ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {trait}
              </button>
            );
          })}
        </div>

        {/* Подсказка автосброса при выборе аномалии */}
        {isCurrentTraitAnomaly && (
          <div className="mt-2 text-center text-[11px] font-semibold text-rose-600 dark:text-rose-300 animate-fadeIn">
            Нажми «+» у {activeElephantName}, чтобы записать отклонение. После тапа статус вернется в «Норму».
          </div>
        )}
      </div>

      {/* ─── PHOTO ATTRIBUTION MODAL ─── */}
      {isPhotoAttribOpen && pendingPhotoUrl && createPortal(
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 sm:p-0"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="w-full max-w-sm rounded-[32px] p-6 space-y-5 animate-slide-up bg-white/95 backdrop-blur-2xl shadow-2xl dark:bg-slate-900"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">
                {activeTab === 'stool' ? '💩' : activeTab === 'urine' ? '💧' : '🌙'}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Чья это {activeTab === 'stool' ? 'куча' : activeTab === 'urine' ? 'лужа' : 'зона сна'}?
              </h3>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Выберите слона для привязки фото</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {displayElephants.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleAssignPhoto(e.id)}
                  className="flex flex-col items-center justify-center gap-2 min-h-[80px] rounded-[20px] transition-all active:scale-95 cursor-pointer tap-target bg-slate-50/90 border border-slate-200/80 shadow-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  <span className="text-2xl">{ELEPHANT_EMOJI[e.id] ?? '🐘'}</span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{e.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { setIsPhotoAttribOpen(false); setPendingPhotoUrl(null); }}
              className="w-full min-h-[48px] rounded-[18px] font-bold text-sm text-slate-600 transition-all active:scale-95 cursor-pointer tap-target bg-slate-100/90 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            >
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ─── PHOTO PREVIEW MODAL ─── */}
      {previewModalPhoto && createPortal(
        <div
          className="fixed inset-0 z-[160] flex flex-col"
          style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2.5 text-white">
              <span className="text-xl">{activeTab === 'stool' ? '💩' : activeTab === 'urine' ? '💧' : '🌙'}</span>
              <div>
                <div className="font-bold text-sm">{previewModalPhoto.elephant.name}</div>
                <div className="text-[11px] text-slate-400">
                  {new Date(previewModalPhoto.photo.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewModalPhoto(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer tap-target bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={previewModalPhoto.photo.dataUrl}
              alt="Фото"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-[20px] shadow-2xl"
            />
          </div>

          <div
            className="px-5 py-4 flex items-center justify-end max-w-2xl mx-auto w-full border-t border-white/10"
          >
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                const { elephant: { id: elephantId }, photo: { id: photoId } } = previewModalPhoto;
                const currentPhotos = metrics?.[elephantId]?.photos ?? [];
                onMetricChange?.(elephantId, 'photos', currentPhotos.filter(p => p.id !== photoId));
                setPreviewModalPhoto(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 tap-target bg-rose-500/20 border border-rose-500/30 text-rose-300"
            >
              <Trash2 size={15} />
              Удалить фото
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
