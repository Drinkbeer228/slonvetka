import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  HeartPulse, Activity, Utensils, Moon, 
  Calendar as CalendarIcon, Camera, FileText, CheckCircle2, ChevronLeft, 
  ChevronRight, Sparkles, Stethoscope, Clock, User, Check, X,
  AlertTriangle, Plus, Edit3, Trash2, Pill, ShieldCheck, Eye, 
  CheckCircle, AlertCircle, Circle, ArrowRight
} from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics } from '../types/shift';
import { Assignment, TreatmentRecordWithPhotos, Elephant } from '../types';
import { DailyRationData } from '../components/daily-shift/FeedControl';
import { formatDuration } from '../components/daily-shift/ExcretionControl';
import { AssignmentModal } from '../components/AssignmentModal';
import { ExecutionModal } from '../components/ExecutionModal';

const ELEPHANT_EMOJI: Record<string, string> = {
  margo: '👑',
  odri: '🎀',
  pretty: '🌸',
};

export function VetDashboard() {
  const { 
    elephants: storeElephants, 
    profile, 
    selectedDate, 
    setSelectedDate, 
    refreshAssignments 
  } = useStore();

  const elephants = useMemo(() => {
    return storeElephants && storeElephants.length > 0 ? storeElephants : [];
  }, [storeElephants]);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [filterElephantId, setFilterElephantId] = useState<string>('all');
  
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  // RBAC permissions
  const isVetOrAdmin = profile?.role === 'vet' || profile?.role === 'admin' || profile?.role === 'director';
  const isKeeper = profile?.role === 'keeper';

  // Modal states
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedTaskForExecution, setSelectedTaskForExecution] = useState<{
    assignment: Assignment;
    elephant: Elephant;
    existingRecord?: TreatmentRecordWithPhotos;
  } | null>(null);

  // Lightbox photo preview
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    title: string;
    elephantName?: string;
    performedAt?: string;
    keeperName?: string;
    assessment?: string;
    comment?: string;
  } | null>(null);

  // Filter between active and all assignments (for Vet)
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Format date display
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        weekday: 'long' 
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftData, assignmentsList, dayRecords] = await Promise.all([
        shiftService.getShiftData(selectedDate),
        isVetOrAdmin ? supabaseService.getAllAssignments() : supabaseService.getActiveAssignments(),
        supabaseService.getRecordsByDate(selectedDate),
      ]);

      setShift(shiftData.shift);
      setMetrics(shiftData.metrics || {});
      setAssignments(assignmentsList || []);
      setRecords(dayRecords || []);
    } catch (err) {
      console.error('Error loading VetDashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, isVetOrAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rationData: DailyRationData = useMemo(() => {
    if (!shift?.feed_notes) return {} as DailyRationData;
    try { return JSON.parse(shift.feed_notes); } catch { return {} as DailyRationData; }
  }, [shift]);

  // Target elephants based on tab filter
  const targetElephants = useMemo(() => {
    if (filterElephantId === 'all') return elephants;
    return elephants.filter(e => e.id === filterElephantId);
  }, [elephants, filterElephantId]);
  
  // High-level physiological status summary
  const displayMetrics = useMemo(() => {
    let totalPoop = 0;
    let totalSleepMins = 0;
    let totalLaydowns = 0;
    let hasDiarrhea = false;
    let hasDry = false;
    
    targetElephants.forEach(e => {
      const m = metrics[e.id];
      if (m) {
        totalPoop += (m.poop_count || 0);
        totalSleepMins += (m.sleep_minutes || 0);
        totalLaydowns += (m.sleep_intervals?.length || 0);
        const traits = m.feces_traits || [];
        if (traits.some(t => t.toLowerCase().includes('жидк') || t.toLowerCase().includes('понос'))) {
          hasDiarrhea = true;
        }
        if (traits.some(t => t.toLowerCase().includes('сух') || t.toLowerCase().includes('твёрд'))) {
          hasDry = true;
        }
      }
    });
    
    const appetiteStatus = rationData.salad_appetite === 'refused' 
      ? 'Отказ ⚠️' 
      : rationData.salad_appetite === 'partial' 
        ? 'Частично' 
        : '100% съедено';

    return {
      poopCount: totalPoop,
      stoolStatus: hasDiarrhea ? 'Понос/Жидкий ⚠️' : hasDry ? 'Сухой' : 'Норма (сформирован)',
      hasDiarrhea,
      hasDry,
      sleepTime: formatDuration(totalSleepMins),
      laydowns: totalLaydowns,
      appetite: appetiteStatus,
      porridgeText: rationData.morning_mash_fed || rationData.morning_porridge === 'all' 
        ? 'Каша съедена без остатка' 
        : rationData.morning_porridge === 'partial' 
          ? 'Остаток каши в кормушке' 
          : 'Выдача рациона',
    };
  }, [targetElephants, metrics, rationData]);
  
  // Filter assignments by elephant and active state
  const displayedAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchElephant = filterElephantId === 'all' || a.elephant_id === filterElephantId;
      const matchActive = isVetOrAdmin && !showOnlyActive ? true : a.is_active;
      return matchElephant && matchActive;
    });
  }, [assignments, filterElephantId, isVetOrAdmin, showOnlyActive]);

  // Photo URL helper
  const getPhotoUrl = (storagePath?: string) => {
    if (!storagePath) return '';
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('blob:') || storagePath.startsWith('data:')) {
      return storagePath;
    }
    return supabaseService.getPublicUrl(storagePath);
  };

  // Execution flow for assignment (both Keeper and Vet)
  const handleCompleteTask = async (data: {
    assessment: string | null;
    medicineUsed: string | null;
    comment: string | null;
    photoBlob: Blob | null;
  }) => {
    if (!selectedTaskForExecution || !profile) return;
    const nowIso = new Date().toISOString();
    
    if (selectedTaskForExecution.existingRecord) {
      try {
        await supabaseService.deleteTreatmentRecord(selectedTaskForExecution.existingRecord.id);
      } catch (err) {
        console.warn('Could not delete old record during edit:', err);
      }
    }

    const tempId = crypto.randomUUID();
    const optimisticRecord: TreatmentRecordWithPhotos = {
      id: tempId,
      assignment_id: selectedTaskForExecution.assignment.id,
      elephant_id: selectedTaskForExecution.elephant.id,
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

    setRecords(prev => [
      ...prev.filter(r => r.assignment_id !== selectedTaskForExecution.assignment.id),
      optimisticRecord,
    ]);
    setSelectedTaskForExecution(null);

    try {
      await SyncManager.saveRecordLocally({
        assignment_id: selectedTaskForExecution.assignment.id,
        elephant_id: selectedTaskForExecution.elephant.id,
        keeper_id: profile.id,
        performed_at: nowIso,
        assessment: data.assessment,
        medicine_used: data.medicineUsed,
        comment: data.comment,
      }, data.photoBlob);

      const dayRecords = await supabaseService.getRecordsByDate(selectedDate);
      setRecords(dayRecords);
    } catch (err) {
      console.error('Failed to complete task:', err);
      const dayRecords = await supabaseService.getRecordsByDate(selectedDate);
      setRecords(dayRecords);
    }
  };

  // Unmark task (Vet or Admin)
  const handleUnmarkTask = async (recordId: string, assignmentId?: string) => {
    if (!confirm('Снять отметку о выполнении этой процедуры?')) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    setRecords(prev => prev.filter(r => r.id !== recordId && (!assignmentId || r.assignment_id !== assignmentId)));
    try {
      await supabaseService.deleteTreatmentRecord(recordId);
      const dayRecords = await supabaseService.getRecordsByDate(selectedDate);
      setRecords(dayRecords);
    } catch (err) {
      console.error('Failed to unmark task:', err);
    }
  };

  // Toggle active/inactive (Vet or Admin)
  const handleToggleActive = async (assignment: Assignment) => {
    try {
      setAssignments(prev => prev.map(a => 
        a.id === assignment.id ? { ...a, is_active: !a.is_active } : a
      ));
      await supabaseService.updateAssignment(assignment.id, {
        is_active: !assignment.is_active
      });
      refreshAssignments();
    } catch (err) {
      console.error('Failed to toggle assignment active state:', err);
      loadData();
    }
  };

  const handleAssignmentSaved = async () => {
    setAssignmentModalOpen(false);
    setEditingAssignment(null);
    await loadData();
    refreshAssignments();
  };

  const stepDate = (days: number) => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 px-3.5 sm:px-6 pt-4 antialiased">
      
      {/* 1. HEADER & DATE SELECTOR */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Stethoscope size={22} className="stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Вет-Кабинет
              </h1>
              {isVetOrAdmin ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                  Ветврач
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                  Кипер (Исполнение)
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5 capitalize">
              <CalendarIcon size={13} className="text-slate-400" />
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>
        
        {/* Date Navigator */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 self-start sm:self-auto">
          <button 
            type="button"
            onClick={() => stepDate(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-90 cursor-pointer"
            title="Предыдущий день"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              selectedDate === todayStr 
                ? 'bg-white text-slate-900 shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Сегодня
          </button>
          <button 
            type="button"
            onClick={() => stepDate(1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-90 cursor-pointer"
            title="Следующий день"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. ELEPHANT SELECTION TABS: [Все слоны] | [Марго] | [Одри] | [Прэтти] */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setFilterElephantId('all')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            filterElephantId === 'all' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200/80 hover:bg-white hover:text-slate-900'
          }`}
        >
          Все слоны
        </button>
        {elephants.map(e => {
          const isSelected = filterElephantId === e.id;
          const emoji = ELEPHANT_EMOJI[e.id] || '🐘';
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setFilterElephantId(e.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200/80 hover:bg-white hover:text-slate-900'
              }`}
            >
              <span>{emoji}</span>
              <span>{e.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-teal-600"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Загрузка данных веткабинета...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 3. ВЕРХНИЙ БЛОК: ЛАКОНИЧНЫЕ КАРТОЧКИ СТАТУСА (ЖКТ/Стул, Сон, Аппетит) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* ЖКТ / Стул */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[24px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity size={17} className="text-amber-600 stroke-[2.4]" />
                  <span className="font-extrabold text-xs tracking-tight uppercase">ЖКТ / Стул</span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  displayMetrics.hasDiarrhea 
                    ? 'bg-rose-100 text-rose-700 border-rose-200' 
                    : displayMetrics.hasDry 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {displayMetrics.stoolStatus}
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {displayMetrics.poopCount} <span className="text-sm text-slate-400 font-bold">куч</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  Объем дефекации за суточную смену
                </div>
              </div>
            </div>

            {/* Сон */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[24px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Moon size={17} className="text-indigo-600 stroke-[2.4]" />
                  <span className="font-extrabold text-xs tracking-tight uppercase">Ночной сон</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {displayMetrics.laydowns > 0 ? 'Лежа' : 'Дремали стоя'}
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {displayMetrics.sleepTime}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  {displayMetrics.laydowns} {displayMetrics.laydowns === 1 ? 'укладка' : displayMetrics.laydowns >= 2 && displayMetrics.laydowns <= 4 ? 'укладки' : 'укладок'} за ночь
                </div>
              </div>
            </div>

            {/* Аппетит */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[24px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Utensils size={17} className="text-emerald-600 stroke-[2.4]" />
                  <span className="font-extrabold text-xs tracking-tight uppercase">Аппетит</span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  displayMetrics.appetite.includes('Отказ') 
                    ? 'bg-rose-100 text-rose-700 border-rose-200' 
                    : displayMetrics.appetite === 'Частично' 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {displayMetrics.appetite}
                </div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {displayMetrics.porridgeText}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  {rationData.evening_diet_fed ? 'Вечерний рацион выдан полностью' : 'Рацион по расписанию'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. ОСНОВНОЙ РАБОЧИЙ БЛОК: «НАЗНАЧЕНИЯ И ЛЕЧЕНИЕ» */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[28px] p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-4">
            
            {/* Header with Title and RBAC Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <HeartPulse size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Назначения и лечение
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {displayedAssignments.length} назначений для выполнения
                  </p>
                </div>
              </div>

              {/* Action buttons based on Role */}
              <div className="flex items-center gap-2 flex-wrap">
                {isVetOrAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOnlyActive(!showOnlyActive)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        !showOnlyActive 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                      title="Показать архивные и неактивные назначения"
                    >
                      {showOnlyActive ? 'Архив' : 'Только активные'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAssignment(null);
                        setAssignmentModalOpen(true);
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer touch-manipulation"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Назначить процедуру</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Assignments List */}
            {displayedAssignments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-bold text-sm">
                  {filterElephantId === 'all' 
                    ? 'Активных назначений и процедур не запланировано' 
                    : 'Для выбранного слона активных назначений нет'}
                </p>
                {isVetOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssignment(null);
                      setAssignmentModalOpen(true);
                    }}
                    className="mt-3 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} />
                    Создать первое назначение
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedAssignments.map(assignment => {
                  const elephant = elephants.find(e => e.id === assignment.elephant_id);
                  const record = records.find(r => r.assignment_id === assignment.id);
                  const isCompletedToday = !!record;
                  const completedTime = record?.performed_at
                    ? new Date(record.performed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : undefined;
                  const keeperName = record?.keeper?.name || 'Кипер';
                  const hasPhotos = record?.photos && record.photos.length > 0;
                  const firstPhotoUrl = hasPhotos ? getPhotoUrl(record.photos[0].storage_path) : null;

                  return (
                    <div 
                      key={assignment.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        !assignment.is_active 
                          ? 'bg-slate-50/60 border-slate-200/60 opacity-60' 
                          : isCompletedToday 
                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-xs' 
                            : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Title, Elephant, Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                              {assignment.title}
                            </span>
                            
                            {/* Elephant Badge */}
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/60">
                              <span>{elephant ? ELEPHANT_EMOJI[elephant.id] || '🐘' : '🐘'}</span>
                              <span>{elephant?.name || 'Слон'}</span>
                            </span>

                            {/* Schedule Type */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {assignment.schedule_type === 'daily' ? 'Ежедневно' : assignment.schedule_type === 'as_needed' ? 'По потребности' : 'Курс'}
                            </span>

                            {/* Active/Inactive badge if inactive */}
                            {!assignment.is_active && (
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                                В архиве
                              </span>
                            )}
                          </div>

                          {/* Medicine & Requirements chips */}
                          <div className="flex items-center gap-1.5 flex-wrap text-xs mt-1.5">
                            {assignment.medicine && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                                <Pill size={11} className="text-teal-600" />
                                <span>{assignment.medicine}</span>
                              </span>
                            )}
                            {assignment.requires_photo && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
                                <Camera size={11} />
                                <span>Фото {assignment.requires_before_after ? 'ДО/ПОСЛЕ' : ''}</span>
                              </span>
                            )}
                            {assignment.assessment_type && assignment.assessment_type !== 'none' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                                <span>Оценка: {assignment.assessment_type}</span>
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {assignment.description && (
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                              {assignment.description}
                            </p>
                          )}

                          {/* Status and Keeper details */}
                          <div className="mt-3 flex items-center gap-3 flex-wrap">
                            {isCompletedToday ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200/80">
                                <CheckCircle2 size={15} className="text-emerald-600" />
                                <span>Выполнено: {keeperName} {completedTime && `в ${completedTime}`}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-200/80">
                                <Clock size={14} className="text-amber-600" />
                                <span>Ожидает исполнения</span>
                              </div>
                            )}

                            {/* Assessment outcome */}
                            {record?.assessment && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                record.assessment === 'В норме' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                Статус: {record.assessment}
                              </span>
                            )}

                            {record?.comment && (
                              <span className="text-xs text-slate-500 italic">
                                «{record.comment}»
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Photo thumbnail and Actions */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                          {/* Photo Thumbnail if completed */}
                          {isCompletedToday && hasPhotos && firstPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto({
                                url: firstPhotoUrl,
                                title: assignment.title,
                                elephantName: elephant?.name,
                                performedAt: completedTime,
                                keeperName,
                                assessment: record.assessment || undefined,
                                comment: record.comment || undefined,
                              })}
                              className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group cursor-pointer shadow-2xs hover:ring-2 hover:ring-teal-500 transition"
                              title="Нажмите для просмотра фото"
                            >
                              <img 
                                src={firstPhotoUrl} 
                                alt="Фото отчета" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                <Eye size={16} />
                              </div>
                            </button>
                          )}

                          {/* ACTION BUTTON: For Keeper and Vet */}
                          {/* If NOT completed -> Execute button */}
                          {!isCompletedToday && (
                            <button
                              type="button"
                              onClick={() => setSelectedTaskForExecution({
                                assignment,
                                elephant: elephant || elephants[0],
                                existingRecord: record,
                              })}
                              className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation"
                            >
                              <Camera size={15} />
                              <span>Выполнено кипером</span>
                            </button>
                          )}

                          {/* If completed -> Options to unmark / re-record */}
                          {isCompletedToday && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTaskForExecution({
                                  assignment,
                                  elephant: elephant || elephants[0],
                                  existingRecord: record,
                                })}
                                className="min-h-[38px] px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                              >
                                Изменить отчет
                              </button>
                              
                              {isVetOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleUnmarkTask(record.id, assignment.id)}
                                  className="w-9 h-9 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                  title="Снять отметку о выполнении"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Vet / Admin specific controls: Edit assignment & Toggle active */}
                          {isVetOrAdmin && (
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAssignment(assignment);
                                  setAssignmentModalOpen(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                title="Редактировать назначение"
                              >
                                <Edit3 size={15} />
                              </button>

                              <label className="relative inline-flex items-center cursor-pointer ml-1" title={assignment.is_active ? 'Сделать неактивным' : 'Сделать активным'}>
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={assignment.is_active}
                                  onChange={() => handleToggleActive(assignment)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. ЖУРНАЛ НАБЛЮДЕНИЙ & ФОТОАРХИВ СМЕНЫ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Заметки киперов */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-slate-600" />
                <h3 className="text-base font-black text-slate-900">Заметки и поведение</h3>
              </div>
              
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                {targetElephants.map(e => {
                  const m = metrics[e.id];
                  if (!m?.notes && !m?.behavior) return null;
                  return (
                    <div key={e.id} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-700">
                          {ELEPHANT_EMOJI[e.id] || '🐘'} {e.name}
                        </span>
                        {m?.behavior && (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {m.behavior}
                          </span>
                        )}
                      </div>
                      {m?.notes && (
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {m.notes}
                        </p>
                      )}
                    </div>
                  );
                })}

                {shift?.handover_notes && (
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1">
                      <ShieldCheck size={13} />
                      <span>Заметки при пересменке</span>
                    </div>
                    <p className="text-xs text-indigo-950 whitespace-pre-wrap leading-relaxed">
                      {shift.handover_notes}
                    </p>
                  </div>
                )}

                {targetElephants.every(e => !metrics[e.id]?.notes) && !shift?.handover_notes && (
                  <div className="text-center py-8 text-slate-400 font-semibold text-xs">
                    Заметок о поведении на эту дату не зафиксировано
                  </div>
                )}
              </div>
            </div>

            {/* Фотографии смены (включая ветпроцедуры) */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-slate-600" />
                  <h3 className="text-base font-black text-slate-900">Фотоархив дня</h3>
                </div>
              </div>

              {(() => {
                const shiftPhotos: { url: string; title: string; elephantName: string }[] = [];
                
                // 1. Shift record photos
                records.forEach(r => {
                  const e = elephants.find(el => el.id === r.elephant_id);
                  const assign = assignments.find(a => a.id === r.assignment_id);
                  if (r.photos) {
                    r.photos.forEach(p => {
                      shiftPhotos.push({
                        url: getPhotoUrl(p.storage_path),
                        title: assign?.title || 'Процедура',
                        elephantName: e?.name || 'Слон',
                      });
                    });
                  }
                });

                // 2. Elephant metrics photos
                targetElephants.forEach(e => {
                  const m = metrics[e.id];
                  if (m?.photos) {
                    m.photos.forEach(p => {
                      shiftPhotos.push({
                        url: p.dataUrl,
                        title: 'Наблюдение',
                        elephantName: e.name,
                      });
                    });
                  }
                });

                if (shiftPhotos.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 font-semibold text-xs bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                      Фотографий за эту смену пока нет
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                    {shiftPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxPhoto({
                          url: p.url,
                          title: p.title,
                          elephantName: p.elephantName,
                        })}
                        className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80 relative group cursor-pointer shadow-2xs"
                      >
                        <img 
                          src={p.url} 
                          alt={p.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={18} />
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      )}

      {/* MODAL: ASSIGNMENT CREATION / EDITING (Vet / Admin only) */}
      {assignmentModalOpen && (
        <AssignmentModal
          elephants={elephants}
          initialData={editingAssignment}
          onClose={() => {
            setAssignmentModalOpen(false);
            setEditingAssignment(null);
          }}
          onSaved={handleAssignmentSaved}
        />
      )}

      {/* MODAL: TASK EXECUTION & PHOTO REPORT (Keeper & Vet) */}
      {selectedTaskForExecution && (
        <ExecutionModal
          assignment={selectedTaskForExecution.assignment}
          elephant={selectedTaskForExecution.elephant}
          initialData={selectedTaskForExecution.existingRecord ? {
            assessment: selectedTaskForExecution.existingRecord.assessment,
            medicineUsed: selectedTaskForExecution.existingRecord.medicine_used,
            comment: selectedTaskForExecution.existingRecord.comment,
          } : undefined}
          onClose={() => setSelectedTaskForExecution(null)}
          onComplete={handleCompleteTask}
        />
      )}

      {/* LIGHTBOX: FULL IMAGE PREVIEW */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-150" 
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 rounded-[28px] overflow-hidden flex flex-col shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
              <div>
                <h4 className="font-bold text-sm tracking-tight">{lightboxPhoto.title}</h4>
                <p className="text-xs text-slate-400">
                  {lightboxPhoto.elephantName} {lightboxPhoto.keeperName && `• Исполнитель: ${lightboxPhoto.keeperName}`} {lightboxPhoto.performedAt && `в ${lightboxPhoto.performedAt}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-[300px] max-h-[65vh] flex items-center justify-center p-2 bg-black/40">
              <img 
                src={lightboxPhoto.url} 
                alt={lightboxPhoto.title} 
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
              />
            </div>

            {(lightboxPhoto.assessment || lightboxPhoto.comment) && (
              <div className="p-4 bg-slate-900/90 border-t border-white/10 text-white text-xs space-y-1">
                {lightboxPhoto.assessment && (
                  <div><span className="text-slate-400 font-semibold">Оценка состояния:</span> <span className="font-bold text-teal-400">{lightboxPhoto.assessment}</span></div>
                )}
                {lightboxPhoto.comment && (
                  <div><span className="text-slate-400 font-semibold">Комментарий:</span> <span>{lightboxPhoto.comment}</span></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
