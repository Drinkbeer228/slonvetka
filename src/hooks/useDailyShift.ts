import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { Assignment, Elephant, TreatmentRecordWithPhotos } from '../types';
import { DailyShift, ElephantDailyMetrics, createDefaultElephantMetrics, WashStatus, LimbCondition, FeedingSlot } from '../types/shift';
import { shiftService } from '../services/shiftService';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { saveShiftDraft, getShiftDraft } from '../services/shiftDraft';
import { getOfflineDb, TreatmentRecordQueueItem } from '../services/offlineDb';
import { useShiftEvents } from './useShiftEvents';

/**
 * useDailyShift — кастомный хук, вынесенный из DailyShiftPage.
 * Инкапсулирует всю логику работы со сменой: загрузка, сохранение,
 * обновление метрик, счётчики физиологии, кормления, мойка, ноги.
 */
export function useDailyShift() {
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

  // Shift state
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [loadingShift, setLoadingShift] = useState(true);
  const [pendingHandoverShift, setPendingHandoverShift] = useState<DailyShift | null>(null);
  const [todayRecords, setTodayRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<TreatmentRecordQueueItem[]>([]);

  // Shift Events
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
      try { navigator.vibrate(ms); } catch {}
    }
  }, []);

  // Fetch today records
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

  // Load shift data
  const loadShiftData = useCallback(async () => {
    setLoadingShift(true);
    try {
      const draft = getShiftDraft(selectedDate);
      if (draft) {
        setShift(draft.shift);
        setMetrics(draft.metrics);
      }

      const data = await shiftService.getShiftData(selectedDate);
      if (data && data.shift) {
        setShift(data.shift);
        setMetrics(data.metrics || {});
      }

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

  // Active elephant
  const activeElephant = useMemo<Elephant>(() => {
    if (elephants.length === 0) return { id: 'margo', name: 'Марго', created_at: '' };
    return elephants.find((e) => e.id === activeElephantId) || elephants[0];
  }, [elephants, activeElephantId]);

  // Active metric
  const activeMetric: ElephantDailyMetrics = useMemo(() => {
    if (!activeElephant?.id) return createDefaultElephantMetrics(shift?.id || 'new', 'margo');
    return (
      metrics[activeElephant.id] ||
      createDefaultElephantMetrics(shift?.id || 'new', activeElephant.id)
    );
  }, [metrics, activeElephant?.id, shift?.id]);

  // Persist
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

  // Helper: update metric field and persist
  const updateMetricField = useCallback(
    (updates: Partial<ElephantDailyMetrics>) => {
      const updatedMetric = { ...activeMetric, ...updates };
      const nextMetrics = { ...metrics, [activeElephant.id]: updatedMetric };
      setMetrics(nextMetrics);
      persistChanges(nextMetrics);
      return nextMetrics;
    },
    [activeMetric, metrics, activeElephant.id, persistChanges]
  );

  // ─── Physiology handlers ───

  const handleUpdateFeces = useCallback((delta: number) => {
    triggerHaptic(15);
    const newCount = Math.max(0, (activeMetric.poop_count ?? 0) + delta);
    updateMetricField({ poop_count: newCount });
    if (delta > 0) {
      logEvent(`Дефекация: ${activeElephant.name} (+1 куча, всего ${newCount})`, '💩');
    }
  }, [activeMetric.poop_count, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleUpdateUrine = useCallback((delta: number) => {
    triggerHaptic(15);
    const newCount = Math.max(0, (activeMetric.urination_count ?? 0) + delta);
    updateMetricField({ urination_count: newCount });
    if (delta > 0) {
      logEvent(`Мочеиспускание: ${activeElephant.name} (+1 лужа, всего ${newCount})`, '💧');
    }
  }, [activeMetric.urination_count, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleToggleFecesAnomaly = useCallback((trait: string) => {
    triggerHaptic(12);
    const current = activeMetric.feces_traits || [];
    const next = current.includes(trait)
      ? current.filter(t => t !== trait)
      : [...current.filter(t => t !== 'Сформирован (норма)'), trait];
    updateMetricField({ feces_traits: next.length > 0 ? next : ['Сформирован (норма)'] });
  }, [activeMetric.feces_traits, updateMetricField, triggerHaptic]);

  const handleToggleUrineAnomaly = useCallback((trait: string) => {
    triggerHaptic(12);
    const current = activeMetric.urination_traits || [];
    const next = current.includes(trait)
      ? current.filter(t => t !== trait)
      : [...current.filter(t => t !== 'Прозрачная (норма)'), trait];
    updateMetricField({ urination_traits: next.length > 0 ? next : ['Прозрачная (норма)'] });
  }, [activeMetric.urination_traits, updateMetricField, triggerHaptic]);

  const handleSetSleepState = useCallback((duration: '🟢 3-4ч (норма)' | '⏱️ 1-2ч' | '❌ Не легла') => {
    triggerHaptic(15);
    updateMetricField({
      sleep_state: {
        ...(activeMetric.sleep_state || { posture: null }),
        duration,
      },
    });
    logEvent(`Оценка сна: ${activeElephant.name} ➔ ${duration}`, '😴');
  }, [activeMetric.sleep_state, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleSetBehavior = useCallback((behavior: string) => {
    triggerHaptic(15);
    updateMetricField({ behavior });
    logEvent(`Поведение: ${activeElephant.name} ➔ ${behavior}`, '🙂');
  }, [activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  // ─── Body care handlers ───

  const handleSetWashStatus = useCallback((status: WashStatus) => {
    triggerHaptic(15);
    updateMetricField({ wash_status: status });
    const labels: Record<WashStatus, string> = {
      not_washed: 'Не мыта',
      rinsed: 'Ополоснута',
      full_wash: 'Вымыта со щёткой',
    };
    logEvent(`Мойка ${activeElephant.name}: ${labels[status]}`, '🚿');
  }, [activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleSetLimbCondition = useCallback((limb: keyof NonNullable<ElephantDailyMetrics['limb_status']>, condition: LimbCondition) => {
    triggerHaptic(15);
    const current = activeMetric.limb_status || { front_right: 'ok', front_left: 'ok', rear_right: 'ok', rear_left: 'ok' };
    const next = { ...current, [limb]: condition };
    const updates: Partial<ElephantDailyMetrics> = { limb_status: next };

    // Auto-note for vet if problem detected
    if (condition !== 'ok') {
      const limbLabels: Record<string, string> = {
        front_right: 'ПП', front_left: 'ЛП',
        rear_right: 'ПЗ', rear_left: 'ЛЗ',
      };
      const condLabels: Record<LimbCondition, string> = {
        ok: 'Норма', crack: 'Трещина', sole_issue: 'Подошва', lameness: 'Хромота',
      };
      const noteText = `⚠️ Ноги: ${limbLabels[limb]} — ${condLabels[condition]}`;
      const existing = activeMetric.notes || '';
      if (!existing.includes(noteText)) {
        updates.notes = existing ? `${existing}\n${noteText}` : noteText;
      }
      logEvent(`Ноги ${activeElephant.name}: ${limbLabels[limb]} → ${condLabels[condition]}`, '🦶');
    }

    updateMetricField(updates);
  }, [activeMetric.limb_status, activeMetric.notes, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  // ─── Feeding handlers ───

  const handleMarkFeedingServed = useCallback((slot: FeedingSlot) => {
    triggerHaptic(20);
    const current = activeMetric.feeding_records || [];
    const existing = current.find(r => r.slot === slot);
    let next: typeof current;
    if (existing) {
      next = current.map(r => r.slot === slot ? { ...r, served: !r.served, served_at: !r.served ? new Date().toISOString() : undefined } : r);
    } else {
      next = [...current, { slot, served: true, served_at: new Date().toISOString() }];
    }
    updateMetricField({ feeding_records: next });
    const slotLabels: Record<FeedingSlot, string> = {
      breakfast: 'Завтрак', lunch: 'Обед', snack: 'Полдник', dinner: 'Ужин',
    };
    logEvent(`Корм выдан: ${activeElephant.name} — ${slotLabels[slot]}`, '🥣');
  }, [activeMetric.feeding_records, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleToggleWaterCheck = useCallback(() => {
    triggerHaptic(12);
    const next = !activeMetric.water_checked;
    updateMetricField({ water_checked: next });
    if (next) logEvent(`Поилка: ${activeElephant.name} — вымыта и заполнена`, '💧');
  }, [activeMetric.water_checked, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  // ─── Fodder & warehouse inventory handlers ───

  const handleUpdateFodder = useCallback((
    field: 'hay_bales_distributed' | 'hay_bags_distributed',
    delta: number
  ) => {
    triggerHaptic(15);
    if (!shift) return;
    const newShift: DailyShift = {
      ...shift,
      [field]: Math.max(0, (shift[field] ?? 0) + delta),
    };
    setShift(newShift);
    persistChanges(metrics, newShift);

    // Sync with warehouse inventory:
    // delta > 0 = issued (deduct from warehouse), delta < 0 = returned (add to warehouse)
    if (delta !== 0) {
      const parentId = field === 'hay_bales_distributed' ? 'bales' : 'rolls';
      const targetItem = fodderInventory.find(
        (item) => item.parentId === parentId || (parentId === 'bales' && item.name.toLowerCase().includes('тюк'))
      );
      if (targetItem) {
        updateFodderAmount(targetItem.id, -delta);
      }
    }

    const title =
      field === 'hay_bales_distributed'
        ? `Раздача сена в тюках (${delta > 0 ? '+' : ''}${delta})`
        : `Раздача рулонов / мешков (${delta > 0 ? '+' : ''}${delta})`;
    logEvent(title, '🌾');
  }, [shift, metrics, fodderInventory, updateFodderAmount, persistChanges, triggerHaptic, logEvent]);

  // ─── Inspection & photo handlers ───

  const handleSaveFeetPhoto = useCallback((
    limb: 'front_right' | 'front_left' | 'rear_right' | 'rear_left',
    photoUrl: string
  ) => {
    triggerHaptic(20);
    const currentFeet = activeMetric.feet_photos || {};
    const nextFeet = {
      ...currentFeet,
      [limb]: { url: photoUrl, date: new Date().toISOString() },
    };
    updateMetricField({ feet_photos: nextFeet });
    const limbLabels: Record<string, string> = {
      front_right: 'ПП', front_left: 'ЛП', rear_right: 'ПЗ', rear_left: 'ЛЗ',
    };
    logEvent(`Недельное фото лапы: ${activeElephant.name} (${limbLabels[limb]})`, '📸');
  }, [activeMetric.feet_photos, activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  const handleUpdateTemporalGland = useCallback((data: {
    score: number;
    washed: boolean;
    ointment: boolean;
    photoUrl?: string;
  }) => {
    triggerHaptic(15);
    const updates: Partial<ElephantDailyMetrics> = {
      temporal_gland_score: data.score,
      temporal_gland_washed: data.washed,
      temporal_gland_ointment: data.ointment,
      temporal_glands: `TGS-${data.score}${data.washed ? ' / Промыто' : ''}${data.ointment ? ' / Мазь' : ''}`,
    };
    if (data.photoUrl) {
      updates.temporal_gland_photo_url = data.photoUrl;
    }
    updateMetricField(updates);
    logEvent(`Височные железы: ${activeElephant.name} (TGS-${data.score})`, '🩺');
  }, [activeElephant.name, updateMetricField, triggerHaptic, logEvent]);

  // ─── Assignment helpers ───

  const elephantAssignments = useMemo(() => {
    return assignments.filter((a) => a.elephant_id === activeElephant.id && a.is_active);
  }, [assignments, activeElephant.id]);

  const isAssignmentDone = useCallback(
    (assignmentId: string) => {
      const fromOnline = todayRecords.some((r) => r.assignment_id === assignmentId);
      const fromDraft = pendingDrafts.some((d) => d.payload?.assignment_id === assignmentId);
      return fromOnline || fromDraft;
    },
    [todayRecords, pendingDrafts]
  );

  const handleQuickExecute = useCallback(async (assignment: Assignment) => {
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
  }, [profile, activeElephant.id, activeElephant.name, triggerHaptic, logEvent, fetchTodayRecords]);

  // Formatted date
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

  return {
    // State
    profile,
    elephants,
    activeElephant,
    activeElephantId,
    activeMetric,
    metrics,
    shift,
    loadingShift,
    pendingHandoverShift,
    todayRecords,
    pendingDrafts,
    globalSaveStatus,
    events,
    formattedDate,
    assignments,
    elephantAssignments,
    fodderInventory,

    // Setters
    setShift,
    setMetrics,
    setActiveElephantId,
    setPendingHandoverShift,

    // Actions
    triggerHaptic,
    logEvent,
    loadShiftData,
    fetchTodayRecords,
    persistChanges,
    updateMetricField,
    refreshAssignments,
    removeEvent,

    // Physiology
    handleUpdateFeces,
    handleUpdateUrine,
    handleToggleFecesAnomaly,
    handleToggleUrineAnomaly,
    handleSetSleepState,
    handleSetBehavior,

    // Feeding & Fodder
    handleMarkFeedingServed,
    handleToggleWaterCheck,
    handleUpdateFodder,

    // Body care & Inspection
    handleSetWashStatus,
    handleSetLimbCondition,
    handleSaveFeetPhoto,
    handleUpdateTemporalGland,

    // Assignments
    isAssignmentDone,
    handleQuickExecute,
    updateFodderAmount,
  };
}
