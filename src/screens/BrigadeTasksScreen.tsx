import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Check, Plus, X, Camera, UserCheck, AlertTriangle, Clock, RefreshCw,
  Flame, User, CheckCircle2, ChevronRight, Sparkles, RotateCcw
} from 'lucide-react';
import { useStore } from '../store';
import { useRole } from '../context/RoleContext';
import { Assignment, Elephant, TreatmentRecordWithPhotos } from '../types';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { ExecutionBottomSheet } from '../components/daily-shift/ExecutionBottomSheet';

type BrigadeFilter = 'free' | 'mine' | 'urgent' | 'all';

/** Готовые шаблоны цирковых задач в 1 тап для Шефа */
const CIRCUS_PRESETS = [
  { title: 'Разгрузка сена (партия в ангар)', elephant_id: 'margo', priority: 'urgent' as const, note: 'Склад фуража', icon: '🌾' },
  { title: 'Смена опила в денниках', elephant_id: 'audrey', priority: 'normal' as const, note: 'Слоновник', icon: '🪵' },
  { title: 'Уборка манежа после репетиции', elephant_id: 'pretty', priority: 'normal' as const, note: 'Манеж', icon: '🎪' },
  { title: 'Заготовка / нарезка свежих веток ивы', elephant_id: 'margo', priority: 'normal' as const, note: 'Фуражный цех', icon: '🌿' },
  { title: 'Генеральная промывка и дезинфекция поилок', elephant_id: 'margo', priority: 'normal' as const, note: 'Все денники', icon: '💧' },
  { title: 'Контроль температуры и запарки каши к 07:00', elephant_id: 'margo', priority: 'urgent' as const, note: 'Кормокухня', icon: '🥣' },
];

/**
 * BrigadeTasksScreen — экран «ЗАДАЧИ / ЦЕХ»
 * Построен на реальных `assignments` из Supabase + оффлайн IndexedDB (`SyncManager`).
 * Никаких моковых массивов и дублирования имён.
 */
