import React, { useState, useRef } from 'react';
import { 
  Sparkles, AlertTriangle, Camera, Check, Clock, 
  RotateCw, RefreshCw, Eye, X, Upload, Activity, ShieldAlert,
  CheckCircle2, Volume2, Footprints, Flame, Play, Timer
} from 'lucide-react';
import { Elephant } from '../../types';
import { ElephantDailyMetrics } from '../../types/shift';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

interface CircusElephantMonitoringProps {
  elephant: Elephant;
  selectedDate: string;
  metrics: ElephantDailyMetrics;
  notes: string;
  isLocked?: boolean;
  onMetricChange: (field: keyof ElephantDailyMetrics, value: any) => void;
  onAppendLog: (logText: string) => void;
  onAddMediaLog?: (logText: string, photoDataUrl: string) => void;
}

// 1. Этологические паттерны движений (что делает слон)
interface StereotypyPattern {
  id: string;
  label: string;
  iconText: string;
  shortName: string;
}

const STEREOTYPY_PATTERNS: StereotypyPattern[] = [
  { id: 'weaving', label: 'Качание (Weaving)', iconText: '🔄', shortName: 'Качание' },
  { id: 'bobbing', label: 'Кивание головой', iconText: '🐘', shortName: 'Кивание головой' },
  { id: 'stepping', label: 'Переступание ног', iconText: '👣', shortName: 'Переступание ног' },
  { id: 'trunk', label: 'Игра хоботом', iconText: '🪵', shortName: 'Игра хоботом' },
];

// 2. Вероятные триггеры / контекст (когда проявляется)
interface StereotypyTrigger {
  id: string;
  label: string;
  iconText: string;
  shortName: string;
}

const STEREOTYPY_TRIGGERS: StereotypyTrigger[] = [
  { id: 'before_feeding', label: 'Перед пайкой', iconText: '🥣', shortName: 'перед пайкой' },
  { id: 'before_arena', label: 'Перед выходом', iconText: '🚪', shortName: 'перед выходом' },
  { id: 'noise_stress', label: 'Шум / стресс', iconText: '🔊', shortName: 'шум/стресс' },
  { id: 'no_cause', label: 'Без видимой причины', iconText: '❓', shortName: 'без видимой причины' },
];

// 3. Шкала длительности / интенсивности эпизода
type DurationTier = '< 5 мин' | '5–15 мин' | '> 15 мин';

interface DurationOption {
  id: DurationTier;
  label: string;
  badgeClass: string;
  activeClass: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { 
    id: '< 5 мин', 
    label: '< 5 мин', 
    badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/50',
    activeClass: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
  },
  { 
    id: '5–15 мин', 
    label: '5–15 мин', 
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/50',
    activeClass: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
  },
  { 
    id: '> 15 мин', 
    label: '> 15 мин (затяжная)', 
    badgeClass: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-300/60 dark:border-rose-700/50',
    activeClass: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
  },
];

// 3. Ноги для мониторинга
const FEET_LIST = [
  { id: 'ПП', label: 'ПП (Правая передняя)' },
  { id: 'ЛП', label: 'ЛП (Левая передняя)' },
  { id: 'ПЗ', label: 'ПЗ (Правая задняя)' },
  { id: 'ЛЗ', label: 'ЛЗ (Левая задняя)' },
];

const EYE_OPTIONS = ['Ясные', 'Прищур', 'Слезотечение', 'Отек век'];
const TRUNK_TONE_OPTIONS = ['Активный / поднятый', 'Пассивный ("плетью")'];
const BREATHING_OPTIONS = ['Чистое дыхание', 'Сопение / храп'];
const TRUNK_TIP_OPTIONS = ['Кончик в норме', 'Сухой кончик', 'Влажный кончик'];
const DISCHARGE_OPTIONS = ['Нет', 'Серозные', 'Гнойные', 'Пылевые пробки'];
const EAR_OPTIONS = ['Активный обмах', 'Уши прижаты'];
const TEMPORAL_OPTIONS = ['Сухие', 'Активная секреция'];
const FEED_CONSUMPTION_OPTIONS = ['Жадно', 'Норма', 'Вяло', 'Отказ'];
const GAIT_OPTIONS = ['Шаг уверенный', 'Бережет ногу', 'Шарканье'];
const HOOF_WARMTH_OPTIONS = ['Норма', 'Теплее обычного'];
const ARENA_REACTION_OPTIONS = ['Стабильная работа', 'Сопротивление', 'Возбудимость', 'Пугливость'];

