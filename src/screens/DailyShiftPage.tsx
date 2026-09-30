import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { DailyShift, ElephantDailyMetrics, createDefaultElephantMetrics } from '../types/shift';
import { ClipboardList, ChevronDown, Plus, Minus, X } from 'lucide-react';
import { FodderStorageSlide } from '../components/daily-shift/FodderStorageSlide';
import { KitchenSlide } from '../components/daily-shift/KitchenSlide';
import { HouseholdSlide } from '../components/daily-shift/HouseholdSlide';
import { ShiftCalendarSlide } from '../components/daily-shift/ShiftCalendarSlide';
import { MenuServiceSlide } from '../components/daily-shift/MenuServiceSlide';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { normalizeElephantSlug } from '../utils/elephantUtils';

export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { elephants, setActiveElephantId, fodderInventory, updateFodderAmount, deductFodderKg } = useStore();
  const [shift] = useState<DailyShift | null>(null);
  
  // 1. GLOBAL NAVIGATION: 4 TABS IN BOTTOM BAR
  // 'shift' (3 operational screens) | 'storage' (Склад) | 'calendar' (График) | 'menu' (Настройки)
  const [globalTab, setGlobalTab] = useLocalStorage<'shift' | 'storage' | 'calendar' | 'menu'>('slonovet_global_tab', 'shift');

  // 2. OPERATIONAL REEL: ONLY 3 SCREENS (0: Обход и Здоровье, 1: Кухня и Фураж, 2: Хозяйство и ТБ)
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

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Common Event Logger
  const addEvent = (title: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEvents(prev => [{ time: timeStr, title }, ...prev]);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Unified Camera
  const cameraRef = useRef<HTMLInputElement>(null);
  const [cameraSource, setCameraSource] = useState<string | null>(null);

  const triggerCamera = (source: string) => {
    setCameraSource(source);
    cameraRef.current?.click();
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && cameraSource) {
      addEvent(`Фото добавлено (${cameraSource})`);
      setCameraSource(null);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  // ---------------------------------------------------------
  // SLIDE 0: ОБХОД И ЗДОРОВЬЕ
  // ---------------------------------------------------------
  type SleepPhase = { id: number, hours: number, time: string };

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
  const [sleepPhases, setSleepPhases] = useLocalStorage<Record<string, SleepPhase[]>>(
    'slonovet_physio_sleep_phases',
    { margo: [], audrey: [], pretty: [] }
  );
  const [showSymptomAccordion, setShowSymptomAccordion] = useState(false);
  const [lameness, setLameness] = useLocalStorage<Record<string, string[]>>(
    'slonovet_physio_lameness',
    { margo: [], audrey: [], pretty: [] }
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

    setSleepPhases({
      margo: [{ id: Date.now(), hours: 4, time: 'ночь 4ч' }],
      audrey: [{ id: Date.now() + 1, hours: 4, time: 'ночь 4ч' }],
      pretty: [{ id: Date.now() + 2, hours: 4, time: 'ночь 4ч' }]
    });

    addEvent('✓ Утренний обход: Норма по всем 3 слонам (кал 4, моча 3, сон 4ч)');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  // Quick sleep chips (3ч, 4ч, 5ч, Беспокойно)
  const handleSetQuickSleep = (elephantId: string, hours: number, flag: 'normal' | 'restless') => {
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const elName = nameMap[elephantId];

    setSleepPhases(prev => {
      const updated = { ...prev };
      updated[elephantId] = [{ 
        id: Date.now(), 
        hours, 
        time: flag === 'restless' ? 'ночь (беспокойно)' : `ночь ${hours}ч` 
      }];
      return updated;
    });

    if (flag === 'restless') {
      addEvent(`⚠️ Зафиксирован беспокойный сон (${elName}, ${hours}ч)`);
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    } else {
      addEvent(`💤 Сон зафиксирован (${elName}, ${hours}ч)`);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  const getElephantTotalSleep = (elephantId: string) => {
    const phases = sleepPhases[elephantId] || [];
    if (phases.length === 0) return 0;
    return phases.reduce((sum, p) => sum + p.hours, 0);
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
  // SLIDE 1 SUB-TAB: 'kitchen' | 'roughage'
  // ---------------------------------------------------------
  const [slide1SubTab, setSlide1SubTab] = useState<'kitchen' | 'roughage'>('kitchen');

  // Roughage state
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

  const getFodderTotal = (parentId: string) => {
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

  const slideWrapperClass = "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-slate-100";

  const roughageContent = (
    <div className="flex flex-col gap-2 max-w-lg mx-auto w-full pt-1 pb-3">
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300 truncate">
          Фураж на складе: Тюки {getFodderTotal('bales')} | Рулоны {getFodderTotal('rolls')} | Ветки {getFodderTotal('browse')}
        </span>
        <span className="text-[9.5px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
          В течение дня
        </span>
      </div>

      {/* 3 Roughage items */}
      <div className="grid grid-cols-3 gap-1.5 w-full">
        {[
          { id: 'bales', parentId: 'bales', label: 'Тюки', selectedId: selectedBaleId, state: distributed.bales, color: 'emerald' },
          { id: 'rolls', parentId: 'rolls', label: 'Рулоны', selectedId: selectedRollId, state: distributed.rolls, color: 'amber' },
          { id: 'branches', parentId: 'browse', label: 'Ветки', selectedId: selectedBranchId, state: distributed.branches, color: 'sky' }
        ].map(item => {
          const selectedItem = fodderInventory.find(i => i.id === item.selectedId);
          const options = fodderInventory.filter(i => i.parentId === item.parentId);
          
          return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col items-center relative">
              <button 
                type="button"
                onClick={() => setActiveFodderDropdown(activeFodderDropdown === item.id ? null : item.id as any)}
                className="w-full mb-1.5 bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 flex flex-col items-center active:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="text-[9.5px] font-bold text-slate-400">{item.label}</span>
                <span className="text-[10px] font-bold text-slate-200 text-center leading-tight truncate w-full">
                  {selectedItem?.name || 'Выбрать'} ▾
                </span>
              </button>

              {activeFodderDropdown === item.id && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl flex flex-col gap-1 w-[130%] -ml-[15%] max-h-56 overflow-y-auto">
                  {options.map(opt => (
                    <button 
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'bales') setSelectedBaleId(opt.id);
                        if (item.id === 'rolls') setSelectedRollId(opt.id);
                        if (item.id === 'branches') setSelectedBranchId(opt.id);
                        setActiveFodderDropdown(null);
                      }}
                      className="text-left flex flex-col px-2 py-1.5 rounded-lg bg-slate-900 active:bg-slate-700 cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-slate-200">{opt.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col w-full rounded-lg overflow-hidden border border-slate-800">
                <button 
                  type="button"
                  onClick={() => incDist(item.id as any, 1)} 
                  className={`flex items-center justify-center py-2.5 w-full bg-${item.color}-900/40 text-${item.color}-500 active:brightness-125 transition-all cursor-pointer`}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="bg-slate-900/80 py-1.5 flex items-center justify-center text-xl font-bold text-white">
                  {item.state}
                </div>
                <button 
                  type="button"
                  onClick={() => incDist(item.id as any, -1)} 
                  className="flex items-center justify-center py-1.5 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hay Quality */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button 
            type="button"
            onClick={() => setHayQuality(p => p === 'dusty' ? 'normal' : 'dusty')} 
            className={`h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer ${hayQuality === 'dusty' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            ⚠️ Пыльное / Сухое
          </button>
          <button 
            type="button"
            onClick={() => { setHayQuality('moldy'); triggerCamera('moldy_hay'); }} 
            className={`h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer ${hayQuality === 'moldy' ? 'bg-rose-900/40 text-rose-400 border-rose-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            🍄 Плесень (+ 📷)
          </button>
        </div>

        {hayQuality === 'dusty' && (
          <button 
            type="button"
            onClick={() => setHayWatered(!hayWatered)} 
            className={`h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer ${hayWatered ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            {hayWatered ? '💧 Сено пролито водой' : '💧 Пролить сено водой?'}
          </button>
        )}
      </div>
    </div>
  );

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

      {/* ULTRA-MINIMALISTIC GLOBAL HEADER (ONLY AVATAR, 3 OPERATIONAL PROGRESS SEGMENTS & SYSTEM TIME) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent px-3 pt-[calc(env(safe-area-inset-top)+0.4rem)] pb-1.5 pointer-events-auto">
        <div className="flex items-center gap-2.5 max-w-lg mx-auto w-full">
          {/* Avatar / Profile Quick Switch */}
          <button
            type="button"
            onClick={() => { setGlobalTab('menu'); triggerSwipeHaptic(); }}
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-sm text-white font-black text-xs shrink-0 active:scale-95 transition-transform cursor-pointer border border-emerald-400/40"
            title="Меню и профиль кипера"
            aria-label="Меню"
          >
            SL
          </button>

          {/* Progress Strip: 3 Operational Slides if in Shift, or Current Tab Label */}
          {globalTab === 'shift' ? (
            <div className="flex items-center gap-1 flex-1 py-1">
              {[
                { id: 0, label: 'Обход' },
                { id: 1, label: 'Кухня' },
                { id: 2, label: 'Хозяйство' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSlide(s.id)}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlideIndex === s.id
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={s.label}
                  aria-label={s.label}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {globalTab === 'storage' && '📦 Склад кормов'}
                {globalTab === 'calendar' && '📅 График смен'}
                {globalTab === 'menu' && '⚙️ Сервис и Настройки'}
              </span>
            </div>
          )}

          {/* System Time */}
          <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-slate-300">
              {new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* FLOATING LOG BADGE (ACCESSIBLE ABOVE BOTTOM BAR) */}
      <button 
        type="button"
        onClick={() => setLogOpen(true)} 
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] right-3 z-30 pointer-events-auto shadow-2xl flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border border-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer"
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
            {/* SLIDE 0: ОБХОД И ЗДОРОВЬЕ (С ОДНОКЛИКОВОЙ НОРМОЙ И БЫСТРЫМ СНОМ) */}
            {/* ---------------------------------------------------------------- */}
            <div className={slideWrapperClass}>
              <div className="flex flex-col gap-2 max-w-lg mx-auto w-full">
                
                {/* 0. HEADER */}
                <div className="flex items-center justify-between shrink-0 mb-0.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
                      <span>🩺</span>
                      <span>Обход и Здоровье</span>
                    </h1>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                      ЖКТ, Сон & Вет-тренинг
                    </span>
                  </div>
                </div>

                {/* 1. БОЛЬШАЯ ЗЕЛЕНАЯ КНОПКА: УТРЕННИЙ ОБХОД НОРМА (ВСЕ 3 СЛОНА) */}
                <button
                  type="button"
                  onClick={handleQuickMorningBaseline}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all border border-emerald-400/40"
                >
                  <span className="text-base leading-none">✓</span>
                  <span>Утренний обход: Норма (все 3 слона)</span>
                </button>

                {/* 2. ELEPHANT SWITCHER */}
                <div className="grid grid-cols-3 gap-1.5 w-full p-1 bg-slate-900 border border-slate-800 rounded-xl">
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

                {/* 3. КОМПАКТНЫЙ БЛОК: МЕДИЦИНА И ВЕТ-ТРЕНИНГ */}
                <div className="grid grid-cols-2 gap-1.5 w-full p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => toggleMeds(selectedPhysioElephant)}
                    className={`h-8 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
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
                    onClick={() => toggleVetTraining(selectedPhysioElephant)}
                    className={`h-8 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
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

                {/* 4. МЕТРИКИ ФИЗИОЛОГИИ: КАЛ, МОЧА И БЫСТРЫЙ СОН В 1 КЛИК */}
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {/* Poop */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col shadow-sm">
                    <div className="text-[11px] font-bold text-slate-200 mb-1 text-center">
                      💩 Кал
                    </div>
                    <div className="flex flex-col w-full rounded-lg overflow-hidden border border-slate-800 mb-1.5">
                      <button 
                        type="button"
                        onClick={handleAddPoop} 
                        className="flex items-center justify-center py-2 w-full bg-amber-900/40 text-amber-500 active:brightness-125 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="bg-slate-900/80 py-1 flex items-center justify-center text-xl font-bold text-white">
                        {metrics[selectedPhysioElephant]?.poop_count || 0}
                      </div>
                      <button 
                        type="button"
                        onClick={() => incrementMetric(selectedPhysioElephant, 'poop_count', -1)} 
                        className="flex items-center justify-center py-1.5 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <button 
                        type="button"
                        onClick={() => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'dense'}))} 
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${stoolTraits[selectedPhysioElephant] !== 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Плотный
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'liquid'}))} 
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${stoolTraits[selectedPhysioElephant] === 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
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
                        onClick={handleAddUrine} 
                        className="flex items-center justify-center py-2 w-full bg-sky-900/40 text-sky-500 active:brightness-125 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="bg-slate-900/80 py-1 flex items-center justify-center text-xl font-bold text-white">
                        {metrics[selectedPhysioElephant]?.urination_count || 0}
                      </div>
                      <button 
                        type="button"
                        onClick={() => incrementMetric(selectedPhysioElephant, 'urination_count', -1)} 
                        className="flex items-center justify-center py-1.5 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-auto">
                      <button 
                        type="button"
                        onClick={() => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'light'}))} 
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${urineTraits[selectedPhysioElephant] !== 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Светлая
                      </button>
                      <button 
                        type="button"
                        onClick={() => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'sediment'}))} 
                        className={`h-7 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${urineTraits[selectedPhysioElephant] === 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Осадок
                      </button>
                    </div>
                  </div>

                  {/* Sleep Fast Chips (Без покликового набора) */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col shadow-sm">
                    <div className="text-[11px] font-bold text-slate-200 mb-1 text-center flex items-center justify-center gap-1">
                      <span>💤 Сон:</span>
                      <span className="font-mono text-indigo-400 font-black">
                        {getElephantTotalSleep(selectedPhysioElephant)}ч
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mb-1">
                      {[
                        { label: '3ч', hours: 3, flag: 'normal' },
                        { label: '4ч', hours: 4, flag: 'normal' },
                        { label: '5ч', hours: 5, flag: 'normal' },
                        { label: '⚠️ Сбой', hours: 1.5, flag: 'restless' }
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => handleSetQuickSleep(selectedPhysioElephant, chip.hours, chip.flag as any)}
                          className="h-7 rounded-md bg-slate-950 hover:bg-indigo-950/60 active:scale-95 border border-slate-800 text-[10px] font-black text-indigo-300 transition-all cursor-pointer px-1 text-center"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Display recorded sleep phases */}
                    {(sleepPhases[selectedPhysioElephant]?.length || 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {sleepPhases[selectedPhysioElephant].map((phase) => (
                          <div key={phase.id} className="flex items-center gap-1 bg-indigo-950/50 border border-indigo-900 text-indigo-300 px-1 py-0.5 rounded text-[8.5px] font-bold">
                            <span>{phase.time}: {phase.hours}ч</span>
                            <button 
                              type="button"
                              onClick={() => setSleepPhases(p => ({...p, [selectedPhysioElephant]: p[selectedPhysioElephant].filter(ph => ph.id !== phase.id)}))}
                              className="text-rose-400 active:scale-90"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. SYMPTOM ACCORDION (LAMENESS & WOUND) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-sm">
                  <button 
                    type="button"
                    onClick={() => setShowSymptomAccordion(!showSymptomAccordion)} 
                    className="w-full flex items-center justify-between text-rose-400 font-bold text-xs cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Зафиксировать болячку / травму / хромоту</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSymptomAccordion ? 'rotate-180' : ''}`} />
                  </button>

                  {showSymptomAccordion && (
                    <div className="pt-2 mt-2 border-t border-slate-800 animate-in fade-in flex flex-col gap-2">
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 mb-1 block">Хромота (без фото):</span>
                        <div className="grid grid-cols-4 gap-1">
                          {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(leg => {
                            const isActive = lameness[selectedPhysioElephant]?.includes(leg);
                            return (
                              <button 
                                key={leg}
                                type="button"
                                onClick={() => {
                                  const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
                                  if (!isActive) addEvent(`Хромота ${leg} (${nameMap[selectedPhysioElephant]}) ⚠️`);
                                  setLameness(p => {
                                    const cur = p[selectedPhysioElephant] || [];
                                    return { ...p, [selectedPhysioElephant]: isActive ? cur.filter(l => l !== leg) : [...cur, leg] };
                                  });
                                  if (navigator.vibrate) navigator.vibrate([30]);
                                }}
                                className={`h-8 border rounded-lg text-[10px] font-bold active:scale-95 transition-all cursor-pointer ${isActive ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                              >
                                {leg}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 mb-1 block">Видимая болячка / рана:</span>
                        <button 
                          type="button"
                          onClick={() => { triggerCamera('wound'); addEvent('Зафиксирована рана/болячка 📷'); }} 
                          className="h-9 w-full bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>📷</span>
                          <span>Снять рану / болячку</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* SLIDE 1: КУХНЯ И ФУРАЖ (ОБЪЕДИНЕННЫЙ ЭКРАН КОРМЛЕНИЯ) */}
            {/* ---------------------------------------------------------------- */}
            <KitchenSlide
              slideWrapperClass={slideWrapperClass}
              fodderInventory={fodderInventory}
              updateFodderAmount={updateFodderAmount}
              deductFodderKg={deductFodderKg}
              addEvent={addEvent}
              feedSubTab={slide1SubTab}
              onFeedSubTabChange={setSlide1SubTab}
              roughageContent={roughageContent}
            />

            {/* ---------------------------------------------------------------- */}
            {/* SLIDE 2: ХОЗЯЙСТВО И ТБ (УХОД, ТАЧКИ НАВОЗА, УЗЛЫ ТБ И ОБОГАЩЕНИЕ) */}
            {/* ---------------------------------------------------------------- */}
            <HouseholdSlide
              slideWrapperClass={slideWrapperClass}
              addEvent={addEvent}
            />

          </div>
        )}

        {/* ADMIN TAB 1: FODDER STORAGE (ОТКРЫВАЕТСЯ ИЗ НИЖНЕГО БАРА) */}
        {globalTab === 'storage' && (
          <div className="w-full h-full overflow-y-auto">
            <FodderStorageSlide slideWrapperClass={slideWrapperClass} />
          </div>
        )}

        {/* ADMIN TAB 2: SHIFT CALENDAR (ОТКРЫВАЕТСЯ ИЗ НИЖНЕГО БАРА) */}
        {globalTab === 'calendar' && (
          <div className="w-full h-full overflow-y-auto">
            <ShiftCalendarSlide slideWrapperClass={slideWrapperClass} addEvent={addEvent} />
          </div>
        )}

        {/* ADMIN TAB 3: MENU & SERVICE (ОТКРЫВАЕТСЯ ИЗ НИЖНЕГО БАРА) */}
        {globalTab === 'menu' && (
          <div className="w-full h-full overflow-y-auto">
            <MenuServiceSlide
              slideWrapperClass={slideWrapperClass}
              onNavigate={onNavigate}
              addEvent={addEvent}
              scrollToSlide={handleMenuNavigateSlide}
            />
          </div>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR: ALWAYS ACCESSIBLE */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1 px-3 pointer-events-auto shadow-2xl">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
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
            <span className="text-[10px] font-black leading-tight">Смена</span>
          </button>

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
