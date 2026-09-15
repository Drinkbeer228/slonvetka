import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { getOfflineDb } from '../services/offlineDb';
import { clearShiftDraft, getShiftDraft, saveShiftDraft } from '../services/shiftDraft';
import { DailyShift, ElephantDailyMetrics, FeedInventoryItem, FeedInventoryType } from '../types/shift';
import { Elephant, Assignment, TreatmentRecordWithPhotos } from '../types';
import { CounterButton } from '../components/common/CounterButton';
import { 
  Calendar as CalendarIcon, CheckCircle2, Loader2, Save, UserCheck, 
  Check, Camera, PackagePlus, Package, X, History, Bell, Plus, Trash2, Image as ImageIcon, FileText, AlertTriangle, Edit2, ShieldAlert,
  Lock, Unlock, LogOut, Stethoscope } from 'lucide-react';
import { ExecutionModal } from '../components/ExecutionModal';
import { VeterinaryAssignmentCard } from '../components/daily-shift/VeterinaryAssignmentCard';
import { FeedControl, DailyRationData } from '../components/daily-shift/FeedControl';
import { ExcretionControl } from '../components/daily-shift/ExcretionControl';
import { ObservationEditor } from '../components/daily-shift/ObservationEditor';
import { SocialDynamicsSection } from '../components/daily-shift/SocialDynamicsSection';
import { SubmitShiftButton } from '../components/daily-shift/SubmitShiftButton';
import { DynamicCounterSection, CounterItem } from '../components/daily-shift/DynamicCounterSection';
import { ShiftSummaryModal } from '../components/daily-shift/ShiftSummaryModal';
import { ArchiveBanner } from '../components/daily-shift/ArchiveBanner';
import { ShiftHandoverModal } from '../components/daily-shift/ShiftHandoverModal';
import { useShiftEvents, ShiftEvent } from '../hooks/useShiftEvents';
import { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';
import { canAdjustInventory, canClaimShift, canCreateMedicalAssignment, canEditShift, canManageUsers } from '../lib/permissions';

export const ELEPHANT_MOODS = [
  { 
    id: 'Грустная / Вялая', 
    label: 'Спит / Вялая', 
    emoji: '🌧️',
    activeClass: 'bg-sky-50 border-2 border-sky-300 text-sky-950 shadow-xs ring-2 ring-sky-200/80 font-bold'
  },
  { 
    id: 'Спокойная / В норме', 
    label: 'Спокойно', 
    emoji: '🐘',
    activeClass: 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-xs ring-2 ring-emerald-200/80 font-bold'
  },
  { 
    id: 'Бодрая / Отличный аппетит', 
    label: 'Ест с аппетитом', 
    emoji: '🍏',
    activeClass: 'bg-teal-50 border-2 border-teal-300 text-teal-950 shadow-xs ring-2 ring-teal-200/80 font-bold'
  },
  { 
    id: 'Игривая / Контактная', 
    label: 'Игривая', 
    emoji: '🎸',
    activeClass: 'bg-purple-50 border-2 border-purple-300 text-purple-950 shadow-xs ring-2 ring-purple-200/80 font-bold'
  },
  { 
    id: 'Беспокойная / Настороже', 
    label: 'Стресс / Шум', 
    emoji: '⚡',
    activeClass: 'bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs ring-2 ring-amber-200/80 font-bold'
  },
];

export const MOOD_ICON_MAP: Record<string, string> = {
  'Грустная / Вялая': '🌧️',
  'Спокойная / В норме': '🐘',
  'Бодрая / Отличный аппетит': '🍏',
  'Игривая / Контактная': '🎸',
  'Беспокойная / Настороже': '⚡',
};

const parseDateString = (dateStr: string) => {
  const parts = (dateStr || '').split('-').map(Number);
  return { year: parts[0] || 2026, month: (parts[1] || 1) - 1, day: parts[2] || 1 };
};

const formatDateString = (y: number, m: number, d: number) => {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const addDays = (dateStr: string, days: number) => {
  const parts = (dateStr || '').split('-').map(Number);
  const d = new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfWeek = (year: number, month: number) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const parseDailyRation = (feedNotes?: string | null): DailyRationData => {
  const defaultRation: DailyRationData = {
    morning_porridge: 'none',
    morning_porridge_time: null,
    morning_porridge_keeper: null,
    morning_porridge_photo: null,
    evening_salad_chips: [],
    salad_notes: '',
    coarse_branches: 0,
    salad_base_included: false,
    salad_photo_url: '',
    salad_appetite: null,
    salad_base_time: null,
    morning_mash_fed: false,
    morning_mash_time: null,
    is_show_day: false,
    noon_mash_status: 'pending',
    noon_mash_cooldown_confirmed: false,
    noon_mash_time: null,
    evening_diet_fed: false,
    evening_diet_time: null
  };
  if (!feedNotes) return defaultRation;
  try {
    const parsed = JSON.parse(feedNotes);
    const morningFed = Boolean(parsed.morning_mash_fed ?? (parsed.morning_porridge && parsed.morning_porridge !== 'none'));
    const isShowDay = Boolean(parsed.is_show_day);
    const noonStatus = parsed.noon_mash_status || (isShowDay ? 'skipped_show_day' : 'pending');
    const eveningFed = Boolean(parsed.evening_diet_fed ?? parsed.salad_base_included);

    return {
      morning_porridge: parsed.morning_porridge || (morningFed ? 'all' : 'none'),
      morning_porridge_time: parsed.morning_porridge_time || parsed.morning_mash_time || null,
      morning_porridge_keeper: parsed.morning_porridge_keeper || null,
      morning_porridge_photo: parsed.morning_porridge_photo || null,
      evening_salad_chips: Array.isArray(parsed.evening_salad_chips) 
        ? parsed.evening_salad_chips 
        : defaultRation.evening_salad_chips,
      salad_notes: parsed.salad_notes || '',
      coarse_branches: parsed.coarse_branches || 0,
      salad_base_included: eveningFed,
      salad_photo_url: parsed.salad_photo_url || '',
      salad_appetite: parsed.salad_appetite || null,
      salad_base_time: parsed.salad_base_time || parsed.evening_diet_time || null,
      morning_mash_fed: morningFed,
      morning_mash_time: parsed.morning_mash_time || parsed.morning_porridge_time || null,
      is_show_day: isShowDay,
      noon_mash_status: noonStatus,
      noon_mash_cooldown_confirmed: Boolean(parsed.noon_mash_cooldown_confirmed),
      noon_mash_time: parsed.noon_mash_time || null,
      evening_diet_fed: eveningFed,
      evening_diet_time: parsed.evening_diet_time || parsed.salad_base_time || null
    };
  } catch {
    return {
      ...defaultRation,
      salad_notes: feedNotes
    };
  }
};

const serializeDailyRation = (ration: DailyRationData): string => {
  return JSON.stringify(ration);
};

export function DailyShiftPage() {
  const { profile, elephants, assignments, selectedDate, setSelectedDate, activeElephantId, setActiveElephantId, setGlobalSaveStatus, globalSaveStatus, logout } = useStore();
  
  const todayStr = new Date().toISOString().split('T')[0];

  // Touch swipe refs for mobile
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const pullDistance = touchEndY.current - touchStartY.current;
    // A vertical pull starts only at the top of the page, so ordinary card gestures stay intact.
    if (touchStartY.current && window.scrollY === 0 && pullDistance > 92 && !isRefreshing) {
      setIsRefreshing(true);
      if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
      loadData().finally(() => setIsRefreshing(false));
    }
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      const elephantList = elephants || [];
      const currentIndex = elephantList.findIndex(e => e.id === activeElephantId);
      const nextIndex = distance > 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= 0 && nextIndex < elephantList.length) {
        setActiveElephantId(elephantList[nextIndex].id);
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartY.current = 0;
    touchEndY.current = 0;
  };
  
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [shiftRecords, setShiftRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  
  
  const [prevShift, setPrevShift] = useState<DailyShift | null>(null);
  const [prevKeeperName, setPrevKeeperName] = useState<string>('Не указан');
  
  const { events: shiftEvents, addEvent, removeEvent } = useShiftEvents(shift?.id || null);

  const handleUndoEvent = (event: ShiftEvent) => {
    if (!event.undo_payload) return;
    const { type, elephant_id, field, value, assignment_id, record_id } = event.undo_payload;
    
    if (type === 'physiology' && elephant_id && field && value !== undefined) {
      handleMetricChange(elephant_id, field as keyof ElephantDailyMetrics, value);
      removeEvent(event.id);
    } else if (type === 'feed' && field && value !== undefined) {
      handleShiftFieldChange(field as any, value);
      removeEvent(event.id);
    }
  };
    
  const [feedInventory, setFeedInventory] = useState<Record<FeedInventoryType, FeedInventoryItem>>({
    hay_bales: { feed_type: 'hay_bales', name: 'Тюки сена', quantity_in_stock: 200, unit: 'тюков' },
    hay_rolls: { feed_type: 'hay_rolls', name: 'Рулоны сена', quantity_in_stock: 15, unit: 'рулонов' },
    branches:  { feed_type: 'branches',  name: 'Ветки / веники', quantity_in_stock: 50, unit: 'веников' },
  });
  const [hayStockBales, setHayStockBales] = useState<number>(200);
  const [hayStockRolls, setHayStockRolls] = useState<number>(15);
  const [initialAvailable, setInitialAvailable] = useState<{ bales: number, rolls: number, branches: number }>({ bales: 0, rolls: 0, branches: 0 });
  
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [modalBales, setModalBales] = useState<number>(200);
  const [modalRolls, setModalRolls] = useState<number>(15);
  const [modalBranches, setModalBranches] = useState<number>(50);
  const [savingInventory, setSavingInventory] = useState(false);

  const [newReminderText, setNewReminderText] = useState<string>('');

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => parseDateString(selectedDate).year);
  const [viewMonth, setViewMonth] = useState<number>(() => parseDateString(selectedDate).month);

  const [activeDays, setActiveDays] = useState<string[]>([]);
  useEffect(() => {
    if (isDatePickerOpen) {
      shiftService.getActiveDaysForMonth(viewYear, viewMonth).then(setActiveDays);
    }
  }, [isDatePickerOpen, viewYear, viewMonth]);
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const days = [];
    
    // Fill empty slots for first week
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };



  // Ad-hoc treatment modal state
  const [adhocModalElephant, setAdhocModalElephant] = useState<Elephant | null>(null);
  const [adhocDescription, setAdhocDescription] = useState('');
  const [adhocMedicine, setAdhocMedicine] = useState('');
  const [adhocPhotoBlob, setAdhocPhotoBlob] = useState<Blob | null>(null);
  const [adhocPreviewUrl, setAdhocPreviewUrl] = useState<string | null>(null);
  const [submittingAdhoc, setSubmittingAdhoc] = useState(false);

  // Full-size photo preview modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // End Match Summary Modal
  const [isEndMatchModalOpen, setIsEndMatchModalOpen] = useState(false);
  const [countersStats, setCountersStats] = useState<{ meritsTotal: number; damageTotal: number; merits: CounterItem[]; damages: CounterItem[] }>({ meritsTotal: 0, damageTotal: 0, merits: [], damages: [] });

  const handleStatsChange = useCallback(({ meritsTotal, damageTotal, merits, damages }: { meritsTotal: number, damageTotal: number, merits: CounterItem[], damages: CounterItem[] }) => {
    setCountersStats({ meritsTotal, damageTotal, merits, damages });
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSavesRef = useRef(0);
  const minSaveTimeRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTask, setSelectedTask] = useState<{ assignment: Assignment; elephant: Elephant; existingRecord?: TreatmentRecordWithPhotos } | null>(null);

  const isToday = selectedDate === todayStr;
  const isFutureDate = selectedDate > todayStr;
  const isArchiveMode = selectedDate < todayStr || shift?.status === 'completed' || (shift?.status as string) === 'submitted';
  const [isEditOverride, setIsEditOverride] = useState(false);
  const [pendingHandover, setPendingHandover] = useState<DailyShift | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [dutyKeeperName, setDutyKeeperName] = useState<string>('');
  const isAdminUser = canManageUsers(profile);
  const canEditCurrentShift = canEditShift(profile, shift);
  const canManageShiftInventory = canAdjustInventory(profile, shift);
  const isLocked = isFutureDate || (isArchiveMode && (!isAdminUser || !isEditOverride));
  
  // Режим только чтения: архив или чужая смена
  // Режим только чтения: архив или чужая смена
  const isSupervisor = isAdminUser;
  const isOtherKeeper = shift?.duty_keeper_id && shift.duty_keeper_id !== profile?.id;
  const isArchiveOrOtherKeeper = Boolean(
    shift && (
      shift.status === 'completed' || 
      (isOtherKeeper && !isSupervisor)
    )
  );
                         
  const canManageMedicalAssignments = canCreateMedicalAssignment(profile);
  const isEditingDisabled = isLocked || isArchiveOrOtherKeeper || (!canEditCurrentShift && !(isAdminUser && isEditOverride));
  const isFeedEditingDisabled = isEditingDisabled;

  useEffect(() => {
    setIsEditOverride(false);
    loadData();
  }, [selectedDate]);

  const fetchShiftRecords = async (dateStr: string) => {
    try {
      const records = await supabaseService.getRecordsByDate(dateStr);
      
      const db = await getOfflineDb();
      const queuedRecords = await db.getAll('records_queue');
      const queuedPhotos = await db.getAll('photos_queue');
      
      const localRecords: TreatmentRecordWithPhotos[] = [];
      for (const qr of queuedRecords) {
        if (qr.status === 'pending' || qr.status === 'syncing' || qr.status === 'error') {
          const recordDateStr = (qr.payload.performed_at || '').split('T')[0];
          if (recordDateStr === dateStr) {
            const photosForRecord = queuedPhotos.filter(qp => qp.temp_record_id === qr.temp_id);
            const photos = photosForRecord.map(qp => ({
              id: qp.temp_photo_id,
              storage_path: URL.createObjectURL(qp.file_blob),
              photo_type: qp.photo_type
            }));
            const keeper = (staffList || []).find(s => s.id === qr.payload.keeper_id) || profile;

            localRecords.push({
              id: qr.temp_id,
              assignment_id: qr.payload.assignment_id,
              elephant_id: qr.payload.elephant_id,
              keeper_id: qr.payload.keeper_id,
              performed_at: qr.payload.performed_at,
              assessment: qr.payload.assessment,
              medicine_used: qr.payload.medicine_used,
              comment: qr.payload.comment,
              photos,
              keeper: keeper ? { id: keeper.id, name: keeper.name } : undefined
            } as any);
          }
        }
      }

      const serverAssignmentIds = new Set((records || []).map(r => r.assignment_id).filter(Boolean));
      const filteredLocalRecords = localRecords.filter(lr => !lr.assignment_id || !serverAssignmentIds.has(lr.assignment_id));

      setShiftRecords([...(records || []), ...filteredLocalRecords]);
    } catch (err) {
      console.error('Failed to fetch shift records:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await shiftService.getShiftData(selectedDate);
      let loadedShift = data.shift || null;
      
      if (profile?.id) {
        const pending = await shiftService.checkPendingHandover(profile.id);
        setPendingHandover(pending);
      }

      if (loadedShift && (!loadedShift.duty_keeper_id || loadedShift.duty_keeper_id !== profile?.id)) {
        const isThisShiftLocked = (loadedShift.status === 'completed' || selectedDate < todayStr || selectedDate > todayStr) && !canManageMedicalAssignments;
        // ИСПРАВЛЕНО: Забираем смену ТОЛЬКО если у нее вообще нет дежурного (duty_keeper_id === null) и это не передача и пользователь не ветврач
        if (!isThisShiftLocked && profile?.id && canClaimShift(profile, loadedShift) && !loadedShift.duty_keeper_id) {
           loadedShift = { ...loadedShift, duty_keeper_id: profile.id };
           setDutyKeeperName(profile.name);
           // Trigger immediate save in background so it's locked to this user
           shiftService.saveShiftData(loadedShift, data.metrics || {}).catch(console.error);
        } else if (loadedShift.duty_keeper_id) {
           supabaseService.getProfile(loadedShift.duty_keeper_id).then(p => {
             if (p) setDutyKeeperName(p.name);
           });
        }
      }
      const draft = getShiftDraft(selectedDate);
      const effectiveShift = draft?.shift || loadedShift;
      setShift(effectiveShift);
      setMetrics(draft?.metrics || data.metrics || {});

      const inv = await shiftService.getFeedInventory();
      setFeedInventory(inv);
      setHayStockBales(inv.hay_bales.quantity_in_stock);
      setHayStockRolls(inv.hay_rolls.quantity_in_stock);

      const currentBales = effectiveShift?.hay_bales_distributed ?? 0;
      const currentRolls = effectiveShift?.hay_bags_distributed ?? 0;
      const currentBranches = parseDailyRation(effectiveShift?.feed_notes).coarse_branches || 0;
      
      setInitialAvailable({
        bales: inv.hay_bales.quantity_in_stock + currentBales,
        rolls: inv.hay_rolls.quantity_in_stock + currentRolls,
        branches: inv.branches.quantity_in_stock + currentBranches
      });

      const { data: staffData } = await supabase.from('profiles').select('id, name, role');
      const staff = staffData || [];
      if (staff) setStaffList(staff);

      const d = parseDateString(selectedDate);
      const dateObj = new Date(d.year, d.month - 1, d.day - 1);
      const prevDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      const prevData = await shiftService.getShiftData(prevDateStr);
      setPrevShift(prevData?.shift);
      if (prevData?.shift?.duty_keeper_id) {
        const k = staff.find(s => s.id === prevData?.shift?.duty_keeper_id);
        setPrevKeeperName(k?.name || 'Кипер предыдущей смены');
      } else {
        setPrevKeeperName('Не указан');
      }

      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to load shift data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant save helper for counters, chips, selectors
  const persistChanges = async (currentShift: DailyShift, currentMetrics: Record<string, ElephantDailyMetrics>) => {
    pendingSavesRef.current++;
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (minSaveTimeRef.current) clearTimeout(minSaveTimeRef.current);
    
    setGlobalSaveStatus('saving');
    saveShiftDraft(selectedDate, currentShift, currentMetrics);
    
    try {
      await shiftService.saveShiftData(currentShift, currentMetrics);
      clearShiftDraft(selectedDate);
    } catch (err) {
      console.error('Autosave error:', err);
      setGlobalSaveStatus('error');
      statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
      pendingSavesRef.current--;
      return;
    }

    pendingSavesRef.current--;
    if (pendingSavesRef.current === 0) {
      minSaveTimeRef.current = setTimeout(() => {
        if (pendingSavesRef.current === 0) {
          setGlobalSaveStatus('saved');
          statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
        }
      }, 1000); // Wait 1 second before showing saved so the GTA save icon spins!
    }
  };

  // Debounced autosave for text inputs
  const triggerDebouncedSave = useCallback((updatedShift: DailyShift, updatedMetrics: Record<string, ElephantDailyMetrics>) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (minSaveTimeRef.current) clearTimeout(minSaveTimeRef.current);
    setGlobalSaveStatus('saving');
    saveShiftDraft(selectedDate, updatedShift, updatedMetrics);
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await shiftService.saveShiftData(updatedShift, updatedMetrics);
        clearShiftDraft(selectedDate);
        setGlobalSaveStatus('saved');
        statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('Debounced save error:', err);
        setGlobalSaveStatus('error');
        statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
      }
    }, 1200); // Slower debounce to match the slower animations
  }, [selectedDate]);

  const handleMetricChange = (elephantId: string, field: keyof ElephantDailyMetrics, value: any) => {
    if (isLocked) return;
    setMetrics(prev => {
      const current = prev[elephantId] || {
        shift_id: shift?.id || '',
        elephant_id: elephantId,
        poop_count: 0,
        feces_traits: ['Сформирован (норма)'],
        urination_count: 0,
        urination_traits: ['Светлая / Прозрачная'],
        behavior: 'Спокойная / В норме',
        notes: ''
      };
      const updatedMetrics = {
        ...prev,
        [elephantId]: {
          ...current,
          [field]: value
        }
      };
      if (shift) {
        setTimeout(() => {
          if (field === 'notes' || field === 'photos') {
            triggerDebouncedSave(shift, updatedMetrics);
          } else {
            persistChanges(shift, updatedMetrics);
          }
        }, 0);
      }
      return updatedMetrics;
    });
  };

  const handleTraitToggle = (elephantId: string, traitType: 'feces_traits' | 'urination_traits', trait: string) => {
    if (isLocked) return;
    const currentMetric = metrics[elephantId] || {
      shift_id: shift?.id || '',
      elephant_id: elephantId,
      poop_count: 0,
      feces_traits: ['Сформирован (норма)'],
      urination_count: 0,
      urination_traits: ['Светлая / Прозрачная'],
      behavior: 'Спокойная / В норме',
      notes: ''
    };

    let traits = [...(currentMetric[traitType] || [])];
    if (traits.includes(trait)) {
      traits = traits.filter(t => t !== trait);
    } else {
      traits.push(trait);
    }

    if (traits.length === 0) {
      traits = [traitType === 'feces_traits' ? 'Сформирован (норма)' : 'Светлая / Прозрачная'];
    }

    handleMetricChange(elephantId, traitType, traits);
  };

  const handleReopenShift = () => {
    setIsEditOverride(true);
    if (shift) {
      const updatedShift: DailyShift = {
        ...shift,
        status: 'in_progress'
      };
      setShift(updatedShift);
      persistChanges(updatedShift, metrics);
    }
  };

  const handleShiftFieldChange = (field: keyof DailyShift, value: any, immediate = true) => {
    if (isFutureDate && field !== 'duty_keeper_id' && field !== 'reminders' && !isEditOverride) return;
    if (isLocked && field !== 'status' && !isEditOverride) return;
    if (!shift) return;
    
    const updatedShift = {
      ...shift,
      [field]: value
    };
    setShift(updatedShift);

    if (immediate) {
      persistChanges(updatedShift, metrics);
    } else {
      triggerDebouncedSave(updatedShift, metrics);
    }
  };

  const handleAddReminder = () => {
    if (!newReminderText.trim() || !shift) return;
    const reminders = [...(shift.reminders || []), newReminderText.trim()];
    handleShiftFieldChange('reminders', reminders, true);
    setNewReminderText('');
  };

  const handleRemoveReminder = (index: number) => {
    if (!shift) return;
    const reminders = (shift.reminders || []).filter((_, i) => i !== index);
    handleShiftFieldChange('reminders', reminders, true);
  };

  const handleSaveInventory = async () => {
    try {
      setSavingInventory(true);
      await shiftService.setFeedInventoryStock('hay_bales', modalBales);
      await shiftService.setFeedInventoryStock('hay_rolls', modalRolls);
      await shiftService.setFeedInventoryStock('branches', modalBranches);
      const updated = await shiftService.getFeedInventory();
      setFeedInventory(updated);
      setHayStockBales(updated.hay_bales.quantity_in_stock);
      setHayStockRolls(updated.hay_rolls.quantity_in_stock);
      
      setInitialAvailable({
        bales: updated.hay_bales.quantity_in_stock + (shift?.hay_bales_distributed ?? 0),
        rolls: updated.hay_rolls.quantity_in_stock + (shift?.hay_bags_distributed ?? 0),
        branches: updated.branches.quantity_in_stock + (parseDailyRation(shift?.feed_notes).coarse_branches || 0)
      });

      setReplenishModalOpen(false);
    } catch (err) {
      console.error('Failed to save feed inventory:', err);
    } finally {
      setSavingInventory(false);
    }
  };

  const currentRation = useMemo<DailyRationData>(() => {
    return parseDailyRation(shift?.feed_notes);
  }, [shift?.feed_notes]);

  const shiftSummary = useMemo(() => {
    const metricsList = Object.values(metrics || {});
    const totalPoop = metricsList.reduce((sum, item) => sum + (item.poop_count || 0), 0);
    const totalUrination = metricsList.reduce((sum, item) => sum + (item.urination_count || 0), 0);
    const totalSleepMinutes = metricsList.reduce((sum, item) => sum + (item.sleep_minutes || 0), 0);
    const sleepHours = totalSleepMinutes > 0 ? `${(totalSleepMinutes / 60).toFixed(1)} ч` : 'нет данных';
    const feedReady = Boolean(
      currentRation.morning_mash_fed || (currentRation.morning_porridge && currentRation.morning_porridge !== 'none')
    ) && Boolean(currentRation.evening_diet_fed || currentRation.salad_base_included);

    return {
      totalPoop,
      totalUrination,
      sleepHours,
      feedStatus: feedReady ? 'Рацион отмечен' : 'Рацион не закрыт',
      syncLabel:
        globalSaveStatus === 'saving' ? 'Сохраняем…' :
        globalSaveStatus === 'saved' ? 'Сохранено' :
        globalSaveStatus === 'error' ? 'Ошибка сохранения' :
        'Без изменений',
    };
  }, [currentRation, globalSaveStatus, metrics]);

  const criticalAlerts = useMemo(() => {
    const alerts: string[] = [];
    const metricsList = Object.values(metrics || {});
    const hasDiarrhea = metricsList.some(item =>
      (item.feces_traits || []).some(trait => {
        const value = trait.toLowerCase();
        return value.includes('жидк') || value.includes('понос');
      })
    );
    const hasDry = metricsList.some(item =>
      (item.feces_traits || []).some(trait => {
        const value = trait.toLowerCase();
        return value.includes('сух') || value.includes('твёрд');
      })
    );
    const elephantsWithoutPoop = (elephants || []).filter(elephant => ((metrics || {})[elephant.id]?.poop_count || 0) === 0);

    if (currentRation.salad_appetite === 'refused') {
      alerts.push('Есть отказ от салата / вечернего рациона.');
    }
    if (hasDiarrhea) {
      alerts.push('Зафиксирован жидкий стул или понос.');
    }
    if (hasDry) {
      alerts.push('Есть отметки сухого / твёрдого стула.');
    }
    if (elephantsWithoutPoop.length > 0) {
      alerts.push(`Без дефекации за смену: ${elephantsWithoutPoop.map(elephant => elephant.name).join(', ')}.`);
    }
    if ((currentRation.coarse_branches || 0) > initialAvailable.branches) {
      alerts.push('По веткам зафиксирован перерасход относительно доступного остатка.');
    }

    return alerts;
  }, [currentRation, elephants, initialAvailable.branches, metrics]);

  const handlePorridgeFieldChange = (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => {
    if (isLocked || !shift) return;
    const patch = typeof field === 'object' ? field : { [field]: value };
    const updatedRation: DailyRationData = {
      ...currentRation,
      ...patch
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };

  const handleBranchesChange = (val: number) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      coarse_branches: val
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };

  const handleVegetableToggle = (chip: string) => {
    if (isLocked || !shift) return;
    const currentChips = currentRation.evening_salad_chips || [];
    const updatedChips = currentChips.includes(chip)
      ? currentChips.filter(c => c !== chip)
      : [...currentChips, chip];
    const updatedRation: DailyRationData = {
      ...currentRation,
      evening_salad_chips: updatedChips
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };

  const handleSaladNotesChange = (notes: string) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      salad_notes: notes
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), false);
  };

  const handleSaladBaseToggle = (included: boolean) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      salad_base_included: included
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };

  const handleSaladPhotoChange = (photoUrl?: string) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      salad_photo_url: photoUrl || ''
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };

  const handleQuickExecuteTask = async (assignment: Assignment) => {
    if (!profile || !activeElephant || isLocked) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    const tempId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const optimisticRecord: TreatmentRecordWithPhotos = {
      id: tempId,
      assignment_id: assignment.id,
      elephant_id: activeElephant.id,
      keeper_id: profile.id,
      performed_at: nowIso,
      assessment: 'В норме',
      medicine_used: assignment.medicine || null,
      comment: 'Штатно',
      created_at: nowIso,
      photos: [],
      keeper: {
        id: profile.id,
        name: profile.name,
      },
    };

    // Optimistically update UI immediately
    setShiftRecords(prev => [
      ...prev.filter(r => r.assignment_id !== assignment.id),
      optimisticRecord,
    ]);

    try {
      await SyncManager.saveRecordLocally({
        assignment_id: assignment.id,
        elephant_id: activeElephant.id,
        keeper_id: profile.id,
        performed_at: nowIso,
        assessment: 'В норме',
        medicine_used: assignment.medicine || null,
        comment: 'Штатно',
      }, null);

      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to quick execute task:', err);
      await fetchShiftRecords(selectedDate);
    }
  };

  const handleCompleteTask = async (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => {
    if (!profile || !selectedTask) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    const tempId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const optimisticRecord: TreatmentRecordWithPhotos = {
      id: tempId,
      assignment_id: selectedTask.assignment.id,
      elephant_id: selectedTask.elephant.id,
      keeper_id: profile.id,
      performed_at: nowIso,
      assessment: data.assessment,
      medicine_used: data.medicineUsed,
      comment: data.comment,
      created_at: nowIso,
      photos: data.photoBlob ? [{
        id: crypto.randomUUID(),
        treatment_record_id: tempId,
        storage_path: URL.createObjectURL(data.photoBlob),
        photo_type: 'single',
        created_at: nowIso,
      }] : [],
      keeper: {
        id: profile.id,
        name: profile.name,
      },
    };
    
    // If editing existing record, remove old record first
    if (selectedTask.existingRecord) {
      try {
        await supabaseService.deleteTreatmentRecord(selectedTask.existingRecord.id);
      } catch (err) {
        console.warn('Could not delete old record during edit:', err);
      }
    }

    // Optimistic UI update
    setShiftRecords(prev => [
      ...prev.filter(r => r.assignment_id !== selectedTask.assignment.id),
      optimisticRecord,
    ]);
    setSelectedTask(null);

    try {
      await SyncManager.saveRecordLocally({
        assignment_id: selectedTask.assignment.id,
        elephant_id: selectedTask.elephant.id,
        keeper_id: profile.id,
        performed_at: nowIso,
        assessment: data.assessment,
        medicine_used: data.medicineUsed,
        comment: data.comment,
      }, data.photoBlob);
      
      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to complete task:', err);
      await fetchShiftRecords(selectedDate);
    }
  };

  const handleUnmarkTask = async (recordId: string, assignmentId?: string) => {
    if (!confirm('Вы уверены, что хотите снять выполнение этой задачи?')) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Optimistically remove from state
    setShiftRecords(prev => prev.filter(r => r.id !== recordId && (!assignmentId || r.assignment_id !== assignmentId)));
    try {
      await supabaseService.deleteTreatmentRecord(recordId);
      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to unmark task:', err);
      alert('Ошибка при снятии выполнения задачи');
      await fetchShiftRecords(selectedDate);
    }
  };

  const handleSaveAdhocRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !adhocModalElephant || !adhocDescription.trim()) return;
    setSubmittingAdhoc(true);

    try {
      await SyncManager.saveRecordLocally({
        assignment_id: null,
        elephant_id: adhocModalElephant.id,
        keeper_id: profile.id,
        performed_at: new Date().toISOString(),
        assessment: 'adhoc',
        medicine_used: adhocMedicine.trim() || null,
        comment: adhocDescription.trim(),
      }, adhocPhotoBlob);

      setAdhocModalElephant(null);
      setAdhocDescription('');
      setAdhocMedicine('');
      setAdhocPhotoBlob(null);
      setAdhocPreviewUrl(null);

      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to save adhoc record:', err);
      alert('Ошибка сохранения внеплановой записи');
    } finally {
      setSubmittingAdhoc(false);
    }
  };

  const handleAdhocPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdhocPhotoBlob(file);
    setAdhocPreviewUrl(URL.createObjectURL(file));
  };

  const formattedDateLabel = (() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  })();

  const changeDateByDays = (days: number) => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const d = new Date(year, month - 1, day + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${dt}`);
    } catch (e) {
      console.error('Failed to change date:', e);
    }
  };

  const dutyKeeper = (staffList || []).find(s => s.id === shift?.duty_keeper_id);
  const hayBalesDistributed = shift?.hay_bales_distributed || 0;
  const hayBagsDistributed = shift?.hay_bags_distributed || 0;

  // Collect all photos from shift records for "Фото дня"
  const allPhotos: { url: string; elephantName: string; timeStr: string; recordId: string }[] = [];
  for (const rec of shiftRecords) {
    if (rec.photos && rec.photos.length > 0) {
      const elephant = (elephants || []).find(e => e.id === rec.elephant_id);
      const timeStr = new Date(rec.performed_at || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      for (const p of rec.photos) {
        const url = (p.storage_path || '').startsWith('blob:') ? p.storage_path : supabaseService.getPublicUrl(p.storage_path);
        allPhotos.push({
          url,
          elephantName: elephant ? elephant.name : 'Слон',
          timeStr,
          recordId: rec.id
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  const activeElephant = (elephants || []).find(e => e.id === activeElephantId) || (elephants || [])[0];
  const m = activeElephant ? ((metrics || {})[activeElephant.id] || {
    shift_id: shift?.id || '',
    elephant_id: activeElephant.id,
    poop_count: 0,
    feces_traits: ['Сформирован (норма)'],
    urination_count: 0,
    urination_traits: ['Светлая / Прозрачная'],
    behavior: 'Спокойная / В норме',
    sleep_minutes: 420,
    notes: ''
  }) : null;

  const assignmentsForEle = activeElephant
    ? (assignments || []).filter(a => a.elephant_id === activeElephant.id)
    : [];

  return (
    <div
      className="pb-60 space-y-6 mt-3 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isRefreshing && (
        <div className="sticky top-2 z-30 mx-auto w-fit rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-fade-blur">
          Обновляем смену…
        </div>
      )}
      

      {/* TOP NOTIFICATION BANNERS */}
      {isArchiveOrOtherKeeper && !isEditOverride && (
        <div className="mb-4 bg-amber-50 border border-amber-200/60 rounded-[24px] p-3 shadow-sm mx-4 sm:mx-0 flex items-center justify-between">
          <p className="text-amber-800 font-bold text-sm flex items-center gap-2">
            <Lock size={16} className="shrink-0" />
            Режим просмотра (Архив / Чужая смена)
          </p>
          <div className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-100/50 px-2 py-1 rounded-lg">Read-Only</div>
        </div>
      )}
      
      {isOtherKeeper && isSupervisor && !isArchiveMode && (
        <div className="mb-4 bg-blue-50 border border-blue-200/60 rounded-[24px] p-3 shadow-sm mx-4 sm:mx-0 flex items-center justify-between">
          <p className="text-blue-800 font-bold text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            Режим администратора
          </p>
          <div className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg">Супервизор</div>
        </div>
      )}

      {/* ARCHIVE GUARD BANNER */}
      {isArchiveMode && !isEditOverride && !isArchiveOrOtherKeeper && (
        <ArchiveBanner
          isAdmin={isAdminUser}
          onReturnToToday={() => setSelectedDate(todayStr)}
          onUnlockAdmin={() => setIsEditOverride(true)}
        />
      )}

      {/* ADMIN ACTIVE EDIT BANNER */}
      {isAdminUser && isEditOverride && isArchiveMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-950 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Unlock className="text-amber-700 shrink-0" size={18} />
            <div>
              <div className="text-xs font-bold">Режим редактирования архива (Админ)</div>
              <div className="text-[11px] text-amber-800/80">Внесение изменений разблокировано</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditOverride(false);
              if (shift?.status === 'completed') {
                handleShiftFieldChange('status', 'completed', true);
              }
            }}
            className="min-h-[40px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer touch-manipulation"
          >
            Завершить редактирование
          </button>
        </div>
      )}

      {/* FUTURE DATE BANNER */}
      {isFutureDate && (
        <div className="bg-blue-50/80 backdrop-blur-xl border border-blue-200/80 text-blue-900 px-4 py-3.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-blue-600 shrink-0" size={20} />
            <div>
              <div className="font-bold text-xs sm:text-sm">Режим планирования будущей смены</div>
              <div className="text-[11px] text-blue-700/80 mt-0.5">Фактический ввод дежурства заблокирован до наступления даты смены.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
          >
            К сегодня
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Смена</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{shiftSummary.totalPoop}</div>
          <div className="text-sm font-semibold text-slate-600">дефекаций за дату</div>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Гидратация</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{shiftSummary.totalUrination}</div>
          <div className="text-sm font-semibold text-slate-600">мочеиспусканий отмечено</div>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Сон</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{shiftSummary.sleepHours}</div>
          <div className="text-sm font-semibold text-slate-600">{shiftSummary.feedStatus}</div>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <Save size={14} />
            Синхронизация
          </div>
          <div className="mt-2 text-lg font-black text-slate-950">{shiftSummary.syncLabel}</div>
          <div className="text-sm font-semibold text-slate-600">Общий статус сохранения смены</div>
        </div>
      </section>

      <section className={`rounded-[24px] border p-4 shadow-sm backdrop-blur-xl ${criticalAlerts.length > 0 ? 'border-amber-200 bg-amber-50/85' : 'border-emerald-200 bg-emerald-50/85'}`}>
        <div className="flex items-start gap-3">
          {criticalAlerts.length > 0 ? (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />
          )}
          <div>
            <div className="text-sm font-black text-slate-950">
              {criticalAlerts.length > 0 ? 'Критические сигналы смены' : 'Критических сигналов не выявлено'}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {criticalAlerts.length > 0
                ? 'Вынесли отклонения отдельно от обычных заметок, чтобы их было видно сразу.'
                : 'Физиология и рацион выглядят стабильно по текущим отметкам.'}
            </div>
            {criticalAlerts.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm font-semibold text-slate-700">
                {criticalAlerts.map(alert => (
                  <li key={alert} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 2. ФИЗИОЛОГИЯ И СОН: <ExcretionControl ... /> (КУЧИ, ЛУЖИ, СОН) */}
      <ExcretionControl
        isLocked={isEditingDisabled}
        elephants={elephants}
        metrics={metrics}
        onMetricChange={(elephantId, field, val) => handleMetricChange(elephantId, field, val)}
        onAddEvent={(actionTitle, icon, undoPayload) => addEvent({
          keeper_id: profile?.id || '',
          keeper_name: profile?.name || 'Кипер',
          action_title: actionTitle,
          icon,
          undo_payload: undoPayload
        })}
      />

      {/* 3. ГРУБЫЕ КОРМА: СЕТКА 3 КОЛОНОК (ТЮКИ, РУЛОНЫ, ВЕТКИ) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[22px] p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)] space-y-3">
        {/* Шапка: Слева иконка и заголовок, справа компактные бейджи («Склад», «Без ограничений») */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none shrink-0">🌾</span>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
              Грубые корма
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {canManageShiftInventory && (
              <button
                type="button"
                onClick={() => {
                  setModalBales(feedInventory.hay_bales.quantity_in_stock);
                  setModalRolls(feedInventory.hay_rolls.quantity_in_stock);
                  setModalBranches(feedInventory.branches.quantity_in_stock);
                  setReplenishModalOpen(true);
                }}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 hover:text-slate-950 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Управление остатками на складе feed_inventory"
              >
                <Package size={13} className="text-amber-600" />
                <span>Склад</span>
              </button>
            )}
          </div>
        </div>

        {/* Карточки счетчиков: 3 колонки */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Тюки сена */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="text-center select-none px-0.5">
              <div className="text-[13px] font-bold text-slate-900 tracking-tight truncate">
                Тюки сена
              </div>
            </div>
            <CounterButton
              value={hayBalesDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
              disabled={isFeedEditingDisabled}
              variant="vertical"
              unit="тюков"
            />
            {(() => {
              const dist = hayBalesDistributed || 0;
              const remaining = initialAvailable.bales - dist;
              const isOver = remaining < 0;
              return (
                <div className={`text-[11px] text-center pt-0.5 select-none truncate ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                  <span className="font-medium">Остаток: </span>
                  <span className={`font-bold ${remaining < 30 && !isOver ? 'text-amber-600 font-black' : (isOver ? 'font-black' : '')}`}>
                    {Math.max(0, remaining)}
                  </span>
                  <span className="font-medium"> тюк.</span>
                  {isOver && <div className="text-[9.5px] leading-tight mt-0.5 font-bold">Нехватка: {Math.abs(remaining)}</div>}
                </div>
              );
            })()}
          </div>

          {/* Рулоны */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="text-center select-none px-0.5">
              <div className="text-[13px] font-bold text-slate-900 tracking-tight truncate">
                Рулоны
              </div>
            </div>
            <CounterButton
              value={hayBagsDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
              disabled={isFeedEditingDisabled}
              variant="vertical"
              unit="рулонов"
            />
            {(() => {
              const dist = hayBagsDistributed || 0;
              const remaining = initialAvailable.rolls - dist;
              const isOver = remaining < 0;
              return (
                <div className={`text-[11px] text-center pt-0.5 select-none truncate ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                  <span className="font-medium">Остаток: </span>
                  <span className={`font-bold ${remaining < 5 && !isOver ? 'text-amber-600 font-black' : (isOver ? 'font-black' : '')}`}>
                    {Math.max(0, remaining)}
                  </span>
                  <span className="font-medium"> рул.</span>
                  {isOver && <div className="text-[9.5px] leading-tight mt-0.5 font-bold">Нехватка: {Math.abs(remaining)}</div>}
                </div>
              );
            })()}
          </div>

          {/* Ветки */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="text-center select-none px-0.5">
              <div className="text-[13px] font-bold text-slate-900 tracking-tight truncate">
                Ветки
              </div>
            </div>
            <CounterButton
              value={currentRation.coarse_branches || 0}
              onChange={handleBranchesChange}
              disabled={isEditingDisabled}
              variant="vertical"
              unit="веников"
            />
            {(() => {
              const dist = currentRation.coarse_branches || 0;
              const remaining = initialAvailable.branches - dist;
              const isOver = remaining < 0;
              return (
                <div className={`text-[11px] text-center pt-0.5 select-none truncate ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                  <span className="font-medium">Остаток: </span>
                  <span className={`font-bold ${remaining < 10 && !isOver ? 'text-amber-600 font-black' : (isOver ? 'font-black' : '')}`}>
                    {Math.max(0, remaining)}
                  </span>
                  <span className="font-medium"> шт.</span>
                  {isOver && <div className="text-[9.5px] leading-tight mt-0.5 font-bold">Нехватка: {Math.abs(remaining)}</div>}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 4. РАЦИОН И КОНЦЕНТРАТЫ: <FeedControl ... /> (КАШИ, ШОУ-ДЕНЬ, ВЕЧЕРНИЙ РАЦИОН) */}
      <div>
        <FeedControl
          ration={currentRation}
          isLocked={isFeedEditingDisabled}
          dutyKeeperName={dutyKeeper?.name}
          onPorridgeFieldChange={handlePorridgeFieldChange}
          hayBalesDistributed={hayBalesDistributed}
          hayBagsDistributed={hayBagsDistributed}
          onBalesChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
          onBagsChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
          onVegetableToggle={handleVegetableToggle}
          onSaladNotesChange={handleSaladNotesChange}
          onBranchesChange={handleBranchesChange}
          onSaladBaseToggle={handleSaladBaseToggle}
          onSaladPhotoChange={handleSaladPhotoChange}
        />
      </div>
      {/* 5. ХОЗЯЙСТВЕННЫЙ БЛОК (Инциденты и счетчики) */}
      <section className="mb-6 mx-4 sm:mx-0">
        <DynamicCounterSection 
          selectedDate={selectedDate}
          isLocked={isEditingDisabled}
          dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
          onStatsChange={setCountersStats}
          onAddEvent={(title, icon, type, id) => addEvent({
            keeper_id: profile?.id || '',
            keeper_name: profile?.name || 'Кипер',
            action_title: title,
            icon: icon,
          })}
        />
      </section>

      {/* 5. ВЕТЕРИНАРНЫЕ НАЗНАЧЕНИЯ / ПРОЦЕДУРЫ (ЕСЛИ ЕСТЬ АКТИВНЫЕ) */}
      {activeElephant && assignmentsForEle.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <span className="text-base leading-none">🩺</span> Вет. назначения
          </div>
          {assignmentsForEle.map(assignment => {
            const relatedRecord = (shiftRecords || []).find(r => r.assignment_id === assignment.id);
            const isCompletedToday = !!relatedRecord;
            const keeperName = relatedRecord?.keeper?.name 
              || staffList.find(s => s.id === relatedRecord?.keeper_id)?.name
              || (relatedRecord?.keeper_id === profile?.id ? profile?.name : undefined);
            const completedTime = relatedRecord?.performed_at
              ? new Date(relatedRecord.performed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              : undefined;

            return (
              <VeterinaryAssignmentCard
                key={assignment.id}
                assignment={assignment}
                isCompletedToday={isCompletedToday}
                isLocked={isLocked || canManageMedicalAssignments}
                completedAt={completedTime}
                completedByKeeperName={keeperName}
                onExecute={() => setSelectedTask({ assignment, elephant: activeElephant, existingRecord: relatedRecord })}
                onQuickExecute={() => handleQuickExecuteTask(assignment)}
                onUnmark={() => relatedRecord && handleUnmarkTask(relatedRecord.id, assignment.id)}
                onEdit={() => setSelectedTask({ assignment, elephant: activeElephant, existingRecord: relatedRecord })}
              />
            );
          })}
        </div>
      )}



      {/* 6. ЖУРНАЛ НАБЛЮДЕНИЙ: <ObservationEditor ... /> (СВОБОДНЫЕ ЗАМЕТКИ, ПОЛЕ ВВОДА ТЕКСТА, ФОТО) */}
      {activeElephant && m && (
        <div className="space-y-4">
          <ObservationEditor
            isLocked={isEditingDisabled}
            elephant={activeElephant}
            elephants={elephants}
            allMetrics={metrics}
            metrics={m}
            selectedDate={selectedDate}
            onMetricChange={(field, val) => handleMetricChange(activeElephant.id, field as any, val)}
            onAllMetricChange={(elephantId, field, val) => handleMetricChange(elephantId, field, val)}
            onTraitToggle={(field, trait) => handleTraitToggle(activeElephant.id, field, trait)}
            onNotesBlur={() => shift && persistChanges(shift, metrics)}
          />

          {/* СОЦИАЛЬНАЯ ДИНАМИКА ГРУППЫ (БЫСТРЫЕ ЧИПСЫ) */}
          <SocialDynamicsSection
            isLocked={isEditingDisabled}
            onAppendSocialLog={(tagText) => {
              if (!activeElephant) return;
              const currentNotes = (m.notes || '').trim();
              const nextNotes = currentNotes ? `${currentNotes}\n${tagText}` : tagText;
              handleMetricChange(activeElephant.id, 'notes', nextNotes);
            }}
          />
        </div>
      )}

      {/* 7. НИЖНЯЯ ПАНЕЛЬ: КНОПКА [ ЗАВЕРШИТЬ СМЕНУ ] */}
      {!isEditingDisabled && (
        <div className="flex flex-col gap-3">
          {profile?.role === 'keeper' && selectedDate === todayStr && (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="w-full min-h-[56px] flex items-center justify-center gap-2 rounded-[24px] bg-sky-100 hover:bg-sky-200 text-sky-700 font-black active:scale-95 transition-all text-sm shadow-sm border-2 border-white tap-target"
            >
              <UserCheck size={20} strokeWidth={2.5} />
              Сдать дежурство (передача смены)
            </button>
          )}

          <SubmitShiftButton
          isIdeal={Boolean(
            (currentRation.morning_mash_fed || (currentRation.morning_porridge && currentRation.morning_porridge !== 'none')) &&
            (currentRation.evening_diet_fed || currentRation.salad_base_included)
          )}
          hasMissingRequired={Boolean(
            (!currentRation.morning_mash_fed && (!currentRation.morning_porridge || currentRation.morning_porridge === 'none')) ||
            (!currentRation.evening_diet_fed && !currentRation.salad_base_included)
          )}
          onClick={() => {
            setIsEndMatchModalOpen(true);
          }}
        />
        </div>
      )}

      {/* END MATCH SUMMARY MODAL */}
      <ShiftSummaryModal
        isOpen={isEndMatchModalOpen}
        onClose={() => setIsEndMatchModalOpen(false)}
        onConfirmCompleteShift={() => {
          setIsEndMatchModalOpen(false);
          setIsHandoverModalOpen(true);
        }}
        dutyKeeperName={dutyKeeper?.name}
        dateString={shift?.date || selectedDate}
        porridgeIssued={!!currentRation.morning_mash_fed || (!!currentRation.morning_porridge && currentRation.morning_porridge !== 'none')}
        saladIssued={!!currentRation.evening_diet_fed || !!currentRation.salad_base_included}
        hayBales={hayBalesDistributed}
        washedCount={countersStats.merits?.find(m => m.id === 'elephants_washed')?.count || 0}
        poopCount={countersStats.merits?.find(m => m.id === 'wheelbarrows_dumped')?.count || 0}
        damages={countersStats.damages}
        isShowDay={Boolean(currentRation.is_show_day)}
        noonMashStatus={currentRation.noon_mash_status}
      />

      {/* MODALS */}

      {/* CALENDAR MODAL */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsDatePickerOpen(false)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Выбор даты</h2>
              <button onClick={() => setIsDatePickerOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => {
                let m = viewMonth - 1;
                let y = viewYear;
                if (m < 1) { m = 12; y--; }
                setViewMonth(m); setViewYear(y);
              }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">←</button>
              
              <div className="font-bold text-slate-700 capitalize">
                {new Date(viewYear, viewMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
              </div>
              
              <button onClick={() => {
                let m = viewMonth + 1;
                let y = viewYear;
                if (m > 12) { m = 1; y++; }
                setViewMonth(m); setViewYear(y);
              }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">→</button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
              <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="h-10" />;
                
                const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const isFilled = activeDays.includes(dateStr);
                
                let bgClass = 'bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-700';
                
                if (isSelected) {
                  bgClass = 'bg-slate-800 border-2 border-slate-800 text-white shadow-md';
                } else if (isFilled) {
                  bgClass = 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
                } else if (dateStr < todayStr) {
                  bgClass = 'bg-rose-50 border-2 border-rose-100 text-rose-700 hover:bg-rose-100';
                }
                
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setIsDatePickerOpen(false);
                    }}
                    className={`h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-90 ${bgClass} ${isToday && !isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Заполнено</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-100"></div> Пусто</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-800"></div> Текущий</div>
            </div>
          </div>
        </div>
      )}

{/* EXECUTION MODAL FOR VET ASSIGNMENTS */}
      {selectedTask && (
        <ExecutionModal
          assignment={selectedTask.assignment}
          elephant={selectedTask.elephant}
          initialData={selectedTask.existingRecord ? {
            assessment: selectedTask.existingRecord.assessment,
            medicineUsed: selectedTask.existingRecord.medicine_used,
            comment: selectedTask.existingRecord.comment,
          } : undefined}
          onClose={() => setSelectedTask(null)}
          onComplete={handleCompleteTask}
        />
      )}

      {/* FULL-SIZE PHOTO PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition"
            >
              <X size={24} />
            </button>
            <img src={previewPhotoUrl} alt="Полноразмерное фото" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* WAREHOUSE FEED INVENTORY MODAL */}
      {replenishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] border border-white/80 p-5 sm:p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xl shadow-xs">
                  🌾
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Склад грубых кормов</h3>
                  <p className="text-xs text-slate-400 font-medium">Таблица базы feed_inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplenishModalOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Тюки сена */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Тюки сена</div>
                  <div className="text-[11px] text-slate-400 font-medium">Основной фураж</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalBales(prev => Math.max(0, prev - 10))}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBales(prev => Math.max(0, prev - 1))}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={modalBales}
                    onChange={(e) => setModalBales(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 min-h-[44px] text-center font-black text-slate-900 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setModalBales(prev => prev + 1)}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBales(prev => prev + 10)}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Рулоны сена */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Рулоны сена</div>
                  <div className="text-[11px] text-slate-400 font-medium">Дополнительный фураж</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalRolls(prev => Math.max(0, prev - 1))}
                    className="min-h-[44px] min-w-[36px] px-2.5 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={modalRolls}
                    onChange={(e) => setModalRolls(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 min-h-[44px] text-center font-black text-slate-900 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setModalRolls(prev => prev + 1)}
                    className="min-h-[44px] min-w-[36px] px-2.5 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalRolls(prev => prev + 5)}
                    className="min-h-[44px] min-w-[36px] px-2.5 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Ветки и веники */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Ветки и веники</div>
                  <div className="text-[11px] text-slate-400 font-medium">Связки / бамбук</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalBranches(prev => Math.max(0, prev - 5))}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBranches(prev => Math.max(0, prev - 1))}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={modalBranches}
                    onChange={(e) => setModalBranches(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 min-h-[44px] text-center font-black text-slate-900 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setModalBranches(prev => prev + 1)}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBranches(prev => prev + 5)}
                    className="min-h-[44px] min-w-[36px] px-2 rounded-xl bg-white border border-slate-200/80 font-bold text-xs text-slate-600 active:scale-95 transition"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReplenishModalOpen(false)}
                disabled={savingInventory}
                className="flex-1 min-h-[44px] rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition active:scale-98 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveInventory}
                disabled={savingInventory}
                className="flex-1 min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-98 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {savingInventory ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Сохранить на складе</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDERING PENDING HANDOVER BANNER */}
      {pendingHandover && profile && (
        <HandoverAcceptBanner
          pendingShift={pendingHandover}
          currentUserId={profile.id}
          onAccept={() => {
            setPendingHandover(null);
            setSelectedDate(todayStr);
            // Refresh to see the newly claimed shift
            loadData();
          }}
          onReject={() => {
            setPendingHandover(null);
          }}
        />
      )}

      {/* SHIFT HANDOVER MODAL */}
      {isHandoverModalOpen && shift && profile && (
        <ShiftHandoverModal
          shiftId={shift.id}
          currentUserId={profile.id}
          onClose={() => setIsHandoverModalOpen(false)}
          onSuccess={() => {
            setIsHandoverModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