export function BrigadeTasksScreen() {
  const {
    assignments,
    profiles,
    elephants,
    profile,
    claimAssignment,
    unclaimAssignment,
    createBrigadeAssignment,
    refreshAssignments,
  } = useStore();

  const { canManageTasks, roleConfig } = useRole();

  // Filters & Modals
  const [activeFilter, setActiveFilter] = useState<BrigadeFilter>('free');
  const [modalOpen, setModalOpen] = useState(false);
  const [executionTask, setExecutionTask] = useState<{ assignment: Assignment; elephant: Elephant } | null>(null);

  // Today completed records
  const [todayRecords, setTodayRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newElephantId, setNewElephantId] = useState('margo');
  const [newPriority, setNewPriority] = useState<'urgent' | 'normal'>('normal');
  const [newRequiresPhoto, setNewRequiresPhoto] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerHaptic = (pattern: number | number[] = 15) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // Load completed records for today
  const loadTodayRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const records = await supabaseService.getTodayRecords();
      setTodayRecords(records);
    } catch (e) {
      console.warn('Notice loading today records in BrigadeTasksScreen:', e);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadTodayRecords();

    const handleSync = () => {
      loadTodayRecords();
      refreshAssignments();
    };

    window.addEventListener('syncComplete', handleSync);
    window.addEventListener('syncStatusChange', handleSync);
    return () => {
      window.removeEventListener('syncComplete', handleSync);
      window.removeEventListener('syncStatusChange', handleSync);
    };
  }, [loadTodayRecords, refreshAssignments]);

  // Helper: Is assignment completed today?
  const isAssignmentDone = useCallback((assignmentId: string): boolean => {
    return todayRecords.some(r => r.assignment_id === assignmentId);
  }, [todayRecords]);

  // Helper: Get keeper name by profile ID
  const getKeeperName = useCallback((keeperId?: string | null): string => {
    if (!keeperId) return '';
    if (keeperId === profile?.id) return 'Вы';
    const found = profiles.find(p => p.id === keeperId);
    return found?.name || 'Кипер';
  }, [profile?.id, profiles]);

  // Helper: Calculate stale duration string (e.g. "2 ч 15 мин")
  const getStaleDuration = useCallback((createdAt: string): string => {
    const diffMins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins} мин`;
    return `${hours} ч ${mins} мин`;
  }, []);

  // Format time HH:MM
  const formatTime = useCallback((isoString?: string | null): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }, []);

  // ─── Actions ───

  const handleClaim = async (assignmentId: string) => {
    if (!profile) return;
    triggerHaptic(20);
    await claimAssignment(assignmentId, profile.id);
  };

  const handleUnclaim = async (assignmentId: string) => {
    triggerHaptic(15);
    await unclaimAssignment(assignmentId);
  };

  const handleQuickComplete = async (assignment: Assignment) => {
    if (!profile) return;
    triggerHaptic([25, 35]);

    await SyncManager.saveRecordLocally(
      {
        assignment_id: assignment.id,
        elephant_id: assignment.elephant_id,
        keeper_id: profile.id,
        performed_at: new Date().toISOString(),
        assessment: 'Выполнено',
        medicine_used: assignment.medicine || null,
        comment: 'Штатно (Бригадная лента)',
      },
      null
    );

    await loadTodayRecords();
  };

  const handleOpenPhotoComplete = (assignment: Assignment) => {
    triggerHaptic(15);
    const elephant = elephants.find(e => e.id === assignment.elephant_id) || {
      id: assignment.elephant_id,
      name: 'Слон',
      created_at: '',
    };
    setExecutionTask({ assignment, elephant });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    triggerHaptic([30, 40]);

    try {
      await createBrigadeAssignment({
        title: newTitle.trim(),
        description: newNote.trim() || undefined,
        elephant_id: newElephantId,
        priority: newPriority,
        requires_photo: newRequiresPhoto,
      });

      setNewTitle('');
      setNewNote('');
      setNewPriority('normal');
      setNewRequiresPhoto(false);
      setModalOpen(false);
    } catch (err) {
      console.error('Error creating brigade task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof CIRCUS_PRESETS[number]) => {
    triggerHaptic(15);
    setNewTitle(preset.title);
    setNewElephantId(preset.elephant_id);
    setNewPriority(preset.priority);
    setNewNote(preset.note);
  };

  // ─── Filtered Assignments ───

  const activeAssignments = useMemo(() => {
    return assignments.filter(a => a.is_active);
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return activeAssignments.filter(a => {
      const done = isAssignmentDone(a.id);
      switch (activeFilter) {
        case 'free':
          return !done && !a.claimed_by;
        case 'mine':
          return a.claimed_by === profile?.id;
        case 'urgent':
          return !done && (a.priority === 'urgent' || a.schedule_type === 'as_needed');
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => {
      // Sort stale unassigned tasks to the very top
      const doneA = isAssignmentDone(a.id);
      const doneB = isAssignmentDone(b.id);
      if (doneA !== doneB) return doneA ? 1 : -1;

      const isStaleA = !a.claimed_by && (Date.now() - new Date(a.created_at).getTime() > 90 * 60 * 1000);
      const isStaleB = !b.claimed_by && (Date.now() - new Date(b.created_at).getTime() > 90 * 60 * 1000);
      if (isStaleA !== isStaleB) return isStaleA ? -1 : 1;

      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeAssignments, isAssignmentDone, activeFilter, profile?.id]);

  // Counts for tabs
  const freeCount = useMemo(() => activeAssignments.filter(a => !isAssignmentDone(a.id) && !a.claimed_by).length, [activeAssignments, isAssignmentDone]);
  const mineCount = useMemo(() => activeAssignments.filter(a => a.claimed_by === profile?.id).length, [activeAssignments, profile?.id]);
  const urgentCount = useMemo(() => activeAssignments.filter(a => !isAssignmentDone(a.id) && a.priority === 'urgent').length, [activeAssignments, isAssignmentDone]);
  const totalCompletedCount = useMemo(() => activeAssignments.filter(a => isAssignmentDone(a.id)).length, [activeAssignments, isAssignmentDone]);

  return (
    <div className="flex flex-col gap-3 w-full pb-4">

      {/* ═══ SHIFT HEADER & SUMMARY ═══ */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Бригадная лента • Цех
            </p>
            <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
              Поручения на смену
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="text-emerald-400 font-bold">{totalCompletedCount}</span> из{' '}
              <span className="font-bold">{activeAssignments.length}</span> выполнено сегодня
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                loadTodayRecords();
                refreshAssignments();
              }}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer touch-manipulation"
              title="Обновить задачи"
            >
              <RefreshCw size={16} className={loadingRecords ? 'animate-spin' : ''} />
            </button>

            {canManageTasks && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setModalOpen(true);
                }}
                className="min-h-[48px] px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer touch-manipulation"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Поручение</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{
              width: `${activeAssignments.length > 0 ? Math.round((totalCompletedCount / activeAssignments.length) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ═══ FILTER TABS ═══ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        {([
          { id: 'free' as BrigadeFilter, label: '🔥 Свободные', count: freeCount },
          { id: 'mine' as BrigadeFilter, label: '👤 Мои', count: mineCount },
          { id: 'urgent' as BrigadeFilter, label: '🚨 Срочные', count: urgentCount },
          { id: 'all' as BrigadeFilter, label: '📋 Все', count: activeAssignments.length },
        ]).map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id);
                triggerHaptic(8);
              }}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] font-mono px-1.5 rounded-full ${
                isActive ? 'bg-zinc-950 text-emerald-400 font-black' : 'bg-zinc-950/60 text-zinc-500'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══ ASSIGNMENT CARDS LIST ═══ */}
      <div className="flex flex-col gap-3">
        {filteredAssignments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 text-sm font-bold space-y-1">
            <p className="text-2xl">🎉</p>
            <p>
              {activeFilter === 'free'
                ? 'Свободных задач нет — всё разобрано!'
                : activeFilter === 'mine'
                ? 'У вас пока нет взятых задач'
                : activeFilter === 'urgent'
                ? 'Срочных задач нет'
                : 'Список поручений пуст'}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment, idx) => {
            const isDone = isAssignmentDone(assignment.id);
            const isClaimedByMe = assignment.claimed_by === profile?.id;
            const isClaimedByOther = Boolean(assignment.claimed_by && !isClaimedByMe);
            const isStale = !assignment.claimed_by && !isDone && (Date.now() - new Date(assignment.created_at).getTime() > 90 * 60 * 1000);
            const elephantObj = elephants.find(e => e.id === assignment.elephant_id);
            const claimedKeeperName = getKeeperName(assignment.claimed_by);

            return (
              <div
                key={`${assignment.id || 'task'}-${idx}`}
                className={`rounded-3xl border p-4 transition-all shadow-md flex flex-col gap-3 ${
                  isDone
                    ? 'bg-zinc-950/60 border-zinc-800/60 opacity-70'
                    : isStale
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-amber-500/10'
                    : isClaimedByMe
                    ? 'bg-zinc-900 border-sky-500/50 shadow-sky-500/10'
                    : assignment.priority === 'urgent'
                    ? 'bg-zinc-900 border-rose-500/40 shadow-rose-500/10'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* 1. TOP STATUS BAR (ВИСЯК ИЛИ ИНФОРМАЦИЯ) */}
                {isStale && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>ВИСИТ {getStaleDuration(assignment.created_at)}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Нет ответственного
                    </span>
                  </div>
                )}

                {isClaimedByMe && !isDone && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <UserCheck size={14} className="shrink-0" />
                      <span>В РАБОТЕ У ВАС</span>
                    </span>
                    {assignment.claimed_at && (
                      <span className="text-[10px] font-mono text-sky-400">
                        Забрано в {formatTime(assignment.claimed_at)}
                      </span>
                    )}
                  </div>
                )}

                {isClaimedByOther && !isDone && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-zinc-500 shrink-0" />
                      <span>В работе у: <strong className="text-zinc-200">{claimedKeeperName}</strong></span>
                    </span>
                    {assignment.claimed_at && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {formatTime(assignment.claimed_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. TITLE & DETAILS */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h3 className={`text-base font-bold leading-snug break-words ${
                      isDone ? 'text-zinc-500 line-through' : 'text-zinc-100'
                    }`}>
                      {assignment.title}
                    </h3>

                    {assignment.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed break-words">
                        {assignment.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Priority */}
                      {assignment.priority === 'urgent' && !isDone && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black">
                          <AlertTriangle size={10} />
                          Срочно
                        </span>
                      )}

                      {/* Elephant / Object */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold">
                        🐘 {elephantObj?.name || 'Слон'}
                      </span>

                      {/* Photo required badge */}
                      {assignment.requires_photo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                          <Camera size={10} />
                          Фото-пруф
                        </span>
                      )}

                      {/* Completed badge */}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black font-mono">
                          <CheckCircle2 size={10} />
                          Выполнено ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DYNAMIC ACTIONS ROW */}

                {/* STATE A: СВОБОДНАЯ ЗАДАЧА ➔ КНОПКА «ЗАБИРАЮ В РАБОТУ» */}
                {!assignment.claimed_by && !isDone && (
                  <button
                    type="button"
                    onClick={() => handleClaim(assignment.id)}
                    className="w-full min-h-[50px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer touch-manipulation"
                  >
                    <span>✋</span>
                    <span>ЗАБИРАЮ В РАБОТУ</span>
                  </button>
                )}

                {/* STATE B: В РАБОТЕ У МЕНЯ ➔ [ ЗАВЕРШИТЬ ] + [ ГОТОВО + ФОТО ] + ВЕРНУТЬ */}
                {isClaimedByMe && !isDone && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(assignment)}
                        className="min-h-[50px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer touch-manipulation"
                      >
                        <Check size={18} strokeWidth={3} />
                        <span>ЗАВЕРШИТЬ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPhotoComplete(assignment)}
                        className="min-h-[50px] rounded-2xl bg-zinc-950 border border-zinc-700 hover:border-zinc-500 active:scale-[0.97] text-zinc-200 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer touch-manipulation"
                      >
                        <Camera size={16} />
                        <span>ГОТОВО + ФОТО</span>
                      </button>
                    </div>

                    {/* Unclaim text button */}
                    <button
                      type="button"
                      onClick={() => handleUnclaim(assignment.id)}
                      className="self-center min-h-[38px] px-3 text-zinc-500 hover:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer touch-manipulation"
                    >
                      <RotateCcw size={13} />
                      <span>Вернуть в цех</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ═══ CREATE ASSIGNMENT MODAL (ДЛЯ ШЕФА В 1 ТАП) ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <div>
                  <h2 className="text-sm font-black text-white">Новое бригадное поручение</h2>
                  <p className="text-[11px] text-zinc-400">Шеф • Вброс задачи в цех</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* ═══ ЧИПСЫ-ШАБЛОНЫ ШЕФА В 1 ТАП ═══ */}
            <div className="py-3 border-b border-zinc-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Быстрые шаблоны в 1 тап:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CIRCUS_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/60 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <span>{p.icon}</span>
                    <span className="break-words">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTask} className="flex flex-col gap-3 py-3">

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Текст поручения <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Разгрузить сено 150 тюков..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Приоритет</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'normal' as const, label: '🔵 Планово' },
                    { id: 'urgent' as const, label: '🔴 Срочно' },
                  ]).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPriority(p.id)}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-bold border transition cursor-pointer touch-manipulation ${
                        newPriority === p.id
                          ? p.id === 'urgent'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black'
                            : 'bg-blue-500/20 border-blue-500 text-blue-300 font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elephant */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Объект / Слониха</label>
                <select
                  value={newElephantId}
                  onChange={(e) => setNewElephantId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {elephants.map(e => (
                    <option key={e.id} value={e.id}>🐘 {e.name}</option>
                  ))}
                </select>
              </div>

              {/* Requires Photo checkbox */}
              <button
                type="button"
                onClick={() => setNewRequiresPhoto(!newRequiresPhoto)}
                className={`w-full min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation ${
                  newRequiresPhoto
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <Camera size={16} />
                <span>{newRequiresPhoto ? 'Обязательное фото при сдаче ✓' : 'Фотофиксация не требуется'}</span>
              </button>

              {/* Note */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Инструкция (опционально)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Детали, сектор..."
                  className="w-full min-h-[44px] px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 min-h-[52px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer touch-manipulation disabled:opacity-50"
              >
                {isSubmitting ? 'Отправка...' : 'ОТПРАВИТЬ В БРИГАДУ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EXECUTION BOTTOM SHEET (ДЛЯ СДАЧИ С ФОТО) ═══ */}
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
            setExecutionTask(null);
            await loadTodayRecords();
          }}
        />
      )}

    </div>
  );
}
