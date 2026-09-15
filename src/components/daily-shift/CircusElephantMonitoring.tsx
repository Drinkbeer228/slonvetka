import React, { useState, useRef } from 'react';
import { 
  Sparkles, AlertTriangle, Camera, Check, Clock, 
  RotateCw, RefreshCw, Eye, X, Upload, Activity, ShieldAlert
} from 'lucide-react';
import { Elephant } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

interface CircusElephantMonitoringProps {
  elephant: Elephant;
  selectedDate: string;
  notes: string;
  isLocked?: boolean;
  onAppendLog: (logText: string) => void;
  onAddMediaLog?: (logText: string, photoDataUrl: string) => void;
}

// 1. Стереотипии по слонам
const STEREOTYPY_PRESETS: Record<string, string[]> = {
  margo: ['Круги по вольеру', 'Вертит хоботом'],
  pretty: ['Качает головой'],
  odri: ['Поиск движения / Беспокойство'],
};

// 2. Триггеры / Причины стереотипий
const STEREOTYPY_TRIGGERS = [
  'Перед пайкой',
  'Шум / Монтаж',
  'Скука / Фоновое',
  'После манежа',
];

// 3. Ноги для мониторинга
const FEET_LIST = [
  { id: 'ПП', label: 'ПП (Правая передняя)' },
  { id: 'ЛП', label: 'ЛП (Левая передняя)' },
  { id: 'ПЗ', label: 'ПЗ (Правая задняя)' },
  { id: 'ЛЗ', label: 'ЛЗ (Левая задняя)' },
];

export function CircusElephantMonitoring({
  elephant,
  selectedDate,
  notes,
  isLocked = false,
  onAppendLog,
  onAddMediaLog,
}: CircusElephantMonitoringProps) {
  // Стереотипии: выбранное действие для микро-выбора причины
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

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

  // 1. Стереотипия: фиксация действия и триггера
  const handleSelectStereotypy = (action: string, trigger: string) => {
    if (isLocked) return;
    handleHaptic(15);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    onAppendLog(`[${timeStr} Стереотипия]: ${elephant.name} — ${action} (Триггер: ${trigger})`);
    setSelectedAction(null);
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

  const elephantStereotypies = STEREOTYPY_PRESETS[elephant.id] || ['Беспокойство / Пайка'];

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
      
      {/* 1. ИНДИВИДУАЛЬНЫЕ СТЕРЕОТИПИИ (СВЯЗКА «ФАКТ + ПРИЧИНА») */}
      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🌀</span>
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">
              Стереотипии: {elephant.name}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Факт → Триггер
          </span>
        </div>

        {/* Действия (стереотипии для конкретного слона) */}
        <div className="flex items-center gap-2 flex-wrap">
          {elephantStereotypies.map(action => {
            const isSelected = selectedAction === action;
            return (
              <button
                key={action}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  handleHaptic(10);
                  setSelectedAction(isSelected ? null : action);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <span>{action}</span>
              </button>
            );
          })}
        </div>

        {/* Микро-выбор причины / триггера при клике на действие */}
        {selectedAction && (
           <div className="p-3 bg-indigo-50/90 rounded-2xl border border-indigo-200/80 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-[11px] font-black text-indigo-900">
              <span>Причина стереотипии «{selectedAction}»:</span>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="text-indigo-500 hover:text-indigo-800 p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {STEREOTYPY_TRIGGERS.map(trigger => (
                <button
                  key={trigger}
                  type="button"
                  onClick={() => handleSelectStereotypy(selectedAction, trigger)}
                  className="min-h-[44px] px-2.5 py-2 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-[11px] font-extrabold transition-all active:scale-95 text-center cursor-pointer shadow-2xs"
                >
                  {trigger}
                </button>
              ))}
            </div>
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
