import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { Assignment, Elephant, TreatmentRecordWithPhotos } from '../types';
import { DailyShift, ElephantDailyMetrics, createDefaultElephantMetrics } from '../types/shift';
import { shiftService } from '../services/shiftService';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { saveShiftDraft, getShiftDraft } from '../services/shiftDraft';
import { getOfflineDb, TreatmentRecordQueueItem } from '../services/offlineDb';
import { useShiftEvents } from '../hooks/useShiftEvents';
import { canCreateMedicalAssignment } from '../lib/permissions';

// Daily Shift Subcomponents
import { ElephantSelector } from '../components/daily-shift/ElephantSelector';
import { VeterinaryAssignmentCard } from '../components/daily-shift/VeterinaryAssignmentCard';
import { ShiftActivityFeed } from '../components/daily-shift/ShiftActivityFeed';
import { ShiftHandover } from '../components/daily-shift/ShiftHandover';
import { SubmitShiftButton } from '../components/daily-shift/SubmitShiftButton';
import { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';
import { ShiftHandoverModal } from '../components/daily-shift/ShiftHandoverModal';
import { ExecutionBottomSheet } from '../components/daily-shift/ExecutionBottomSheet';
import { FodderStorageSlide } from '../components/daily-shift/FodderStorageSlide';
import { AssignmentModal } from '../components/AssignmentModal';
import { ObservationModal } from '../components/ObservationModal';

// Screens for other tabs
import { FeedScreen } from './FeedScreen';
import { HandbookScreen } from './HandbookScreen';

// Lucide Icons
import {
  ShieldCheck,
  FileText,
  BookOpen,
  Package,
  Clock,
  Droplets,
  Archive,
  Plus,
  Minus,
  CheckCircle2,
  Camera,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  ChevronRight,
  Sprout,
  Users
} from 'lucide-react';

type TabKey = 'shift' | 'feed' | 'reference' | 'warehouse';

export function DailyShiftPage() {
  // Global Store
  const {
    profile,
    elephants,
    activeElephantId,
    setActiveElephantId,
    assignments,
    selectedDate,
    globalSaveStatus,
    setGlobalSaveStatus,
    refreshAssignments,
    fodderInventory,
    updateFodderAmount,
  } = useStore();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<TabKey>('shift');

  // Real Shift State & Metrics from Supabase / OfflineDb
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [loadingShift, setLoadingShift] = useState(true);

  // Pending handover banner state
  const [pendingHandoverShift, setPendingHandoverShift] = useState<DailyShift | null>(null);

  // Today treatment records for real assignment completion tracking
  const [todayRecords, setTodayRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<TreatmentRecordQueueItem[]>([]);

  // Modals & Bottom Sheets
  const [executionTask, setExecutionTask] = useState<{ assignment: Assignment; elephant: Elephant } | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Shift Events Hook for Activity Feed
  const { events, addEvent, removeEvent } = useShiftEvents(shift?.id || null);

  const logEvent = useCallback(
    (action_title: string, icon: string, undo_payload?: any) => {
      addEvent({
        keeper_id: profile?.id || 'anon',
        keeper_name: profile?.name || 'Кипер',
        action_title,
        icon,
        undo_payload,
      });
    },
    [addEvent, profile?.id, profile?.name]
  );

  // Haptic feedback
  const triggerHaptic = useCallback((ms: number = 12) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // 1. Fetch Today Treatment Records (real assignment completion status)
  const fetchTodayRecords = useCallback(async () => {
    try {
      const records = await supabaseService.getTodayRecords();
      setTodayRecords(records);
    } catch (err) {
      console.warn('Failed to load today records, offline fallback:', err);
    }
    try {
      const db = await getOfflineDb();
      const drafts = await db.getAll('records_queue');
      setPendingDrafts(drafts);
    } catch (dbErr) {
      console.warn('Failed to read IDB records_queue:', dbErr);
    }
  }, []);

  // 2. Load Shift & Metrics Data
  const loadShiftData = useCallback(async () => {
    setLoadingShift(true);
    try {
      // Check local draft first for instant resilience
      const draft = getShiftDraft(selectedDate);
      if (draft) {
        setShift(draft.shift);
        setMetrics(draft.metrics);
      }

      // Fetch official shift data from shiftService (Supabase with IDB fallback)
      const data = await shiftService.getShiftData(selectedDate);
      if (data && data.shift) {
        setShift(data.shift);
        setMetrics(data.metrics || {});
      }

      // Check if another keeper initiated handover to current user
      if (profile?.id) {
        const pending = await shiftService.checkPendingHandover(profile.id);
        setPendingHandoverShift(pending);
      }
    } catch (err) {
      console.warn('Notice loading shift data:', err);
    } finally {
      setLoadingShift(false);
    }
  }, [selectedDate, profile?.id]);

  useEffect(() => {
    loadShiftData();
    fetchTodayRecords();

    const handleSyncUpdate = () => {
      fetchTodayRecords();
      loadShiftData();
    };

    window.addEventListener('syncComplete', handleSyncUpdate);
    window.addEventListener('syncStatusChange', handleSyncUpdate);

    return () => {
      window.removeEventListener('syncComplete', handleSyncUpdate);
      window.removeEventListener('syncStatusChange', handleSyncUpdate);
    };
  }, [loadShiftData, fetchTodayRecords]);

  // Ensure an active elephant is selected
  const activeElephant = useMemo(() => {
    if (elephants.length === 0) return { id: 'margo', name: 'Марго', created_at: '' };
    return elephants.find((e) => e.id === activeElephantId) || elephants[0];
  }, [elephants, activeElephantId]);

  // Active Metric for current elephant
  const activeMetric: ElephantDailyMetrics = useMemo(() => {
    if (!activeElephant?.id) return createDefaultElephantMetrics(shift?.id || 'new', 'margo');
    return (
      metrics[activeElephant.id] ||
      createDefaultElephantMetrics(shift?.id || 'new', activeElephant.id)
    );
  }, [metrics, activeElephant?.id, shift?.id]);

  // Save metrics & shift helper
  const persistChanges = useCallback(
    async (
      updatedMetrics: Record<string, ElephantDailyMetrics>,
      updatedShift?: DailyShift
    ) => {
      const currentShift = updatedShift || shift;
      if (!currentShift) return;

      setGlobalSaveStatus('saving');
      try {
        await shiftService.saveShiftData(currentShift, updatedMetrics);
        saveShiftDraft(selectedDate, currentShift, updatedMetrics);
        setGlobalSaveStatus('saved');
        setTimeout(() => setGlobalSaveStatus('idle'), 1800);
      } catch (err) {
        console.warn('Notice saving shift changes:', err);
        setGlobalSaveStatus('error');
      }
    },
    [shift, selectedDate, setGlobalSaveStatus]
  );

  // Update Feces counter
  const handleUpdateFeces = (delta: number) => {
    triggerHaptic(15);
    const newCount = Math.max(0, (activeMetric.poop_count ?? 0) + delta);
    const updatedMetric = { ...activeMetric, poop_count: newCount };
    const nextMetrics = { ...metrics, [activeElephant.id]: updatedMetric };
    setMetrics(nextMetrics);
    persistChanges(nextMetrics);

    if (delta > 0) {
      logEvent(`Дефекация: ${activeElephant.name} (+1 куча, всего ${newCount})`, '💩', {
        type: 'feces',
        elephant_id: activeElephant.id,
        value: newCount,
      });
    }
  };

  // Update Urine counter
  const handleUpdateUrine = (delta: number) => {
    triggerHaptic(15);
    const newCount = Math.max(0, (activeMetric.urination_count ?? 0) + delta);
    const updatedMetric = { ...activeMetric, urination_count: newCount };
    const nextMetrics = { ...metrics, [activeElephant.id]: updatedMetric };
    setMetrics(nextMetrics);
    persistChanges(nextMetrics);

    if (delta > 0) {
      logEvent(`Мочеиспускание: ${activeElephant.name} (+1 лужа, всего ${newCount})`, '💧', {
        type: 'urine',
        elephant_id: activeElephant.id,
        value: newCount,
      });
    }
  };

  // Update Sleep state
  const handleSetSleepState = (duration: '🟢 3-4ч (норма)' | '⏱️ 1-2ч' | '❌ Не легла') => {
    triggerHaptic(15);
    const updatedMetric: ElephantDailyMetrics = {
      ...activeMetric,
      sleep_state: {
        ...(activeMetric.sleep_state || { posture: null }),
        duration,
      },
    };
    const nextMetrics = { ...metrics, [activeElephant.id]: updatedMetric };
    setMetrics(nextMetrics);
    persistChanges(nextMetrics);

    logEvent(`Оценка сна: ${activeElephant.name} ➔ ${duration}`, '😴');
  };

  // Update Mood / Behavior
  const handleSetBehavior = (behavior: string) => {
    triggerHaptic(15);
    const updatedMetric = { ...activeMetric, behavior };
    const nextMetrics = { ...metrics, [activeElephant.id]: updatedMetric };
    setMetrics(nextMetrics);
    persistChanges(nextMetrics);

    logEvent(`Поведение: ${activeElephant.name} ➔ ${behavior}`, '🙂');
  };

  // Update Fodder Distributed + deduct from global warehouse inventory
  const handleUpdateFodder = (
    field: 'hay_bales_distributed' | 'hay_bags_distributed',
    delta: number
  ) => {
    triggerHaptic(15);
    if (!shift) return;
    const newShift = {
      ...shift,
      [field]: Math.max(0, (shift[field] ?? 0) + delta),
    };
    setShift(newShift);
    persistChanges(metrics, newShift);

    // --- Задача 2: Sync with global warehouse store ---
    // Списываем тюки сена: parentId 'bales' → суммарно по всем позициям через первый подходящий item.
    // delta > 0 = расход (минус со склада), delta < 0 = возврат (плюс на склад).
    if (delta !== 0) {
      const parentId = field === 'hay_bales_distributed' ? 'bales' : 'rolls';
      // Списываем/возвращаем со ВСЕХ позиций этой группы поровну (первого хватает для тюков).
      // Используем updateFodderAmount на первом подходящем item с нужным parentId.
      const targetItem = fodderInventory.find((item) => item.parentId === parentId);
      if (targetItem) {
        // delta > 0 = выдали → уменьшаем остаток (-delta), delta < 0 = вернули → увеличиваем
        updateFodderAmount(targetItem.id, -delta);
      }
    }

    const title =
      field === 'hay_bales_distributed'
        ? `Раздача сена в тюках (${delta > 0 ? '+' : ''}${delta})`
        : `Раздача рулонов / мешков (${delta > 0 ? '+' : ''}${delta})`;
    logEvent(title, '🌾');
  };

  // Assignments for active elephant
  const elephantAssignments = useMemo(() => {
    return assignments.filter((a) => a.elephant_id === activeElephant.id && a.is_active);
  }, [assignments, activeElephant.id]);

  // Check if an assignment is completed today
  const isAssignmentDone = useCallback(
    (assignmentId: string) => {
      const fromOnline = todayRecords.some((r) => r.assignment_id === assignmentId);
      const fromDraft = pendingDrafts.some((d) => d.payload?.assignment_id === assignmentId);
      return fromOnline || fromDraft;
    },
    [todayRecords, pendingDrafts]
  );

  // Quick execute assignment (without photo requirement)
  const handleQuickExecute = async (assignment: Assignment) => {
    if (!profile) return;
    triggerHaptic(20);

    await SyncManager.saveRecordLocally(
      {
        assignment_id: assignment.id,
        elephant_id: activeElephant.id,
        keeper_id: profile.id,
        performed_at: new Date().toISOString(),
        assessment: 'В норме',
        medicine_used: assignment.medicine || null,
        comment: 'Штатно',
      },
      null
    );

    logEvent(`Выполнено задание: ${assignment.title} (${activeElephant.name})`, '✅');
    await fetchTodayRecords();
  };

  // Formatted date string
  const formattedDate = useMemo(() => {
    try {
      const d = selectedDate ? new Date(selectedDate) : new Date();
      return new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d);
    } catch {
      return new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date());
    }
  }, [selectedDate]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-y-auto overscroll-y-contain flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
        
        {/* TOP STATUS HEADER (PREMIUM DARK & ULTRA SLIM) */}
        <header className="sticky top-0 z-30 border-b border-zinc-850 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
                <span className="text-lg">🐘</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight text-white">
                    СлоноВет
                  </h1>
                  {/* Status Indicator */}
                  {globalSaveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Сохранение</span>
                    </span>
                  )}
                  {globalSaveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Сохранено</span>
                    </span>
                  )}
                  {globalSaveStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium" title="Офлайн сохранение активно">
                      <span>Офлайн</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-snug break-words">
                  {profile?.name || 'Дежурный кипер'} • {profile?.role === 'vet' ? 'Ветврач' : profile?.role === 'admin' ? 'Администратор' : 'Кипер'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-semibold text-zinc-300 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                {shift?.status === 'submitted' || shift?.status === 'completed' ? 'Смена сдана' : 'На смене'}
              </div>
            </div>
          </div>
        </header>

        {/* PENDING HANDOVER BANNER */}
        {pendingHandoverShift && profile?.id && (
          <div className="px-4 pt-3 sm:px-6">
            <HandoverAcceptBanner
              pendingShift={pendingHandoverShift}
              currentUserId={profile.id}
              onAccept={() => {
                setPendingHandoverShift(null);
                loadShiftData();
              }}
              onReject={() => {
                setPendingHandoverShift(null);
              }}
            />
          </div>
        )}

        {/* MAIN CONTAINER (pb-32 ensures no overlap with bottom tab bar) */}
        <main className="flex-1 px-4 pb-32 pt-4 sm:px-6">
          
          {/* ========================================================= */}
          {/* TAB 1: СМЕНА (ГЛАВНЫЙ СТРУКТУРИРОВАННЫЙ ЭКРАН)            */}
          {/* ========================================================= */}
          {activeTab === 'shift' && (
            <div className="space-y-4">
              
              {/* 1. СЕГОДНЯ / ТЕКУЩАЯ СМЕНА */}
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Текущее дежурство
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white capitalize break-words">
                      {formattedDate}
                    </h2>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed break-words">
                      Фиксируйте показатели физиологии слонов, выполняйте ветеринарные назначения и контролируйте расход кормов.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
                    <Clock size={20} className="text-zinc-300" strokeWidth={1.8} />
                  </div>
                </div>
              </section>

              {/* 2. ВЫБОР СЛОНА (iOS SEGMENTED CONTROL С СТАТУСАМИ) */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Выбор слонихи
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {elephants.length} в группе
                  </span>
                </div>
                <ElephantSelector
                  elephants={elephants}
                  activeElephantId={activeElephant.id}
                  onSelect={(id) => {
                    setActiveElephantId(id);
                    triggerHaptic(12);
                  }}
                  metrics={metrics}
                />
              </section>

              {/* 3. ФИЗИОЛОГИЯ (ГЛАВНЫЙ СИЛЬНЫЙ БЛОК) */}
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/20 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Мониторинг • {activeElephant.name}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white tracking-tight">
                      Физиология и состояние
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 text-cyan-400">
                    <Droplets size={19} strokeWidth={1.8} />
                  </div>
                </div>

                {/* COUNTERS: ДЕФЕКАЦИЯ & МОЧЕИСПУСКАНИЕ */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  
                  {/* 💩 ДЕФЕКАЦИЯ */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">💩 Кал (дефекация)</p>
                        <p className="text-xs text-zinc-500 mt-0.5 break-words">
                          {(activeMetric.feces_traits?.[0] || 'Норма').replace(' ⚠️', '')}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-base shrink-0">
                        💩
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateFeces(-1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-850 active:scale-95 cursor-pointer touch-manipulation"
                        aria-label="Уменьшить кал"
                      >
                        <Minus size={20} strokeWidth={2.5} />
                      </button>

                      <div className="text-center min-w-[60px]">
                        <span className="text-3xl font-bold font-mono text-white leading-none">
                          {activeMetric.poop_count ?? 0}
                        </span>
                        <div className="text-[11px] text-zinc-500 mt-0.5">куч</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateFeces(1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 transition hover:bg-white active:scale-95 cursor-pointer touch-manipulation shadow-md"
                        aria-label="Увеличить кал"
                      >
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* 💧 МОЧЕИСПУСКАНИЕ */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">💧 Мочеиспускание</p>
                        <p className="text-xs text-zinc-500 mt-0.5 break-words">
                          {(activeMetric.urination_traits?.[0] || 'Норма').replace(' ⚠️', '')}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-cyan-400 shrink-0">
                        <Droplets size={16} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateUrine(-1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-850 active:scale-95 cursor-pointer touch-manipulation"
                        aria-label="Уменьшить мочу"
                      >
                        <Minus size={20} strokeWidth={2.5} />
                      </button>

                      <div className="text-center min-w-[60px]">
                        <span className="text-3xl font-bold font-mono text-white leading-none">
                          {activeMetric.urination_count ?? 0}
                        </span>
                        <div className="text-[11px] text-zinc-500 mt-0.5">луж</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateUrine(1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 transition hover:bg-white active:scale-95 cursor-pointer touch-manipulation shadow-md"
                        aria-label="Увеличить мочу"
                      >
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                </div>

                {/* 😴 СОН (РЕАЛЬНАЯ МОДЕЛЬ ИЗ shift.ts С iOS SELECTOR) */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">😴 Оценка сна</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Текущий статус: {activeMetric.sleep_state?.duration || 'Не указан'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: '🟢 3-4ч (норма)', label: 'Норма', color: 'emerald' },
                      { key: '⏱️ 1-2ч', label: 'Беспокойно', color: 'amber' },
                      { key: '❌ Не легла', label: 'Не спала', color: 'rose' },
                    ].map((opt) => {
                      const isSelected = activeMetric.sleep_state?.duration === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSetSleepState(opt.key as any)}
                          className={`min-h-[48px] px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer touch-manipulation active:scale-[0.98] ${
                            isSelected
                              ? opt.color === 'emerald'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                                : opt.color === 'amber'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                                : 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🙂 ПОВЕДЕНИЕ И НАСТРОЕНИЕ */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-200">🙂 Поведение и контактность</p>
                    <span className="text-xs text-emerald-400 font-semibold">{activeMetric.behavior || 'Спокойное'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Спокойное', 'Активное', 'Игривое', 'Настороженное', 'Угнетённое'].map((mood) => {
                      const isSelected = activeMetric.behavior === mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => handleSetBehavior(mood)}
                          className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold border transition cursor-pointer touch-manipulation active:scale-[0.98] ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {mood}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </section>

              {/* 4. ЗАДАНИЯ (РЕАЛЬНЫЕ ASSIGNMENTS С ПРОВЕРКОЙ ВЫПОЛНЕНИЯ) */}
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/20 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      План ветслужбы
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <h2 className="text-xl font-semibold text-white tracking-tight">
                        Задания для {activeElephant.name}
                      </h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-xs font-mono font-medium text-zinc-400">
                        {elephantAssignments.filter((a) => isAssignmentDone(a.id)).length}/{elephantAssignments.length}
                      </span>
                    </div>
                  </div>

                  {canCreateMedicalAssignment(profile) && (
                    <button
                      type="button"
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="min-h-[44px] px-3.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer touch-manipulation shadow-md shadow-black/30"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Назначить</span>
                    </button>
                  )}
                </div>

                {elephantAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-400 text-sm">
                    На сегодня для {activeElephant.name} нет активных ветеринарных заданий.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {elephantAssignments.map((assignment) => {
                      const completed = isAssignmentDone(assignment.id);
                      return (
                        <VeterinaryAssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          isCompletedToday={completed}
                          isLocked={shift?.status === 'completed' || shift?.status === 'submitted'}
                          onExecute={() => {
                            setExecutionTask({ assignment, elephant: activeElephant });
                          }}
                          onQuickExecute={() => handleQuickExecute(assignment)}
                          onUnmark={async () => {
                            const rec = todayRecords.find((r) => r.assignment_id === assignment.id);
                            if (rec) {
                              await supabaseService.deleteTreatmentRecord(rec.id);
                              fetchTodayRecords();
                            }
                          }}
                          onEdit={() => {
                            setExecutionTask({ assignment, elephant: activeElephant });
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 5. ФУРАЖ / РАСХОД ЗА СМЕНУ */}
              <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/20 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Складской учёт смены
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white tracking-tight">
                      Расход грубых кормов
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-400">
                    <Archive size={19} strokeWidth={1.8} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* ТЮКИ СЕНА */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">🌾 Сено (тюки)</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Выдано за смену</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateFodder('hay_bales_distributed', -1)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-850 active:scale-95 cursor-pointer touch-manipulation"
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>

                      <div className="w-12 text-center">
                        <span className="text-2xl font-bold font-mono text-emerald-400">
                          {shift?.hay_bales_distributed ?? 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateFodder('hay_bales_distributed', 1)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 transition hover:bg-white active:scale-95 cursor-pointer touch-manipulation shadow-md"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* РУЛОНЫ / МЕШКИ */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">🌿 Рулоны / Мешки</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Выдано за смену</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateFodder('hay_bags_distributed', -1)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-850 active:scale-95 cursor-pointer touch-manipulation"
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>

                      <div className="w-12 text-center">
                        <span className="text-2xl font-bold font-mono text-emerald-400">
                          {shift?.hay_bags_distributed ?? 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateFodder('hay_bags_distributed', 1)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 transition hover:bg-white active:scale-95 cursor-pointer touch-manipulation shadow-md"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('warehouse')}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-between transition cursor-pointer touch-manipulation"
                >
                  <span className="flex items-center gap-2">
                    <Package size={15} className="text-emerald-400" />
                    <span>Посмотреть общие складские остатки ({fodderInventory.length} поз.)</span>
                  </span>
                  <ChevronRight size={16} className="text-zinc-500" />
                </button>
              </section>

              {/* 6. ЛЕНТА СОБЫТИЙ СМЕНЫ & ФОТООТЧЕТЫ */}
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Оперативный журнал
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsObservationModalOpen(true)}
                    className="min-h-[44px] px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <Camera size={14} />
                    <span>Добавить наблюдение</span>
                  </button>
                </div>

                <ShiftActivityFeed
                  events={events}
                  currentUserId={profile?.id}
                  onUndo={(event) => removeEvent(event.id)}
                />
              </section>

              {/* 7. ПЕРЕДАЧА СМЕНЫ (ФИНАЛЬНЫЙ БЛОК) */}
              <section className="space-y-3">
                <ShiftHandover
                  handoverNotes={shift?.handover_notes || ''}
                  isLocked={shift?.status === 'completed' || shift?.status === 'submitted'}
                  isSaving={globalSaveStatus === 'saving'}
                  onChange={(val) => {
                    if (!shift) return;
                    const nextShift = { ...shift, handover_notes: val };
                    setShift(nextShift);
                    persistChanges(metrics, nextShift);
                  }}
                  onSubmit={() => setIsHandoverModalOpen(true)}
                />

                <SubmitShiftButton
                  isIdeal={true}
                  disabled={shift?.status === 'completed' || shift?.status === 'submitted'}
                  onClick={() => setIsHandoverModalOpen(true)}
                />
              </section>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ЛЕНТА (ОПЕРАТИВНЫЙ ЧАТ / ЖУРНАЛ СЛОНОВНИКА)         */}
          {/* ========================================================= */}
          {activeTab === 'feed' && (
            <div className="space-y-4 pb-4">
              <FeedScreen
                onAddEventExternal={(text) => {
                  logEvent(text, '💬');
                }}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: СПРАВОЧНИК (РЕГЛАМЕНТЫ, РАЦИОНЫ, ТБ)               */}
          {/* ========================================================= */}
          {activeTab === 'reference' && (
            <div className="space-y-4 pb-4">
              <HandbookScreen />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: СКЛАД (ИНВЕНТАРИЗАЦИЯ И ОСТАТКИ ФУРАЖА)            */}
          {/* ========================================================= */}
          {activeTab === 'warehouse' && (
            <div className="space-y-4">
              <FodderStorageSlide />
            </div>
          )}

        </main>

        {/* ========================================================= */}
        {/* FIXED BOTTOM NAVIGATION BAR (APPLE HEALTH STYLE 4 TABS)   */}
        {/* ========================================================= */}
        <nav className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-2xl px-3 pb-3">
            <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/85 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="grid grid-cols-4 gap-1">
                {[
                  {
                    key: 'shift' as TabKey,
                    label: 'Смена',
                    icon: <ShieldCheck size={20} strokeWidth={2} />,
                  },
                  {
                    key: 'feed' as TabKey,
                    label: 'Лента',
                    icon: <FileText size={20} strokeWidth={2} />,
                  },
                  {
                    key: 'reference' as TabKey,
                    label: 'Справочник',
                    icon: <BookOpen size={20} strokeWidth={2} />,
                  },
                  {
                    key: 'warehouse' as TabKey,
                    label: 'Склад',
                    icon: <Package size={20} strokeWidth={2} />,
                  },
                ].map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setActiveTab(tab.key);
                      }}
                      className={[
                        'flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2 transition cursor-pointer touch-manipulation',
                        active
                          ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                          : 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 font-medium',
                      ].join(' ')}
                    >
                      {tab.icon}
                      <span className="text-[11px] leading-tight break-words">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* EXECUTION BOTTOM SHEET (REAL PHOTO CAPTURE & RECORD COMPLETION) */}
        {executionTask && (
          <ExecutionBottomSheet
            assignment={executionTask.assignment}
            elephant={executionTask.elephant}
            onClose={() => setExecutionTask(null)}
            onComplete={async (data) => {
              if (!profile) return;
              await SyncManager.saveRecordLocally(
                {
                  assignment_id: executionTask.assignment.id,
                  elephant_id: executionTask.elephant.id,
                  keeper_id: profile.id,
                  performed_at: new Date().toISOString(),
                  assessment: data.assessment,
                  medicine_used: data.medicineUsed,
                  comment: data.comment,
                },
                data.photoBlob
              );

              logEvent(
                `Выполнено задание с фото: ${executionTask.assignment.title} (${executionTask.elephant.name})`,
                '📸'
              );

              setExecutionTask(null);
              await fetchTodayRecords();
            }}
          />
        )}

        {/* ASSIGNMENT MODAL (CREATE TASK FOR VET / ADMIN) */}
        {isAssignmentModalOpen && (
          <AssignmentModal
            elephants={elephants}
            initialData={
              {
                elephant_id: activeElephant.id,
              } as Assignment
            }
            onClose={() => setIsAssignmentModalOpen(false)}
            onSaved={async () => {
              setIsAssignmentModalOpen(false);
              await refreshAssignments();
            }}
          />
        )}

        {/* OBSERVATION MODAL (ADD QUICK PHOTO & OBSERVATION NOTE) */}
        {isObservationModalOpen && (
          <ObservationModal
            elephants={elephants}
            onClose={() => setIsObservationModalOpen(false)}
            onComplete={async ({ elephantId, comment, photoBlob }) => {
              if (!profile) return;
              // --- Задача 3: фото опционально, fallback через offlineDb ---
              let storagePath: string | null = null;
              if (photoBlob) {
                try {
                  storagePath = await supabaseService.uploadShiftMedia(
                    photoBlob,
                    selectedDate,
                    'general_observation'
                  );
                } catch (uploadErr) {
                  console.warn('Photo upload failed, saving observation without photo:', uploadErr);
                  // Сохраняем наблюдение локально как текстовую запись без фото
                  try {
                    await SyncManager.saveRecordLocally(
                      {
                        assignment_id: null as any,
                        elephant_id: elephantId,
                        keeper_id: profile.id,
                        performed_at: new Date().toISOString(),
                        assessment: 'Наблюдение',
                        medicine_used: null,
                        comment: `[НАБЛЮДЕНИЕ ОФЛАЙН] ${comment}`,
                      },
                      null
                    );
                  } catch {}
                }
              }

              // Обновляем метрики: текстовая заметка + фото (если загрузилось)
              try {
                const curr =
                  metrics[elephantId] ||
                  createDefaultElephantMetrics(shift?.id || 'new', elephantId);
                const updatedPhotos = storagePath
                  ? [
                      ...(curr.photos || []),
                      {
                        id: `p-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        section: 'general' as const,
                        storage_path: storagePath,
                      },
                    ]
                  : curr.photos || [];
                const updated = {
                  ...curr,
                  notes: curr.notes ? `${curr.notes}\n${comment}` : comment,
                  photos: updatedPhotos,
                };
                const nextMetrics = { ...metrics, [elephantId]: updated };
                setMetrics(nextMetrics);
                persistChanges(nextMetrics);
              } catch (err) {
                console.error('Failed to update observation metrics:', err);
              }

              const elName = elephants.find((e) => e.id === elephantId)?.name || 'Слон';
              logEvent(
                `Добавлено наблюдение: ${elName} (${comment})${storagePath ? ' 📷' : ''}`,
                '📷'
              );
              setIsObservationModalOpen(false);
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
              loadShiftData();
            }}
          />
        )}

      </div>
    </div>
  );
}

export default DailyShiftPage;
