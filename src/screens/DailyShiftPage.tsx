import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics, FeedInventoryItem, createDefaultElephantMetrics } from '../types/shift';
import { Elephant, Assignment } from '../types';
import confetti from 'canvas-confetti';
import { 
  bodyMonitoringService, 
  BodyPhoto, 
  VetReminderTask,
  VetRecommendation
} from '../services/bodyMonitoringService';
import { 
  Calendar, Wifi, WifiOff, Menu, ClipboardList, Package, CircleDot, TreeDeciduous,
  UserCheck, CheckCircle, Camera, Activity, AlertTriangle, ShieldAlert, LogOut, Check, ChevronDown, Plus, Minus, Users, Stethoscope, X, RotateCcw,
  Bookmark, Droplets
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
  // Reel 7: Two-stage Handover Protocol state
  const [handoverStep, setHandoverStep] = useState<'outgoing' | 'incoming' | 'completed'>('outgoing');
  const [handoverTime, setHandoverTime] = useState<string>('');
  
  // Step 1: Outgoing keeper states
  const [outgoingChecklist, setOutgoingChecklist] = useState<string[]>([
    'Поилки вычищены и налиты',
    'Ночная пайка сена заложена в рептухи',
    'Тазы из-под каши вымыты',
    'Задвижки и тросы заперты на фиксаторы',
    'Электропастух проверен',
  ]);
  const [outgoingDamages, setOutgoingDamages] = useState<string[]>([]);
  const [outgoingPhotoUrl, setOutgoingPhotoUrl] = useState<string | null>(null);
  const outgoingPhotoRef = useRef<HTMLInputElement>(null);
  const [outgoingSlider, setOutgoingSlider] = useState<number>(0);

  // Step 2: Incoming keeper states
  const [incomingChecklist, setIncomingChecklist] = useState<string[]>([
    'Замки и вольеры целы',
    'Вода в поилках есть',
    'Слонихи спокойны / травм нет',
    'Инструмент и сеновал в порядке',
  ]);
  const [showIncomingIssues, setShowIncomingIssues] = useState<boolean>(false);
  const [incomingIssues, setIncomingIssues] = useState<string[]>([]);
  const [incomingPhotoUrl, setIncomingPhotoUrl] = useState<string | null>(null);
  const incomingPhotoRef = useRef<HTMLInputElement>(null);
  const [incomingSlider, setIncomingSlider] = useState<number>(0);

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

  // Reel 1: Reporting by Exception states & Photo monitoring
  const [notSlept, setNotSlept] = useState<Record<string, boolean>>(() => {
    const ex = bodyMonitoringService.getExceptions();
    return {
      margo: Boolean(ex.margo?.didNotSleep),
      audrey: Boolean(ex.audrey?.didNotSleep),
      pretty: Boolean(ex.pretty?.didNotSleep),
    };
  });
  const [photoElephant, setPhotoElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [selectedFoot, setSelectedFoot] = useState<'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ'>('ПП');
  const [bodyPhotos, setBodyPhotos] = useState<BodyPhoto[]>(() => bodyMonitoringService.getPhotos());
  const [selectedBodyPhoto, setSelectedBodyPhoto] = useState<BodyPhoto | null>(null);
  const footPhotoInputRef = useRef<HTMLInputElement>(null);
  const silhouettePhotoInputRef = useRef<HTMLInputElement>(null);
  const [vetReminders, setVetReminders] = useState<VetReminderTask[]>(() => bodyMonitoringService.getReminders());
  const [vetRecommendations, setVetRecommendations] = useState<VetRecommendation[]>(() => bodyMonitoringService.getRecommendations());
  const [physioTab, setPhysioTab] = useState<'poop'|'urine'|'sleep'>('poop');

  // Triple Frame States for Reel 1
  const [selectedPhysioElephant, setSelectedPhysioElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [stoolTraits, setStoolTraits] = useState<Record<string, 'dense' | 'dry' | 'liquid'>>({
    margo: 'dense',
    audrey: 'dense',
    pretty: 'dense',
  });
  const [urineTraits, setUrineTraits] = useState<Record<string, 'light' | 'dark' | 'sediment'>>({
    margo: 'light',
    audrey: 'light',
    pretty: 'light',
  });

  interface SleepPhaseItem {
    id: string;
    hours: number;
    time: string;
  }
  const [sleepHourInput, setSleepHourInput] = useState<number>(2.0);
  const [sleepPhases, setSleepPhases] = useState<Record<string, SleepPhaseItem[]>>({
    margo: [
      { id: '1', hours: 2.0, time: '01:30' },
      { id: '2', hours: 2.5, time: '04:45' },
    ],
    audrey: [
      { id: '1', hours: 2.0, time: '02:00' },
      { id: '2', hours: 2.0, time: '05:00' },
    ],
    pretty: [
      { id: '1', hours: 2.5, time: '01:00' },
      { id: '2', hours: 2.5, time: '04:30' },
    ],
  });

  const getTotalSleep = (eid: string) => {
    return (sleepPhases[eid] || []).reduce((acc, curr) => acc + curr.hours, 0);
  };

  const handleAddSleepPhase = () => {
    if (sleepHourInput <= 0) return;
    const newPhase: SleepPhaseItem = {
      id: `phase-${Date.now()}`,
      hours: sleepHourInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSleepPhases(prev => ({
      ...prev,
      [selectedPhysioElephant]: [...(prev[selectedPhysioElephant] || []), newPhase],
    }));
    const phaseNum = (sleepPhases[selectedPhysioElephant]?.length || 0) + 1;
    const eNames: Record<string, string> = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    addEvent(`${eNames[selectedPhysioElephant]}: зафиксирована Фаза сна ${phaseNum} (${sleepHourInput} ч)`);
    setSleepHourInput(1.5);
    if (notSlept[selectedPhysioElephant]) {
      toggleNotSlept(selectedPhysioElephant);
    }
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const handleRemoveSleepPhase = (phaseId: string) => {
    setSleepPhases(prev => ({
      ...prev,
      [selectedPhysioElephant]: (prev[selectedPhysioElephant] || []).filter(p => p.id !== phaseId),
    }));
  };

  const handleAcknowledgeRecommendation = (recId: string) => {
    const updated = bodyMonitoringService.acknowledgeRecommendation(recId, profile?.name || 'Дежурный кипер');
    setVetRecommendations(bodyMonitoringService.getRecommendations());
    if (updated) {
      addEvent(`🩺 Назначение врача (${updated.elephantName}): принято в работу ✓`);
      if (navigator.vibrate) navigator.vibrate(60);
    }
  };

  // Reel 3 state: Porridge Constructor & Watering
  const [mashBaseIngredients, setMashBaseIngredients] = useState<string[]>([
    'Овёс',
    'Отруби пшеничные',
    'Ячмень плющеный',
  ]);
  const [mashPhytoAdditives, setMashPhytoAdditives] = useState<string[]>([
    'ВТМ (травяная мука)',
    'Сбор Wellhorse (суставы)',
  ]);

  const toggleMashBase = (item: string) => {
    setMashBaseIngredients(prev => {
      const next = prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item];
      addEvent(`Рецепт каши: ${prev.includes(item) ? 'убран' : 'добавлен'} ${item}`);
      return next;
    });
  };

  const toggleMashPhyto = (item: string) => {
    setMashPhytoAdditives(prev => {
      const next = prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item];
      addEvent(`Фито-добавка: ${prev.includes(item) ? 'убрана' : 'добавлена'} ${item}`);
      return next;
    });
  };

  const [wateringSlots, setWateringSlots] = useState<Record<string, { given: boolean; time: string; thirst: 'normal' | 'greedy' | 'sluggish' }>>({
    morning: { given: true, time: '07:30', thirst: 'normal' },
    noon: { given: true, time: '13:30', thirst: 'normal' },
    evening: { given: false, time: '19:30', thirst: 'normal' },
  });

  const handleToggleWaterSlot = (slotId: string) => {
    setWateringSlots(prev => {
      const current = prev[slotId];
      const nextGiven = !current.given;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const next = {
        ...prev,
        [slotId]: {
          ...current,
          given: nextGiven,
          time: nextGiven ? nowTime : current.time,
        },
      };
      const slotNames: Record<string, string> = { morning: 'Утреннее', noon: 'Дневное', evening: 'Вечернее' };
      addEvent(`Водный режим: ${slotNames[slotId]} поение ${nextGiven ? 'проведено ✓' : 'отменено'}`);
      return next;
    });
  };

  const handleSetThirst = (slotId: string, thirst: 'normal' | 'greedy' | 'sluggish') => {
    setWateringSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        thirst,
      },
    }));
    const thirstNames = { normal: 'в норме', greedy: 'пьют жадно', sluggish: 'вяло / отказ ⚠️' };
    addEvent(`Поение (${slotId}): аппетит/жажда ${thirstNames[thirst]}`);
  };
  
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

  // Sync with body monitoring service (photos, reminders, exceptions, recommendations)
  useEffect(() => {
    const handlePhotos = () => setBodyPhotos(bodyMonitoringService.getPhotos());
    const handleReminders = () => setVetReminders(bodyMonitoringService.getReminders());
    const handleRecs = () => setVetRecommendations(bodyMonitoringService.getRecommendations());
    const handleExceptions = () => {
      const ex = bodyMonitoringService.getExceptions();
      setNotSlept({
        margo: Boolean(ex.margo?.didNotSleep),
        audrey: Boolean(ex.audrey?.didNotSleep),
        pretty: Boolean(ex.pretty?.didNotSleep),
      });
    };
    window.addEventListener('elephant-photos-updated', handlePhotos);
    window.addEventListener('elephant-reminders-updated', handleReminders);
    window.addEventListener('elephant-recommendations-updated', handleRecs);
    window.addEventListener('elephant-exceptions-updated', handleExceptions);
    return () => {
      window.removeEventListener('elephant-photos-updated', handlePhotos);
      window.removeEventListener('elephant-reminders-updated', handleReminders);
      window.removeEventListener('elephant-recommendations-updated', handleRecs);
      window.removeEventListener('elephant-exceptions-updated', handleExceptions);
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

  
  const updateSleepState = (eid: string, field: 'duration' | 'posture', value: string) => {
    setMetrics(prev => {
      const current = prev[eid]?.sleep_state || { duration: null, posture: null };
      return { ...prev, [eid]: { ...prev[eid], sleep_state: { ...current, [field]: value } } };
    });
    addEvent(`${eid}: Сон ${field} = ${value}`);
  };

  const toggleNotSlept = (eid: string) => {
    setNotSlept(prev => {
      const nextVal = !prev[eid];
      bodyMonitoringService.setElephantException(eid, { didNotSleep: nextVal });
      const eName = eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти';
      if (nextVal) {
        addEvent(`⚠️ ИСКЛЮЧЕНИЕ: ${eName} не ложилась ночью!`);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        updateSleepState(eid, 'duration', '❌ Не легла');
      } else {
        addEvent(`🟢 ${eName}: статус сна возвращён в норму`);
        updateSleepState(eid, 'duration', '🟢 3-4ч (норма)');
      }
      return { ...prev, [eid]: nextVal };
    });
  };

  const handleFootPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const eName = photoElephant === 'margo' ? 'Марго' : photoElephant === 'audrey' ? 'Одри' : 'Прэтти';
      const now = new Date();
      bodyMonitoringService.addPhoto({
        elephantId: photoElephant,
        elephantName: eName,
        type: 'foot',
        foot: selectedFoot,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        dataUrl,
        note: `Плановый еженедельный чек стопы ${selectedFoot}`,
      });
      addEvent(`📷 Фото стопы ${selectedFoot} (${eName}) сохранено в архив`);
      if (navigator.vibrate) navigator.vibrate(50);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSilhouettePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const eName = photoElephant === 'margo' ? 'Марго' : photoElephant === 'audrey' ? 'Одри' : 'Прэтти';
      const now = new Date();
      bodyMonitoringService.addPhoto({
        elephantId: photoElephant,
        elephantName: eName,
        type: 'silhouette',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        dataUrl,
        note: 'Плановая оценка упитанности / силуэта',
      });
      addEvent(`📷 Фото силуэта (${eName}) сохранено в архив`);
      if (navigator.vibrate) navigator.vibrate(50);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleReminder = (id: string) => {
    const updated = bodyMonitoringService.toggleReminder(id, profile?.name || 'Дежурный кипер');
    setVetReminders(bodyMonitoringService.getReminders());
    if (updated?.completed) {
      addEvent(`✅ Выполнено: ${updated.text}`);
      if (navigator.vibrate) navigator.vibrate(60);
    }
  };

  const incrementMetric = (eid: string, field: 'poop_count'|'urination_count', val: number) => {
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

  // Sync Reel 1 physiological entries into bodyMonitoringService
  useEffect(() => {
    ['margo', 'audrey', 'pretty'].forEach((eid) => {
      const eName = eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти';
      const poop = metrics[eid]?.poop_count ?? 15;
      const urine = metrics[eid]?.urination_count ?? 10;
      const stool = stoolTraits[eid] || 'dense';
      const urineTrait = urineTraits[eid] || 'clear';
      const phases = sleepPhases[eid] || [];
      const sleep = getTotalSleep(eid);

      bodyMonitoringService.saveDailyPhysio({
        date: selectedDate,
        elephantId: eid as any,
        elephantName: eName,
        poopCount: poop,
        stoolTrait: stool,
        urineCount: urine,
        urineTrait: urineTrait,
        sleepHours: sleep,
        sleepPhases: phases,
      });
    });
  }, [metrics, stoolTraits, urineTraits, sleepPhases, selectedDate]);

  return (
    <div className="w-screen min-w-full h-[100dvh] max-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-slate-950 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y overscroll-none select-none text-slate-100" ref={containerRef}>
      
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
                      if(dateInputRef.current && "click" in dateInputRef.current) (dateInputRef.current as HTMLInputElement).click();
                    }
                  } else {
                    if(dateInputRef.current && "click" in dateInputRef.current) (dateInputRef.current as HTMLInputElement).click();
                  }
                }
              }} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          {/* Physiological Monitoring Shortcut */}
          <button 
            onClick={() => onNavigate('monitoring')} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 text-sky-400 hover:text-white border border-slate-700 active:scale-95 text-xs font-bold transition-all shadow-sm"
            title="Мониторинг физиологии и коридоры нормы"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Мониторинг</span>
          </button>
          {/* Medical Doctor Recommendation Badge */}
          {vetRecommendations.filter(r => !r.acknowledged).length > 0 && (
            <button
              onClick={() => {
                const reel0 = containerRef.current?.querySelector('.reel-section[data-index="0"]');
                reel0?.scrollIntoView({ behavior: 'smooth' });
                if (navigator.vibrate) navigator.vibrate(40);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-200 text-xs font-black active:scale-95 animate-pulse shadow-md"
              title="Назначение врача ожидает подтверждения"
            >
              <span className="text-sm">🩺</span>
              <span className="hidden sm:inline">Врач:</span>
              <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-black text-[10px]">
                {vetRecommendations.filter(r => !r.acknowledged).length}
              </span>
            </button>
          )}
          <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FLOATING INDICATOR (6 REELS) */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-none">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`w-1.5 rounded-full transition-all duration-300 ${activeReel === i ? 'h-6 bg-emerald-400' : 'h-1.5 bg-slate-700'}`} />
        ))}
      </div>

      {/* FLOATING LOG BADGE */}
      <button onClick={() => setLogOpen(true)} className="fixed bottom-5 right-4 z-30 pointer-events-auto shadow-2xl flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 text-xs font-medium active:scale-95">
        <ClipboardList className="w-4 h-4 text-emerald-400" />
        Лента смены
        <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">{events.length}</span>
      </button>

      {/* REEL 1: PHYSIO - REPORTING BY EXCEPTION */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-y-auto flex flex-col p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="0">
        <div className="flex flex-col gap-2.5 flex-1 justify-start mt-1">
          {/* Active Doctor Reminders for Keeper */}
          {vetReminders.filter(r => !r.completed).length > 0 && (
            <div className="bg-sky-950/70 border border-sky-600/50 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 shadow-md">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xl shrink-0">🩺</span>
                <div className="text-xs text-sky-200">
                  <div className="font-bold text-sky-100 flex items-center gap-1">
                    Назначение врача ({vetReminders.filter(r => !r.completed)[0].elephantName || 'Все'}):
                  </div>
                  <p className="truncate text-slate-300 font-medium">{vetReminders.filter(r => !r.completed)[0].text}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleReminder(vetReminders.filter(r => !r.completed)[0].id)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                Сделано
              </button>
            </div>
          )}

          {/* Doctor Recommendation Response Card (if active for this elephant or all) */}
          {vetRecommendations.filter(r => !r.acknowledged).length > 0 && (
            <div className="bg-sky-950/80 border-2 border-sky-500/60 rounded-2xl p-3 flex flex-col gap-2 shadow-lg animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🩺</span>
                  <span className="text-xs font-black text-sky-200">
                    Назначение врача ({vetRecommendations.filter(r => !r.acknowledged)[0].elephantName})
                  </span>
                </div>
                <span className="text-[10px] text-sky-300 font-mono">
                  {vetRecommendations.filter(r => !r.acknowledged)[0].time}
                </span>
              </div>

              <div className="flex gap-2.5 items-start bg-slate-950/70 p-2 rounded-xl border border-sky-900/60">
                {vetRecommendations.filter(r => !r.acknowledged)[0].photoUrl && (
                  <img
                    src={vetRecommendations.filter(r => !r.acknowledged)[0].photoUrl}
                    alt="Фото от врача"
                    className="w-14 h-14 object-cover rounded-lg border border-sky-700/60 shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <div className="text-[11px] font-bold text-sky-100">
                    {vetRecommendations.filter(r => !r.acknowledged)[0].diagnosis}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-emerald-400">Курс:</strong> {vetRecommendations.filter(r => !r.acknowledged)[0].treatmentCourse}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAcknowledgeRecommendation(vetRecommendations.filter(r => !r.acknowledged)[0].id)}
                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>[ ✓ Принято в работу / Обработано ]</span>
              </button>
            </div>
          )}

          {/* Heading & Elephant Selector */}
          <div className="flex items-center justify-between gap-2">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 flex-1">
              {[
                { id: 'margo', label: 'Марго', dot: 'bg-emerald-400' },
                { id: 'audrey', label: 'Одри', dot: 'bg-amber-400' },
                { id: 'pretty', label: 'Прэтти', dot: 'bg-purple-400' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedPhysioElephant(tab.id as any);
                    if (navigator.vibrate) navigator.vibrate(25);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    selectedPhysioElephant === tab.id
                      ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[11px] bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <span className="text-slate-400">Статус:</span>
              {notSlept[selectedPhysioElephant] ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ЧП
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Норма
                </span>
              )}
            </div>
          </div>

          {/* TRIPLE FRAME: [ Кал (кучи) ] [ Моча (разы) ] [ Сон (часы и фазы) ] */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {/* 1. КАЛ (КУЧИ) */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1">
                    💩 Кал
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">кучи</span>
                </div>

                {/* Stepper +/- */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => incrementMetric(selectedPhysioElephant, 'poop_count', -1)}
                    className="w-7 h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-base"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-lg text-white">
                    {metrics[selectedPhysioElephant]?.poop_count || 0}
                  </span>
                  <button
                    onClick={() => incrementMetric(selectedPhysioElephant, 'poop_count', 1)}
                    className="w-7 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-300 active:bg-amber-500 active:text-slate-950 font-bold flex items-center justify-center text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Характеристика стула */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Стул:</span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'dense', label: 'Плотный ✓', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' },
                    { id: 'dry', label: 'Сухой', color: 'bg-amber-600/30 text-amber-300 border-amber-500/50' },
                    { id: 'liquid', label: 'Жидкий ⚠️', color: 'bg-rose-600/30 text-rose-300 border-rose-500/60' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setStoolTraits(prev => ({ ...prev, [selectedPhysioElephant]: opt.id as any }));
                        addEvent(`${selectedPhysioElephant}: стул ${opt.label}`);
                        if (navigator.vibrate) navigator.vibrate(25);
                      }}
                      className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center leading-tight border ${
                        stoolTraits[selectedPhysioElephant] === opt.id
                          ? `${opt.color} font-black shadow-sm`
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. МОЧА (РАЗЫ) */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1">
                    💧 Моча
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">разы</span>
                </div>

                {/* Stepper +/- */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => incrementMetric(selectedPhysioElephant, 'urination_count', -1)}
                    className="w-7 h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-base"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-lg text-white">
                    {metrics[selectedPhysioElephant]?.urination_count || 0}
                  </span>
                  <button
                    onClick={() => incrementMetric(selectedPhysioElephant, 'urination_count', 1)}
                    className="w-7 h-8 rounded-lg bg-sky-600/30 border border-sky-500/40 text-sky-300 active:bg-sky-500 active:text-slate-950 font-bold flex items-center justify-center text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Характеристика мочи */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Цвет:</span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'light', label: 'Светлая ✓', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' },
                    { id: 'dark', label: 'Тёмная', color: 'bg-amber-600/30 text-amber-300 border-amber-500/50' },
                    { id: 'sediment', label: 'Осадок ⚠️', color: 'bg-rose-600/30 text-rose-300 border-rose-500/60' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setUrineTraits(prev => ({ ...prev, [selectedPhysioElephant]: opt.id as any }));
                        addEvent(`${selectedPhysioElephant}: моча ${opt.label}`);
                        if (navigator.vibrate) navigator.vibrate(25);
                      }}
                      className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center leading-tight border ${
                        urineTraits[selectedPhysioElephant] === opt.id
                          ? `${opt.color} font-black shadow-sm`
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. СОН (ЧАСЫ И ФАЗЫ С КНОПКОЙ ЗАКЛАДКИ) */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1">
                    💤 Сон
                  </span>
                  <span className="text-[10px] text-emerald-400 font-black">
                    {getTotalSleep(selectedPhysioElephant)} ч
                  </span>
                </div>

                {/* Stepper for current phase hours */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setSleepHourInput(prev => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
                    className="w-7 h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm text-indigo-300">
                    {sleepHourInput}ч
                  </span>
                  <button
                    onClick={() => setSleepHourInput(prev => Math.min(10, Math.round((prev + 0.5) * 10) / 10))}
                    className="w-7 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 active:bg-indigo-500 active:text-white font-bold flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Bookmark Button: [ 🔖 + Фаза ] */}
                <button
                  onClick={handleAddSleepPhase}
                  className="w-full mt-1.5 py-1.5 px-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-md transition-all"
                >
                  <Bookmark className="w-3 h-3 fill-current" />
                  <span>+ Фаза</span>
                </button>
              </div>

              {/* List of recorded phases */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-col gap-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">
                  Фазы ({(sleepPhases[selectedPhysioElephant] || []).length}):
                </div>
                <div className="max-h-20 overflow-y-auto flex flex-col gap-1 pr-0.5">
                  {(sleepPhases[selectedPhysioElephant] || []).map((phase, idx) => (
                    <div
                      key={phase.id}
                      className="flex items-center justify-between bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800/80 text-[10px]"
                    >
                      <span className="font-mono text-indigo-300 font-bold">Ф{idx + 1}: {phase.hours}ч</span>
                      <button
                        onClick={() => handleRemoveSleepPhase(phase.id)}
                        className="text-slate-500 hover:text-rose-400 ml-1 p-0.5"
                        title="Удалить фазу"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(sleepPhases[selectedPhysioElephant] || []).length === 0 && (
                    <div className="text-[10px] text-slate-500 text-center py-1">
                      Нет фаз сна
                    </div>
                  )}
                </div>

                {/* Alarm exception button */}
                <button
                  onClick={() => toggleNotSlept(selectedPhysioElephant)}
                  className={`w-full mt-1 py-1 rounded-lg text-[9px] font-bold transition-all active:scale-95 border ${
                    notSlept[selectedPhysioElephant]
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {notSlept[selectedPhysioElephant] ? 'Снять ЧП ⚠️' : '⚠️ Не ложилась'}
                </button>
              </div>
            </div>
          </div>

          {/* All 3 Elephants mini status strip */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/70 p-2 rounded-2xl border border-slate-800/80 text-[10px]">
            {[
              { id: 'margo', label: 'Марго' },
              { id: 'audrey', label: 'Одри' },
              { id: 'pretty', label: 'Прэтти' },
            ].map(e => {
              const ePoop = metrics[e.id]?.poop_count || 0;
              const eUrine = metrics[e.id]?.urination_count || 0;
              const eSleep = getTotalSleep(e.id);
              const ePhases = (sleepPhases[e.id] || []).length;
              const isCurrent = selectedPhysioElephant === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedPhysioElephant(e.id as any)}
                  className={`p-1.5 rounded-xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-slate-800 border-slate-700 shadow-sm'
                      : 'bg-slate-950/50 border-slate-900 text-slate-400'
                  }`}
                >
                  <div className="font-black text-slate-200 truncate">{e.label}</div>
                  <div className="text-slate-400 mt-0.5">
                    💩 <span className="text-slate-200 font-bold">{ePoop}</span> • 💧 <span className="text-slate-200 font-bold">{eUrine}</span>
                  </div>
                  <div className="text-indigo-400 font-bold">
                    💤 {eSleep}ч <span className="text-slate-500 font-normal">({ePhases} ф)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Planned Photo Monitoring: Foot check & Silhouette/Condition */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 mt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                Плановый фото-контроль «Оболочки»
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                В архиве: {bodyPhotos.length} фото
              </span>
            </div>

            {/* Elephant Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {[
                { id: 'margo', label: 'Марго' },
                { id: 'audrey', label: 'Одри' },
                { id: 'pretty', label: 'Прэтти' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPhotoElephant(tab.id as any)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    photoElephant === tab.id ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🐘 {tab.label}
                </button>
              ))}
            </div>

            {/* Weekly Foot Check with leg selection */}
            <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  Еженедельный чек стопы:
                </span>
                <div className="flex gap-1">
                  {(['ПП', 'ЛП', 'ПЗ', 'ЛЗ'] as const).map(leg => (
                    <button
                      key={leg}
                      onClick={() => setSelectedFoot(leg)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                        selectedFoot === leg
                          ? 'bg-sky-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {leg}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => footPhotoInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 active:scale-95 text-xs font-bold text-sky-300 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                [ 📷 Фото стопы {selectedFoot} (план раз в неделю) ]
              </button>
              <input
                ref={footPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFootPhotoCapture}
              />
            </div>

            {/* Monthly Body Condition / Silhouette */}
            <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <button
                onClick={() => silhouettePhotoInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 active:scale-95 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                [ 📷 Фото силуэта / бока (план раз в месяц) ]
              </button>
              <input
                ref={silhouettePhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleSilhouettePhotoCapture}
              />
            </div>

            {/* Recent Photos Mini-Gallery */}
            {bodyPhotos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
                {bodyPhotos.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedBodyPhoto(p)}
                    className="shrink-0 flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer active:scale-95 transition-all"
                  >
                    <img src={p.dataUrl} alt={p.note} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="text-[10px] leading-tight pr-1">
                      <div className="font-bold text-slate-200">{p.elephantName}</div>
                      <div className="text-slate-400">{p.type === 'foot' ? `Стопа ${p.foot}` : 'Бок / силуэт'}</div>
                      <div className="text-[9px] text-slate-500">{p.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* REEL 3: RATION, PORRIDGE CONSTRUCTOR & WATERING */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-y-auto flex flex-col justify-start p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="2">
        <div className="flex flex-col gap-2.5 flex-1 justify-start mt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              🥣 Концентраты, каша и водопой
            </h2>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
              Замес и гидратация
            </span>
          </div>

          {/* Brewing Tech Process & Post-Arena Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-between">
              <span className="font-black text-slate-300 text-xs mb-1.5 flex items-center gap-1.5">
                <span>♨️</span> Техпроцесс запарки
              </span>
              {!porridgeBrewTime ? (
                <button 
                  onClick={() => {
                    const now = Date.now();
                    const timeStr = new Date(now).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    setPorridgeBrewTimestamp(now);
                    setPorridgeBrewTime(timeStr);
                    addEvent('Каша запарена кипятком');
                    if (navigator.vibrate) navigator.vibrate(40);
                  }} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-black active:scale-95 shadow-md w-full text-center transition-all"
                >
                  ♨️ Запарить кашу кипятком
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  {(() => {
                    const elapsedMins = porridgeBrewTimestamp ? Math.floor((currentTime - porridgeBrewTimestamp) / 60000) : 0;
                    if (elapsedMins >= 150) {
                      return (
                        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex flex-col gap-0.5 items-center text-center">
                          <span>⏳ Запарена в {porridgeBrewTime} ({elapsedMins} мин)</span>
                          <span className="text-rose-400 font-black">⚠️ Проверь температуру / не закисла ли!</span>
                        </div>
                      );
                    } else if (elapsedMins >= 45) {
                      return (
                        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex flex-col gap-0.5 items-center text-center">
                          <span>⏳ Запарена в {porridgeBrewTime} ({elapsedMins} мин)</span>
                          <span className="text-emerald-400 font-black">🟢 Каша настоялась и остыла (готова)</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex flex-col gap-0.5 items-center text-center">
                          <span>⏳ Запарена в {porridgeBrewTime} ({elapsedMins} мин)</span>
                          <span className="text-sky-400">Настаивается (остывает)...</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
              <button 
                onClick={() => {
                  setIsAfterArena(!isAfterArena);
                  if (navigator.vibrate) navigator.vibrate(25);
                }} 
                className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold active:scale-95 transition-all border ${
                  isAfterArena 
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>🎪 Слоны после манежа</span>
                <span className="text-xs">{isAfterArena ? '⚠️ Активно' : 'Выкл'}</span>
              </button>
              {isAfterArena ? (
                <p className="text-[10px] text-amber-300 mt-1.5 font-medium leading-tight">
                  ⚠️ Остывание 45 мин! Сено можно сразу. Поение и каша — строго после остывания.
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  Стандартный режим выдачи по расписанию
                </p>
              )}
            </div>
          </div>

          {/* PORRIDGE CONSTRUCTOR (MULTI-SELECT CHIPS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                🥣 Конструктор каши / замеса
              </span>
              <span className="text-[10px] text-amber-400 font-bold">
                Мультивыбор чипсов
              </span>
            </div>

            {/* Base Ingredients Multi-select */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                База замеса:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Овёс',
                  'Отруби пшеничные',
                  'Ячмень плющеный',
                  'Свекловичный жом',
                  'Кукуруза дроблёная',
                ].map((item) => {
                  const isSelected = mashBaseIngredients.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMashBase(item)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phyto-additives & Minerals Multi-select */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Фито-сборы и добавки:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ВТМ (травяная мука)',
                  'Сбор Wellhorse (суставы)',
                  'Льняное семя / масло',
                  'Витамины группы B',
                  'Электролиты / соль',
                ].map((item) => {
                  const isSelected = mashPhytoAdditives.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMashPhyto(item)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-black shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipe summary banner */}
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] flex flex-col gap-0.5">
              <span className="text-slate-400 font-bold text-[10px]">Рецепт в корыто:</span>
              <p className="text-slate-200 font-medium">
                <span className="text-amber-300 font-bold">{mashBaseIngredients.join(' + ') || 'Нет базы'}</span>
                {mashPhytoAdditives.length > 0 && (
                  <> • <span className="text-emerald-300 font-bold">{mashPhytoAdditives.join(', ')}</span></>
                )}
              </p>
            </div>
          </div>

          {/* WATERING REGIME (3 SLOTS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                💧 Водный режим (поение из шланга / поилок)
              </span>
              <span className="text-[10px] text-sky-400 font-bold">
                Норма: 100–150 л/день
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'morning', label: '07:30 Утро', defaultTime: '07:30' },
                { id: 'noon', label: '13:30 День', defaultTime: '13:30' },
                { id: 'evening', label: '19:30 Вечер', defaultTime: '19:30' },
              ].map(slot => {
                const data = wateringSlots[slot.id] || { given: false, time: slot.defaultTime, thirst: 'normal' };
                return (
                  <div
                    key={slot.id}
                    className={`p-2 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      data.given
                        ? 'bg-slate-950 border-sky-900/70'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-200">{slot.label}</span>
                      <button
                        onClick={() => {
                          setWateringSlots(prev => ({
                            ...prev,
                            [slot.id]: {
                              ...(prev[slot.id] || { time: slot.defaultTime, thirst: 'normal' }),
                              given: !prev[slot.id]?.given,
                            },
                          }));
                          addEvent(`Поение (${slot.label}): ${!data.given ? 'проведено ✓' : 'снята отметка'}`);
                          if (navigator.vibrate) navigator.vibrate(30);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          data.given
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-black'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {data.given ? '✓ Напоены' : 'Не напоены'}
                      </button>
                    </div>

                    {/* Thirst assessment chips */}
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'normal', label: 'Норма', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
                        { id: 'greedy', label: 'Жадно', color: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
                        { id: 'sluggish', label: 'Отказ ⚠️', color: 'bg-rose-600/30 text-rose-300 border-rose-500/40' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setWateringSlots(prev => ({
                              ...prev,
                              [slot.id]: {
                                ...(prev[slot.id] || { given: true, time: slot.defaultTime }),
                                thirst: t.id as any,
                              },
                            }));
                            addEvent(`Жажда (${slot.label}): ${t.label}`);
                            if (navigator.vibrate) navigator.vibrate(25);
                          }}
                          className={`py-1 rounded-lg text-[9px] font-bold text-center border transition-all ${
                            data.thirst === t.id
                              ? `${t.color} font-black shadow-sm`
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
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

      {/* REEL 4: VET & STEREOTYPIES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="3">
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
                   const nextVal = !isActive;
                   setLameness(p => ({ ...p, [selectedVetElephant]: nextVal }));
                   bodyMonitoringService.setElephantException(selectedVetElephant, {
                     lameness: nextVal,
                     lameLeg: (lameLeg[selectedVetElephant] as 'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ') || 'ПП'
                   });
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
                          bodyMonitoringService.setElephantException(selectedVetElephant, {
                            lameness: true,
                            lameLeg: leg as 'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ'
                          });
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

      {/* REEL 5: SOCIAL DYNAMICS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="4">
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

      {/* REEL 6: HANDOVER & PROTOCOL + CHORES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3 pb-24 box-border shrink-0 relative pt-[56px]" data-index="5">
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-0.5 pb-1 relative z-10">
          {/* Header & Step Tracker */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <span>📋 Акт передачи смены и хозработы</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              {handoverStep === 'outgoing' ? '1/3: Сдача' : handoverStep === 'incoming' ? '2/3: Приёмка' : '3/3: Финал'}
            </span>
          </div>

          {/* Stepper tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-[11px] font-bold text-center">
            <button 
              type="button"
              onClick={() => handoverStep !== 'outgoing' && setHandoverStep('outgoing')}
              className={`py-1.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
                handoverStep === 'outgoing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>1. Сдача</span>
              {handoverStep !== 'outgoing' && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
            </button>
            <button 
              type="button"
              onClick={() => handoverTime && setHandoverStep('incoming')}
              className={`py-1.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
                handoverStep === 'incoming'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>2. Приёмка</span>
              {handoverStep === 'completed' && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
            </button>
            <div 
              className={`py-1.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
                handoverStep === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-500'
              }`}
            >
              <span>3. Акт</span>
              {handoverStep === 'completed' && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
            </div>
          </div>

          {/* STEP 1: OUTGOING KEEPER */}
          {handoverStep === 'outgoing' && (
            <div className="flex flex-col gap-2.5">
              {/* Summary of shift */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-lg">💩</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">Навоз (тачек)</span>
                  <span className="text-base font-black text-emerald-400">{dungWheelbarrows || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-lg">🌾</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">Сено (тюков)</span>
                  <span className="text-base font-black text-emerald-400">{distributed?.bales || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-lg">⚠️</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">Поломки / ЧП</span>
                  <span className={`text-base font-black ${incidentCount + outgoingDamages.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {incidentCount + outgoingDamages.length}
                  </span>
                </div>
              </div>

              {/* COMPACT CHORES CHECKLIST (TRANSFERRED FROM REEL) */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    🧹 Хозработы дежурства (клининг)
                  </span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/60">
                    Помыто: {washedElephants.length}/3
                  </span>
                </div>

                {/* Showers */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Помывка (душ):</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'margo', label: 'Марго' },
                      { id: 'audrey', label: 'Одри' },
                      { id: 'pretty', label: 'Прэтти' },
                    ].map(el => {
                      const isWashed = washedElephants.includes(el.id);
                      return (
                        <button 
                          key={el.id}
                          type="button"
                          onClick={() => {
                            if (!isWashed) {
                              setWashedElephants(p => [...p, el.id]);
                              addEvent(`Помыта ${el.label} (душ)`);
                            } else {
                              setWashedElephants(p => p.filter(id => id !== el.id));
                            }
                            if (navigator.vibrate) navigator.vibrate(30);
                          }}
                          className={`py-2 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border ${
                            isWashed 
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-black shadow-sm' 
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>🐘 {el.label}</span>
                          {isWashed && <span>🚿</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dung Wheelbarrows & Carpets */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/70">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">🚜 Вывоз навоза</span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          if (dungWheelbarrows > 0) {
                            setDungWheelbarrows(p => p - 1);
                            addEvent('Отмена тачки');
                          }
                        }} 
                        className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-sm active:scale-95 text-slate-300"
                      >
                        -
                      </button>
                      <span className="text-base font-black font-mono text-white min-w-[20px] text-center">
                        {dungWheelbarrows}
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setDungWheelbarrows(p => p + 1);
                          addEvent('Вывезена тачка навоза (+1)');
                          if (navigator.vibrate) navigator.vibrate(25);
                        }} 
                        className="w-7 h-7 bg-amber-600/40 border border-amber-500/50 rounded-lg flex items-center justify-center font-bold text-sm active:scale-95 text-amber-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      setCarpetsCleaned(!carpetsCleaned);
                      if (!carpetsCleaned) addEvent('🧼 Ковры зачищены');
                      if (navigator.vibrate) navigator.vibrate(30);
                    }} 
                    className={`border rounded-xl p-2 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                      carpetsCleaned 
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-base">{carpetsCleaned ? '✓' : '🧼'}</span>
                    <span className="text-[10px] font-bold text-center leading-tight">Ковры зачищены</span>
                  </button>
                </div>

                {/* Spot Wash */}
                <div className="pt-1 border-t border-slate-800/70 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400">
                    🚿 Точечная замывка ({selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти'}):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Ноги', 'Круп', 'Бок'].map(zone => {
                      const isActive = spotWash?.elephant === selectedVetElephant && spotWash?.zone === zone;
                      return (
                        <button 
                          key={zone}
                          type="button"
                          onClick={() => {
                            setSpotWash({ elephant: selectedVetElephant, zone });
                            const eName = selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти';
                            addEvent(`🚿 Замывка (${eName}): ${zone}`);
                            if (navigator.vibrate) navigator.vibrate(25);
                          }} 
                          className={`py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all border ${
                            isActive 
                              ? 'bg-sky-600 border-sky-500 text-white shadow-sm' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {zone}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preparation Checklist */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Чек-лист подготовки к сдаче
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                    {outgoingChecklist.length}/5
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    'Поилки вычищены и налиты',
                    'Ночная пайка сена заложена в рептухи',
                    'Тазы из-под каши вымыты',
                    'Задвижки и тросы заперты на фиксаторы',
                    'Электропастух проверен',
                  ].map((item) => {
                    const isChecked = outgoingChecklist.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(30);
                          setOutgoingChecklist((prev) =>
                            isChecked ? prev.filter((i) => i !== item) : [...prev, item]
                          );
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs font-semibold transition-all active:scale-[0.98] ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="flex-1">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift damages block */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Поломки за смену
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['🧹 Метла', '🪣 Ведро', '🚿 Шланг', '🚪 Засов'].map((damageItem) => {
                    const isSelected = outgoingDamages.includes(damageItem);
                    return (
                      <button
                        key={damageItem}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(40);
                          setOutgoingDamages((prev) => {
                            const next = isSelected ? prev.filter((d) => d !== damageItem) : [...prev, damageItem];
                            if (!isSelected) {
                              addEvent(`⚠️ Зафиксирована поломка: ${damageItem}`);
                            }
                            return next;
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-rose-950/50 border-rose-500 text-rose-300 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {damageItem}
                      </button>
                    );
                  })}
                </div>

                {/* Hidden camera input for outgoing keeper */}
                <input
                  ref={outgoingPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const url = URL.createObjectURL(file);
                      setOutgoingPhotoUrl(url);
                      addEvent('📸 Зафиксирована поломка / дефект (фото)');
                      if (navigator.vibrate) navigator.vibrate(50);
                    }
                  }}
                />

                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => outgoingPhotoRef.current?.click()}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span>📷 Зафиксировать поломку / дефект</span>
                  </button>

                  {outgoingPhotoUrl && (
                    <div className="relative shrink-0">
                      <img
                        src={outgoingPhotoUrl}
                        alt="Поломка"
                        className="w-10 h-10 object-cover rounded-xl border border-amber-400 shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setOutgoingPhotoUrl(null)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Slider Outgoing */}
              <div className="mt-1 flex flex-col gap-1">
                <div className="relative h-[56px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none select-none group" style={{ containerType: 'inline-size' }}>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-amber-500/30 transition-all duration-75 ease-out"
                    style={{ width: `${outgoingSlider}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-xs font-bold tracking-wider transition-all uppercase ${outgoingSlider > 50 ? 'text-amber-300' : 'text-slate-300'}`}>
                      {outgoingSlider >= 85 ? 'ОТПУСТИТЕ ДЛЯ СДАЧИ!' : 'Сдвиньте для сдачи смены ➔'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={outgoingSlider}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOutgoingSlider(val);
                      if (val >= 85 && navigator.vibrate) {
                        navigator.vibrate(50);
                      }
                    }}
                    onTouchEnd={() => {
                      if (outgoingSlider >= 85) {
                        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setHandoverTime(nowTime);
                        setHandoverStep('incoming');
                        setOutgoingSlider(0);
                        if (navigator.vibrate) navigator.vibrate(50);
                        addEvent(`📋 Смена подготовлена к сдаче в ${nowTime}`);
                      } else {
                        setOutgoingSlider(0);
                      }
                    }}
                    onMouseUp={() => {
                      if (outgoingSlider >= 85) {
                        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setHandoverTime(nowTime);
                        setHandoverStep('incoming');
                        setOutgoingSlider(0);
                        if (navigator.vibrate) navigator.vibrate(50);
                        addEvent(`📋 Смена подготовлена к сдаче в ${nowTime}`);
                      } else {
                        setOutgoingSlider(0);
                      }
                    }}
                  />
                  <div
                    className="absolute left-1 top-1 bottom-1 w-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-75 ease-out z-10 pointer-events-none"
                    style={{ transform: `translateX(calc(${outgoingSlider / 100} * (100cqw - 56px)))` }}
                  >
                    <span className="text-slate-950 font-black">➔</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INCOMING KEEPER */}
          {handoverStep === 'incoming' && (
            <div className="flex flex-col gap-2.5">
              {/* Information Banner */}
              <div className="bg-sky-950/40 border border-sky-500/40 p-3 rounded-2xl flex items-start gap-2.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-sky-200">Входной контроль</div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    Смену сдает: <span className="font-bold text-white">{profile?.name || 'Дежурный кипер'}</span> в <span className="font-bold text-amber-300">{handoverTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>. Проверьте сектор!
                  </div>
                </div>
              </div>

              {/* Express Checklist */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Экспресс-чек-лист приёмки (в 1 тап)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setIncomingChecklist([
                        'Замки и вольеры целы',
                        'Вода в поилках есть',
                        'Слонихи спокойны / травм нет',
                        'Инструмент и сеновал в порядке',
                      ]);
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline"
                  >
                    Отметить все ✓
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    'Замки и вольеры целы',
                    'Вода в поилках есть',
                    'Слонихи спокойны / травм нет',
                    'Инструмент и сеновал в порядке',
                  ].map((item) => {
                    const isChecked = incomingChecklist.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(30);
                          setIncomingChecklist((prev) =>
                            isChecked ? prev.filter((i) => i !== item) : [...prev, item]
                          );
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs font-semibold transition-all active:scale-[0.98] ${
                          isChecked
                            ? 'bg-sky-950/20 border-sky-500/40 text-sky-200'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            isChecked
                              ? 'bg-sky-500 border-sky-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="flex-1">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Claims / Remarks */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setShowIncomingIssues((prev) => !prev);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-between transition-all active:scale-98 ${
                    showIncomingIssues || incomingIssues.length > 0
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚠️ Есть замечания к сдающему</span>
                    {incomingIssues.length > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {incomingIssues.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showIncomingIssues ? 'rotate-180' : ''}`} />
                </button>

                {showIncomingIssues && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '💩 Грязно в вольере',
                        '💧 Мало воды / сухо',
                        '🔨 Сломан инвентарь',
                        '🔓 Не запер засов',
                      ].map((issue) => {
                        const isActive = incomingIssues.includes(issue);
                        return (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => {
                              if (navigator.vibrate) navigator.vibrate(40);
                              setIncomingIssues((prev) => {
                                const next = isActive ? prev.filter((i) => i !== issue) : [...prev, issue];
                                if (!isActive) {
                                  addEvent(`⚠️ Замечание к сдаче: ${issue}`);
                                }
                                return next;
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                              isActive
                                ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            {issue}
                          </button>
                        );
                      })}
                    </div>

                    {/* Hidden camera input for incoming claim photo */}
                    <input
                      ref={incomingPhotoRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const url = URL.createObjectURL(file);
                          setIncomingPhotoUrl(url);
                          addEvent('📸 Фото косяка для протокола');
                          if (navigator.vibrate) navigator.vibrate(50);
                        }
                      }}
                    />

                    <div className="flex items-center gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => incomingPhotoRef.current?.click()}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                      >
                        <Camera className="w-4 h-4 text-rose-400" />
                        <span>📷 Фото косяка для протокола</span>
                      </button>

                      {incomingPhotoUrl && (
                        <div className="relative shrink-0">
                          <img
                            src={incomingPhotoUrl}
                            alt="Фото косяка"
                            className="w-10 h-10 object-cover rounded-xl border border-rose-500 shadow"
                          />
                          <button
                            type="button"
                            onClick={() => setIncomingPhotoUrl(null)}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Slider Incoming */}
              <div className="mt-1 flex flex-col gap-1">
                <div className="relative h-[56px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none select-none group" style={{ containerType: 'inline-size' }}>
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-emerald-500/30 transition-all duration-75 ease-out"
                    style={{ width: `${incomingSlider}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-xs font-bold tracking-wider transition-all uppercase ${incomingSlider > 50 ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {incomingSlider >= 85 ? 'ОТПУСТИТЕ ДЛЯ ПРИЁМА!' : 'Сдвиньте для приёма смены ➔'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={incomingSlider}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setIncomingSlider(val);
                      if (val >= 85 && navigator.vibrate) {
                        navigator.vibrate(50);
                      }
                    }}
                    onTouchEnd={() => {
                      if (incomingSlider >= 85) {
                        if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                        setHandoverStep('completed');
                        setIncomingSlider(0);
                        addEvent('🏁 ДЕЖУРСТВО ПРИНЯТО');
                      } else {
                        setIncomingSlider(0);
                      }
                    }}
                    onMouseUp={() => {
                      if (incomingSlider >= 85) {
                        if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                        setHandoverStep('completed');
                        setIncomingSlider(0);
                        addEvent('🏁 ДЕЖУРСТВО ПРИНЯТО');
                      } else {
                        setIncomingSlider(0);
                      }
                    }}
                  />
                  <div
                    className="absolute left-1 top-1 bottom-1 w-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-75 ease-out z-10 pointer-events-none"
                    style={{ transform: `translateX(calc(${incomingSlider / 100} * (100cqw - 56px)))` }}
                  >
                    <span className="text-slate-950 font-black">➔</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED */}
          {handoverStep === 'completed' && (
            <div className="flex flex-col gap-2.5">
              {/* Success Badge */}
              <div className={`p-4 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-lg ${
                incomingIssues.length > 0
                  ? 'bg-amber-950/30 border-amber-500/80 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              }`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg ${
                  incomingIssues.length > 0 ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}>
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  {incomingIssues.length > 0 ? 'Дежурство принято с замечаниями ⚠️' : 'Дежурство принято без споров ✓'}
                </h3>
                <p className="text-xs font-semibold text-slate-300 mt-1">
                  Время передачи: <span className="font-bold text-white">{handoverTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>

              {/* Shift Summary Card */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Итоговый протокол смены</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Штамп зафиксирован</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Сдал смену:</span>
                    <span className="font-bold text-slate-200">{profile?.name || 'Дежурный кипер'}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Чек-листы:</span>
                    <span className="font-bold text-emerald-400">Сдача: {outgoingChecklist.length}/5 • Приём: {incomingChecklist.length}/4</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Вывезено навоза:</span>
                    <span className="font-bold text-slate-200">{dungWheelbarrows || 0} тачек</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Роздано сена:</span>
                    <span className="font-bold text-slate-200">{distributed?.bales || 0} тюков</span>
                  </div>
                </div>

                {/* Broken items / incidents */}
                <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-400 block text-[10px]">Поломки и инциденты:</span>
                  <span className="font-semibold text-slate-200">
                    {incidentCount + outgoingDamages.length > 0 ? (
                      <span className="text-rose-400">
                        {outgoingDamages.length > 0 ? outgoingDamages.join(', ') : `${incidentCount} зафиксировано`}
                      </span>
                    ) : (
                      <span className="text-emerald-400">Поломок нет</span>
                    )}
                  </span>
                </div>

                {/* Incoming Remarks */}
                <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-slate-400 block text-[10px]">Замечания принимающего:</span>
                  <span className="font-semibold">
                    {incomingIssues.length > 0 ? (
                      <span className="text-amber-300">{incomingIssues.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-400">Замечаний нет — сектор в порядке</span>
                    )}
                  </span>
                </div>

                {/* Attached photos if any */}
                {(outgoingPhotoUrl || incomingPhotoUrl) && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Фотофиксация:</span>
                    <div className="flex gap-2">
                      {outgoingPhotoUrl && (
                        <div className="relative">
                          <img src={outgoingPhotoUrl} alt="Поломка" className="w-9 h-9 object-cover rounded-lg border border-amber-400/60" />
                          <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-black px-0.5 rounded-tl">Дефект</span>
                        </div>
                      )}
                      {incomingPhotoUrl && (
                        <div className="relative">
                          <img src={incomingPhotoUrl} alt="Замечание" className="w-9 h-9 object-cover rounded-lg border border-rose-400/60" />
                          <span className="absolute bottom-0 right-0 bg-rose-500 text-white text-[8px] font-black px-0.5 rounded-tl">Косяк</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Start new shift button */}
              <button
                type="button"
                onClick={() => {
                  setHandoverStep('outgoing');
                  setHandoverTime('');
                  setOutgoingSlider(0);
                  setIncomingSlider(0);
                  setOutgoingDamages([]);
                  setOutgoingPhotoUrl(null);
                  setShowIncomingIssues(false);
                  setIncomingIssues([]);
                  setIncomingPhotoUrl(null);
                  setOutgoingChecklist([
                    'Поилки вычищены и налиты',
                    'Ночная пайка сена заложена в рептухи',
                    'Тазы из-под каши вымыты',
                    'Задвижки и тросы заперты на фиксаторы',
                    'Электропастух проверен',
                  ]);
                  setIncomingChecklist([
                    'Замки и вольеры целы',
                    'Вода в поилках есть',
                    'Слонихи спокойны / травм нет',
                    'Инструмент и сеновал в порядке',
                  ]);
                  addEvent('🔄 Начата новая смена');
                  if (navigator.vibrate) navigator.vibrate(40);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-600 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Начать новую смену</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DRAWERS AND MODALS */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2 shadow-2xl border-r border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 mb-4 px-2">Меню</h2>
            
            <button 
              onClick={() => { setMenuOpen(false); onNavigate('monitoring'); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Activity className="w-5 h-5 text-emerald-400"/> Мониторинг физиологии
            </button>

            <button 
              onClick={() => { setMenuOpen(false); onNavigate('vet_dashboard'); }} 
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
        <ShiftWheelModal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} onLogResult={(a, p) => addEvent(`Жребий: ${a} ➔ ${p}`)} />
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

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedBodyPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBodyPhoto(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-sm w-full shadow-2xl relative flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{selectedBodyPhoto.elephantName}</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedBodyPhoto.type === 'foot' ? `Стопа: ${selectedBodyPhoto.foot}` : 'Кондиция / силуэт'} • {selectedBodyPhoto.date} {selectedBodyPhoto.time}
                </p>
              </div>
              <button onClick={() => setSelectedBodyPhoto(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-400 active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img src={selectedBodyPhoto.dataUrl} alt={selectedBodyPhoto.note} className="w-full h-full object-cover" />
            </div>
            {selectedBodyPhoto.note && (
              <p className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                {selectedBodyPhoto.note}
              </p>
            )}
            <button
              onClick={() => setSelectedBodyPhoto(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
