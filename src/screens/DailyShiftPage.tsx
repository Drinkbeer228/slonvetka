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
  const [events, setEvents] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeReel, setActiveReel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(containerRef);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Reel 1 state
  const [physioTab, setPhysioTab] = useState<'poop'|'urine'|'sleep'>('poop');
  
  // Reel 2 state
  const [hayIssues, setHayIssues] = useState<string[]>([]);
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

  const updateInventory = (field: string, val: number) => {
    setInventory(prev => ({ ...prev, [field]: Math.max(0, prev[field] + val) }));
    addEvent(`Склад: ${field} ${val > 0 ? '+' : ''}${val}`);
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
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">
            <Calendar className="w-5 h-5" />
          </button>
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
          
          <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-sm font-medium text-slate-300">Остаток: Тюки {inventory.bales} | Рулоны {inventory.rolls}</span>
            <button className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация</button>
          </div>

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
                <button onClick={() => updateInventory(col.id, 1)} className="h-[52px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-t-xl active:bg-amber-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center">
                  +
                </button>
                <div className="text-3xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {inventory[col.id]}
                </div>
                <button onClick={() => updateInventory(col.id, -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center">
                  -
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => toggleHayIssue('dusty')} className={`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all ${hayIssues.includes('dusty') ? 'border-amber-400 bg-amber-500 text-slate-900 shadow-md' : 'border-amber-800 bg-amber-950/40 text-amber-300'}`}>
              ⚠️ Пыльное / Прелое сено
            </button>
            <button onClick={() => toggleHayIssue('mold')} className={`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all ${hayIssues.includes('mold') ? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950/40 text-rose-300'}`}>
              🍄 Плесень в тюке (+📷 Фото)
            </button>
          </div>

          <button onClick={() => { addEvent('Зафиксирована дача грубых кормов'); setRoughageFixed(true); }} className={`w-full mt-4 py-3.5 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all ${roughageFixed ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-200 active:bg-slate-700'}`}>
            {roughageFixed ? <Check className="w-5 h-5"/> : null}
            Зафиксировать дневную дачу
          </button>
        </div>
      </div>

      {/* REEL 3: RATION & MASH */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="2">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-slate-300 text-sm">Техпроцесс запарки</span>
            <button onClick={() => addEvent('♨️ Запарка каши (кипяток)')} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-lg">
              ♨️ Запарить кашу
            </button>
          </div>

          <button onClick={() => addEvent('⚠️ Слоны после манежа')} className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-2xl flex items-center gap-2 text-sm font-bold active:scale-95 text-left">
            🎪 Слоны после манежа / силовой нагрузки
          </button>
          
          <div className="flex flex-col gap-2 mt-2">
            {[
              { id: 'm', label: '07:00 Утро (Запарка)' },
              { id: 'n', label: '13:00 Обед (Каша / Мэш)' },
              { id: 'e', label: '19:00 Ужин (Овощной салат)' }
            ].map(slot => (
              <div key={slot.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 mb-2">{slot.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => addEvent(`${slot.label}: Съедено чисто`)} className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] font-bold py-2 rounded-xl active:bg-emerald-900/60 leading-tight">🟢 Съедено чисто</button>
                  <button onClick={() => addEvent(`${slot.label}: Есть остаток`)} className="bg-amber-950/40 border border-amber-800 text-amber-400 text-[10px] font-bold py-2 rounded-xl active:bg-amber-900/60 leading-tight">🟡 Есть остаток</button>
                  <button onClick={() => addEvent(`${slot.label}: Отказ от корма`)} className="bg-rose-950/40 border border-rose-800 text-rose-400 text-[10px] font-bold py-2 rounded-xl active:bg-rose-900/60 leading-tight flex flex-col items-center justify-center">
                    <span>🔴 Отказ ⚠️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => addEvent('⚠️ Подозрение на инородный предмет в корме')} className="w-full mt-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95">
            ⚠️ Подозрение на инородный предмет в корме (+📷)
          </button>
        </div>
      </div>

      {/* REEL 4: CHORES & INCIDENTS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="3">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты</h2>
          
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button onClick={() => addEvent('🐘 Все 3 слона помыты')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95">
              <span className="text-3xl">🐘</span>
              <span className="text-xs font-bold text-slate-300">Все 3 помыты</span>
            </button>
            <button onClick={() => addEvent('🧼 Ковры зачищены')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95">
              <span className="text-3xl">🧼</span>
              <span className="text-xs font-bold text-slate-300">Ковры зачищены</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center col-span-2">
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xs font-bold text-slate-300">🚜 Вывезено тачек:</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateInventory('barrows', -1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg">-</button>
                  <span className="text-2xl font-black font-mono">{inventory.barrows || 0}</span>
                  <button onClick={() => updateInventory('barrows', 1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg">+</button>
                </div>
              </div>
            </div>
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300 mb-2 block">🚿 Замывка загрязнений:</span>
              <div className="flex gap-2">
                <button onClick={() => addEvent('🚿 Замывка: Ноги')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Ноги</button>
                <button onClick={() => addEvent('🚿 Замывка: Круп')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Круп</button>
                <button onClick={() => addEvent('🚿 Замывка: Бок')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Бок</button>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 rounded-2xl p-3 border border-rose-900/50 mt-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">Барабан поломок и ЧП</span>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инцидентов: 2</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 my-2">
              {['🧹 Метла', '🪣 Ведро', '⚡ Пастух', '🚿 Шланг', '🪝 Багор', '🚪 Засов'].map((inc, i) => (
                <button key={i} onClick={() => addEvent('ЧП: ' + inc)} className="p-2 bg-rose-900/40 border border-rose-800 rounded-xl text-xs font-bold text-rose-300 active:scale-95 text-center">
                  {inc}
                </button>
              ))}
            </div>
            
            <button onClick={() => addEvent('🚨 Зафиксировано ЧП')} className="bg-rose-600 active:bg-rose-700 text-white font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2">
              +1 Зафиксировать ЧП
            </button>
          </div>
        </div>
      </div>

      {/* REEL 5: VET & STEREOTYPIES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="4">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария</h2>
          
          <div className="grid grid-cols-3 gap-2 w-full p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {['margo', 'audrey', 'pretty'].map(eid => (
              <button key={eid} className="py-2 rounded-xl text-sm transition-all active:scale-95 text-slate-400 font-medium capitalize">
                🐘 {eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-emerald-400">Назначения (Марго):</span>
            <p className="text-sm font-medium text-slate-300">Стопа ПП: промыть хлоргексидином, нанести дегтярную мазь</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => addEvent('📷 Фотоотчет процедуры')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">📷 Фотоотчет</button>
              <button onClick={() => addEvent('🦶 Фото подошв (День копыт)')} className="flex-1 bg-indigo-900/40 text-indigo-300 py-2 rounded-xl text-xs font-bold border border-indigo-800 active:scale-95">🦶 День копыт</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['🔄 Качание (weaving)', '↕️ Кивание головой', '👣 Переступание', '🪵 Игра хоботом'].map((ster, i) => (
              <button key={i} onClick={() => addEvent(`Стереотипия: ${ster}`)} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 active:scale-95 text-left leading-tight">
                {ster}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button onClick={() => addEvent('🚨 Хромота (открыт выбор лап)')} className="p-3 rounded-2xl border border-amber-800 bg-amber-950/40 text-amber-300 text-xs font-bold active:scale-95 text-left flex justify-between">
              <span>🚨 Замечена хромота</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => addEvent('Хромота: ПП')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ПП</button>
              <button onClick={() => addEvent('Хромота: ЛП')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ЛП</button>
              <button onClick={() => addEvent('Хромота: ПЗ')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ПЗ</button>
              <button onClick={() => addEvent('Хромота: ЛЗ')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ЛЗ</button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => addEvent('⚠️ Хобот плетью')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-rose-400 active:scale-95">⚠️ Хобот плетью</button>
            <button onClick={() => addEvent('⚠️ Сопение / Хрип')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-rose-400 active:scale-95">⚠️ Сопение / Хрип</button>
            <button onClick={() => addEvent('🟡 Височные железы (секреция)')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-amber-400 active:scale-95">🟡 Секреция желез</button>
          </div>
        </div>
      </div>

      {/* REEL 6: SOCIAL DYNAMICS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="5">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">👥 Социальная динамика</h2>
          
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
            <button className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95">Марго <ChevronDown className="w-4 h-4"/></button>
            <span className="text-slate-500 font-bold">➔</span>
            <button className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95">Одри <ChevronDown className="w-4 h-4"/></button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => addEvent('💥 Стычка / Удар хоботом')} className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">💥 Стычка / Удар хоботом</button>
            <button onClick={() => addEvent('🥐 Отобрала пайку / сено')} className="bg-amber-950/40 border border-amber-800 text-amber-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🥐 Отобрала пайку / сено</button>
            <button onClick={() => addEvent('🤗 Взаимный груминг / Игра')} className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🤗 Взаимный груминг / Игра</button>
            <button onClick={() => addEvent('👀 Ревность к киперу')} className="bg-purple-950/40 border border-purple-800 text-purple-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">👀 Ревность к киперу</button>
            <button onClick={() => addEvent('💤 Спят рядом (контакт)')} className="bg-blue-950/40 border border-blue-800 text-blue-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">💤 Спят рядом (контакт)</button>
            <button onClick={() => addEvent('🔊 Трубный глас')} className="bg-orange-950/40 border border-orange-800 text-orange-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🔊 Трубный глас / Рокот</button>
          </div>
        </div>
      </div>

      {/* REEL 7: HANDOVER & TIMER */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="6">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🏁 Сдача дежурства</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Куч за смену:</span> <span className="text-emerald-400">{(metrics['margo']?.poop_count || 0) + (metrics['audrey']?.poop_count || 0) + (metrics['pretty']?.poop_count || 0)}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Вывезено тачек:</span> <span className="text-emerald-400">{inventory.barrows || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Роздано тюков:</span> <span className="text-emerald-400">{inventory.bales || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Инциденты:</span> <span className="text-rose-400">2</span></div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-200">
              <span>Чек-лист задач:</span>
              <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-800">8 / 8 выполнено</span>
            </div>
          </div>

          <div className="text-5xl font-black font-mono tracking-wider text-center py-4 rounded-3xl bg-slate-900 border border-emerald-500/30 text-emerald-400 my-2">
            23:59:05
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <button onClick={() => addEvent('Замечание: 🧹 Не вынесен навоз')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🧹 Не вынесен навоз</button>
            <button onClick={() => addEvent('Замечание: 🌾 Мало сена на ночь')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🌾 Мало сена на ночь</button>
            <button onClick={() => addEvent('Замечание: 🚰 Течь поилки')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🚰 Течь поилки</button>
            <button onClick={() => addEvent('📷 Фото косяка')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">📷 Фото косяка</button>
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500 rounded-full h-[60px] relative overflow-hidden flex items-center justify-center mt-auto" onClick={handleHandover}>
            <span className="text-emerald-400 font-bold z-10 pointer-events-none">🛑 Сдвиньте для сдачи смены ➔➔➔</span>
            <div className="absolute left-1 top-1 bottom-1 w-12 bg-emerald-500 rounded-full cursor-pointer flex items-center justify-center">
              <span className="text-slate-900 font-black">➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWERS AND MODALS */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Меню</h2>
            <button onClick={() => { setMenuOpen(false); onNavigate('dashboard'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Stethoscope className="w-5 h-5 text-emerald-400"/> Веткабинет</button>
            <button onClick={() => { setMenuOpen(false); onNavigate('feed_inventory'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Package className="w-5 h-5 text-amber-400"/> Склад кормов</button>
            <button onClick={() => { setMenuOpen(false); setWheelOpen(true); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Users className="w-5 h-5 text-purple-400"/> Жребий смены</button>
            <button onClick={() => { setMenuOpen(false); onNavigate('archive'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><ClipboardList className="w-5 h-5 text-slate-400"/> Архив смен</button>
          </div>
        </div>
      )}

      {wheelOpen && (
        <ShiftWheelModal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} onActionAssigned={(a, p) => addEvent(`Жребий: ${a} ➔ ${p}`)} />
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