interface ChoiceChipGroupProps {
  options: string[];
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ChoiceChipGroup({ options, value, onChange, disabled = false }: ChoiceChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={`min-h-[40px] rounded-2xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white/90 text-slate-700 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface MultiSelectChipGroupProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}

function MultiSelectChipGroup({ options, selected, onToggle, disabled = false }: MultiSelectChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(option)}
            className={`min-h-[40px] rounded-2xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
              isActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white/90 text-slate-700 border-slate-200/80 hover:border-indigo-300'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function CircusElephantMonitoring({
  elephant,
  selectedDate,
  metrics,
  notes,
  isLocked = false,
  onMetricChange,
  onAppendLog,
  onAddMediaLog,
}: CircusElephantMonitoringProps) {
  // Стереотипии: стейт конструктора
  const [selectedPattern, setSelectedPattern] = useState<StereotypyPattern | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<StereotypyTrigger | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationTier>('< 5 мин');
  const [justLoggedSuccess, setJustLoggedSuccess] = useState<string | null>(null);

  // Бережёт ногу: раскрытие выбора ног
  const [isFootPickerOpen, setIsFootPickerOpen] = useState(false);

  // Вторничный квест ног
  const isTuesday = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.getDay() === 2; // 2 = Вторник
    } catch {
      return false;
    }
  })();

  // Загрузка фото для вторничного дня ног
  const [feetPhotos, setFeetPhotos] = useState<string[]>([]);
  const [isUploadingFeetPhoto, setIsUploadingFeetPhoto] = useState(false);
  const feetFileInputRef = useRef<HTMLInputElement>(null);

  // Квест Прэтти: височные доли
  const isPretty = elephant.id === 'pretty';
  const [temporalChecked, setTemporalChecked] = useState(false);
  const [temporalPhoto, setTemporalPhoto] = useState<string | null>(null);
  const [isUploadingTemporalPhoto, setIsUploadingTemporalPhoto] = useState(false);
  const temporalFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const handleHaptic = (ms = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  const eyeObservations = metrics.eye_observations || [];
  const foreignObjectSuspected = Boolean(metrics.foreign_object_suspected);
  const needsFavoredLeg = metrics.gait_assessment === 'Бережет ногу';

  const handleChoiceChange = (field: keyof ElephantDailyMetrics, value: string) => {
    if (isLocked) return;
    handleHaptic(10);
    onMetricChange(field, value);
  };

  const handleTextChange = (field: keyof ElephantDailyMetrics, value: string) => {
    if (isLocked) return;
    onMetricChange(field, value);
  };

  const handleBooleanChange = (field: keyof ElephantDailyMetrics, value: boolean) => {
    if (isLocked) return;
    handleHaptic(10);
    onMetricChange(field, value);
  };

  const handleEyeToggle = (value: string) => {
    if (isLocked) return;
    const next = eyeObservations.includes(value)
      ? eyeObservations.filter(item => item !== value)
      : [...eyeObservations, value];
    handleHaptic(10);
    onMetricChange('eye_observations', next);
  };

  // 1. Стереотипия: быстрая фиксация в лог
  const handleLogStereotypy = (
    pattern: StereotypyPattern,
    trigger: StereotypyTrigger,
    duration: DurationTier
  ) => {
    if (isLocked) return;
    handleHaptic(18);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const logLine = `${timeStr} • ${pattern.shortName} (${trigger.shortName}) • ${duration}`;
    onAppendLog(`[${timeStr} Этология]: ${elephant.name} — ${pattern.label}, триггер: ${trigger.label}, длительность: ${duration}`);
    
    setJustLoggedSuccess(logLine);
    setTimeout(() => {
      setJustLoggedSuccess(null);
    }, 4000);

    // Сброс выбора после успешной фиксации
    setSelectedPattern(null);
    setSelectedTrigger(null);
  };

  // Фиксация нормы («Стереотипий не наблюдалось»)
  const handleLogNorm = () => {
    if (isLocked) return;
    handleHaptic(20);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const logLine = `${timeStr} • Стереотипий не наблюдалось (Норма)`;
    onAppendLog(`[${timeStr} Этология]: ${elephant.name} — стереотипий не наблюдалось (Норма)`);
    
    setJustLoggedSuccess(logLine);
    setTimeout(() => {
      setJustLoggedSuccess(null);
    }, 4000);

    setSelectedPattern(null);
    setSelectedTrigger(null);
  };

  // 3. Бережёт ногу: выбор ноги
  const handleSelectTroubledFoot = (footLabel: string) => {
    if (isLocked) return;
    handleHaptic(20);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    onAppendLog(`[${timeStr} ВНИМАНИЕ! Бережёт ногу]: ${elephant.name} щадит конечность ${footLabel}`);
    setIsFootPickerOpen(false);
  };

  // 3. Вторник: загрузка фото ног
  const handleFeetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFeetPhoto(true);
    handleHaptic(15);

    try {
      const blob = await compressImage(file);
      const storagePath = await supabaseService.uploadShiftMedia(blob, selectedDate, `feet_${elephant.id}`);
      const publicUrl = supabaseService.getPublicUrl(storagePath);
      
      setFeetPhotos(prev => [...prev, publicUrl]);
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      onAppendLog(`[${timeStr} День копыт]: Загружено фото ног (подошва/ногти) для ${elephant.name}`);
      if (onAddMediaLog) {
        onAddMediaLog(`[День копыт] ${elephant.name}`, publicUrl);
      }
    } catch (err) {
      console.error('Failed to upload feet photo:', err);
      alert('Не удалось загрузить фото ног');
    } finally {
      setIsUploadingFeetPhoto(false);
      e.target.value = '';
    }
  };

  // 3. Прэтти: обработка височных долей
  const handleTemporalCheck = () => {
    if (isLocked) return;
    handleHaptic(12);
    const nextState = !temporalChecked;
    setTemporalChecked(nextState);
    if (nextState) {
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      onAppendLog(`[${timeStr} Вет-уход]: Обработка височных долей (Прэтти) выполнена`);
    }
  };

  const handleTemporalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTemporalPhoto(true);
    handleHaptic(15);

    try {
      const blob = await compressImage(file);
      const storagePath = await supabaseService.uploadShiftMedia(blob, selectedDate, `temporal_${elephant.id}`);
      const publicUrl = supabaseService.getPublicUrl(storagePath);
      
      setTemporalPhoto(publicUrl);
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      onAppendLog(`[${timeStr} Фото]: Прикреплен снимок обработки височных долей (Прэтти)`);
      if (onAddMediaLog) {
        onAddMediaLog(`[Височные доли] Прэтти`, publicUrl);
      }
    } catch (err) {
      console.error('Failed to upload temporal photo:', err);
      alert('Ошибка загрузки фото');
    } finally {
      setIsUploadingTemporalPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
      
      {/* 1. ЭТОЛОГИЧЕСКИЙ МОНИТОРИНГ СТЕРЕОТИПИЙ (ДВУХУРОВНЕВАЯ ФИКСАЦИЯ В 1 ТАП) */}
      <div className="p-4 sm:p-4.5 bg-slate-50/90 dark:bg-slate-900/60 rounded-[24px] border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 shadow-xs">
        {/* Заголовок блока с индикатором нормы */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-base font-bold">
              🌀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Стереотипии: {elephant.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">
                  Этология
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Паттерн движения → Триггер → Длительность
              </p>
            </div>
          </div>

          {/* Кнопка быстрой фиксации нормы (без стереотипий) */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleLogNorm}
            className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation disabled:opacity-50 shrink-0"
            title="Зафиксировать отсутствие стереотипий"
          >
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Норма</span>
            <span className="xs:hidden">Ок</span>
          </button>
        </div>

        {/* Уведомление о последней записи */}
        {justLoggedSuccess && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <Check size={15} className="text-emerald-600 shrink-0" />
            <span className="truncate">Зафиксировано в лог: {justLoggedSuccess}</span>
          </div>
        )}

        {/* УРОВЕНЬ 1: Паттерн движения (что делает слон) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-0.5 flex items-center justify-between">
            <span>1. Паттерн движения</span>
            {selectedPattern && (
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                Выбран: {selectedPattern.shortName}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STEREOTYPY_PATTERNS.map(pattern => {
              const isSelected = selectedPattern?.id === pattern.id;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    handleHaptic(12);
                    setSelectedPattern(isSelected ? null : pattern);
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 border text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base leading-none select-none">{pattern.iconText}</span>
                  <span className="truncate">{pattern.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* УРОВЕНЬ 2: Триггер + шкала длительности (активен при выборе паттерна) */}
        {selectedPattern ? (
          <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3 animate-in fade-in zoom-in-98 duration-150">
            {/* Шкала фиксации длительности эпизода */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                <span className="flex items-center gap-1">
                  <Timer size={12} className="text-indigo-600 dark:text-indigo-400" />
                  Длительность эпизода
                </span>
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {selectedDuration}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map(opt => {
                  const isDurSelected = selectedDuration === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        handleHaptic(10);
                        setSelectedDuration(opt.id);
                      }}
                      className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all active:scale-95 flex items-center justify-center text-center cursor-pointer touch-manipulation disabled:opacity-50 ${
                        isDurSelected ? opt.activeClass : `bg-white/80 dark:bg-slate-800/80 ${opt.badgeClass}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Вероятный триггер (фиксация в 1 тап) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                <span>2. Вероятный триггер (нажмите для сохранения)</span>
                <button
                  type="button"
                  onClick={() => setSelectedPattern(null)}
                  className="text-indigo-500 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-[11px] font-bold"
                >
                  Отмена
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STEREOTYPY_TRIGGERS.map(trigger => (
                  <button
                    key={trigger.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleLogStereotypy(selectedPattern, trigger, selectedDuration)}
                    className="min-h-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-950 dark:text-indigo-100 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-700/60 text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 text-center cursor-pointer shadow-2xs touch-manipulation"
                  >
                    <span className="text-sm select-none">{trigger.iconText}</span>
                    <span className="truncate">{trigger.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Выберите паттерн движения слона выше для фиксации триггера и тайминга
            </span>
          </div>
        )}
      </div>

      {/* 3. МОНИТОРИНГ НОГ И СПЕЦ-КВЕСТЫ */}
      <div className="space-y-2.5">
        
        {/* Тревожная кнопка: «Бережёт ногу» */}
        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-rose-600 stroke-[2.4]" />
              <span className="font-extrabold text-xs text-rose-950 uppercase tracking-tight">
                Тревожный сигнал
              </span>
            </div>
            
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                handleHaptic(15);
                setIsFootPickerOpen(!isFootPickerOpen);
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 ${
                isFootPickerOpen 
                  ? 'bg-rose-700 text-white' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              }`}
            >
              <span>🚨 Бережёт ногу</span>
            </button>
          </div>

          {/* Выбор проблемной ноги: ПП | ЛП | ПЗ | ЛЗ */}
          {isFootPickerOpen && (
            <div className="pt-2 border-t border-rose-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
              {FEET_LIST.map(foot => (
                <button
                  key={foot.id}
                  type="button"
                  onClick={() => handleSelectTroubledFoot(foot.label)}
                  className="min-h-[42px] px-2.5 py-2 rounded-xl bg-white hover:bg-rose-600 hover:text-white text-rose-900 border border-rose-300 font-extrabold text-xs transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span className="text-sm font-black">{foot.id}</span>
                  <span className="text-[9px] opacity-75">{foot.id.includes('П') ? 'Передняя' : 'Задняя'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Вторничный спец-слот («День копыт») */}
        {isTuesday && (
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <div>
                  <span className="font-extrabold text-xs text-amber-950 uppercase tracking-tight block">
                    Вторничный спец-слот: «День копыт»
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">
                    Фото подошвы и ногтей (2–3 ракурса)
                  </span>
                </div>
              </div>

              <input 
                type="file" 
                ref={feetFileInputRef} 
                accept="image/*" 
                capture="environment" 
                onChange={handleFeetPhotoUpload} 
                className="hidden" 
              />

              <button
                type="button"
                disabled={isLocked || isUploadingFeetPhoto}
                onClick={() => feetFileInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isUploadingFeetPhoto ? <RefreshCw size={13} className="animate-spin" /> : <Camera size={14} />}
                <span>+ Фото ног</span>
              </button>
            </div>

            {/* Галерея сделанных фото ног */}
            {feetPhotos.length > 0 && (
              <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                {feetPhotos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxImg(url)}
                    className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-amber-300 shrink-0 relative group shadow-2xs cursor-pointer"
                  >
                    <img src={url} alt="Копыто" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Eye size={14} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ежедневный квест для Прэтти: «Обработка височных долей» */}
        {isPretty && (
          <div className="p-3.5 bg-violet-50/80 rounded-2xl border border-violet-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <input 
                type="checkbox"
                id="temporal-quest"
                disabled={isLocked}
                checked={temporalChecked}
                onChange={handleTemporalCheck}
                className="w-5 h-5 rounded-md text-violet-600 focus:ring-violet-500 border-violet-300 cursor-pointer"
              />
              <label htmlFor="temporal-quest" className="cursor-pointer">
                <span className="font-extrabold text-xs text-violet-950 block">
                  Ежедневный квест (Прэтти): Обработка височных долей
                </span>
                <span className="text-[10px] text-violet-700 font-medium">
                  Осмотр секреции и антисептическая обработка
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <input 
                type="file" 
                ref={temporalFileInputRef} 
                accept="image/*" 
                capture="environment" 
                onChange={handleTemporalPhotoUpload} 
                className="hidden" 
              />

              {temporalPhoto ? (
                <button
                  type="button"
                  onClick={() => setLightboxImg(temporalPhoto)}
                  className="w-10 h-10 rounded-xl bg-slate-100 border border-violet-300 overflow-hidden shrink-0 relative group cursor-pointer shadow-2xs"
                  title="Посмотреть фото"
                >
                  <img src={temporalPhoto} alt="Висок" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Eye size={13} />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLocked || isUploadingTemporalPhoto}
                  onClick={() => temporalFileInputRef.current?.click()}
                  className="min-h-[38px] px-3 py-1.5 bg-white hover:bg-violet-100 text-violet-800 border border-violet-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isUploadingTemporalPhoto ? <RefreshCw size={13} className="animate-spin" /> : <Camera size={13} />}
                  <span>Прикрепить фото</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">Хобот и дыхание</h3>
            <p className="text-[11px] text-slate-500">Тонус, дыхание, кончик хобота и выделения</p>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Тонус хобота</div>
            <ChoiceChipGroup options={TRUNK_TONE_OPTIONS} value={metrics.trunk_tone} onChange={(value) => handleChoiceChange('trunk_tone', value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Дыхание</div>
            <ChoiceChipGroup options={BREATHING_OPTIONS} value={metrics.breathing_observation} onChange={(value) => handleChoiceChange('breathing_observation', value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Кончик хобота</div>
            <ChoiceChipGroup options={TRUNK_TIP_OPTIONS} value={metrics.trunk_tip_condition} onChange={(value) => handleChoiceChange('trunk_tip_condition', value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Носовые выделения</div>
            <ChoiceChipGroup options={DISCHARGE_OPTIONS} value={metrics.nasal_discharge} onChange={(value) => handleChoiceChange('nasal_discharge', value)} disabled={isLocked} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-700">Пылевая / грязевая ванна</span>
            <span className="flex items-center gap-2 text-xs font-black text-slate-600">
              <span>{metrics.dust_bathing ? 'Да' : 'Нет'}</span>
              <input
                type="checkbox"
                checked={Boolean(metrics.dust_bathing)}
                disabled={isLocked}
                onChange={(e) => handleBooleanChange('dust_bathing', e.target.checked)}
                className="h-5 w-5 rounded-md border-slate-300 text-emerald-600"
              />
            </span>
          </label>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">Глаза, уши, терморегуляция</h3>
            <p className="text-[11px] text-slate-500">Уши, височные железы и быстрые маркеры по глазам</p>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Работа ушами</div>
            <ChoiceChipGroup options={EAR_OPTIONS} value={metrics.ear_flapping} onChange={(value) => handleChoiceChange('ear_flapping', value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Височные железы</div>
            <ChoiceChipGroup options={TEMPORAL_OPTIONS} value={metrics.temporal_glands} onChange={(value) => handleChoiceChange('temporal_glands', value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Глаза</div>
            <MultiSelectChipGroup options={EYE_OPTIONS} selected={eyeObservations} onToggle={handleEyeToggle} disabled={isLocked} />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">Аппетит и кормление</h3>
            <p className="text-[11px] text-slate-500">Поедаемость, выборочность и риск инородки</p>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Поедаемость</div>
            <ChoiceChipGroup options={FEED_CONSUMPTION_OPTIONS} value={metrics.feed_consumption} onChange={(value) => handleChoiceChange('feed_consumption', value)} disabled={isLocked} />
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-600">Выборочное поедание</span>
            <input
              type="text"
              value={metrics.selective_eating || ''}
              disabled={isLocked}
              onChange={(e) => handleTextChange('selective_eating', e.target.value)}
              placeholder="Напр. съела морковь, кашу оставила"
              className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-700">Подозрение на инородку</span>
            <span className="flex items-center gap-2 text-xs font-black text-slate-600">
              <span>{foreignObjectSuspected ? 'Да' : 'Нет'}</span>
              <input
                type="checkbox"
                checked={foreignObjectSuspected}
                disabled={isLocked}
                onChange={(e) => handleBooleanChange('foreign_object_suspected', e.target.checked)}
                className="h-5 w-5 rounded-md border-slate-300 text-rose-600"
              />
            </span>
          </label>
          {foreignObjectSuspected && (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-600">Примечание</span>
              <textarea
                value={metrics.foreign_object_note || ''}
                disabled={isLocked}
                onChange={(e) => handleTextChange('foreign_object_note', e.target.value)}
                rows={3}
                placeholder="Что жевала / где заметили"
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-rose-400 resize-none"
              />
            </label>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">Вет и ноги</h3>
            <p className="text-[11px] text-slate-500">Походка, конечность и теплота копыта/венчика</p>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Походка</div>
            <ChoiceChipGroup options={GAIT_OPTIONS} value={metrics.gait_assessment} onChange={(value) => handleChoiceChange('gait_assessment', value)} disabled={isLocked} />
          </div>
          {needsFavoredLeg && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-600">Какая нога</div>
              <ChoiceChipGroup options={['ПП', 'ПЗ', 'ЛП', 'ЛЗ']} value={metrics.favored_leg} onChange={(value) => handleChoiceChange('favored_leg', value)} disabled={isLocked} />
            </div>
          )}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Копытный башмак / венчик</div>
            <ChoiceChipGroup options={HOOF_WARMTH_OPTIONS} value={metrics.hoof_warmth} onChange={(value) => handleChoiceChange('hoof_warmth', value)} disabled={isLocked} />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">Манеж / репетиция</h3>
          <p className="text-[11px] text-slate-500">Реакция на команду, кипера и новые раздражители</p>
        </div>
        <ChoiceChipGroup options={ARENA_REACTION_OPTIONS} value={metrics.arena_reaction} onChange={(value) => handleChoiceChange('arena_reaction', value)} disabled={isLocked} />
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-[28px] overflow-hidden p-2 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <img src={lightboxImg} alt="Просмотр фото" className="max-h-[75vh] w-auto object-contain rounded-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}
