import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { getOfflineDb } from '../services/offlineDb';
import { DailyShift, ElephantDailyMetrics } from '../types/shift';
import { Elephant, Assignment, TreatmentRecordWithPhotos } from '../types';
import { CounterButton } from '../components/common/CounterButton';
import { 
  Calendar as CalendarIcon, CheckCircle2, Loader2, Save, UserCheck, 
  Check, Camera, PackagePlus, X, History, Bell, Plus, Trash2, Image as ImageIcon, FileText, AlertTriangle, Edit2
, LogOut } from 'lucide-react';
import { ExecutionModal } from '../components/ExecutionModal';
import { VeterinaryAssignmentCard } from '../components/daily-shift/VeterinaryAssignmentCard';
import { FeedControl, DailyRationData } from '../components/daily-shift/FeedControl';
import { ObservationEditor } from '../components/daily-shift/ObservationEditor';

const FECES_OPTIONS = [
  'Сформирован (норма)',
  'Рассыпчатый / Сухой',
  'Жидкий / Понос ⚠️',
  'Со слизью ⚠️',
  'Плохо переварен / цельные куски ⚠️'
];

const URINATION_OPTIONS = [
  'Светлая / Прозрачная',
  'Темная / Концентрированная',
  'Мутная / С осадком ⚠️',
  'Бурая / Красноватая ⚠️',
  'Натуживание / Малыми порциями ⚠️'
];

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
    lunch_porridge: 'none',
    evening_salad_chips: ['Морковь', 'Яблоки', 'Капуста'],
    salad_notes: '',
    coarse_branches: 0
  };
  if (!feedNotes) return defaultRation;
  try {
    const parsed = JSON.parse(feedNotes);
    return {
      morning_porridge: parsed.morning_porridge || 'none',
      lunch_porridge: parsed.lunch_porridge || 'none',
      evening_salad_chips: Array.isArray(parsed.evening_salad_chips) 
        ? parsed.evening_salad_chips 
        : defaultRation.evening_salad_chips,
      salad_notes: parsed.salad_notes || '',
      coarse_branches: parsed.coarse_branches || 0
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
  const { profile, elephants, assignments, selectedDate, setSelectedDate, activeElephantId, setActiveElephantId, setGlobalSaveStatus, logout } = useStore();
  
  const todayStr = new Date().toISOString().split('T')[0];

  // Touch swipe refs for mobile
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      const currentIndex = (elephants || []).findIndex(e => e.id === activeElephantId);
      if (distance > 0 && currentIndex < elephants.length - 1) {
        setActiveElephantId(elephants[currentIndex + 1].id);
      } else if (distance < 0 && currentIndex > 0) {
        setActiveElephantId(elephants[currentIndex - 1].id);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };
  
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [shiftRecords, setShiftRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  
  const [prevShift, setPrevShift] = useState<DailyShift | null>(null);
  const [prevKeeperName, setPrevKeeperName] = useState<string>('Не указан');
    
  const [hayStockBales, setHayStockBales] = useState<number>(200);
  const [hayStockRolls, setHayStockRolls] = useState<number>(15);
  
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [modalBales, setModalBales] = useState<number>(200);
  const [modalRolls, setModalRolls] = useState<number>(15);

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

  const [loading, setLoading] = useState<boolean>(true);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSavesRef = useRef(0);
  const minSaveTimeRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTask, setSelectedTask] = useState<{ assignment: Assignment; elephant: Elephant; existingRecord?: TreatmentRecordWithPhotos } | null>(null);

  const isVet = profile?.role === 'vet' || profile?.role === 'director';
  const isFutureDate = selectedDate > todayStr;
  const isArchiveMode = selectedDate < todayStr;
  const isLocked = (shift?.status === 'completed' || isArchiveMode || isFutureDate) && !isVet;

  useEffect(() => {
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
      if (loadedShift && (!loadedShift.duty_keeper_id || loadedShift.duty_keeper_id !== profile?.id)) {
        const isThisShiftLocked = (loadedShift.status === 'completed' || selectedDate < todayStr || selectedDate > todayStr) && profile?.role !== 'vet';
        if (!isThisShiftLocked && profile?.id) {
           loadedShift = { ...loadedShift, duty_keeper_id: profile.id };
           // Trigger immediate save in background so it's locked to this user
           shiftService.saveShiftData(loadedShift, data.metrics || {}).catch(console.error);
        }
      }
      setShift(loadedShift);
      setMetrics(data.metrics || {});

      const bales = await shiftService.getHayStock('bales');
      const rolls = await shiftService.getHayStock('rolls');
      setHayStockBales(bales);
      setHayStockRolls(rolls);

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
    
    try {
      await shiftService.saveShiftData(currentShift, currentMetrics);
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
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await shiftService.saveShiftData(updatedShift, updatedMetrics);
        setGlobalSaveStatus('saved');
        statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('Debounced save error:', err);
        setGlobalSaveStatus('error');
        statusTimerRef.current = setTimeout(() => setGlobalSaveStatus('idle'), 3000);
      }
    }, 1200); // Slower debounce to match the slower animations
  }, []);

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

  const handleShiftFieldChange = (field: keyof DailyShift, value: any, immediate = true) => {
    if (isFutureDate && field !== 'duty_keeper_id' && field !== 'reminders') return;
    if (isLocked) return;
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

  
  const currentRation = useMemo<DailyRationData>(() => {
    return parseDailyRation(shift?.feed_notes);
  }, [shift?.feed_notes]);

  const handlePorridgeChange = (meal: 'morning' | 'lunch', status: 'none' | 'all' | 'partial') => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      [meal === 'morning' ? 'morning_porridge' : 'lunch_porridge']: status
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

  const handleCompleteTask = async (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => {
    if (!profile || !selectedTask) return;
    
    // If editing existing record, remove old record first
    if (selectedTask.existingRecord) {
      try {
        await supabaseService.deleteTreatmentRecord(selectedTask.existingRecord.id);
      } catch (err) {
        console.warn('Could not delete old record during edit:', err);
      }
    }

    await SyncManager.saveRecordLocally({
      assignment_id: selectedTask.assignment.id,
      elephant_id: selectedTask.elephant.id,
      keeper_id: profile.id,
      performed_at: new Date().toISOString(),
      assessment: data.assessment,
      medicine_used: data.medicineUsed,
      comment: data.comment,
    }, data.photoBlob);
    
    setSelectedTask(null);
    await fetchShiftRecords(selectedDate);
  };

  const handleUnmarkTask = async (recordId: string) => {
    if (!confirm('Вы уверены, что хотите снять выполнение этой задачи?')) return;
    try {
      await supabaseService.deleteTreatmentRecord(recordId);
      await fetchShiftRecords(selectedDate);
    } catch (err) {
      console.error('Failed to unmark task:', err);
      alert('Ошибка при снятии выполнения задачи');
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
  return (
        <div className="pb-32 space-y-6 mt-2 relative">
      
      {/* FUTURE DATE BANNER */}
      {isFutureDate && (
        <div className="bg-blue-50/80 backdrop-blur-xl border border-blue-200/80 text-blue-900 px-5 py-3.5 rounded-[24px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-blue-600 shrink-0" size={20} />
            <div>
              <div className="font-bold text-xs sm:text-sm">Режим планирования будущей смены</div>
              <div className="text-[11px] text-blue-700/80 mt-0.5">Фактический ввод дежурства заблокирован до наступления даты смены.</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition shadow-sm shrink-0"
          >
            К сегодня
          </button>
        </div>
      )}

      {/* ARCHIVE BANNER */}
      {isArchiveMode && (
        <div className="bg-amber-50/80 backdrop-blur-xl border border-amber-200/80 text-amber-900 px-5 py-3.5 rounded-[24px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <History className="text-amber-600 shrink-0" size={20} />
            <div>
              <div className="font-bold text-xs sm:text-sm">Архив смены • Режим чтения</div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">Редактирование закрыто (просмотр исторических записей).</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold transition shadow-sm shrink-0"
          >
            К сегодня
          </button>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-white/80 backdrop-blur-md border border-white/40 p-3 sm:p-5 rounded-[28px] shadow-lg flex flex-row items-center justify-between gap-2 sm:gap-4">
        
        {/* LEFT SIDE: MINI PROFILE */}
        <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl shadow-sm transition-all shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-[12px] font-black shrink-0 shadow-inner ring-2 ring-white">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-tight tracking-tight truncate max-w-[75px] sm:max-w-full">{profile?.name || 'Гость'}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase leading-tight truncate">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: DATE */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedDate !== todayStr && (
            <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-600 hidden md:flex">
              {isFutureDate ? 'План' : 'Архив'}
            </span>
          )}
          
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-all shadow-md shadow-slate-900/20 active:scale-95 shrink-0"
            >
              Сегодня
            </button>
          )}
          <button onClick={() => setIsDatePickerOpen(true)} className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1 shrink-0">
            {formattedDateLabel} <span className="text-[10px] sm:text-sm opacity-50">▼</span>
          </button>
        </div>

      </div>

      {/* ACTIVE ELEPHANT CONTENT */}
      <div className="space-y-6">
        {(() => {
          const activeElephant = (elephants || []).find(e => e.id === activeElephantId) || (elephants || [])[0];
          if (!activeElephant) return null;
          
          const m = (metrics || {})[activeElephant.id] || {
            shift_id: shift?.id || '',
            elephant_id: activeElephant.id,
            poop_count: 0,
            feces_traits: ['Сформирован (норма)'],
            urination_count: 0,
            urination_traits: ['Светлая / Прозрачная'],
            behavior: 'Спокойная / В норме',
            sleep_minutes: 420,
            notes: ''
          };
          
          const assignmentsForEle = (assignments || []).filter(a => a.elephant_id === activeElephant.id);
          
          const assignmentsContent = assignmentsForEle.length > 0 ? (
            <div className="space-y-2 mt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="text-base leading-none">🩺</span> Вет. назначения
              </div>
              {assignmentsForEle.map(assignment => {
                const relatedRecord = (shiftRecords || []).find(r => r.assignment_id === assignment.id);
                const isCompletedToday = !!relatedRecord;
                return (
                  <VeterinaryAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isCompletedToday={isCompletedToday}
                    isLocked={isLocked}
                    onExecute={() => setSelectedTask({ assignment, elephant: activeElephant })}
                    onUnmark={() => handleUnmarkTask(relatedRecord.id)}
                    onEdit={() => setSelectedTask({ assignment, elephant: activeElephant, existingRecord: relatedRecord })}
                  />
                );
              })}
            </div>
          ) : null;

          return (
            <ObservationEditor
              elephant={activeElephant}
              metrics={m}
              isLocked={isLocked}
              onMetricChange={(field, val) => handleMetricChange(activeElephant.id, field as any, val)}
              onTraitToggle={(field, trait) => handleTraitToggle(activeElephant.id, field, trait)}
              onNotesBlur={() => shift && persistChanges(shift, metrics)}
              assignmentsContent={assignmentsContent}
            />
          );
        })()}
      </div>

      {/* FEED CONTROL & DAILY RATION SECTION */}
      <div className="space-y-6 pt-6">
        <FeedControl
          hayBalesDistributed={hayBalesDistributed}
          hayBagsDistributed={hayBagsDistributed}
          ration={currentRation}
          isLocked={isLocked}
          onBalesChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
          onBagsChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
          onPorridgeChange={handlePorridgeChange}
          onVegetableToggle={handleVegetableToggle}
          onSaladNotesChange={handleSaladNotesChange}
          onBranchesChange={handleBranchesChange}
        />
      </div>

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

      {/* SHIFT COMPLETED CONFIRMATION MODAL */}
    </div>
    );
}
