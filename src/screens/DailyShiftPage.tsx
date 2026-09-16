import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics, FeedInventoryItem, createDefaultElephantMetrics } from '../types/shift';
import { Elephant, Assignment } from '../types';
import confetti from 'canvas-confetti';
import { 
  Calendar, Wifi, WifiOff, Menu, ClipboardList, Package, CircleDot, TreeDeciduous,
  UserCheck, Camera, Activity, AlertTriangle, ShieldAlert, LogOut, Check, ChevronDown, Plus, Minus, Users, Stethoscope, X
} from 'lucide-react';
import { ShiftWheelModal } from '../components/daily-shift/ShiftWheelModal';

// ---------------------------------------------------------
// HOOKS
// ---------------------------------------------------------
function useScrollDirection(ref: React.RefObject<HTMLDivElement>) {
  const [direction, setDirection] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref]);
  
  return direction;
}

export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { profile, elephants, selectedDate, setSelectedDate } = useStore();
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [ration, setRation] = useState<any>({});
  const [inventory, setInventory] = useState<any>({ bales: 42, rolls: 8, branches: 15 });
  const [distributed, setDistributed] = useState<any>({ bales: 0, rolls: 0, branches: 0 });
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('--:--');
  const [hayWatered, setHayWatered] = useState(false);
  const [porridgeBrewTime, setPorridgeBrewTime] = useState<string | null>(null);
  const [porridgeBrewTimestamp, setPorridgeBrewTimestamp] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [refusePhotos, setRefusePhotos] = useState<Record<string, string>>({});
  const [activeRefuseSlot, setActiveRefuseSlot] = useState<string | null>(null);
  const refusePhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);
  const [isAfterArena, setIsAfterArena] = useState(false);
  const [feedStatus, setFeedStatus] = useState<Record<string, string>>({ m: 'clean', n: 'clean', e: 'clean' });
  const [washedAll, setWashedAll] = useState(false);
  const [carpetsCleaned, setCarpetsCleaned] = useState(false);
  const [washParts, setWashParts] = useState<string[]>([]);
  const [selectedVetElephant, setSelectedVetElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [hoofCare, setHoofCare] = useState<Record<string, { foot: string | null, photoBefore: boolean, photoAfter: boolean }>>({ margo: { foot: null, photoBefore: false, photoAfter: false }, audrey: { foot: null, photoBefore: false, photoAfter: false }, pretty: { foot: null, photoBefore: false, photoAfter: false } });
  const [vetTaskDone, setVetTaskDone] = useState<Record<string, boolean>>({ margo: false, audrey: false, pretty: false });
  const [stereotypyMode, setStereotypyMode] = useState<Record<string, 'normal' | 'abnormal'>>({ margo: 'normal', audrey: 'normal', pretty: 'normal' });
  const [lameLeg, setLameLeg] = useState<Record<string, string | null>>({ margo: null, audrey: null, pretty: null });
  const [symptoms, setSymptoms] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });
  const [washedElephants, setWashedElephants] = useState<string[]>([]);
  const [dungWheelbarrows, setDungWheelbarrows] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<string>('Метла');
  const [incidentCount, setIncidentCount] = useState<number>(0);
  const [spotWash, setSpotWash] = useState<{ elephant: string; zone: string } | null>(null);
  const [stereotypies, setStereotypies] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });
  const [lameness, setLameness] = useState<Record<string, boolean>>({ margo: false, audrey: false, pretty: false });
  const [dragProgress, setDragProgress] = useState(0);
  const [isShiftSubmitted, setIsShiftSubmitted] = useState(false);
  const [handoverIssues, setHandoverIssues] = useState<string[]>([]);
  const sliderRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [incidents, setIncidents] = useState<string[]>([]);
  const [actor, setActor] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [target, setTarget] = useState<'margo' | 'audrey' | 'pretty'>('audrey');
  const [flashingBtn, setFlashingBtn] = useState<string | null>(null);
  const [lastSocialEvent, setLastSocialEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeReel, setActiveReel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(containerRef);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [invDraft, setInvDraft] = useState({ bales: 42, rolls: 8, branches: 15 });

  // Reel 1 state
  const [physioTab, setPhysioTab] = useState<'poop'|'urine'|'sleep'>('poop');
  
  // Reel 2 state
  const [hayIssues, setHayIssues] = useState<string[]>([]);
  const [moldPhotoUrl, setMoldPhotoUrl] = useState<string | null>(null);
  const moldPhotoInputRef = useRef<HTMLInputElement>(null);
  const [roughageFixed, setRoughageFixed] = useState(false);
  
  const toggleHayIssue = (issue: string) => {
    setHayIssues(prev => {
      if (prev.includes(issue)) return prev.filter(i => i !== issue);
      addEvent('Зафиксировано: ' + issue);
      return [...prev, issue];
    });
  };
  
  // Initialize and dummy online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Intersection observer for active reel
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveReel(Number(entry.target.getAttribute('data-index')));
          }
        });
      },
      { root: containerRef.current, threshold: 0.5 }
    );
    const reels = containerRef.current.querySelectorAll('.reel-section');
    reels.forEach(r => observer.observe(r));
    return () => observer.disconnect();
  }, [shift]);

  // Load shift mock or actual
  useEffect(() => {
    const loadShift = async () => {
      if (!profile) return;
      const today = new Date().toISOString().split('T')[0];
      setShift({
        id: 'shift-1',
        date: selectedDate || today,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        duty_keeper_id: profile.id,
        hay_bags_distributed: 0,
        hay_bales_distributed: 0,
        reminders: [],
        feed_notes: '',
        handover_notes: ''
      });
      setMetrics({
        'margo': createDefaultElephantMetrics('shift-1', 'margo'),
        'audrey': createDefaultElephantMetrics('shift-1', 'audrey'),
        'pretty': createDefaultElephantMetrics('shift-1', 'pretty')
      });
      setEvents([]);
    };
    loadShift();
  }, [selectedDate, profile]);

  const addEvent = (title: string) => {
    setEvents(prev => [{ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), title }, ...prev]);
    if(navigator.vibrate) navigator.vibrate(50);
  };

  const handleHandover = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const incrementMetric = (eid: string, field: 'poop_count'|'urination_count'|'sleep_minutes', val: number) => {
    setMetrics(prev => {
      const current = prev[eid]?.[field] || 0;
      return { ...prev, [eid]: { ...prev[eid], [field]: Math.max(0, current + val) } };
    });
    addEvent(`${eid}: ${field} ${val > 0 ? '+' : ''}${val}`);
  };

  const handleDistribute = (field: string, delta: number) => {
    if (delta > 0) {
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(`Выдача: ${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (+1)`);
    } else {
      if (distributed[field] < Math.abs(delta)) return;
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(`Возврат на склад: ${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (-1)`);
    }
    setLastUpdatedTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y overscroll-none select-none bg-slate-950 text-slate-100" ref={containerRef}>
      
      {/* SMART AUTO-HIDING HEADER */}
      <div className={`fixed top-0 left-0 right-0 z-40 px-4 h-[52px] flex items-center justify-between bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-transform duration-300 ${scrollDir === 'down' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        <div className="font-bold text-lg text-emerald-400 flex items-center gap-2">
          🐘 СлоноВет
        </div>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-rose-500" />}
          <div className="relative">
            <input 
              ref={dateInputRef} 
              type="date" 
              value={selectedDate} 
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }} 
              className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none" 
            />
            <button 
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in dateInputRef.current) {
                    try {
                      (dateInputRef.current as any).showPicker();
                    } catch (e) {
                      dateInputRef.current.click();
                    }
                  } else {
                    dateInputRef.current.click();
                  }
                }
              }} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FLOATING INDICATOR */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`w-1.5 rounded-full transition-all duration-300 ${activeReel === i ? 'h-6 bg-emerald-400' : 'h-1.5 bg-slate-700'}`} />
        ))}
      </div>

      {/* FLOATING LOG BADGE */}
      <button onClick={() => setLogOpen(true)} className="fixed bottom-5 right-4 z-30 pointer-events-auto shadow-2xl flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 text-xs font-medium active:scale-95">
        <ClipboardList className="w-4 h-4 text-emerald-400" />
        Лента смены
        <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">{events.length}</span>
      </button>

      {/* REEL 1: PHYSIO */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="0">
        <div className="flex flex-col gap-2.5 flex-1 justify-start mt-2">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">💩 Физиология и дефекация</h2>
          
          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {[{ id: 'poop', label: '💩 Кучи' }, { id: 'urine', label: '💧 Лужи' }, { id: 'sleep', label: '🌙 Сон' }].map(tab => (
              <button key={tab.id} onClick={() => setPhysioTab(tab.id as any)} className={`py-2 rounded-xl text-sm transition-all active:scale-95 ${physioTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full">
            {['margo', 'audrey', 'pretty'].map((eid) => (
              <div key={eid} className="flex flex-col">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${eid === 'margo' ? 'bg-emerald-400' : eid === 'audrey' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                  <span className="text-sm font-bold capitalize">{eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}</span>
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes', physioTab === 'sleep' ? 30 : 1)} className="h-[52px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-t-xl active:bg-emerald-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center transition-colors">
                  +
                </button>
                <div className="text-4xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {metrics[eid]?.[physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes'] || 0}
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes', physioTab === 'sleep' ? -30 : -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center transition-colors">
                  -
                </button>
              </div>
            ))}
          </div>

          <div className={`mt-2 transition-all duration-300 ${physioTab === 'poop' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <h3 className="text-sm font-bold text-slate-300 mb-2">Характер стула</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'norm', label: '🟢 Сформирован (норма)', activeClass: 'bg-emerald-600 text-white font-bold border-emerald-400' },
                  { id: 'dry', label: '🌾 Сухой / Рассыпчатый', activeClass: 'bg-amber-600 text-white font-bold border-amber-400' },
                  { id: 'liquid', label: '⚠️ Жидкий / Понос', activeClass: 'bg-rose-600 text-white font-bold border-rose-400 animate-pulse', requirePhoto: true },
                  { id: 'blood', label: '🩸 Слизь / Кровь / Гельминты', activeClass: 'bg-rose-700 text-white font-bold border-rose-500 animate-pulse', requirePhoto: true }
                ].map(chip => (
                  <button key={chip.id} onClick={() => { addEvent(`Стул: ${chip.label}`); }} className={`p-3 rounded-2xl border border-slate-700 bg-slate-800/50 text-sm font-medium active:scale-95 transition-all text-left`}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
        </div>
      </div>

      {/* REEL 2: ROUGHAGE */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="1">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🌾 Грубые корма и сеновал</h2>
          
          <div className={`flex justify-between items-center p-3 rounded-2xl border ${inventory.bales < 0 || inventory.rolls < 0 ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-900/80 border-slate-800'}`}>
            <span className={`text-sm font-medium ${inventory.bales < 0 || inventory.rolls < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              Остаток на складе: Тюки {inventory.bales} шт | Рулоны {inventory.rolls} шт
              {(inventory.bales < 0 || inventory.rolls < 0) && <span className="block text-xs font-bold mt-0.5 text-rose-500">⚠️ долг/не учтено</span>}
            </span>
            <button onClick={() => { setInvDraft(inventory); setInventoryOpen(true); }} className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95 whitespace-nowrap ml-2">📦 Инвентаризация</button>
          </div>

          <p className="text-center text-sm font-semibold text-slate-400 mt-2 mb-1">Роздано слонам за смену</p>
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {[
              { id: 'bales', icon: Package, label: 'Тюки сена' },
              { id: 'rolls', icon: CircleDot, label: 'Рулоны сена' },
              { id: 'branches', icon: TreeDeciduous, label: 'Веточный корм' }
            ].map(col => (
              <div key={col.id} className="flex flex-col">
                <div className="flex flex-col items-center justify-center gap-1 mb-2">
                  <col.icon className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] font-bold text-center leading-tight text-slate-400">{col.label}</span>
                </div>
                <button onClick={() => handleDistribute(col.id, 1)} className="h-[52px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-t-xl active:bg-amber-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center">
                  +
                </button>
                <div className="text-3xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {distributed[col.id]}
                </div>
                <button onClick={() => handleDistribute(col.id, -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center">
                  -
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => toggleHayIssue('dusty')} className={`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all ${hayIssues.includes('dusty') ? 'border-amber-400 bg-amber-500 text-slate-900 shadow-md' : 'border-amber-800 bg-amber-950/40 text-amber-300'}`}>
              ⚠️ Пыльное / Сухое
            </button>
            <input 
              ref={moldPhotoInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const url = URL.createObjectURL(e.target.files[0]);
                  setMoldPhotoUrl(url);
                  addEvent('📸 Зафиксирована плесень/гниль в сене');
                  if (!hayIssues.includes('mold')) {
                    setHayIssues(p => [...p, 'mold']);
                  }
                }
              }} 
            />
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (moldPhotoUrl) {
                    toggleHayIssue('mold');
                  } else {
                    moldPhotoInputRef.current?.click();
                  }
                }} 
                className={`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all ${hayIssues.includes('mold') && moldPhotoUrl ? 'border-emerald-400 bg-emerald-500 text-slate-900 shadow-md flex items-center justify-between' : hayIssues.includes('mold') ? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950/40 text-rose-300'}`}
              >
                {hayIssues.includes('mold') && moldPhotoUrl ? '🍄 Плесень зафиксирована ✓' : '🍄 Плесень / Гниль (+📷 Фото)'}
              </button>
              {moldPhotoUrl && (
                <div className="flex items-center gap-2 animate-slide-up bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                  <img src={moldPhotoUrl} alt="Плесень" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                  <button onClick={() => { setMoldPhotoUrl(null); toggleHayIssue('mold'); }} className="text-xs font-bold text-rose-400 p-2 active:scale-95 bg-rose-500/10 rounded-lg">Удалить</button>
                  <button onClick={() => moldPhotoInputRef.current?.click()} className="text-xs font-bold text-sky-400 p-2 active:scale-95 bg-sky-500/10 rounded-lg">Переснять</button>
                </div>
              )}
            </div>
          </div>

          {hayIssues.includes('dusty') && (
            <div className="mt-2 bg-sky-950/40 border border-sky-800 p-2.5 rounded-xl animate-slide-up flex flex-col gap-3">
              <p className="text-xs text-sky-200 font-medium leading-relaxed">
                🚿 <strong>Протокол обеспыливания:</strong> тщательно пролить сено водой из шланга перед дачей!
              </p>
              <button 
                onClick={() => {
                  if(!hayWatered) {
                    setHayWatered(true);
                    addEvent('Сено обеспылено водой');
                    setLastUpdatedTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                  }
                }} 
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${hayWatered ? 'bg-sky-500 text-white shadow-md border border-sky-400' : 'bg-sky-900/50 text-sky-300 border border-sky-700'}`}
              >
                {hayWatered ? '💧 Пролито / Замочено (✓)' : '💧 Пролито / Замочено'}
              </button>
            </div>
          )}

          {lastUpdatedTime !== '--:--' && (
            <p className="text-center text-xs text-slate-500 mt-6 mb-2">Автосохранение в лог смены • {lastUpdatedTime}</p>
          )}
        </div>
      </div>

      {/* REEL 3: RATION & MASH */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="2">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-slate-300 text-sm">Техпроцесс запарки</span>
              {!porridgeBrewTime ? (
                <button 
                  onClick={() => {
                    const now = Date.now();
                    const timeStr = new Date(now).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    setPorridgeBrewTimestamp(now);
                    setPorridgeBrewTime(timeStr);
                    addEvent('Каша запарена кипятком');
                  }} 
                  className="bg-emerald-600 text-white px-3 py-3 rounded-xl text-xs font-bold active:scale-95 shadow-lg w-full text-center"
                >
                  ♨️ Запарить кашу
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {(() => {
                    const elapsedMins = porridgeBrewTimestamp ? Math.floor((currentTime - porridgeBrewTimestamp) / 60000) : 0;
                    
                    if (elapsedMins >= 150) {
                      return (
                        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span className="text-sm">⚠️ Проверь температуру / не закисла ли!</span>
                        </div>
                      );
                    } else if (elapsedMins >= 45) {
                      return (
                        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span className="text-sm">🟢 Каша настоялась и остыла (готова к раздаче)</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span>Настаивается...</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsAfterArena(!isAfterArena)} 
            className={`w-full p-3 rounded-2xl flex items-center gap-2 text-sm font-bold active:scale-95 text-left transition-all ${isAfterArena ? 'bg-amber-600/30 border border-amber-500 text-amber-400' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}
          >
            🎪 Слоны после манежа / силовой нагрузки
          </button>
          {isAfterArena && (
            <div className="bg-amber-950/40 border border-amber-800 p-2.5 rounded-xl animate-slide-up">
              <p className="text-xs text-amber-200 font-medium leading-relaxed">⚠️ Слоны остывают 45 минут! Сено можно сразу. Поение водой и раздача каши — строго после остывания.</p>
            </div>
          )}
          
          <input 
            ref={refusePhotoInputRef} 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && activeRefuseSlot) {
                const url = URL.createObjectURL(e.target.files[0]);
                setRefusePhotos(p => ({ ...p, [activeRefuseSlot]: url }));
                
                const slotLabels: any = { m: 'Утро', n: 'Обед', e: 'Ужин' };
                addEvent(`Отказ от концентратов (${slotLabels[activeRefuseSlot]}) + фото`);
                setActiveRefuseSlot(null);
                if (navigator.vibrate) navigator.vibrate(50);
              }
            }} 
          />

          <div className="flex flex-col gap-2 mt-2">
            {[
              { id: 'm', label: '07:00 Утро (Запарка)' },
              { id: 'n', label: '13:00 Обед (Каша / Мэш)' },
              { id: 'e', label: '19:00 Ужин (Овощной салат)' }
            ].map(slot => (
              <div key={slot.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-400">{slot.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'clean' }));
                      addEvent(`${slot.label}: Съедено чисто`);
                    }} 
                    className={`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all ${feedStatus[slot.id] === 'clean' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}`}
                  >
                    🟢 Съедено чисто
                  </button>
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'leftovers' }));
                      addEvent(`${slot.label}: Есть остаток`);
                    }} 
                    className={`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all ${feedStatus[slot.id] === 'leftovers' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}`}
                  >
                    🟡 Есть остаток
                  </button>
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'refusal' }));
                      addEvent(`${slot.label}: Отказ от корма`);
                    }} 
                    className={`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all ${feedStatus[slot.id] === 'refusal' ? 'bg-rose-600 text-white shadow-md animate-pulse' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}`}
                  >
                    🔴 Отказ ⚠️
                  </button>
                </div>
                {feedStatus[slot.id] === 'refusal' && (
                  <div className="mt-1 animate-slide-up flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (!refusePhotos[slot.id]) {
                          setActiveRefuseSlot(slot.id);
                          refusePhotoInputRef.current?.click();
                        }
                      }} 
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex justify-center gap-2 items-center active:scale-95 ${refusePhotos[slot.id] ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {refusePhotos[slot.id] ? '📷 Кормушка сфотографирована ✓' : '📷 Снять нетронутую кормушку'}
                    </button>
                    
                    {refusePhotos[slot.id] && (
                      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                        <img src={refusePhotos[slot.id]} alt="Отказ" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                        <button onClick={() => { 
                          setRefusePhotos(p => { const nv = {...p}; delete nv[slot.id]; return nv; }); 
                        }} className="text-xs font-bold text-rose-400 p-2 active:scale-95 bg-rose-500/10 rounded-lg">Удалить</button>
                        <button onClick={() => {
                          setActiveRefuseSlot(slot.id);
                          refusePhotoInputRef.current?.click();
                        }} className="text-xs font-bold text-sky-400 p-2 active:scale-95 bg-sky-500/10 rounded-lg">Переснять</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REEL 4: CHORES & INCIDENTS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="3">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты</h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-300">Помывка (душ)</span>
               <span className="text-xs font-bold text-emerald-400">Помыто: {washedElephants.length}/3</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'margo', label: 'Марго' },
                { id: 'audrey', label: 'Одри' },
                { id: 'pretty', label: 'Прэтти' }
              ].map(el => {
                 const isWashed = washedElephants.includes(el.id);
                 return (
                   <button 
                     key={el.id}
                     onClick={() => {
                       if (!isWashed) {
                         setWashedElephants(p => [...p, el.id]);
                         addEvent(`Помыта ${el.label} (душ)`);
                       } else {
                         setWashedElephants(p => p.filter(id => id !== el.id));
                       }
                     }}
                     className={`py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border ${isWashed ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                   >
                     🐘 {el.label} {isWashed ? '🚿' : ''}
                   </button>
                 );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button 
              onClick={() => {
                setCarpetsCleaned(!carpetsCleaned);
                if (!carpetsCleaned) addEvent('🧼 Ковры зачищены');
              }} 
              className={`border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all ${carpetsCleaned ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
            >
              <span className="text-2xl">{carpetsCleaned ? '✓' : '🧼'}</span>
              <span className="text-xs font-bold text-center">Ковры зачищены</span>
              {carpetsCleaned && <span className="text-[9px] font-black bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 mt-1">+25 XP в карму смены</span>}
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-300 text-center">🚜 Вывезено тачек</span>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                    if(dungWheelbarrows > 0) {
                        setDungWheelbarrows(p => p - 1);
                        addEvent('Отмена тачки');
                    }
                }} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 text-slate-300">-</button>
                <span className="text-2xl font-black font-mono text-white">{dungWheelbarrows}</span>
                <button onClick={() => {
                    setDungWheelbarrows(p => p + 1);
                    addEvent('Вывезена тачка навоза (+1)');
                }} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 text-slate-300">+</button>
              </div>
            </div>

            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300 mb-2 block">🚿 Точечная замывка (выбран: {selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
              <div className="flex gap-2">
                {['Ноги', 'Круп', 'Бок'].map(zone => {
                  const isActive = spotWash?.elephant === selectedVetElephant && spotWash?.zone === zone;
                  return (
                    <button 
                      key={zone}
                      onClick={() => {
                        setSpotWash({ elephant: selectedVetElephant, zone });
                        const eName = selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти';
                        addEvent(`🚿 Замывка (${eName}): ${zone}`);
                      }} 
                      className={`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border ${isActive ? 'bg-sky-600 border-sky-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                    >
                      {zone}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 rounded-2xl p-3 border border-rose-900/50 mt-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">Барабан поломок и ЧП</span>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инцидентов: {incidentCount}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 my-2">
              {['Метла', 'Ведро', 'Пастух', 'Шланг', 'Багор', 'Засов'].map((inc) => {
                const isActive = selectedIncident === inc;
                return (
                  <button 
                    key={inc} 
                    onClick={() => setSelectedIncident(inc)} 
                    className={`p-2 border rounded-xl text-xs font-bold active:scale-95 text-center transition-all ${isActive ? 'bg-rose-600 border-rose-500 text-white shadow-md ring-2 ring-rose-400' : 'bg-rose-900/40 border-rose-800 text-rose-300'}`}
                  >
                    {inc}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={() => {
                setIncidentCount(p => p + 1);
                addEvent(`ЧП: ${selectedIncident} поврежден(а)`);
                if (navigator.vibrate) navigator.vibrate(50);
              }}
              className="mt-2 w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              +1 Зафиксировать ЧП
            </button>
          </div>
        </div>
      </div>

      {/* REEL 5: VET & STEREOTYPIES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="4">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария</h2>
          
          <div className="grid grid-cols-3 w-full p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-2">
            {[
              { id: 'margo', label: 'Марго', color: 'bg-emerald-600' },
              { id: 'audrey', label: 'Одри', color: 'bg-purple-600' },
              { id: 'pretty', label: 'Прэтти', color: 'bg-rose-600' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setSelectedVetElephant(tab.id as 'margo' | 'audrey' | 'pretty')}
                className={`py-2 rounded-xl text-sm transition-all active:scale-95 font-medium ${selectedVetElephant === tab.id ? `${tab.color} text-white shadow-md font-bold` : 'text-slate-400 hover:text-slate-200'}`}
              >
                🐘 {tab.label}
              </button>
            ))}
          </div>

          <div className={`border p-3 rounded-2xl flex flex-col gap-2 transition-all ${vetTaskDone[selectedVetElephant] ? 'bg-emerald-950/40 border-emerald-800' : 'bg-slate-900 border-slate-800'}`}>
            <span className="text-xs font-bold text-slate-400">Назначения ({selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
            <p className="text-sm font-medium text-slate-300">Стопа ПП: промыть хлоргексидином, нанести дегтярную мазь</p>
            <button 
              onClick={() => {
                setVetTaskDone(p => ({ ...p, [selectedVetElephant]: true }));
                addEvent(`✅ Процедура выполнена (${selectedVetElephant})`);
              }} 
              className={`mt-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all border flex items-center justify-center gap-2 ${vetTaskDone[selectedVetElephant] ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
            >
              {vetTaskDone[selectedVetElephant] ? '✓ Процедура выполнена' : 'Отметить выполнение'}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-300">Педикюр / Расчистка подошвы</span>
            <div className="flex justify-between gap-2 mt-1">
              {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(foot => {
                const isSelected = hoofCare[selectedVetElephant]?.foot === foot;
                return (
                  <button 
                    key={foot} 
                    onClick={() => {
                      setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], foot } }));
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-95 border ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {foot}
                  </button>
                )
              })}
            </div>
            {hoofCare[selectedVetElephant]?.foot && (
              <div className="flex gap-2 mt-2 animate-slide-up">
                <button 
                  onClick={() => setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], photoBefore: true } }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border flex justify-center items-center gap-1 ${hoofCare[selectedVetElephant].photoBefore ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {hoofCare[selectedVetElephant].photoBefore ? '✓ Фото ДО' : '📷 Фото ДО'}
                </button>
                <button 
                  onClick={() => setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], photoAfter: true } }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border flex justify-center items-center gap-1 ${hoofCare[selectedVetElephant].photoAfter ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {hoofCare[selectedVetElephant].photoAfter ? '✓ Фото ПОСЛЕ' : '📷 Фото ПОСЛЕ'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <button 
              onClick={() => {
                setStereotypyMode(p => ({ ...p, [selectedVetElephant]: p[selectedVetElephant] === 'normal' ? 'abnormal' : 'normal' }));
                if (stereotypyMode[selectedVetElephant] === 'abnormal') {
                   addEvent(`Стереотипия (${selectedVetElephant}): Поведение нормотипичное`);
                }
              }}
              className={`w-full p-3 rounded-2xl border active:scale-95 text-left flex justify-between transition-all text-xs font-bold ${stereotypyMode[selectedVetElephant] === 'normal' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-amber-600/20 border-amber-500 text-amber-300'}`}
            >
              <span>{stereotypyMode[selectedVetElephant] === 'normal' ? '✨ Поведение нормотипичное' : '⚠️ Замечена стереотипия'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${stereotypyMode[selectedVetElephant] === 'abnormal' ? 'rotate-180' : ''}`} />
            </button>
            
            {stereotypyMode[selectedVetElephant] === 'abnormal' && (
              <div className="grid grid-cols-2 gap-2 animate-slide-up">
                 {['🔄 Качание (weaving)', '↕️ Кивание головой', '👣 Переступание', '🪵 Игра хоботом'].map((ster, i) => {
                   const isActive = stereotypies[selectedVetElephant]?.includes(ster);
                   return (
                     <button 
                       key={i} 
                       onClick={() => {
                         setStereotypies(p => {
                           const cur = p[selectedVetElephant] || [];
                           return { ...p, [selectedVetElephant]: isActive ? cur.filter(s => s !== ster) : [...cur, ster] };
                         });
                         if (!isActive) addEvent(`Стереотипия (${selectedVetElephant}): ${ster}`);
                       }} 
                       className={`p-3 border rounded-xl text-xs font-bold active:scale-95 text-left leading-tight transition-all ${isActive ? 'bg-amber-600 border-amber-500 text-slate-900 shadow-md' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'}`}
                     >
                       {ster}
                     </button>
                   )
                 })}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 mt-2">
             <span className="text-xs font-bold text-slate-300 mb-1">Симптомы и отклонения</span>
             
             <div className="flex flex-col gap-2">
               <button 
                 onClick={() => {
                   const isActive = lameness[selectedVetElephant];
                   setLameness(p => ({ ...p, [selectedVetElephant]: !isActive }));
                   if (!isActive) {
                     addEvent(`🚨 Хромота (${selectedVetElephant})`);
                     if (navigator.vibrate) navigator.vibrate(50);
                   }
                 }} 
                 className={`p-3 rounded-xl border active:scale-95 text-left flex justify-between transition-all text-xs font-bold ${lameness[selectedVetElephant] ? 'border-rose-500 bg-rose-600/30 text-rose-300' : 'border-slate-800 bg-slate-800/50 text-slate-400'}`}
               >
                 <span>🚨 Хромота {lameLeg[selectedVetElephant] ? `(${lameLeg[selectedVetElephant]})` : ''}</span>
                 <ChevronDown className={`w-4 h-4 transition-transform ${lameness[selectedVetElephant] ? 'rotate-180' : ''}`} />
               </button>
               {lameness[selectedVetElephant] && (
                 <div className="grid grid-cols-4 gap-2 animate-slide-up bg-slate-950/50 p-2 rounded-xl">
                    {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(leg => (
                      <button 
                        key={leg} 
                        onClick={() => {
                          setLameLeg(p => ({ ...p, [selectedVetElephant]: leg }));
                          addEvent(`Хромота (${selectedVetElephant}): ${leg}`);
                          if (navigator.vibrate) navigator.vibrate(50);
                        }} 
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${lameLeg[selectedVetElephant] === leg ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        {leg}
                      </button>
                    ))}
                 </div>
               )}
               
               <div className="grid grid-cols-3 gap-2 mt-1">
                 {['Хобот плетью', 'Сопение / Хрип', 'Секреция желез'].map(symp => {
                   const isActive = symptoms[selectedVetElephant]?.includes(symp);
                   return (
                     <button 
                       key={symp} 
                       onClick={() => {
                         setSymptoms(p => {
                           const cur = p[selectedVetElephant] || [];
                           return { ...p, [selectedVetElephant]: isActive ? cur.filter(s => s !== symp) : [...cur, symp] };
                         });
                         if (!isActive) {
                           addEvent(`Симптом (${selectedVetElephant}): ${symp}`);
                           if (navigator.vibrate) navigator.vibrate(50);
                         }
                       }} 
                       className={`py-2 px-1 border rounded-xl text-[10px] font-bold active:scale-95 text-center leading-tight transition-all ${isActive ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                     >
                       {symp}
                     </button>
                   )
                 })}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* REEL 6: SOCIAL DYNAMICS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="5">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">👥 Социальная динамика</h2>
          
          <div className="flex flex-col gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Актор (кто действует)</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'margo', label: 'Марго' },
                  { id: 'audrey', label: 'Одри' },
                  { id: 'pretty', label: 'Прэтти' }
                ].map(el => (
                  <button
                    key={el.id}
                    onClick={() => {
                      setActor(el.id as any);
                      if (target === el.id) {
                        const newTarget = ['margo', 'audrey', 'pretty'].find(i => i !== el.id) as any;
                        setTarget(newTarget);
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${actor === el.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
               <div className="bg-slate-900 p-1 rounded-full border border-slate-800">
                 <div className="bg-slate-800 text-slate-400 rounded-full p-1.5">
                   <span className="block text-[10px] leading-none transform rotate-90">➔</span>
                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Реципиент (на кого)</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'margo', label: 'Марго' },
                  { id: 'audrey', label: 'Одри' },
                  { id: 'pretty', label: 'Прэтти' }
                ].map(el => (
                  <button
                    key={el.id}
                    disabled={actor === el.id}
                    onClick={() => setTarget(el.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${target === el.id ? 'bg-indigo-600 text-white shadow-md' : actor === el.id ? 'bg-slate-950/50 text-slate-600 opacity-50 cursor-not-allowed border border-dashed border-slate-700' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { id: 'fight', label: '💥 Стычка / Удар хоботом', colorClass: 'bg-rose-950/40 border-rose-800 text-rose-300 ring-rose-400' },
              { id: 'food', label: '🥐 Отобрала пайку / сено', colorClass: 'bg-amber-950/40 border-amber-800 text-amber-300 ring-amber-400' },
              { id: 'grooming', label: '🤗 Взаимный груминг / Игра', colorClass: 'bg-emerald-950/40 border-emerald-800 text-emerald-300 ring-emerald-400' },
              { id: 'jealousy', label: '👀 Ревность к киперу', colorClass: 'bg-purple-950/40 border-purple-800 text-purple-300 ring-purple-400' },
              { id: 'sleep', label: '💤 Спят рядом (контакт)', colorClass: 'bg-blue-950/40 border-blue-800 text-blue-300 ring-blue-400' },
              { id: 'roar', label: '🔊 Трубный глас / Рокот', colorClass: 'bg-orange-950/40 border-orange-800 text-orange-300 ring-orange-400' }
            ].map(action => (
              <button 
                key={action.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(40);
                  
                  const eNames: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
                  const actorName = eNames[actor];
                  const targetName = eNames[target];
                  const actionName = action.label.split(' ')[1]; // Short name
                  
                  const fullLogStr = `${actorName} ➔ ${targetName}: ${action.label}`;
                  addEvent(fullLogStr);
                  
                  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  setLastSocialEvent(`${timeStr} ${actorName} ➔ ${targetName} (${actionName}) ✓`);
                  
                  setFlashingBtn(action.id);
                  setTimeout(() => setFlashingBtn(null), 300);
                }} 
                className={`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all duration-200 ${action.colorClass} ${flashingBtn === action.id ? 'ring-2 scale-95 opacity-100 brightness-150' : ''}`}
              >
                {action.label}
              </button>
            ))}
          </div>
          
          {lastSocialEvent && (
             <div className="bg-slate-900/80 border border-emerald-500/30 p-2.5 rounded-xl animate-slide-up flex items-center justify-between mt-1">
               <span className="text-[10px] font-bold text-slate-400">Последнее:</span>
               <span className="text-[11px] font-bold text-emerald-400">{lastSocialEvent}</span>
             </div>
          )}
        </div>
      </div>

      {/* REEL 7: HANDOVER & TIMER */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="6">
        <div className="flex flex-col gap-2.5 flex-1 justify-center relative">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🏁 Сдача дежурства</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col gap-2 relative z-10">
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Куч за смену:</span> <span className="text-emerald-400">{(metrics['margo']?.poop_count || 0) + (metrics['audrey']?.poop_count || 0) + (metrics['pretty']?.poop_count || 0)}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Вывезено тачек:</span> <span className="text-emerald-400">{dungWheelbarrows || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Роздано тюков:</span> <span className="text-emerald-400">{distributed.bales || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Инциденты:</span> <span className="text-rose-400">{incidentCount || 0}</span></div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-200">
              <span>Чек-лист задач:</span>
              <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-800">Готово</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4 mt-4 relative z-10">
             {['🧹 Не вынесен навоз', '🌾 Мало сена на ночь', '🚰 Течь поилки'].map(issue => {
               const isActive = handoverIssues.includes(issue);
               return (
                 <button 
                   key={issue} 
                   onClick={() => {
                     if (navigator.vibrate) navigator.vibrate(40);
                     setHandoverIssues(p => isActive ? p.filter(i => i !== issue) : [...p, issue]);
                   }}
                   className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isActive ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                 >
                   {issue}
                 </button>
               )
             })}
             
             <label className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer">
               📷 Фото косяка
               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                 if (e.target.files && e.target.files.length > 0) {
                    addEvent(`📸 Прикреплено фото к сдаче смены`);
                    if (navigator.vibrate) navigator.vibrate(50);
                 }
               }}/>
             </label>
          </div>
          
          <div className="mt-auto relative z-10 flex flex-col gap-2">
            {isShiftSubmitted ? (
               <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center animate-slide-up">
                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-2">
                   <CheckCircle2 className="w-8 h-8 text-slate-900" />
                 </div>
                 <h3 className="text-xl font-bold text-emerald-400">Смена сдана!</h3>
                 <p className="text-sm font-bold text-slate-400 mt-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
               </div>
            ) : (
               <div className="relative h-[60px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none group" style={{ containerType: "inline-size" }}>
                 {/* Background fill */}
                 <div className="absolute left-0 top-0 bottom-0 bg-emerald-600/30 transition-all duration-100 ease-out" style={{ width: `${dragProgress}%` }} />
                 
                 {/* Text */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className={`font-bold transition-all ${dragProgress > 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                     {dragProgress > 85 ? 'ОТПУСТИТЕ!' : 'Сдвиньте для сдачи смены ➔'}
                   </span>
                 </div>
                 
                 {/* Input Range (Hidden overlay) */}
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={dragProgress}
                   ref={sliderRef}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                   onChange={(e) => {
                     setDragProgress(Number(e.target.value));
                   }}
                   onTouchEnd={() => {
                     if (dragProgress >= 85) {
                       setIsShiftSubmitted(true);
                       if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                       confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                       addEvent('🏁 СМЕНА СДАНА');
                     } else {
                       setDragProgress(0);
                     }
                   }}
                   onMouseUp={() => {
                     if (dragProgress >= 85) {
                       setIsShiftSubmitted(true);
                       if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                       confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                       addEvent('🏁 СМЕНА СДАНА');
                     } else {
                       setDragProgress(0);
                     }
                   }}
                 />
                 
                 {/* Visual Thumb */}
                 <div 
                   className="absolute left-1 top-1 bottom-1 w-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100 ease-out z-10 pointer-events-none"
                   style={{ transform: `translateX(calc(${dragProgress / 100} * (100cqw - 56px)))` }}
                 >
                   <span className="text-slate-900 font-black">➔</span>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* DRAWERS AND MODALS */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2 shadow-2xl border-r border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 mb-4 px-2">Меню</h2>
            
            <button 
              onClick={() => { setMenuOpen(false); onNavigate('vet'); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Stethoscope className="w-5 h-5 text-emerald-400"/> Веткабинет
            </button>
            
            <button 
              onClick={() => { setMenuOpen(false); setInvDraft(inventory); setInventoryOpen(true); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Package className="w-5 h-5 text-amber-400"/> Склад кормов
            </button>
            
            <button 
              onClick={() => { setMenuOpen(false); setWheelOpen(true); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Users className="w-5 h-5 text-purple-400"/> Жребий смены
            </button>
          </div>
        </div>
      )}

      {wheelOpen && (
        <ShiftWheelModal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} onActionAssigned={(a, p) => addEvent(`Жребий: ${a} ➔ ${p}`)} />
      )}

      
      {/* INVENTORY MODAL */}
      {inventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all" onClick={() => setInventoryOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /> Инвентаризация</h2>
              <button onClick={() => setInventoryOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 active:scale-95"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Тюки сена (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, bales: Math.max(0, p.bales - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.bales} onChange={e => setInvDraft(p => ({...p, bales: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, bales: p.bales + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Рулоны сена (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, rolls: Math.max(0, p.rolls - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.rolls} onChange={e => setInvDraft(p => ({...p, rolls: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, rolls: p.rolls + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Веточный корм (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, branches: Math.max(0, p.branches - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.branches} onChange={e => setInvDraft(p => ({...p, branches: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, branches: p.branches + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setInventory(invDraft);
                setInventoryOpen(false);
                addEvent(`Проведена инвентаризация: Тюки ${invDraft.bales}, Рулоны ${invDraft.rolls}, Веточный корм ${invDraft.branches}`);
              }} 
              className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-all text-lg shadow-lg shadow-emerald-900/50"
            >
              Сохранить остатки
            </button>
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
