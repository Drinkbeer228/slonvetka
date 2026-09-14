import React, { useRef, useState, useEffect } from 'react';
import { Trash2, X, Moon, Waves, Leaf } from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics, ShiftPhoto, clampCount } from '../../types/shift';
import { createPortal } from 'react-dom';
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
  margo:  '👑',
  odri:   '🎀',
  pretty: '🌸',
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
}

export function ExcretionControl({
  elephants,
  metrics,
  onMetricChange,
  isLocked = false,
}: ExcretionControlProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stool');

  const displayElephants = elephants && elephants.length > 0 ? elephants : DEFAULT_ELEPHANTS;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [isPhotoAttribOpen, setIsPhotoAttribOpen] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<{
    elephant: { id: string; name: string };
    photo: ShiftPhoto;
  } | null>(null);

  const [localStoolTraits, setLocalStoolTraits] = useState<string[]>([]);
  const [localUrineTraits, setLocalUrineTraits] = useState<string[]>([]);
  const [localSleepTraits, setLocalSleepTraits] = useState<string[]>([]);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  useEffect(() => {
    if (metrics && displayElephants.length > 0) {
      const first = displayElephants[0];
      const m = metrics[first.id];
      if (m) {
        if (m.feces_traits?.length) setLocalStoolTraits(m.feces_traits);
        if (m.urination_traits?.length) setLocalUrineTraits(m.urination_traits);
        const found = SLEEP_TRAITS.filter(t => (m.notes || '').includes(t));
        if (found.length) setLocalSleepTraits(found);
      }
    }
  }, [metrics, displayElephants]);

  const activeStoolTraits = localStoolTraits.length > 0 ? localStoolTraits : ['Сформирован (норма)'];
  const activeUrineTraits = localUrineTraits.length > 0
    ? localUrineTraits.map(t => (t === 'Светлая / Прозрачная' ? 'Прозрачная (норма)' : t))
    : ['Прозрачная (норма)'];
  const activeSleepTraits = localSleepTraits.length > 0 ? localSleepTraits : ['Спокойно (норма)'];

  const handleHaptic = (ms = 10) => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch { /* ignore */ }
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
      let newTraits: string[];
      if (trait === 'Спокойно (норма)') {
        newTraits = ['Спокойно (норма)'];
      } else if (activeSleepTraits.includes(trait)) {
        newTraits = activeSleepTraits.filter(t => t !== trait);
        if (newTraits.length === 0) newTraits = ['Спокойно (норма)'];
      } else {
        newTraits = activeSleepTraits.filter(t => t !== 'Спокойно (норма)');
        newTraits.push(trait);
      }
      setLocalSleepTraits(newTraits);
      displayElephants.forEach(e => {
        let currentNotes = metrics?.[e.id]?.notes || '';
        SLEEP_TRAITS.forEach(t => {
          const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          currentNotes = currentNotes
            .replace(new RegExp(`\\s*\\[${escaped}\\]`, 'g'), '')
            .replace(new RegExp(`\\s*${escaped}`, 'g'), '');
        });
        const appended = newTraits.map(t => `[${t}]`).join(' ');
        const finalNotes = (currentNotes.trim() + (appended ? ` ${appended}` : '')).trim();
        onMetricChange?.(e.id, 'notes', finalNotes);
      });
    }
  };

  const handleIncrement = (elephantId: string) => {
    if (isLocked) return;
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    onMetricChange?.(elephantId, field, clampCount(current + 1));
  };

  const handleDecrement = (elephantId: string) => {
    if (isLocked) return;
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    if (current > 0) onMetricChange?.(elephantId, field, clampCount(current - 1));
  };

  const handleIncrementSleep = (elephantId: string) => {
    if (isLocked) return;
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
  };

  const handleDecrementSleep = (elephantId: string) => {
    if (isLocked) return;
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
      const blob = await compressImage(file);
      const sDate = new Date().toISOString().split('T')[0]; // Adjust if shiftDate can be passed
      const storagePath = await supabaseService.uploadShiftMedia(blob, sDate, activeTab);
      
      setPendingPhotoUrl(storagePath);
      setIsPhotoAttribOpen(true);
    } catch (err) {
      console.error('Failed to process and upload image:', err);
      alert('Ошибка загрузки фото');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAssignPhoto = (elephantId: string) => {
    if (!pendingPhotoUrl) return;
    const newPhoto: ShiftPhoto = {
      id: crypto.randomUUID(),
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

  const currentTraits = activeTab === 'stool' ? activeStoolTraits : activeTab === 'urine' ? activeUrineTraits : activeSleepTraits;
  const traitsForCurrentTab = activeTab === 'stool' ? STOOL_TRAITS : activeTab === 'urine' ? URINE_TRAITS : SLEEP_TRAITS;

  return (
    <div
      className="rounded-[26px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 2px 16px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Hidden File Input */}
      <input type="file" accept="image/*" capture="environment"
        ref={fileInputRef} onChange={handlePhotoCapture} className="hidden"
      />

      {/* ─── SECTION HEADER ─── */}
      <div className={`px-5 pt-5 pb-4 bg-gradient-to-br ${currentTab.headerBg} border-b border-white/60`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl bg-gradient-to-br ${currentTab.accentColor} shadow-lg`}
            >
              {currentTab.emoji}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight">
                Физиология
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                {activeTab === 'stool'
                  ? 'Стул, цвет и консистенция'
                  : activeTab === 'urine'
                  ? 'Моча, мутность и признаки'
                  : 'Время сна и укладки'}
              </p>
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
          className="mt-4 grid grid-cols-3 p-1 rounded-[18px]"
          style={{
            background: 'rgba(148,163,184,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.06)',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[14px] text-xs font-bold transition-all active:scale-95 cursor-pointer select-none tap-target ${
                activeTab === tab.id
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={activeTab === tab.id ? {
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 6px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,1)',
              } : {}}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── ELEPHANT CARDS ─── */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-3 gap-2.5">
          {displayElephants.map(elephant => {
            if (activeTab === 'sleep') {
              const sleepMinutes = metrics?.[elephant.id]?.sleep_minutes ?? 0;
              const hasSleep = sleepMinutes > 0;

              return (
                <div key={elephant.id} className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-bold text-slate-500 text-center flex items-center justify-center gap-1 select-none">
                    <span>{ELEPHANT_EMOJI[elephant.id] ?? '🐘'}</span>
                    <span>{elephant.name}</span>
                  </div>

                  {/* Карточка слона для сна */}
                  <div
                    className="rounded-[20px] overflow-hidden"
                    style={{
                      boxShadow: hasSleep
                        ? '0 2px 10px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
                        : '0 1px 4px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: hasSleep
                        ? '1px solid rgba(167,139,250,0.35)'
                        : '1px solid rgba(203,213,225,0.6)',
                    }}
                  >
                    {/* Верхняя кнопка [+] */}
                    <button
                      type="button"
                      disabled={isLocked || sleepMinutes >= 720}
                      onClick={() => handleIncrementSleep(elephant.id)}
                      className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        color: hasSleep ? '#7c3aed' : '#94a3b8',
                      }}
                      aria-label={`Добавить 30 мин сна для ${elephant.name}`}
                    >
                      +
                    </button>

                    {/* Центральное значение с мини-бейджем */}
                    <div
                      className="py-2.5 text-center select-none flex flex-col items-center justify-center gap-0.5 min-h-[62px]"
                      style={{
                        background: hasSleep
                          ? 'linear-gradient(180deg, rgba(237,233,254,0.6) 0%, rgba(221,214,254,0.4) 100%)'
                          : 'rgba(248,250,252,0.6)',
                      }}
                    >
                      <span className="text-[11px] font-black tracking-wider text-violet-600 flex items-center justify-center gap-1 uppercase">
                        🌙 СОН
                      </span>
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {formatTotalSleepHours(sleepMinutes)}
                      </span>
                    </div>

                    {/* Нижняя кнопка [-] */}
                    <button
                      type="button"
                      disabled={isLocked || sleepMinutes <= 0}
                      onClick={() => handleDecrementSleep(elephant.id)}
                      className="h-11 w-full flex items-center justify-center text-lg font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target"
                      style={{
                        background: 'rgba(248,250,252,0.7)',
                        color: '#94a3b8',
                      }}
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

            return (
              <div key={elephant.id} className="flex flex-col gap-1.5">
                <div className="text-[11px] font-bold text-slate-500 text-center flex items-center justify-center gap-1">
                  <span>{ELEPHANT_EMOJI[elephant.id] ?? '🐘'}</span>
                  <span>{elephant.name}</span>
                </div>
                <div
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    boxShadow: hasCount
                      ? `0 2px 10px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`
                      : '0 1px 4px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: hasCount
                      ? `1px solid ${activeTab === 'stool' ? 'rgba(251,146,60,0.3)' : 'rgba(56,189,248,0.3)'}`
                      : '1px solid rgba(203,213,225,0.6)',
                  }}
                >
                  {/* Increment */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleIncrement(elephant.id)}
                    className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      color: hasCount
                        ? activeTab === 'stool' ? '#ea580c' : '#0284c7'
                        : '#94a3b8',
                    }}
                    aria-label={`Увеличить для ${elephant.name}`}
                  >
                    +
                  </button>

                  {/* Counter display с мини-бейджем */}
                  <div
                    className="py-2.5 text-center select-none flex flex-col items-center justify-center gap-0.5 min-h-[62px]"
                    style={{
                      background: hasCount
                        ? activeTab === 'stool'
                          ? 'linear-gradient(180deg, rgba(254,243,199,0.6) 0%, rgba(253,230,138,0.4) 100%)'
                          : 'linear-gradient(180deg, rgba(224,242,254,0.6) 0%, rgba(186,230,253,0.4) 100%)'
                        : 'rgba(248,250,252,0.6)',
                    }}
                  >
                    <span
                      className={`text-[11px] font-black tracking-wider flex items-center justify-center gap-1 uppercase ${
                        activeTab === 'stool' ? 'text-amber-600' : 'text-sky-600'
                      }`}
                    >
                      {activeTab === 'stool' ? '💩 КУЧИ' : '💧 ЛУЖИ'}
                    </span>
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {count}
                    </span>
                  </div>

                  {/* Decrement */}
                  <button
                    type="button"
                    disabled={isLocked || count === 0}
                    onClick={() => handleDecrement(elephant.id)}
                    className="h-11 w-full flex items-center justify-center text-lg font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none tap-target"
                    style={{
                      background: 'rgba(248,250,252,0.7)',
                      color: '#94a3b8',
                    }}
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

      {/* ─── TRAITS GRID ─── */}
      <div
        className="px-4 pb-5 pt-3"
        style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}
      >
        {/* Плашка-заголовок секции свойств */}
        <div className="flex items-center justify-between px-0.5 mb-2.5">
          <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
            {activeTab === 'stool' && '💩 ХАРАКТЕР И ОСОБЕННОСТИ СТУЛА'}
            {activeTab === 'urine' && '💧 ХАРАКТЕР И ОСОБЕННОСТИ МОЧИ'}
            {activeTab === 'sleep' && '🌙 ХАРАКТЕР И ОСОБЕННОСТИ СНА'}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
              activeTab === 'stool'
                ? currentTraits.some(t => t.includes('⚠️'))
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-amber-100 text-amber-800'
                : activeTab === 'urine'
                ? currentTraits.some(t => t.includes('⚠️'))
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-sky-100 text-sky-800'
                : activeSleepTraits.some(t => t.includes('⚠️'))
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-violet-100 text-violet-800'
            }`}
          >
            {(activeTab === 'sleep' ? activeSleepTraits : currentTraits).some(t => t.includes('⚠️'))
              ? 'Внимание ⚠️'
              : 'Норма'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {traitsForCurrentTab.map(trait => {
            const isSelected = currentTraits.includes(trait);
            const isWarning = trait.includes('⚠️');

            let style: React.CSSProperties;
            if (isSelected) {
              if (isWarning) {
                style = {
                  background: 'var(--alert-crit-bg)',
                  color: 'var(--alert-crit-text)',
                  border: '1px solid var(--alert-crit-border)',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.12)',
                };
              } else {
                style = {
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#fff',
                  border: '1px solid transparent',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.3)',
                };
              }
            } else {
              style = {
                background: 'rgba(248,250,252,0.8)',
                color: isWarning ? '#b91c1c' : '#475569',
                border: isWarning ? '1px solid rgba(252,165,165,0.4)' : '1px solid rgba(203,213,225,0.7)',
              };
            }

            return (
              <button
                key={trait}
                type="button"
                disabled={isLocked}
                onClick={() => toggleTrait(trait)}
                className={`min-h-[44px] px-3 rounded-[14px] text-xs font-bold transition-all flex items-center justify-center text-center leading-tight active:scale-95 cursor-pointer tap-target ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={style}
              >
                {trait}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── PHOTO ATTRIBUTION MODAL ─── */}
      {isPhotoAttribOpen && pendingPhotoUrl && createPortal(
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 sm:p-0"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="w-full max-w-sm rounded-[32px] p-6 space-y-5 animate-slide-up"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">
                {activeTab === 'stool' ? '💩' : activeTab === 'urine' ? '💧' : '🌙'}
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Чья это {activeTab === 'stool' ? 'куча' : activeTab === 'urine' ? 'лужа' : 'зона сна'}?
              </h3>
              <p className="text-sm text-slate-500 mt-1">Выберите слона для привязки фото</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {displayElephants.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleAssignPhoto(e.id)}
                  className="flex flex-col items-center justify-center gap-2 min-h-[80px] rounded-[20px] transition-all active:scale-95 cursor-pointer tap-target"
                  style={{
                    background: 'rgba(248,250,252,0.9)',
                    border: '1px solid rgba(203,213,225,0.7)',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}
                >
                  <span className="text-2xl">{ELEPHANT_EMOJI[e.id] ?? '🐘'}</span>
                  <span className="font-bold text-xs text-slate-800">{e.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { setIsPhotoAttribOpen(false); setPendingPhotoUrl(null); }}
              className="w-full min-h-[48px] rounded-[18px] font-bold text-sm text-slate-600 transition-all active:scale-95 cursor-pointer tap-target"
              style={{
                background: 'rgba(241,245,249,0.9)',
                border: '1px solid rgba(203,213,225,0.6)',
              }}
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
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer tap-target"
              style={{ background: 'rgba(255,255,255,0.1)' }}
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
            className="px-5 py-4 flex items-center justify-end max-w-2xl mx-auto w-full"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 tap-target"
              style={{
                background: 'rgba(254,202,202,0.15)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
              }}
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
