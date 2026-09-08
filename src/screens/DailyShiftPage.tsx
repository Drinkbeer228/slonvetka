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
  const { profile, elephants, assignments, selectedDate, setSelectedDate } = useStore();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeElephantId, setActiveElephantId] = useState<string>('');

  useEffect(() => {
    if (elephants.length > 0 && (!activeElephantId || !elephants.find(e => e.id === activeElephantId))) {
      setActiveElephantId(elephants[0].id);
    }
  }, [elephants]);

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
      const currentIndex = elephants.findIndex(e => e.id === activeElephantId);
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
  const [complaintSpoilerOpen, setComplaintSpoilerOpen] = useState(false);
  const [complaintTags, setComplaintTags] = useState<string[]>([]);
  const [complaintComment, setComplaintComment] = useState('');
  const [complaintPhotoBlob, setComplaintPhotoBlob] = useState<Blob | null>(null);
  const [complaintPreviewUrl, setComplaintPreviewUrl] = useState<string | null>(null);
  
  const [hayStockBales, setHayStockBales] = useState<number>(200);
  const [hayStockRolls, setHayStockRolls] = useState<number>(15);
  
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [modalBales, setModalBales] = useState<number>(200);
  const [modalRolls, setModalRolls] = useState<number>(15);

  const [newReminderText, setNewReminderText] = useState<string>('');
  const [shiftCompletedModalOpen, setShiftCompletedModalOpen] = useState(false);

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
          const recordDateStr = qr.payload.performed_at.split('T')[0];
          if (recordDateStr === dateStr) {
            const photosForRecord = queuedPhotos.filter(qp => qp.temp_record_id === qr.temp_id);
            const photos = photosForRecord.map(qp => ({
              id: qp.temp_photo_id,
              storage_path: URL.createObjectURL(qp.file_blob),
              photo_type: qp.photo_type
            }));
            const keeper = staffList.find(s => s.id === qr.payload.keeper_id) || profile;

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

      const serverAssignmentIds = new Set(records.map(r => r.assignment_id).filter(Boolean));
      const filteredLocalRecords = localRecords.filter(lr => !lr.assignment_id || !serverAssignmentIds.has(lr.assignment_id));

      setShiftRecords([...records, ...filteredLocalRecords]);
    } catch (err) {
      console.error('Failed to fetch shift records:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await shiftService.getShiftData(selectedDate);
      setShift(data.shift);
      setMetrics(data.metrics);

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
      setPrevShift(prevData.shift);
      if (prevData.shift.duty_keeper_id) {
        const k = staff.find(s => s.id === prevData.shift.duty_keeper_id);
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

  const handleAddComplaint = async () => {
    if (!shift) return;
    const newComplaint = {
      id: `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author_name: profile?.name || 'Дежурный',
      tags: complaintTags,
      comment: complaintComment.trim(),
      photo_url: complaintPreviewUrl || undefined,
      created_at: new Date().toISOString()
    };
    const existing = shift.handover_complaints || [];
    const updated = [newComplaint, ...existing];
    handleShiftFieldChange('handover_complaints', updated, true);
    setComplaintTags([]);
    setComplaintComment('');
    setComplaintPhotoBlob(null);
    setComplaintPreviewUrl(null);
    setComplaintSpoilerOpen(false);
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

  const formattedDateLabel = new Date(selectedDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dutyKeeper = staffList.find(s => s.id === shift?.duty_keeper_id);
  const hayBalesDistributed = shift?.hay_bales_distributed || 0;
  const hayBagsDistributed = shift?.hay_bags_distributed || 0;

  // Collect all photos from shift records for "Фото дня"
  const allPhotos: { url: string; elephantName: string; timeStr: string; recordId: string }[] = [];
  for (const rec of shiftRecords) {
    if (rec.photos && rec.photos.length > 0) {
      const elephant = elephants.find(e => e.id === rec.elephant_id);
      const timeStr = new Date(rec.performed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      for (const p of rec.photos) {
        const url = supabaseService.getPublicUrl(p.storage_path);
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-zinc-400" size={36} />
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6 mt-4">
      {/* SAVING STATUS INDICATOR BAR */}
      <div className="fixed bottom-6 right-6 z-50">
        {savingStatus === 'saving' && (
          <div className="bg-zinc-900/90 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in fade-in">
            <Loader2 className="animate-spin" size={14} /> Сохранение...
          </div>
        )}
        {savingStatus === 'saved' && (
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold backdrop-blur-md animate-in fade-in">
            <Check size={14} /> Сохранено ✓
          </div>
        )}
      </div>

      {/* FUTURE DATE BANNER (PLANNING MODE) */}
      {isFutureDate && (
        <div className="bg-indigo-50 border-2 border-indigo-200 text-indigo-900 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-200 flex items-center justify-center text-indigo-800 shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="font-black text-sm">Режим планирования будущей смены ({formattedDateLabel})</div>
              <div className="text-xs font-medium text-indigo-700 mt-0.5">
                Фактический ввод дежурства заблокирован. Установите дежурного и добавьте напоминания.
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
          >
            К сегодня
          </button>
        </div>
      )}

      {/* ARCHIVE BANNER IF IN ARCHIVE MODE */}
      {isArchiveMode && (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <History size={20} />
            </div>
            <div>
              <div className="font-black text-sm">Архив смены за {formattedDateLabel}</div>
              <div className="text-xs font-medium text-amber-700 mt-0.5">
                Дежурный: {dutyKeeper ? dutyKeeper.name : 'Не указан'} • Режим чтения
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
          >
            К сегодня
          </button>
        </div>
      )}

      {/* KEEPER & TASKS COMPACT BLOCK */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-zinc-200 space-y-4">
        {/* KEEPER SELECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-zinc-500" />
            <span className="text-sm font-bold text-zinc-700">Дежурный кипер:</span>
          </div>
          <select
            disabled={isArchiveMode && !isVet}
            value={shift?.duty_keeper_id || profile?.id || ''}
            onChange={(e) => handleShiftFieldChange('duty_keeper_id', e.target.value, true)}
            className="w-full sm:w-auto min-w-[240px] px-3.5 py-2.5 bg-zinc-100 border border-zinc-300 rounded-xl font-bold text-sm focus:outline-none focus:border-zinc-900 disabled:opacity-60"
          >
            <option value="">-- Выберите дежурного --</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
            ))}
          </select>
        </div>

        {/* REMINDERS MANAGEMENT */}
        <div className="pt-3 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bell size={14} /> Напоминания и задачи на смену
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddReminder(); }}
              placeholder="Например: Привоз сена в 15:00, разгрузка моркови..."
              className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900"
            />
            <button
              type="button"
              onClick={handleAddReminder}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0"
            >
              <Plus size={16} /> Добавить
            </button>
          </div>

          {shift?.reminders && shift.reminders.length > 0 && (
            <div className="space-y-1.5">
              {shift.reminders.map((reminder, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="text-zinc-800 font-bold">{reminder}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(idx)}
                    className="text-zinc-400 hover:text-red-600 transition p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCK 0: ACCEPTANCE OF SHIFT FROM PREVIOUS KEEPER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg shadow-sm">
              🤝
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-950">
                Приемка смены от предыдущего дежурного
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Предыдущая смена: <span className="font-bold text-zinc-800">{prevKeeperName}</span>
                {prevShift?.date ? ` (${prevShift.date})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setComplaintSpoilerOpen(!complaintSpoilerOpen)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border border-amber-200 shadow-sm"
          >
            <AlertTriangle size={15} />
            <span>{complaintSpoilerOpen ? 'Скрыть форму замечаний' : '⚠️ Зафиксировать замечания по приемке'}</span>
          </button>
        </div>

        {prevShift?.handover_notes ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
            <div className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Напутствие от предыдущего дежурного:</div>
            <div className="italic">«{prevShift.handover_notes}»</div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 italic px-1">
            У предыдущего дежурного нет записок в поле «Заметки для следующего дежурного».
          </div>
        )}

        {shift?.handover_complaints && shift.handover_complaints.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={14} /> Зафиксированные замечания ({shift.handover_complaints.length})
            </div>
            <div className="space-y-2">
              {shift.handover_complaints.map((c) => (
                <div key={c.id} className="p-3 bg-red-50/70 border border-red-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-red-900">{c.author_name}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {c.tags && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-red-100 text-red-800 rounded-lg font-bold text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.comment && <div className="text-zinc-800 font-medium">{c.comment}</div>}
                  {c.photo_url && (
                    <div className="mt-1">
                      <img src={c.photo_url} alt="Proof" className="w-20 h-20 object-cover rounded-xl border border-red-200 cursor-zoom-in" onClick={() => setPreviewPhotoUrl(c.photo_url || null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {complaintSpoilerOpen && (
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Фиксация замечания по приемке смены</div>
            
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-zinc-600">Типовые замечания:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Не убран вольер', 'Не помыт слон', 'Навоз не вывезен', 'Инвентарь не на месте'].map(tag => {
                  const isSelected = complaintTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) setComplaintTags(complaintTags.filter(t => t !== tag));
                        else setComplaintTags([...complaintTags, tag]);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold text-left transition border flex items-center justify-between ${
                        isSelected ? 'bg-amber-800 text-white border-amber-800 shadow-sm' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Пояснение / Комментарий</label>
              <textarea
                rows={2}
                value={complaintComment}
                onChange={(e) => setComplaintComment(e.target.value)}
                placeholder="Опишите детали замечания..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="cursor-pointer px-3 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-xl font-bold text-xs text-zinc-700 transition flex items-center gap-1.5 shadow-sm">
                <Camera size={14} />
                <span>{complaintPreviewUrl ? 'Фото прикреплено ✓' : 'Прикрепить фото'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setComplaintPhotoBlob(file);
                      setComplaintPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              {complaintPreviewUrl && (
                <img src={complaintPreviewUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-zinc-300" />
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleAddComplaint}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition shadow-sm"
              >
                Сохранить замечание
              </button>
            </div>
          </div>
        )}
      </div>

      {/* IF FUTURE DATE, DO NOT RENDER FACTUAL SHIFT BLOCKS */}
      {isFutureDate ? (
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-black">
            📅
          </div>
          <h2 className="text-xl font-black text-zinc-900">Будущая дата заблокирована для фактического ввода</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Фактические показатели дефекации, мочеиспускания и раздачи кормов можно будет заполнить в день наступления смены ({formattedDateLabel}).
          </p>
        </div>
      ) : (
        <>
          {/* BLOCK 1: PHYSIOLOGICAL MONITORING */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <h2 className="text-lg font-black tracking-tight text-zinc-800">
                🐘 1. Физиологический мониторинг слонов
              </h2>
              <span className="text-xs font-bold text-zinc-400">
                Свайпните влево/вправо для смены слона
              </span>
            </div>

            {/* ELEPHANT TABS SEGMENTED CONTROL */}
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl w-full">
              {elephants.map((elephant) => {
                const isActive = elephant.id === activeElephantId;
                const m = metrics[elephant.id];
                const hasNotes = m && m.notes && m.notes.trim().length > 0;
                return (
                  <button
                    key={elephant.id}
                    type="button"
                    onClick={() => setActiveElephantId(elephant.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all relative ${
                      isActive 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white font-bold' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🐘</span>
                    <span className="truncate">{elephant.name}</span>
                    {hasNotes && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" title="Есть заметки" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ACTIVE ELEPHANT CARD WITH SWIPE GESTURE */}
            {(() => {
              const activeElephant = elephants.find(e => e.id === activeElephantId) || elephants[0];
              if (!activeElephant) return null;

              const m = metrics[activeElephant.id] || {
                shift_id: shift?.id || '',
                elephant_id: activeElephant.id,
                poop_count: 0,
                feces_traits: ['Сформирован (норма)'],
                urination_count: 0,
                urination_traits: ['Светлая / Прозрачная'],
                behavior: 'Спокойная / В норме',
                notes: ''
              };

              const fecesTraits = m.feces_traits || ['Сформирован (норма)'];
              const urinationTraits = m.urination_traits || ['Светлая / Прозрачная'];

              return (
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl shadow-sm">
                        🐘
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-zinc-900">{activeElephant.name}</h3>
                        <p className="text-xs text-zinc-400 font-medium">Физиологический статус и показатели</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdhocModalElephant(activeElephant)}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border border-blue-200 shadow-sm"
                    >
                      <Camera size={15} /> + Заметка / Обработка
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CONTAINER 1: DEFECATION */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                      <CounterButton
                        label="Дефекация"
                        value={m.poop_count}
                        onChange={(val) => handleMetricChange(activeElephant.id, 'poop_count', val)}
                      />

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="block text-[11px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">Характер стула</span>
                        <div className="space-y-1.5">
                          {FECES_OPTIONS.map(trait => {
                            const isSelected = fecesTraits.includes(trait);
                            const isWarning = trait.includes('⚠️');
                            const isNormal = trait.includes('норма');

                            let btnStyle = 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100';
                            if (isSelected) {
                              if (isWarning) btnStyle = 'bg-red-700 text-white border-red-700 shadow-sm';
                              else if (isNormal) btnStyle = 'bg-emerald-700 text-white border-emerald-700 shadow-sm';
                              else btnStyle = 'bg-zinc-800 text-white border-zinc-800 shadow-sm';
                            }

                            return (
                              <button
                                key={trait}
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleTraitToggle(activeElephant.id, 'feces_traits', trait)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition border flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{trait}</span>
                                {isSelected && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* CONTAINER 2: URINATION */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                      <CounterButton
                        label="Мочеиспускание"
                        value={m.urination_count}
                        onChange={(val) => handleMetricChange(activeElephant.id, 'urination_count', val)}
                      />

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="block text-[11px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">Характеристики мочи</span>
                        <div className="space-y-1.5">
                          {URINATION_OPTIONS.map(trait => {
                            const isSelected = urinationTraits.includes(trait);
                            const isWarning = trait.includes('⚠️') || trait.includes('Темная') || trait.includes('Мутная') || trait.includes('Бурая');
                            const isNormal = trait.includes('Светлая / Прозрачная');

                            let btnStyle = 'bg-white dark:bg-slate-700 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100';
                            if (isSelected) {
                              if (isNormal) btnStyle = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                              else if (isWarning) btnStyle = 'bg-amber-600 text-white border-amber-600 shadow-sm';
                              else btnStyle = 'bg-zinc-800 text-white border-zinc-800 shadow-sm';
                            }

                            return (
                              <button
                                key={trait}
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleTraitToggle(activeElephant.id, 'urination_traits', trait)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition border flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{trait}</span>
                                {isSelected && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONTAINER 3: MOOD & NOTES */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="space-y-2">
                      <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Эмоции и состояние слона</span>
                      <div className="grid grid-cols-5 gap-2 w-full mt-2">
                        {ELEPHANT_MOODS.map(mood => {
                          const currentBehavior = m.behavior || 'Спокойная / В норме';
                          const isSelected = currentBehavior === mood.id;
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleMetricChange(activeElephant.id, 'behavior', mood.id)}
                              className={`min-h-[64px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? mood.activeClass 
                                  : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 opacity-70 hover:opacity-100 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="text-2xl mb-1 shrink-0">
                                {mood.emoji}
                              </span>
                              <span className="text-[11px] font-medium leading-tight text-center">
                                {mood.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={m.notes || ''}
                        onChange={(e) => handleMetricChange(activeElephant.id, 'notes', e.target.value)}
                        onBlur={() => shift && persistChanges(shift, metrics)}
                        placeholder="Краткие заметки по слону..."
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* BLOCK 2: VETERINARY ASSIGNMENTS & EDIT/UNMARK ACTIONS */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black tracking-tight text-zinc-800">
              🩺 2. Ветеринарные назначения и фотоотчеты
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Выполненные задачи сохраняют статус, фото и поддерживают редактирование</p>

            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-sm text-zinc-400 font-medium py-4 text-center">Назначений нет</p>
              ) : (
                assignments.map(assignment => {
                  const elephant = elephants.find(e => e.id === assignment.elephant_id);
                  const relatedRecord = shiftRecords.find(r => r.assignment_id === assignment.id);
                  const isCompletedToday = !!relatedRecord;

                  return (
                    <div key={assignment.id} className={`p-4 rounded-2xl border transition ${isCompletedToday ? 'bg-emerald-50/40 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs px-2.5 py-0.5 bg-zinc-200 rounded-lg text-zinc-800">
                              {elephant ? elephant.name : 'Слон'}
                            </span>
                            <span className="font-bold text-base text-zinc-900">{assignment.title}</span>

                            {isCompletedToday ? (
                              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black border border-emerald-300">
                                ✓ Выполнено: {relatedRecord.keeper?.name || 'Кипер'}, {new Date(relatedRecord.performed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                                ⏳ Активно
                              </span>
                            )}
                          </div>

                          {assignment.medicine && (
                            <p className="text-xs font-bold text-blue-700">💊 Препарат: {assignment.medicine}</p>
                          )}
                          {assignment.description && (
                            <p className="text-xs text-zinc-600 font-medium">{assignment.description}</p>
                          )}

                          {relatedRecord?.comment && (
                            <p className="text-xs text-zinc-700 bg-white/80 p-2 rounded-xl border border-emerald-100 mt-1">
                              💬 Комментарий: {relatedRecord.comment}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Photo thumbnail if exists (80x80px compact fixed size, zoom-in cursor, hover effect) */}
                          {relatedRecord?.photos && relatedRecord.photos.length > 0 && (
                            <div className="flex gap-1.5">
                              {relatedRecord.photos.map(p => {
                                const thumbUrl = supabaseService.getPublicUrl(p.storage_path);
                                return (
                                  <img
                                    key={p.id}
                                    src={thumbUrl}
                                    alt="Фотоотчет"
                                    onClick={() => setPreviewPhotoUrl(thumbUrl)}
                                    className="w-20 h-20 rounded-lg object-cover border-2 border-emerald-300 shadow-sm cursor-zoom-in hover:opacity-80 transition"
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* Action Buttons for Completed or Pending Tasks */}
                          {isCompletedToday ? (
                            !isLocked && elephant && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTask({ assignment, elephant, existingRecord: relatedRecord })}
                                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-1"
                                  title="Редактировать выполнение"
                                >
                                  <Edit2 size={14} /> Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUnmarkTask(relatedRecord.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200"
                                  title="Снять выполнение"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )
                          ) : (
                            !isLocked && elephant && (
                              <button
                                type="button"
                                onClick={() => setSelectedTask({ assignment, elephant })}
                                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                              >
                                <Camera size={14} /> Выполнить
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BLOCK 3: INDEPENDENT FEED STREAMS (BALES & ROLLS/BAGS) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black tracking-tight text-zinc-800">🌾 3. Корма и склад сена</h2>
                <p className="text-xs text-zinc-500 font-medium">Независимый учет тюков и рулонов/мешков без взаимных блокировок</p>
              </div>

              {isVet && (
                <button
                  type="button"
                  onClick={() => {
                    setModalBales(hayStockBales);
                    setModalRolls(hayStockRolls);
                    setReplenishModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition flex items-center gap-2 shadow-sm"
                >
                  <PackagePlus size={16} />
                  <span>± Управление складом</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* SECTION 1: BALES (Тюки) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">📦 Тюки сена</span>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-zinc-400">На складе</div>
                    <div className="text-base font-black text-zinc-900">
                      {Math.max(0, hayStockBales - hayBalesDistributed)} тюков
                    </div>
                  </div>
                </div>

                <CounterButton
                  label="Раздано тюков"
                  value={hayBalesDistributed}
                  onChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
                />
              </div>

              {/* SECTION 2: ROLLS & BAGS (Рулоны и мешки) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">🔄 Рулоны и мешки</span>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-zinc-400">На складе</div>
                    <div className="text-base font-black text-zinc-900">
                      {hayStockRolls} рулонов
                    </div>
                  </div>
                </div>

                <CounterButton
                  label="Раздано мешков"
                  value={hayBagsDistributed}
                  onChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Заметки по кормлению</label>
              <textarea
                disabled={isLocked}
                rows={2}
                value={shift?.feed_notes || ''}
                onChange={(e) => handleShiftFieldChange('feed_notes', e.target.value, false)}
                onBlur={() => shift && persistChanges(shift, metrics)}
                placeholder="Особенности поедания кормов..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-900 resize-none"
              />
            </div>
          </div>

          {/* BLOCK 4: HANDOVER (СДАЧА СМЕНЫ СЛЕДУЮЩЕМУ) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black tracking-tight text-zinc-800">
              🤝 Сдача смены следующему дежурному
            </h2>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Что важно знать следующей смене (состояние слонов, нюансы по кормам, задачи)...</label>
              <textarea
                disabled={isLocked}
                rows={3}
                value={shift?.handover_notes || ''}
                onChange={(e) => handleShiftFieldChange('handover_notes', e.target.value, false)}
                onBlur={() => shift && persistChanges(shift, metrics)}
                placeholder="Важная информация для сменщика..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-900 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              {shift?.status !== 'completed' && !isArchiveMode && (
                <button
                  type="button"
                  onClick={() => {
                    handleShiftFieldChange('status', 'completed', true);
                    setShiftCompletedModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 uppercase tracking-wider text-sm"
                >
                  <CheckCircle2 size={18} />
                  <span>СДАТЬ СМЕНУ</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION: ФОТО ДНЯ (PHOTOS OF THE DAY GALLERY) */}
          {allPhotos.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-zinc-700" size={20} />
                <h2 className="text-lg font-black tracking-tight text-zinc-800">Фото дня ({allPhotos.length})</h2>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Все фотоотчеты и внеплановые снимки за текущие сутки</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {allPhotos.map((item, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square shadow-sm cursor-zoom-in" onClick={() => setPreviewPhotoUrl(item.url)}>
                    <img src={item.url} alt={item.elephantName} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                      <div className="text-[11px] font-black">{item.elephantName}</div>
                      <div className="text-[9px] text-zinc-300">{item.timeStr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* REPLENISH WAREHOUSE STOCK MODAL */}
      {replenishModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base">Остатки на складе</h3>
              <button type="button" onClick={() => setReplenishModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">📦 Тюки сена (шт.)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalBales(Math.max(0, modalBales - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center transition shadow-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={modalBales}
                    onChange={(e) => setModalBales(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 px-1 bg-zinc-100 border border-zinc-300 rounded-xl font-bold text-lg text-center focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setModalBales(modalBales + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center transition shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">🔄 Рулоны сена (шт.)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalRolls(Math.max(0, modalRolls - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center transition shadow-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={modalRolls}
                    onChange={(e) => setModalRolls(Math.max(0, Number(e.target.value)))}
                    className="w-16 h-10 px-1 bg-zinc-100 border border-zinc-300 rounded-xl font-bold text-lg text-center focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setModalRolls(modalRolls + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center transition shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAllStocks}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-xs transition shadow-sm uppercase tracking-wider"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AD-HOC TREATMENT MODAL */}
      {adhocModalElephant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{adhocModalElephant.name}</div>
                <h3 className="font-black text-base">Внеплановая заметка / Обработка</h3>
              </div>
              <button type="button" onClick={() => setAdhocModalElephant(null)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAdhocRecord} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Препарат (если применялся)</label>
                <input
                  type="text"
                  value={adhocMedicine}
                  onChange={(e) => setAdhocMedicine(e.target.value)}
                  placeholder="Например: Мазь Вишневского, Йод..."
                  className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Описание / Наблюдение *</label>
                <textarea
                  rows={3}
                  required
                  value={adhocDescription}
                  onChange={(e) => setAdhocDescription(e.target.value)}
                  placeholder="Опишите состояние или выполненную внеплановую процедуру..."
                  className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Фотофиксация</label>
                {adhocPreviewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black flex justify-center border border-zinc-300 max-h-40">
                    <img src={adhocPreviewUrl} alt="Preview" className="h-40 object-contain" />
                    <button
                      type="button"
                      onClick={() => { setAdhocPhotoBlob(null); setAdhocPreviewUrl(null); }}
                      className="absolute top-2 right-2 bg-black/80 text-white px-2.5 py-1 rounded-xl text-xs font-bold"
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition">
                    <Camera size={24} className="text-zinc-500 mb-1" />
                    <span className="text-xs font-bold text-zinc-700">Сделать или выбрать фото</span>
                    <input type="file" accept="image/*" onChange={handleAdhocPhotoSelected} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAdhocModalElephant(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-zinc-600 bg-zinc-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submittingAdhoc}
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold flex items-center gap-2"
                >
                  {submittingAdhoc && <Loader2 size={16} className="animate-spin" />}
                  <span>Сохранить заметку</span>
                </button>
              </div>
            </form>
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
      {shiftCompletedModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Смена успешно сдана!</h3>
              <p className="text-xs text-zinc-500 font-medium">Статус смены переведен в «Завершена». Все данные зафиксированы в системе.</p>
            </div>
            <button
              type="button"
              onClick={() => setShiftCompletedModalOpen(false)}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-xs transition uppercase tracking-wider shadow-sm"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
