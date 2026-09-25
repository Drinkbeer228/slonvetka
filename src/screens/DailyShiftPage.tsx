import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics, createDefaultElephantMetrics } from '../types/shift';
import { bodyMonitoringService, VetRecommendation } from '../services/bodyMonitoringService';
import { ClipboardList, Plus, Minus, Check, X, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FodderStorageSlide } from '../components/daily-shift/FodderStorageSlide';
import { KitchenSlide } from '../components/daily-shift/KitchenSlide';
import { HouseholdSlide } from '../components/daily-shift/HouseholdSlide';
import { ShiftCalendarSlide } from '../components/daily-shift/ShiftCalendarSlide';
import { MenuServiceSlide } from '../components/daily-shift/MenuServiceSlide';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { normalizeElephantSlug, getElephantName } from '../utils/elephantUtils';
import { useRole } from '../context/RoleContext';

export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { profile, elephants, activeElephantId, setActiveElephantId, selectedDate, setSelectedDate, fodderInventory, updateFodderAmount, deductFodderKg } = useStore();
  const {
    userRole,
    setUserRole,
    roleConfig,
    isAdmin,
    isKeeper,
    isWarehouse,
    isChief,
    isReadOnly,
    canAccessShift,
    canAccessCalendar,
    canViewVetTasks,
  } = useRole();
  const canInteractElephantHouse = isKeeper;
  const [shift, setShift] = useState<DailyShift | null>(null);
  
  // 1. GLOBAL NAVIGATION: 4 TABS IN BOTTOM BAR
  // 'shift' (4 operational screens) | 'storage' (Склад) | 'calendar' (График) | 'menu' (Настройки)
  const [globalTab, setGlobalTab] = useLocalStorage<'shift' | 'storage' | 'calendar' | 'menu'>('slonovet_global_tab', 'shift');

  // Enforce warehouse restriction: warehouse only has storage and menu
  useEffect(() => {
    if (isWarehouse && (globalTab === 'shift' || globalTab === 'calendar')) {
      setGlobalTab('storage');
    }
  }, [isWarehouse, globalTab]);

  // 2. OPERATIONAL REEL: 4 SCREENS (0: Обход и Здоровье, 1: Кухня, 2: Фураж, 3: Хозяйство и ТБ)
  const [currentSlideIndex, setCurrentSlideIndex] = useLocalStorage<number>('slonovet_current_slide_v2', 0);
  
  const [logOpen, setLogOpen] = useState(false);
  const [events, setEvents] = useLocalStorage<any[]>('slonovet_events', []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastReportedSlideRef = useRef<number>(currentSlideIndex);

  const triggerSwipeHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(12); // light, crisp tactile impulse (12ms)
      }
    } catch {}
  };

  // Restore saved slide scroll position on mount
  useEffect(() => {
    if (globalTab === 'shift' && currentSlideIndex > 0) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const width = scrollContainerRef.current.clientWidth;
          scrollContainerRef.current.scrollTo({ left: width * currentSlideIndex, behavior: 'auto' });
          lastReportedSlideRef.current = currentSlideIndex;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [globalTab]);

  const scrollToSlide = (index: number) => {
    const targetIdx = Math.max(0, Math.min(2, index));
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({ left: width * targetIdx, behavior: 'smooth' });
      if (lastReportedSlideRef.current !== targetIdx) {
        lastReportedSlideRef.current = targetIdx;
        setCurrentSlideIndex(targetIdx);
        triggerSwipeHaptic();
      }
    }
  };

  const handleMenuNavigateSlide = (index: number) => {
    setGlobalTab('shift');
    setTimeout(() => {
      scrollToSlide(Math.min(2, Math.max(0, index)));
    }, 50);
  };

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('--:--');

  // Common Event Logger
  const addEvent = (title: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEvents(prev => [{ time: timeStr, title }, ...prev]);
    setLastUpdatedTime(timeStr);
  };

  // Unified Camera
  const cameraRef = useRef<HTMLInputElement>(null);
  const [cameraSource, setCameraSource] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const triggerCamera = (source: string) => {
    setCameraSource(source);
    cameraRef.current?.click();
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && cameraSource) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotos(p => ({ ...p, [cameraSource]: url }));
      addEvent(`Фото добавлено (${cameraSource})`);
      setCameraSource(null);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  // ---------------------------------------------------------
  // SLIDE 0: ОБХОД И ЗДОРОВЬЕ
  // ---------------------------------------------------------
  type SleepStatus = 'normal' | 'restless' | 'no_sleep';

  const [selectedPhysioElephantRaw, setSelectedPhysioElephantRaw] = useLocalStorage<string>(
    'slonovet_active_elephant',
    'margo'
  );

  const selectedPhysioElephant = React.useMemo(() => {
    return normalizeElephantSlug(selectedPhysioElephantRaw, elephants);
  }, [selectedPhysioElephantRaw, elephants]);

  const setSelectedPhysioElephant = (slug: 'margo' | 'audrey' | 'pretty') => {
    setSelectedPhysioElephantRaw(slug);
    const matched = elephants.find(e => normalizeElephantSlug(e.id, elephants) === slug);
    if (matched) {
      setActiveElephantId(matched.id);
    }
  };
  const [metrics, setMetrics] = useLocalStorage<Record<string, ElephantDailyMetrics>>(
    'slonovet_physio_metrics',
    {}
  );
  const [stoolTraits, setStoolTraits] = useLocalStorage<Record<string, 'dense' | 'liquid'>>(
    'slonovet_physio_stool_traits',
    { margo: 'dense', audrey: 'dense', pretty: 'dense' }
  );
  const [urineTraits, setUrineTraits] = useLocalStorage<Record<string, 'light' | 'sediment'>>(
    'slonovet_physio_urine_traits',
    { margo: 'light', audrey: 'light', pretty: 'light' }
  );
  const [sleepStatus, setSleepStatus] = useLocalStorage<Record<string, SleepStatus>>(
    'slonovet_physio_sleep_status',
    { margo: 'normal', audrey: 'normal', pretty: 'normal' }
  );

  // Veterinary medicine & protected contact training states
  const [medsGiven, setMedsGiven] = useLocalStorage<Record<string, boolean>>(
    'slonovet_physio_meds_given',
    { margo: false, audrey: false, pretty: false }
  );
  const [vetTraining, setVetTraining] = useLocalStorage<Record<string, boolean>>(
    'slonovet_physio_vet_training',
    { margo: false, audrey: false, pretty: false }
  );

  const toggleMeds = (elId: string) => {
    const next = !medsGiven[elId];
    setMedsGiven(p => ({ ...p, [elId]: next }));
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    addEvent(next ? `💊 Препараты выданы: ${nameMap[elId]}` : `↩ Отменена выдача препаратов: ${nameMap[elId]}`);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const toggleVetTraining = (elId: string) => {
    const next = !vetTraining[elId];
    setVetTraining(p => ({ ...p, [elId]: next }));
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    addEvent(next ? `🎯 Вет-тренинг (ноги/хобот): ${nameMap[elId]} ✓` : `↩ Отменен статус тренинга: ${nameMap[elId]}`);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // 1-TAP QUICK MORNING BASELINE (HEALTHY STATUS FOR ALL 3 ELEPHANTS)
  const handleQuickMorningBaseline = () => {
    const elephantsList: ('margo' | 'audrey' | 'pretty')[] = ['margo', 'audrey', 'pretty'];
    
    setMetrics(prev => {
      const updated = { ...prev };
      elephantsList.forEach(el => {
        const cur = updated[el] || createDefaultElephantMetrics(el, shift?.id || '');
        updated[el] = {
          ...cur,
          poop_count: Math.max(cur.poop_count as number || 0, 4),
          urination_count: Math.max(cur.urination_count as number || 0, 3),
        };
      });
      return updated;
    });

    setStoolTraits({ margo: 'dense', audrey: 'dense', pretty: 'dense' });
    setUrineTraits({ margo: 'light', audrey: 'light', pretty: 'light' });

    setSleepStatus({
      margo: 'normal',
      audrey: 'normal',
      pretty: 'normal'
    });
    bodyMonitoringService.setElephantException('margo', { didNotSleep: false });
    bodyMonitoringService.setElephantException('audrey', { didNotSleep: false });
    bodyMonitoringService.setElephantException('pretty', { didNotSleep: false });

    addEvent('✓ Утренний обход: Норма по всем 3 слонам (кал, моча, сон 🟢)');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  // Visual sleep evaluation: [ 🟢 Норма ], [ 🟡 Беспокойно ], [ 🔴 Не спала ]
  const handleSetSleepStatus = (elephantId: string, status: SleepStatus) => {
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const elName = nameMap[elephantId] || elephantId;

    setSleepStatus(prev => ({
      ...prev,
      [elephantId]: status
    }));

    bodyMonitoringService.setElephantException(elephantId as any, {
      didNotSleep: status === 'no_sleep'
    });

    if (status === 'normal') {
      addEvent(`💤 Сон: Норма (${elName}) 🟢`);
      if (navigator.vibrate) navigator.vibrate(15);
    } else if (status === 'restless') {
      addEvent(`⚠️ Сон: Беспокойно (${elName}) 🟡`);
      if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
    } else {
      addEvent(`🚨 Не спала ночью: (${elName}) 🔴`);
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    }
  };

  const incrementMetric = (elId: string, key: keyof ElephantDailyMetrics, delta: number) => {
    setMetrics(prev => {
      const current = prev[elId] || createDefaultElephantMetrics(elId, shift?.id || '');
      const newVal = Math.max(0, (current[key] as number) + delta);
      addEvent(`${elId} ${key}: ${newVal}`);
      if (navigator.vibrate) navigator.vibrate(15);
      return { ...prev, [elId]: { ...current, [key]: newVal } };
    });
  };

  const handleAddPoop = () => {
    const isLiquid = stoolTraits[selectedPhysioElephant] === 'liquid';
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const elName = nameMap[selectedPhysioElephant];
    
    setMetrics(prev => {
      const current = prev[selectedPhysioElephant] || createDefaultElephantMetrics(selectedPhysioElephant, shift?.id || '');
      const newVal = (current.poop_count as number) + 1;
      addEvent(isLiquid ? `Жидкий стул (${elName}) ⚠️` : `Нормальная дефекация (${elName})`);
      if (navigator.vibrate) navigator.vibrate(15);
      return { ...prev, [selectedPhysioElephant]: { ...current, poop_count: newVal } };
    });
    
    if (isLiquid) setStoolTraits(p => ({ ...p, [selectedPhysioElephant]: 'dense' }));
  };

  const handleAddUrine = () => {
    const isSediment = urineTraits[selectedPhysioElephant] === 'sediment';
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const elName = nameMap[selectedPhysioElephant];
    
    setMetrics(prev => {
      const current = prev[selectedPhysioElephant] || createDefaultElephantMetrics(selectedPhysioElephant, shift?.id || '');
      const newVal = (current.urination_count as number) + 1;
      addEvent(isSediment ? `Моча с осадком (${elName}) ⚠️` : `Светлая моча (${elName})`);
      if (navigator.vibrate) navigator.vibrate(15);
      return { ...prev, [selectedPhysioElephant]: { ...current, urination_count: newVal } };
    });
    
    if (isSediment) setUrineTraits(p => ({ ...p, [selectedPhysioElephant]: 'light' }));
  };

  // ---------------------------------------------------------
  // SLIDE 2: ROUGHAGE STATE (РАЗДАЧА ГРУБЫХ КОРМОВ)
  // ---------------------------------------------------------
  const [distributed, setDistributed] = useLocalStorage<{ bales: number; rolls: number; branches: number }>(
    'slonovet_roughage_distributed',
    { bales: 0, rolls: 0, branches: 0 }
  );
  const [hayQuality, setHayQuality] = useLocalStorage<'normal' | 'dusty' | 'moldy'>(
    'slonovet_roughage_hay_quality',
    'normal'
  );
  const [hayWatered, setHayWatered] = useLocalStorage<boolean>(
    'slonovet_roughage_hay_watered',
    false
  );
  const [selectedBaleId, setSelectedBaleId] = useState('h2');
  const [selectedRollId, setSelectedRollId] = useState('r2');
  const [selectedBranchId, setSelectedBranchId] = useState('b1');
  const [activeFodderDropdown, setActiveFodderDropdown] = useState<'bales' | 'rolls' | 'branches' | null>(null);

  // ---------------------------------------------------------
  // SLIDE 0: HAY INTAKE PER ELEPHANT & VARIETY SELECTOR
  // ---------------------------------------------------------
  const [hayIntake, setHayIntake] = useLocalStorage<Record<string, { count: number; variety: string }>>(
    'slonovet_hay_intake',
    {
      margo: { count: 0, variety: 'Тимофеевка' },
      audrey: { count: 0, variety: 'Тимофеевка' },
      pretty: { count: 0, variety: 'Тимофеевка' }
    }
  );
  const [activeHayVarietyDropdown, setActiveHayVarietyDropdown] = useState(false);

  const incrementHayIntake = (elephantId: string, delta: number) => {
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const elName = nameMap[elephantId] || elephantId;
    setHayIntake(prev => {
      const cur = prev[elephantId] || { count: 0, variety: 'Тимофеевка' };
      const newCount = Math.max(0, cur.count + delta);
      if (delta > 0) {
        addEvent(`🌾 Сено +1 (${cur.variety}): ${newCount} для ${elName}`);
      } else if (cur.count > 0) {
        addEvent(`🌾 Сено -1 (${cur.variety}): ${newCount} для ${elName}`);
      }
      if (navigator.vibrate) navigator.vibrate(15);
      return {
        ...prev,
        [elephantId]: { ...cur, count: newCount }
      };
    });
  };

  const setHayVariety = (elephantId: string, variety: string) => {
    setHayIntake(prev => ({
      ...prev,
      [elephantId]: { ...(prev[elephantId] || { count: 0, variety: 'Тимофеевка' }), variety }
    }));
    setActiveHayVarietyDropdown(false);
  };

  const getFodderTotal = (parentId: string) => {
    if (parentId === 'hay' || parentId === 'bales') {
      return fodderInventory.filter(i => i.parentId === 'bales' || i.parentId === 'rolls' || i.parentId === 'hay').reduce((acc, item) => acc + item.amount, 0);
    }
    return fodderInventory.filter(i => i.parentId === parentId).reduce((acc, item) => acc + item.amount, 0);
  };

  const incDist = (key: 'bales' | 'rolls' | 'branches', delta: number) => {
    const cv = distributed[key];
    const nv = Math.max(0, cv + delta);
    if (nv === cv) return;
    const diff = nv - cv;

    let selectedId = '';
    if (key === 'bales') selectedId = selectedBaleId;
    if (key === 'rolls') selectedId = selectedRollId;
    if (key === 'branches') selectedId = selectedBranchId;

    const unitMap: any = { bales: 'тюк', rolls: 'рулон', branches: 'ветка/веник' };
    const targetItem = fodderInventory.find(i => i.id === selectedId);
    if (!targetItem) return;

    const remaining = targetItem.amount - diff;
    updateFodderAmount(selectedId, -diff);
    setDistributed(p => ({ ...p, [key]: nv }));
    
    const logName = targetItem.name;
    if (diff > 0) {
      addEvent(`Выдано: ${diff} ${unitMap[key]} (${logName}). На складе: ${remaining} ${targetItem.unit}.`);
    } else {
      addEvent(`Возврат: ${-diff} ${unitMap[key]} (${logName}). На складе: ${remaining} ${targetItem.unit}.`);
    }

    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (lastReportedSlideRef.current !== index) {
      lastReportedSlideRef.current = index;
      setCurrentSlideIndex(index);
      triggerSwipeHaptic();
    }
  };

  const baseSlideWrapperClass = "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-slate-100 transition-colors duration-500";

  // Distinct department atmosphere colors to distinguish different departments
  const slide0WrapperClass = `${baseSlideWrapperClass} bg-gradient-to-b from-[#081e3a] via-slate-950 to-slate-950`; // 📋 Суточная рутина (Сапфир / Лазурь)
  const slide1WrapperClass = `${baseSlideWrapperClass} bg-gradient-to-b from-[#042416] via-slate-950 to-slate-950`; // 🥣 Кухня (Изумруд)
  const slide2WrapperClass = `${baseSlideWrapperClass} bg-gradient-to-b from-[#1c0a2c] via-slate-950 to-slate-950`; // 🧹 Хозяйство и ТБ (Пурпур)
  const storageWrapperClass = `${baseSlideWrapperClass} bg-gradient-to-b from-[#1d1710] via-slate-950 to-slate-950`; // 📦 Склад
  const calendarWrapperClass = `${baseSlideWrapperClass} bg-gradient-to-b from-[#0a1529] via-slate-950 to-slate-950`; // 📅 Календарь

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 select-none overflow-hidden flex flex-col">
      {/* Hidden Camera Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraRef} 
        className="hidden" 
        onChange={handleCameraUpload} 
      />

      {/* ULTRA-MINIMALISTIC PROGRESS STRIP (3 OPERATIONAL SLIDE SEGMENTS IN SLONOVNIK MODE) */}
      {globalTab === 'shift' && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 max-w-xs mx-auto w-full">
            {[
              { id: 0, label: 'Суточная рутина', activeColor: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]' },
              { id: 1, label: 'Кухня', activeColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' },
              { id: 2, label: 'Хозяйство и ТБ', activeColor: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSlide(s.id)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlideIndex === s.id
                    ? s.activeColor
                    : 'bg-slate-800/80 hover:bg-slate-700'
                }`}
                title={s.label}
                aria-label={s.label}
              />
            ))}
          </div>
        </header>
      )}

      {/* FLOATING LOG BADGE (ACCESSIBLE ABOVE BOTTOM ACTION BUTTONS) */}
      <button 
        type="button"
        onClick={() => setLogOpen(true)} 
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+7.75rem)] right-3 z-30 pointer-events-auto shadow-2xl flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border border-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer hover:bg-slate-800"
      >
        <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
        <span>Лента</span>
      </button>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 w-full h-full">
        {globalTab === 'shift' && (
          <div 
            ref={scrollContainerRef} 
            className="w-full h-full flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth touch-pan-x" 
            onScroll={handleScroll}
          >
            {/* ---------------------------------------------------------------- */}
            {/* SLIDE 0: СУТОЧНАЯ РУТИНА (КАЛ, МОЧА, СЕНО, СОН) */}
            {/* ---------------------------------------------------------------- */}
            <div className={slide0WrapperClass}>
              <div className="flex flex-col gap-2 max-w-lg mx-auto w-full">
                
                {/* 0. HEADER */}
                <div className="flex items-center justify-between shrink-0 mb-0.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
                      <span>🐘</span>
                      <span>Слоновник: Рутина</span>
                    </h1>
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-full shrink-0">
                    Физиология и сено
                  </span>
                </div>

                {/* NON-KEEPER RESTRICTION BANNER */}
                {!canInteractElephantHouse && (
                  <div className="bg-amber-950/80 border border-amber-600/50 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">🔒</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-amber-200">Режим просмотра «Слоновник»</span>
                        <span className="text-[10px] text-amber-300/80 leading-tight">Взаимодействовать могут только киперы ({roleConfig.shortLabel})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserRole('keeper');
                        addEvent('Переключена роль на Кипер для взаимодействия со слоновником');
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] shrink-0 active:scale-95 transition-all shadow cursor-pointer"
                    >
                      Стать кипером
                    </button>
                  </div>
                )}

                {/* 1. ELEPHANT SWITCHER */}
                <div className="grid grid-cols-3 gap-1.5 w-full p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                  {[
                    { id: 'margo', label: 'Марго', color: 'bg-emerald-400' },
                    { id: 'audrey', label: 'Одри', color: 'bg-amber-400' },
                    { id: 'pretty', label: 'Прэтти', color: 'bg-purple-400' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedPhysioElephant(tab.id as any)}
                      className={`h-9 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                        selectedPhysioElephant === tab.id 
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${tab.color}`} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* 2. МЕТРИКИ РУТИНЫ: КАЛ, МОЧА И СЕНО (С ВЫБОРОМ СОРТА) */}
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {/* Poop */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col shadow-sm">
                    <div className="text-[11px] font-bold text-slate-200 mb-1 text-center">
                      💩 Кал
                    </div>
                    <div className="flex flex-col w-full rounded-lg overflow-hidden border border-slate-800 mb-1.5">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : handleAddPoop} 
                        disabled={!canInteractElephantHouse}
                        className={`flex items-center justify-center py-2 w-full transition-all ${
                          !canInteractElephantHouse ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-amber-900/40 text-amber-500 active:brightness-125 cursor-pointer'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="bg-slate-950/90 py-1 flex items-center justify-center text-xl font-bold font-mono text-white">
                        {metrics[selectedPhysioElephant]?.poop_count || 0}
                      </div>
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => incrementMetric(selectedPhysioElephant, 'poop_count', -1)} 
                        disabled={!canInteractElephantHouse}
                        className={`flex items-center justify-center py-1.5 w-full transition-all ${
                          !canInteractElephantHouse ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-rose-950/20 text-rose-500 active:bg-rose-900/40 cursor-pointer'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'dense'}))} 
                        disabled={!canInteractElephantHouse}
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all ${
                          !canInteractElephantHouse ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${stoolTraits[selectedPhysioElephant] !== 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Плотный
                      </button>
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'liquid'}))} 
                        disabled={!canInteractElephantHouse}
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all ${
                          !canInteractElephantHouse ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${stoolTraits[selectedPhysioElephant] === 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Жидкий
                      </button>
                    </div>
                  </div>

                  {/* Urine */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col shadow-sm">
                    <div className="text-[11px] font-bold text-slate-200 mb-1 text-center">
                      💧 Моча
                    </div>
                    <div className="flex flex-col w-full rounded-lg overflow-hidden border border-slate-800 mb-1.5">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : handleAddUrine} 
                        disabled={!canInteractElephantHouse}
                        className={`flex items-center justify-center py-2 w-full transition-all ${
                          !canInteractElephantHouse ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-sky-900/40 text-sky-500 active:brightness-125 cursor-pointer'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="bg-slate-950/90 py-1 flex items-center justify-center text-xl font-bold font-mono text-white">
                        {metrics[selectedPhysioElephant]?.urination_count || 0}
                      </div>
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => incrementMetric(selectedPhysioElephant, 'urination_count', -1)} 
                        disabled={!canInteractElephantHouse}
                        className={`flex items-center justify-center py-1.5 w-full transition-all ${
                          !canInteractElephantHouse ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-rose-950/20 text-rose-500 active:bg-rose-900/40 cursor-pointer'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'light'}))} 
                        disabled={!canInteractElephantHouse}
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all ${
                          !canInteractElephantHouse ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${urineTraits[selectedPhysioElephant] !== 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Светлая
                      </button>
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'sediment'}))} 
                        disabled={!canInteractElephantHouse}
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all ${
                          !canInteractElephantHouse ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${urineTraits[selectedPhysioElephant] === 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Осадок
                      </button>
                    </div>
                  </div>

                  {/* Hay with variety selector */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col shadow-sm relative">
                    <div className="text-[11px] font-bold text-slate-200 mb-1 text-center">
                      🌾 Сено
                    </div>
                    <div className="flex flex-col w-full rounded-lg overflow-hidden border border-slate-800 mb-1.5">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => incrementHayIntake(selectedPhysioElephant, 1)} 
                        disabled={!canInteractElephantHouse}
                        className={`flex items-center justify-center py-2 w-full transition-all ${
                          !canInteractElephantHouse ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-amber-900/40 text-amber-400 active:brightness-125 cursor-pointer'
                        }`}
                        title="Добавить порцию сена"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="bg-slate-950/90 py-1 flex items-center justify-center text-xl font-bold font-mono text-white">
                        {hayIntake[selectedPhysioElephant]?.count || 0}
                      </div>
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => incrementHayIntake(selectedPhysioElephant, -1)} 
                        disabled={!canInteractElephantHouse || (hayIntake[selectedPhysioElephant]?.count || 0) <= 0}
                        className={`flex items-center justify-center py-1.5 w-full transition-all ${
                          !canInteractElephantHouse || (hayIntake[selectedPhysioElephant]?.count || 0) <= 0 ? 'bg-slate-950 text-slate-600 cursor-not-allowed' : 'bg-rose-950/20 text-rose-500 active:bg-rose-900/40 cursor-pointer'
                        }`}
                        title="Убавить порцию сена"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Variety Dropdown Button */}
                    <div className="relative mt-auto">
                      <button 
                        type="button"
                        onClick={!canInteractElephantHouse ? undefined : () => setActiveHayVarietyDropdown(p => !p)}
                        disabled={!canInteractElephantHouse}
                        className={`w-full h-7 px-1 rounded-md border text-[9.5px] font-bold flex items-center justify-between transition-colors ${
                          !canInteractElephantHouse ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-amber-300 cursor-pointer'
                        }`}
                        title="Выбрать сорт сена"
                      >
                        <span className="truncate">{hayIntake[selectedPhysioElephant]?.variety || 'Тимофеевка'}</span>
                        <span className="text-[8px] text-slate-400 shrink-0 ml-0.5">▾</span>
                      </button>

                      {activeHayVarietyDropdown && canInteractElephantHouse && (
                        <div className="absolute bottom-8 right-0 left-[-40px] z-50 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 min-w-[150px] animate-in fade-in duration-100">
                          <span className="text-[8.5px] font-black uppercase text-slate-400 px-2 py-0.5 border-b border-slate-700/60">
                            Сорт сена:
                          </span>
                          {[
                            'Тимофеевка',
                            'Луговое разнотравье',
                            'Костёр',
                            'Овсяница / злаки',
                            'Люцерна',
                            'Солома овсяная'
                          ].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setHayVariety(selectedPhysioElephant, v)}
                              className={`text-left px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                (hayIntake[selectedPhysioElephant]?.variety || 'Тимофеевка') === v
                                   ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                  : 'text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. А СОН НИЖЕ (РАСПОЛОЖЕН ПОД МЕТРИКАМИ) */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>💤</span>
                      <span>Сон за ночь ({selectedPhysioElephant === 'margo' ? 'Марго' : selectedPhysioElephant === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {sleepStatus[selectedPhysioElephant] === 'normal' ? '🟢 Полноценный' : sleepStatus[selectedPhysioElephant] === 'restless' ? '🟡 Беспокойный' : '🔴 Стоя / без сна'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'normal', label: 'Норма', icon: '🟢', activeCls: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 ring-1 ring-emerald-500/40' },
                      { id: 'restless', label: 'Беспокойно', icon: '🟡', activeCls: 'bg-amber-950/80 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/40' },
                      { id: 'no_sleep', label: 'Не спала', icon: '🔴', activeCls: 'bg-rose-950/80 border-rose-500/70 text-rose-300 ring-1 ring-rose-500/40' },
                    ].map(status => {
                      const isSelected = (sleepStatus[selectedPhysioElephant] || 'normal') === status.id;
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={!canInteractElephantHouse ? undefined : () => handleSetSleepStatus(selectedPhysioElephant, status.id as SleepStatus)}
                          disabled={!canInteractElephantHouse}
                          className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            !canInteractElephantHouse ? 'cursor-not-allowed opacity-75' : 'active:scale-95'
                          } ${
                            isSelected
                              ? `${status.activeCls} font-black shadow-sm`
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs leading-none">{status.icon}</span>
                          <span>{status.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. ВЕТЕРИНАРНЫЕ ЗАДАЧИ (КОМПАКТНО ВНИЗУ ЕСЛИ ЕСТЬ ДОСТУП) */}
                {canViewVetTasks && (
                  <div className="grid grid-cols-2 gap-1.5 w-full p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={!canInteractElephantHouse ? undefined : () => toggleMeds(selectedPhysioElephant)}
                      disabled={!canInteractElephantHouse}
                      className={`h-8 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                        !canInteractElephantHouse ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      } ${
                        medsGiven[selectedPhysioElephant]
                          ? 'bg-teal-950/80 border-teal-500/70 text-teal-200 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1 min-w-0 pr-1 truncate">
                        <span>💊</span>
                        <span className="truncate">Препараты выданы</span>
                      </span>
                      <span className={`text-[10px] font-black shrink-0 ${medsGiven[selectedPhysioElephant] ? 'text-teal-300' : 'text-slate-600'}`}>
                        {medsGiven[selectedPhysioElephant] ? '✓' : '○'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={!canInteractElephantHouse ? undefined : () => toggleVetTraining(selectedPhysioElephant)}
                      disabled={!canInteractElephantHouse}
                      className={`h-8 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all ${
                        !canInteractElephantHouse ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      } ${
                        vetTraining[selectedPhysioElephant]
                          ? 'bg-purple-950/80 border-purple-500/70 text-purple-200 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1 min-w-0 pr-1 truncate">
                        <span>🎯</span>
                        <span className="truncate">Вет-тренинг (ноги)</span>
                      </span>
                      <span className={`text-[10px] font-black shrink-0 ${vetTraining[selectedPhysioElephant] ? 'text-purple-300' : 'text-slate-600'}`}>
                        {vetTraining[selectedPhysioElephant] ? '✓' : '○'}
                      </span>
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* SLIDE 1: КУХНЯ (РАЦИОНЫ И ЗАМЕС) */}
            {/* ---------------------------------------------------------------- */}
            <KitchenSlide
              slideWrapperClass={slide1WrapperClass}
              fodderInventory={fodderInventory}
              updateFodderAmount={updateFodderAmount}
              deductFodderKg={deductFodderKg}
              addEvent={addEvent}
            />

            {/* ---------------------------------------------------------------- */}
            {/* SLIDE 2: ХОЗЯЙСТВО И ТБ (УХОД, ТАЧКИ НАВОЗА, УЗЛЫ ТБ И ОБОГАЩЕНИЕ) */}
            {/* ---------------------------------------------------------------- */}
            <HouseholdSlide
              slideWrapperClass={slide2WrapperClass}
              addEvent={addEvent}
            />

          </div>
        )}

        {/* TAB 1: FODDER STORAGE (РЕЙЛЫ СКЛАДА) */}
        {globalTab === 'storage' && (
          <div className="w-full h-full overflow-hidden">
            <FodderStorageSlide />
          </div>
        )}

        {/* ADMIN TAB 2: SHIFT CALENDAR (ОТКРЫВАЕТСЯ ИЗ НИЖНЕГО БАРА) */}
        {globalTab === 'calendar' && (
          <div className="w-full h-full overflow-y-auto">
            <ShiftCalendarSlide slideWrapperClass={calendarWrapperClass} addEvent={addEvent} />
          </div>
        )}

        {/* ADMIN TAB 3: MENU & SERVICE (ОТКРЫВАЕТСЯ ИЗ НИЖНЕГО БАРА) */}
        {globalTab === 'menu' && (
          <div className="w-full h-full overflow-y-auto">
            <MenuServiceSlide
              slideWrapperClass={baseSlideWrapperClass}
              onNavigate={onNavigate}
              addEvent={addEvent}
              scrollToSlide={handleMenuNavigateSlide}
            />
          </div>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR: ALWAYS ACCESSIBLE */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1 px-3 pointer-events-auto shadow-2xl">
        <div className={`max-w-lg mx-auto grid ${isWarehouse ? 'grid-cols-2' : 'grid-cols-4'} gap-1`}>
          {canAccessShift && (
            <button
              type="button"
              onClick={() => { setGlobalTab('shift'); triggerSwipeHaptic(); }}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                globalTab === 'shift'
                  ? 'text-emerald-400 bg-slate-900 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none mb-0.5">🐘</span>
              <span className="text-[10px] font-black leading-tight">Слоновник</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setGlobalTab('storage'); triggerSwipeHaptic(); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              globalTab === 'storage'
                ? 'text-emerald-400 bg-slate-900 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base leading-none mb-0.5">📦</span>
            <span className="text-[10px] font-black leading-tight">Склад</span>
          </button>

          {canAccessCalendar && (
            <button
              type="button"
              onClick={() => { setGlobalTab('calendar'); triggerSwipeHaptic(); }}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                globalTab === 'calendar'
                  ? 'text-emerald-400 bg-slate-900 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none mb-0.5">📅</span>
              <span className="text-[10px] font-black leading-tight">Календарь</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setGlobalTab('menu'); triggerSwipeHaptic(); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              globalTab === 'menu'
                ? 'text-emerald-400 bg-slate-900 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base leading-none mb-0.5">⚙️</span>
            <span className="text-[10px] font-black leading-tight">Меню</span>
          </button>
        </div>
      </nav>

      {/* EVENT LOG MODAL */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setLogOpen(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl h-2/3 p-4 flex flex-col gap-2 animate-in slide-in-from-bottom border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-slate-100">Лента событий смены</h2>
              <button 
                type="button"
                onClick={() => setLogOpen(false)} 
                className="p-1.5 bg-slate-800 rounded-full text-slate-400 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <div className="text-slate-500 text-center py-10 font-bold text-xs">Событий пока нет</div>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                    <div className="text-emerald-400 text-[10px] font-mono font-bold mb-0.5">{ev.time}</div>
                    <div className="text-slate-200 font-medium text-xs">{ev.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
