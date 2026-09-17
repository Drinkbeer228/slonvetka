import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics, createDefaultElephantMetrics } from '../types/shift';
import { bodyMonitoringService, VetRecommendation } from '../services/bodyMonitoringService';
import { Menu, ClipboardList, ChevronDown, Plus, Minus, Check, X, ChevronRight } from 'lucide-react';
import { FodderStorageSlide } from '../components/daily-shift/FodderStorageSlide';

export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { profile, elephants, selectedDate, setSelectedDate, fodderInventory, updateFodderAmount } = useStore();
  const [shift, setShift] = useState<DailyShift | null>(null);
  
  // App Shell States
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  
  const [events, setEvents] = useState<any[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    }
  };
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('--:--');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Common Event Logger
  const addEvent = (title: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEvents(prev => [{ time: timeStr, title }, ...prev]);
    setLastUpdatedTime(timeStr);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

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
  // REEL 1: PHYSIO
  // ---------------------------------------------------------
  const [selectedPhysioElephant, setSelectedPhysioElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [stoolTraits, setStoolTraits] = useState<Record<string, 'dense' | 'liquid'>>({ margo: 'dense', audrey: 'dense', pretty: 'dense' });
  const [urineTraits, setUrineTraits] = useState<Record<string, 'light' | 'sediment'>>({ margo: 'light', audrey: 'light', pretty: 'light' });
  const [sleepHourInput, setSleepHourInput] = useState(0);
  type SleepPhase = { id: number, hours: number, time: string };
  const [sleepPhases, setSleepPhases] = useState<Record<string, SleepPhase[]>>({ margo: [], audrey: [], pretty: [] });
  const [showSymptomAccordion, setShowSymptomAccordion] = useState(false);
  const [lameness, setLameness] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });

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
    
    // Auto-reset
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
    
    // Auto-reset
    if (isSediment) setUrineTraits(p => ({ ...p, [selectedPhysioElephant]: 'light' }));
  };

  const handleAddPhase = () => {
    if (sleepHourInput <= 0) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newPhase: SleepPhase = { id: Date.now(), hours: sleepHourInput, time: timeStr };
    
    setSleepPhases(p => ({
      ...p,
      [selectedPhysioElephant]: [...(p[selectedPhysioElephant] || []), newPhase]
    }));
    
    const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    addEvent(`Фаза сна (${nameMap[selectedPhysioElephant]}): ${sleepHourInput}ч`);
    setSleepHourInput(0);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // ---------------------------------------------------------
  // REEL 2: ROUGHAGE
  // ---------------------------------------------------------
  const [distributed, setDistributed] = useState({ bales: 0, rolls: 0, branches: 0 });
  const [hayQuality, setHayQuality] = useState<'normal' | 'dusty' | 'moldy'>('normal');
  const [hayWatered, setHayWatered] = useState(false);
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
      addEvent(`Выдано: ${diff} ${unitMap[key]} (${logName}). На складе осталось: ${remaining} ${targetItem.unit}.`);
    } else {
      addEvent(`Возврат на склад: ${-diff} ${unitMap[key]} (${logName}). На складе стало: ${remaining} ${targetItem.unit}.`);
    }

    if (navigator.vibrate) navigator.vibrate(15);
  };

  // ---------------------------------------------------------
  // REEL 3: RATION & WATER
  // ---------------------------------------------------------
  const [dietProblems, setDietProblems] = useState<{slotId: string, elephant: string, reason: string}[]>([]);
  const [openProblemSlot, setOpenProblemSlot] = useState<string | null>(null);
  const [problemForm, setProblemForm] = useState({ elephant: 'margo', reason: '' });
  
  // RATION PRESETS
  const [activeRecipes, setActiveRecipes] = useState<Record<string, string>>({
    m: 'classic_m',
    n: 'classic_n'
  });
  
  const [activeSeasonals, setActiveSeasonals] = useState<string[]>([]);
  const [dispensedSlots, setDispensedSlots] = useState<Record<string, boolean>>({});
  
  const handleDispense = (slotId: string, recipeKey: string, isEvening: boolean, seasonals: string[]) => {
    if (dispensedSlots[slotId]) return;
    
    // Decrement from fodderInventory (updateFodderAmount takes id and delta)
    let logMsg = '';
    
    if (slotId === 'm') {
      if (recipeKey === 'classic_m') { updateFodderAmount('c1', -0.5); updateFodderAmount('c2', -0.3); logMsg = "списано: 0.5 меш овса, 0.3 меш отрубей"; }
      if (recipeKey === 'diet_m') { updateFodderAmount('c4', -0.2); updateFodderAmount('c3', -0.3); logMsg = "списано: 0.2 меш льна, 0.3 меш ВТМ"; }
      if (recipeKey === 'energy_m') { updateFodderAmount('c1', -0.5); updateFodderAmount('c5', -0.5); logMsg = "списано: 0.5 меш овса, 0.5 меш ячменя"; }
    } else if (slotId === 'n') {
      if (recipeKey === 'classic_n') { updateFodderAmount('c3', -0.2); updateFodderAmount('c4', -0.1); logMsg = "списано: 0.2 меш ВТМ, 0.1 меш льна"; }
      if (recipeKey === 'diet_n') { updateFodderAmount('c4', -0.2); logMsg = "списано: 0.2 меш льна"; }
    } else if (isEvening) {
      updateFodderAmount('j1', -15);
      updateFodderAmount('j2', -10);
      updateFodderAmount('j3', -5);
      logMsg = "списано: 15кг моркови, 10кг свёклы, 5кг яблок";
      if (seasonals.includes('🎃 Тыква')) { updateFodderAmount('j4', -5); logMsg += ", 5кг тыквы"; }
    }
    
    const slotMap: any = { m: 'Утренняя запарка', n: 'Обеденный мэш', e: 'Вечерний салат' };
    const recipeNameMap: any = {
      'classic_m': 'Стандарт', 'diet_m': 'Диета', 'energy_m': 'Зима/Энергия',
      'classic_n': 'Мэш с ВТМ', 'diet_n': 'Легкий отвар'
    };
    
    let eventTitle = slotMap[slotId] + ': выдан рацион';
    if (!isEvening) {
      eventTitle += " '" + (recipeNameMap[recipeKey] || 'Базовый') + "'";
    }
    if (logMsg) eventTitle += ", " + logMsg;
    
    addEvent(eventTitle);
    setDispensedSlots(p => ({...p, [slotId]: true}));
  };
  
  const submitDietProblem = () => {
    if (!openProblemSlot || !problemForm.reason) return;
    
    setDietProblems(prev => [...prev, {
      slotId: openProblemSlot,
      elephant: problemForm.elephant,
      reason: problemForm.reason
    }]);
    
    const eleMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const slotMap: any = { m: 'Утро', n: 'Обед', e: 'Вечер' };
    
    addEvent(slotMap[openProblemSlot] + ' • ' + eleMap[problemForm.elephant] + ' — ' + problemForm.reason);
    
    setOpenProblemSlot(null);
    setProblemForm({ elephant: 'margo', reason: '' });
  };

  // ---------------------------------------------------------
  // REEL 4: HANDOVER, CHORES & INCIDENTS
  // ---------------------------------------------------------
  const [washedElephants, setWashedElephants] = useState<string[]>([]);
  const [dungWheelbarrows, setDungWheelbarrows] = useState(0);
  const [brokenTools, setBrokenTools] = useState<string[]>([]);
  const [handoverStep, setHandoverStep] = useState<'outgoing' | 'incoming' | 'completed'>('outgoing');
  const [outgoingChecklist, setOutgoingChecklist] = useState<string[]>(['Поилки вычищены', 'Ночная пайка сена', 'Задвижки заперты', 'Ковры помыты']);
  const [outgoingSlider, setOutgoingSlider] = useState(0);
  const [handoverTime, setHandoverTime] = useState('');

  const toggleBrokenTool = (tool: string) => {
    setBrokenTools(p => {
      if (p.includes(tool)) return p.filter(t => t !== tool);
      addEvent(`Поломка: ${tool}`);
      return [...p, tool];
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (currentSlideIndex !== index) {
      setCurrentSlideIndex(index);
      if (navigator.vibrate) navigator.vibrate(25);
    }
  };

  const slideWrapperClass = "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto overscroll-y-contain px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-28 text-slate-100";

  return (
    <div ref={scrollContainerRef} className="fixed inset-0 w-full h-[100dvh] flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth bg-slate-950 touch-pan-x select-none" onScroll={handleScroll}>
      {/* Hidden Camera Input */}
      <input 
        ref={cameraRef} 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={handleCameraUpload} 
      />

      {/* GLOBAL HEADER & INDICATORS */}
      <div className="fixed top-0 left-0 right-0 z-40 flex flex-col pointer-events-none">
        {/* Stories-style indicators */}
        <div className="flex items-center gap-1.5 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 bg-gradient-to-b from-slate-950/90 to-transparent">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${currentSlideIndex === i ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700/50'}`} />
          ))}
        </div>
        
        {/* Header content */}
        <header className="flex items-center justify-between px-4 pb-2 pointer-events-auto">
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/20 overflow-hidden cursor-pointer active:scale-95 transition-all" onClick={() => setWheelOpen(true)}>
              <div className="text-white font-black text-xl tracking-tighter leading-none mt-0.5 ml-0.5">SL</div>
            </div>
            <div className="relative flex flex-col cursor-pointer active:opacity-70">
              <input type="date" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <h1 className="text-[15px] font-black tracking-tight text-white flex items-center gap-1.5">
                Смена <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </h1>
              <div className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Активна
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all border border-slate-700/50">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
      </div>

      {/* FLOATING LOG BADGE */}
      <button onClick={() => setLogOpen(true)} className="fixed bottom-5 right-4 z-30 pointer-events-auto shadow-2xl flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 text-xs font-medium active:scale-95">
        <ClipboardList className="w-4 h-4 text-emerald-400" />
        Лента
      </button>

      {/* SCREEN 1: PHYSIO */}
      <div className={slideWrapperClass}>
        <div className="flex items-center justify-between gap-2 mb-3 mt-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">🩺 Физиология</h2>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full p-1 bg-slate-900 border border-slate-800 rounded-xl mb-4">
          {[
            { id: 'margo', label: 'Марго', color: 'bg-emerald-400' },
            { id: 'audrey', label: 'Одри', color: 'bg-amber-400' },
            { id: 'pretty', label: 'Прэтти', color: 'bg-purple-400' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedPhysioElephant(tab.id as any)}
              className={`h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 ${selectedPhysioElephant === tab.id ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-400'}`}
            >
              <span className={`w-2 h-2 rounded-full ${tab.color}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          {/* Poop */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col shadow-sm">
            <div className="text-sm font-semibold text-slate-200 mb-2 text-center w-full">
              💩 Кал
            </div>
            <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800 mb-2">
              <button onClick={handleAddPoop} className="flex items-center justify-center py-2.5 w-full bg-amber-900/40 text-amber-500 active:brightness-125 transition-all">
                <Plus className="w-5 h-5" />
              </button>
              <div className="bg-slate-900/80 py-2 flex items-center justify-center text-2xl font-bold text-white">
                {metrics[selectedPhysioElephant]?.poop_count || 0}
              </div>
              <button onClick={() => incrementMetric(selectedPhysioElephant, 'poop_count', -1)} className="flex items-center justify-center py-2 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-auto">
              <button onClick={() => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'dense'}))} className={`h-11 text-[9px] font-bold rounded-xl border transition-all ${stoolTraits[selectedPhysioElephant] !== 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Плотный</button>
              <button onClick={() => setStoolTraits(p => ({...p, [selectedPhysioElephant]: 'liquid'}))} className={`h-11 text-[9px] font-bold rounded-xl border transition-all ${stoolTraits[selectedPhysioElephant] === 'liquid' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Жидкий</button>
            </div>
          </div>

          {/* Urine */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col shadow-sm">
            <div className="text-sm font-semibold text-slate-200 mb-2 text-center w-full">
              💧 Моча
            </div>
            <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800 mb-2">
              <button onClick={handleAddUrine} className="flex items-center justify-center py-2.5 w-full bg-sky-900/40 text-sky-500 active:brightness-125 transition-all">
                <Plus className="w-5 h-5" />
              </button>
              <div className="bg-slate-900/80 py-2 flex items-center justify-center text-2xl font-bold text-white">
                {metrics[selectedPhysioElephant]?.urination_count || 0}
              </div>
              <button onClick={() => incrementMetric(selectedPhysioElephant, 'urination_count', -1)} className="flex items-center justify-center py-2 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-auto">
              <button onClick={() => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'light'}))} className={`h-11 text-[9px] font-bold rounded-xl border transition-all ${urineTraits[selectedPhysioElephant] !== 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Светлая</button>
              <button onClick={() => setUrineTraits(p => ({...p, [selectedPhysioElephant]: 'sediment'}))} className={`h-11 text-[9px] font-bold rounded-xl border transition-all ${urineTraits[selectedPhysioElephant] === 'sediment' ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Осадок</button>
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col shadow-sm">
            <div className="text-sm font-semibold text-slate-200 mb-2 text-center w-full">
              💤 Сон
            </div>
            <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800 mb-2">
              <button onClick={() => setSleepHourInput(p => Math.min(10, p + 0.5))} className="flex items-center justify-center py-2.5 w-full bg-indigo-900/40 text-indigo-500 active:brightness-125 transition-all">
                <Plus className="w-5 h-5" />
              </button>
              <div className="bg-slate-900/80 py-2 flex items-center justify-center text-2xl font-bold text-indigo-300">
                {sleepHourInput}ч
              </div>
              <button onClick={() => setSleepHourInput(p => Math.max(0, p - 0.5))} className="flex items-center justify-center py-2 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={handleAddPhase}
              className="h-11 w-full bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-bold active:scale-95 transition-all"
            >
              🔖 + Фаза
            </button>
            
            {/* Added Phases */}
            {(sleepPhases[selectedPhysioElephant]?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sleepPhases[selectedPhysioElephant].map((phase, i) => (
                  <div key={phase.id} className="flex items-center gap-1 bg-indigo-950/40 border border-indigo-900 text-indigo-300 px-1.5 py-1 rounded text-[10px] font-bold">
                    <span>Ф{i + 1}: {phase.hours}ч</span>
                    <button 
                      onClick={() => setSleepPhases(p => ({...p, [selectedPhysioElephant]: p[selectedPhysioElephant].filter(ph => ph.id !== phase.id)}))}
                      className="text-rose-400 p-0.5 active:scale-90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-4">
          <button onClick={() => setShowSymptomAccordion(!showSymptomAccordion)} className="w-full flex items-center justify-between text-rose-400 font-bold text-sm">
            <span className="flex items-center gap-2">⚠️ Зафиксировать болячку / травму</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSymptomAccordion ? 'rotate-180' : ''}`} />
          </button>
          {showSymptomAccordion && (
            <div className="pt-3 mt-3 border-t border-slate-800 animate-in fade-in flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 mb-1.5 block">Хромота (без фото):</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(leg => {
                    const isActive = lameness[selectedPhysioElephant]?.includes(leg);
                    return (
                      <button 
                        key={leg}
                        onClick={() => {
                          const nameMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
                          if (!isActive) addEvent(`Хромота ${leg} (${nameMap[selectedPhysioElephant]}) ⚠️`);
                          setLameness(p => {
                            const cur = p[selectedPhysioElephant] || [];
                            return { ...p, [selectedPhysioElephant]: isActive ? cur.filter(l => l !== leg) : [...cur, leg] };
                          });
                          if (navigator.vibrate) navigator.vibrate([30]);
                        }}
                        className={`h-10 border rounded-xl text-[10px] font-bold active:scale-95 transition-all ${isActive ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        {leg}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 mb-1.5 block">Видимая болячка / рана:</span>
                <button 
                  onClick={() => { triggerCamera('wound'); addEvent('Зафиксирована рана/болячка 📷'); }} 
                  className="h-11 w-full bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  📷 Снять рану / болячку
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCREEN 2: ROUGHAGE */}
      <div className={slideWrapperClass}>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 mt-1">🌾 Грубые корма</h2>
        
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-300 truncate pr-2">
            Фураж: Тюки {getFodderTotal('bales')} | Рулоны {getFodderTotal('rolls')} | Ветки {getFodderTotal('browse')}...
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          {[
            { id: 'bales', parentId: 'bales', label: 'Тюки', selectedId: selectedBaleId, state: distributed.bales, color: 'emerald' },
            { id: 'rolls', parentId: 'rolls', label: 'Рулоны', selectedId: selectedRollId, state: distributed.rolls, color: 'amber' },
            { id: 'branches', parentId: 'browse', label: 'Ветки', selectedId: selectedBranchId, state: distributed.branches, color: 'sky' }
          ].map(item => {
            const selectedItem = fodderInventory.find(i => i.id === item.selectedId);
            const options = fodderInventory.filter(i => i.parentId === item.parentId);
            
            return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col items-center relative">
              <button 
                onClick={() => setActiveFodderDropdown(activeFodderDropdown === item.id ? null : item.id as any)}
                className="w-full mb-2 bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1.5 flex flex-col items-center active:bg-slate-800 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400 mb-0.5">{item.label}</span>
                <span className="text-[11px] font-bold text-slate-200 flex flex-col items-center gap-0.5 text-center leading-tight">
                  <span className="text-[10px] opacity-80">{selectedItem?.scoreTag || ''}</span>
                  {selectedItem?.name || 'Выбрать'} ▾
                </span>
              </button>

              {activeFodderDropdown === item.id && (
                <div className="absolute top-14 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl flex flex-col gap-1 w-[140%] -ml-[20%] max-h-60 overflow-y-auto">
                  {options.map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => {
                        if (item.id === 'bales') setSelectedBaleId(opt.id);
                        if (item.id === 'rolls') setSelectedRollId(opt.id);
                        if (item.id === 'branches') setSelectedBranchId(opt.id);
                        setActiveFodderDropdown(null);
                      }}
                      className="text-left flex flex-col px-2 py-2 rounded-lg bg-slate-900 active:bg-slate-700"
                    >
                      {opt.scoreTag && <span className="text-[10px] text-slate-400">{opt.scoreTag}</span>}
                      <span className="text-[11px] font-bold text-slate-200">{opt.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800">
                <button onClick={() => incDist(item.id as any, 1)} className={`flex items-center justify-center py-3 w-full bg-${item.color}-900/40 text-${item.color}-500 active:brightness-125 transition-all`}>
                  <Plus className="w-5 h-5" />
                </button>
                <div className="bg-slate-900/80 py-2 flex items-center justify-center text-2xl font-bold text-white">
                  {item.state}
                </div>
                <button onClick={() => incDist(item.id as any, -1)} className="flex items-center justify-center py-2 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all">
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setHayQuality(p => p === 'dusty' ? 'normal' : 'dusty')} className={`h-11 rounded-xl text-xs font-bold border transition-all ${hayQuality === 'dusty' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>⚠️ Пыльное / Сухое</button>
            <button onClick={() => { setHayQuality('moldy'); triggerCamera('moldy_hay'); }} className={`h-11 rounded-xl text-xs font-bold border transition-all ${hayQuality === 'moldy' ? 'bg-rose-900/40 text-rose-400 border-rose-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>🍄 Плесень / Гниль (+ 📷)</button>
          </div>
          {hayQuality === 'dusty' && (
            <button onClick={() => setHayWatered(!hayWatered)} className={`h-11 rounded-xl text-xs font-bold border transition-all animate-in fade-in ${hayWatered ? 'bg-sky-900/40 text-sky-400 border-sky-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              {hayWatered ? '💧 Сено пролито водой' : '💧 Пролить сено водой?'}
            </button>
          )}
        </div>
      </div>

      {/* SCREEN 3: RATION & WATER */}
      <div className={slideWrapperClass}>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 mt-1">🥣 Рацион и Водопой</h2>
        
        <div className="flex flex-col gap-4">
          {[
            { 
              id: 'm', 
              label: 'Утро', 
              desc: 'Запарка', 
              presets: {
                'classic_m': { name: '🥣 Базовая запарка', chips: ['🌾 Овёс 5кг', '🌾 Отруби 2кг', '💊 Wellhorse', '💧 Вода 10л'] },
                'diet_m': { name: '🌱 Диетический мэш', chips: ['🌾 Лён распаренный', '🌾 Отруби', '🌿 ВТМ'] },
                'energy_m': { name: '⚡ Зимний / Энергия', chips: ['🌾 Овёс', '🌾 Ячмень плющеный', '🌻 Жмых', '🌿 ВТМ'] }
              }
            },
            { 
              id: 'n', 
              label: 'Обед', 
              desc: 'Мэш', 
              presets: {
                'classic_n': { name: '🍵 Тёплый льняной отвар / Мэш', chips: ['🌿 ВТМ', '🌾 Лён', '💧 Тёплый отвар'] },
                'diet_n': { name: '🌱 Легкий мэш', chips: ['🌾 Лён', '💧 Больше воды'] }
              }
            },
            { 
              id: 'e', 
              label: 'Вечер', 
              desc: 'Сочный салат',
              isEvening: true,
              chips: ['🥕 Морковь', '🍎 Яблоки', '🟣 Свёкла']
            }
          ].map(slot => {
            const slotProblems = dietProblems.filter(p => p.slotId === slot.id);
            const eleMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
            const activePreset = slot.presets ? slot.presets[activeRecipes[slot.id] || Object.keys(slot.presets)[0]] : null;
            const chipsToRender = slot.isEvening ? slot.chips : activePreset?.chips;
            
            return (
            <div key={slot.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col gap-3 shadow-sm shrink-0">
              <div className="flex flex-col gap-2">
                <span className="text-base font-black text-slate-100">{slot.label} <span className="text-slate-500 font-bold text-sm">({slot.desc})</span></span>
                
                {slot.presets && (
                  <div className="relative group">
                    <select 
                      className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/50"
                      value={activeRecipes[slot.id] || Object.keys(slot.presets)[0]}
                      onChange={(e) => setActiveRecipes(p => ({...p, [slot.id]: e.target.value}))}
                    >
                      {Object.entries(slot.presets).map(([k, v]) => (
                        <option key={k} value={k}>{v.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-1">
                {chipsToRender?.map((chip: string) => (
                  <span key={chip} className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg">
                    {chip}
                  </span>
                ))}
              </div>

              {slot.isEvening && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/50">
                  {['🎃 Тыква', '🍉 Арбуз', '🥒 Кабачки', '🍌 Бананы'].map(s => {
                    const isActive = activeSeasonals.includes(s);
                    return (
                      <button 
                        key={s}
                        onClick={() => setActiveSeasonals(p => isActive ? p.filter(i => i !== s) : [...p, s])}
                        className={'px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ' + (isActive ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800/50 text-slate-400')}
                      >
                        + {s}
                      </button>
                    )
                  })}
                </div>
              )}
              
              <button
                disabled={dispensedSlots[slot.id]}
                onClick={() => handleDispense(slot.id, activeRecipes[slot.id] || (slot.presets ? Object.keys(slot.presets)[0] : ''), slot.isEvening || false, activeSeasonals)}
                className={"w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center transition-all " + (dispensedSlots[slot.id] ? 'bg-slate-950 text-emerald-500/50 border border-emerald-900/30' : 'bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 hover:bg-slate-700')}
              >
                {dispensedSlots[slot.id] ? '✓ Выдано и списано' : '✓ Выдать и списать со склада'}
              </button>
              
              {slotProblems.length > 0 && (
                <div className="flex flex-col gap-2 mt-1 mb-2 border-t border-slate-800/50 pt-3">
                  {slotProblems.map((prob, idx) => (
                    <div key={idx} className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-2.5 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⚠️</span>
                      <div>
                        <span className="text-amber-400 font-bold text-xs block">{eleMap[prob.elephant]}</span>
                        <span className="text-amber-200/70 font-semibold text-xs">{prob.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {openProblemSlot === slot.id ? (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Кто?</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['margo', 'audrey', 'pretty'].map(el => (
                        <button
                          key={el}
                          onClick={() => setProblemForm(p => ({...p, elephant: el}))}
                          className={'h-10 rounded-xl text-xs font-bold border transition-all ' + (problemForm.elephant === el ? 'bg-amber-600/30 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400')}
                        >
                          {eleMap[el]}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Что случилось?</span>
                    <div className="flex flex-wrap gap-2">
                      {['🥣 Съела половину', '❌ Полный отказ', '💢 Отогнали от таза', '💧 Не пьёт воду', '💊 Выплюнула добавку'].map(reason => (
                        <button
                          key={reason}
                          onClick={() => setProblemForm(p => ({...p, reason}))}
                          className={'px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ' + (problemForm.reason === reason ? 'bg-rose-600/30 border-rose-500/50 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400')}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setOpenProblemSlot(null)} className="flex-1 h-11 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs">
                      Отмена
                    </button>
                    <button 
                      onClick={submitDietProblem}
                      disabled={!problemForm.reason}
                      className="flex-[2] h-11 bg-rose-500 text-rose-950 rounded-xl font-black text-xs disabled:opacity-50 transition-all active:scale-95"
                    >
                      Зафиксировать в лог
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-t border-slate-800/50 pt-3 mt-1">
                  <div className="flex-1 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-center items-center">
                    <span className="text-emerald-500 text-lg mb-1">🟢</span>
                    <span className="text-emerald-400/80 font-bold text-[10px] text-center leading-tight">Все слонихи: аппетит и<br/>водопой в норме</span>
                  </div>
                  <button 
                    onClick={() => { setOpenProblemSlot(slot.id); setProblemForm({ elephant: 'margo', reason: '' }); }}
                    className="w-16 h-full min-h-[72px] shrink-0 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/30 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <span className="text-amber-500 text-lg">⚠️</span>
                    <span className="text-amber-500/80 font-bold text-[9px] text-center leading-tight">Отклонение</span>
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>

      {/* SCREEN 4: FODDER */}
      <FodderStorageSlide slideWrapperClass={slideWrapperClass} />

      {/* SCREEN 5: HANDOVER, CHORES & INCIDENTS */}
      <div className={slideWrapperClass}>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-4 mt-1">📋 Хозработы и Сдача</h2>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl mb-4">
          <span className="text-xs font-black text-slate-200 block mb-2">🚿 Помывка слонов</span>
          <div className="grid grid-cols-3 gap-2">
            {['margo', 'audrey', 'pretty'].map(el => {
              const labels: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
              const isActive = washedElephants.includes(el);
              return (
                <button
                  key={el}
                  onClick={() => setWashedElephants(p => isActive ? p.filter(i => i !== el) : [...p, el])}
                  className={`h-11 rounded-xl text-xs font-bold border transition-all ${isActive ? 'bg-sky-600/30 border-sky-500/50 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  🐘 {labels[el]} {isActive && '✓'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 mb-2">Навоз (тачек)</span>
            <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800">
              <button onClick={() => setDungWheelbarrows(p => p + 1)} className="flex items-center justify-center py-2.5 w-full bg-emerald-900/40 text-emerald-500 active:brightness-125 transition-all">
                <Plus className="w-5 h-5" />
              </button>
              <div className="bg-slate-900/80 py-2 flex items-center justify-center text-2xl font-bold text-white">
                {dungWheelbarrows}
              </div>
              <button onClick={() => setDungWheelbarrows(p => Math.max(0, p - 1))} className="flex items-center justify-center py-2 w-full bg-rose-950/20 text-rose-500 active:bg-rose-900/40 transition-all">
                <Minus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 mb-2 text-center">Поломки (1 тап)</span>
            <div className="grid grid-cols-2 gap-1.5 flex-1">
              {['Метла', 'Ведро', 'Шланг', 'Засов'].map(tool => {
                const isActive = brokenTools.includes(tool);
                return (
                  <button
                    key={tool}
                    onClick={() => toggleBrokenTool(tool)}
                    className={`rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center ${isActive ? 'bg-rose-600/30 border-rose-500/50 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {tool}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-3">
          <span className="text-xs font-black text-slate-200 block">Чек-лист передачи смены</span>
          {['Поилки вычищены', 'Ночная пайка сена', 'Задвижки заперты', 'Ковры помыты'].map(item => {
            const done = outgoingChecklist.includes(item);
            return (
              <button 
                key={item} 
                onClick={() => setOutgoingChecklist(p => done ? p.filter(i => i !== item) : [...p, item])}
                className="flex items-center gap-3 text-left"
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${done ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-700'}`}>
                  {done && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                </div>
                <span className={`text-sm ${done ? 'text-slate-300' : 'text-slate-500'}`}>{item}</span>
              </button>
            )
          })}

          <div className="relative h-12 bg-slate-950 rounded-xl overflow-hidden mt-2 border border-slate-800 flex items-center justify-center">
            <span className="text-slate-500 text-xs font-bold pointer-events-none z-0 select-none">Потяните вправо для сдачи</span>
            <div 
              className="absolute top-0 left-0 bottom-0 bg-emerald-500/20 border-r border-emerald-500/50 z-10 transition-all duration-75"
              style={{ width: `${outgoingSlider}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={outgoingSlider}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setOutgoingSlider(val);
                if (val > 95) {
                  setOutgoingSlider(100);
                  setHandoverStep('incoming');
                  const now = new Date();
                  setHandoverTime(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                  addEvent('Смена сдана (ожидание приемки)');
                  if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>
        </div>
      </div>
      
      {/* Modals & Popups would go here (Log sheet, etc.) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-100">Меню</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 active:scale-95"><X className="w-5 h-5"/></button>
            </div>
            
            <button 
              onClick={() => { setMenuOpen(false); scrollToSlide(3); }}
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 active:scale-95 transition-all text-left"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl">🌾</div>
              <div>
                <div className="font-bold text-slate-100">Фуражная</div>
                <div className="text-xs text-slate-400 mt-0.5">Склад и остатки кормов</div>
              </div>
            </button>
            
            {/* Safe spacing for bottom menu */}
            <div className="h-6"></div>
          </div>
        </div>
      )}

      {logOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setLogOpen(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl h-2/3 p-4 flex flex-col gap-2 animate-in slide-in-from-bottom border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-100">Лента событий</h2>
              <button onClick={() => setLogOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 active:scale-95"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <div className="text-slate-500 text-center py-10 font-bold">Событий пока нет</div>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-emerald-400 text-xs font-bold mb-1">{ev.time}</div>
                    <div className="text-slate-200 font-medium text-sm">{ev.title}</div>
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
