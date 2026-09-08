import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { ExecutionModal } from '../components/ExecutionModal';
import { VeterinaryAssignmentCard } from '../components/daily-shift/VeterinaryAssignmentCard';
import { FeedControl } from '../components/daily-shift/FeedControl';
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
    activeClass: 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500 text-blue-600 shadow-sm'
  },
  { 
    id: 'Спокойная / В норме', 
    label: 'Спокойно', 
    emoji: '🐘',
    activeClass: 'bg-slate-100 dark:bg-slate-700 border-2 border-slate-400 text-slate-800 dark:text-slate-100 shadow-sm'
  },
  { 
    id: 'Бодрая / Отличный аппетит', 
    label: 'Ест с аппетитом', 
    emoji: '🍏',
    activeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-600 shadow-sm'
  },
  { 
    id: 'Игривая / Контактная', 
    label: 'Игривая', 
    emoji: '🎸',
    activeClass: 'bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-500 text-purple-600 shadow-sm'
  },
  { 
    id: 'Беспокойная / Настороже', 
    label: 'Стресс / Шум', 
    emoji: '⚡',
    activeClass: 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-600 shadow-sm'
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

export function DailyShiftPage() {
  const { profile, elephants, assignments, selectedDate, setSelectedDate, activeElephantId, setActiveElephantId } = useStore();
  
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
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      setShift(data.shift || null);
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
    setSavingStatus('saving');
    try {
      await shiftService.saveShiftData(currentShift, currentMetrics);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (err) {
      console.error('Autosave error:', err);
      setSavingStatus('idle');
    }
  };

  // Debounced autosave for text inputs
  const triggerDebouncedSave = useCallback((updatedShift: DailyShift, updatedMetrics: Record<string, ElephantDailyMetrics>) => {
    setSavingStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await shiftService.saveShiftData(updatedShift, updatedMetrics);
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (err) {
        console.error('Debounced save error:', err);
        setSavingStatus('idle');
      }
    }, 800);
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
        persistChanges(shift, updatedMetrics);
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

  
  const handleSaveAllStocks = async () => {
    const newBales = await shiftService.setHayStock('bales', Number(modalBales));
    const newRolls = await shiftService.setHayStock('rolls', Number(modalRolls));
    setHayStockBales(newBales);
    setHayStockRolls(newRolls);
    setReplenishModalOpen(false);
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
      
      {/* SAVING STATUS */}
      <div className="fixed bottom-6 right-6 z-50">
        {savingStatus === 'saving' && (
          <div className="bg-slate-900/80 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in fade-in">
            <Loader2 className="animate-spin" size={14} /> Сохранение...
          </div>
        )}
        {savingStatus === 'saved' && (
          <div className="bg-emerald-500/90 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in fade-in fade-out delay-1000">
            <Check size={14} /> Сохранено ✓
          </div>
        )}
      </div>

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
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-[24px] shadow-[0_4px_32px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Рабочая смена</h2>
            {selectedDate !== todayStr && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                {isFutureDate ? 'План' : 'Архив'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <div className="text-xl font-black text-slate-800 tracking-tight">{formattedDateLabel}</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition active:scale-95"
                title="Предыдущий день"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition active:scale-95"
                title="Следующий день"
              >
                →
              </button>
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-0.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-full transition ml-1"
                >
                  Сегодня
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Дежурный: {dutyKeeper ? dutyKeeper.name : 'Не указан'} {isLocked ? '• Режим чтения' : ''}
          </div>
          {!isLocked && (
             <div className="flex -space-x-2">
                {staffList.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => handleShiftFieldChange('duty_keeper_id', s.id, true)}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      shift?.duty_keeper_id === s.id ? 'bg-slate-800 text-white z-10 scale-110' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={s.name}
                  >
                    {s.name.charAt(0)}
                  </button>
                ))}
             </div>
          )}
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

      {/* FEED CONTROL SECTION */}
      <div className="space-y-6 pt-6">
        <FeedControl
          hayBalesDistributed={hayBalesDistributed}
          hayBagsDistributed={hayBagsDistributed}
          onBalesChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
          onBagsChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
        />
      </div>

      {/* MODALS */}
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
