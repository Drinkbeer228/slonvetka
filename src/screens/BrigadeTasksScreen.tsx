import React, { useState } from 'react';
import {
  Check, Plus, X, Camera, UserCheck, AlertTriangle, Clock
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRole } from '../context/RoleContext';
import { useStore } from '../store';
import { DailyTask, TaskType, INITIAL_DAILY_TASKS } from '../types/engine';

type TaskFilter = 'active' | 'mine' | 'done';

/**
 * BrigadeTasksScreen — экран «ЗАДАЧИ»
 * Бригадная лента задач с механикой «Забрать себе» и фильтрами.
 */
export function BrigadeTasksScreen() {
  const { userRole, canManageTasks, roleConfig } = useRole();
  const { profile } = useStore();

  const [tasks, setTasks] = useLocalStorage<DailyTask[]>(
    'slonovet_daily_tasks_v2',
    INITIAL_DAILY_TASKS
  );

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('active');
  const [modalOpen, setModalOpen] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>(userRole === 'vet' ? 'vet' : 'routine');
  const [newAssignedTo, setNewAssignedTo] = useState<'keeper' | 'vet' | 'admin' | 'all'>('all');
  const [newElephant, setNewElephant] = useState('Все слонихи');
  const [newNote, setNewNote] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'normal'>('normal');

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // ─── Task actions ───

  const toggleTask = (id: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const willComplete = !t.isCompleted;
      return {
        ...t,
        isCompleted: willComplete,
        completedAt: willComplete ? timeStr : undefined,
        completedBy: willComplete ? (profile?.name || roleConfig.label) : undefined,
      };
    }));

    triggerHaptic([20, 30]);
  };

  const claimTask = (id: string) => {
    triggerHaptic(20);
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        claimed_by: profile?.id || 'anon',
        claimed_by_name: profile?.name || roleConfig.label,
      };
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      isCompleted: false,
      assignedTo: newAssignedTo,
      elephantName: newElephant,
      note: newNote.trim() || undefined,
      priority: newPriority,
      createdAt: new Date().toISOString(),
      createdBy: profile?.name || roleConfig.label,
    };

    setTasks(prev => [newTask, ...prev]);
    triggerHaptic([30, 40]);

    setNewTitle('');
    setNewNote('');
    setNewPriority('normal');
    setModalOpen(false);
  };

  // ─── Filtering ───

  const filteredTasks = tasks.filter(t => {
    switch (activeFilter) {
      case 'active':
        return !t.isCompleted;
      case 'mine':
        return t.claimed_by === profile?.id || t.completedBy === profile?.name;
      case 'done':
        return t.isCompleted;
      default:
        return true;
    }
  });

  const activeCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <div className="flex flex-col gap-3 w-full pb-4">

      {/* ═══ SHIFT HEADER ═══ */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Бригадная лента
            </p>
            <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
              Задачи на смену
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="text-emerald-400 font-bold">{completedCount}</span> из{' '}
              <span className="font-bold">{tasks.length}</span> выполнено
            </p>
          </div>

          {canManageTasks && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-[48px] px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer touch-manipulation"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Задача</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* ═══ FILTER TABS ═══ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        {([
          { id: 'active' as TaskFilter, label: 'Активные', count: activeCount },
          { id: 'mine' as TaskFilter, label: 'Мои задачи', count: tasks.filter(t => t.claimed_by === profile?.id).length },
          { id: 'done' as TaskFilter, label: 'Завершённые', count: completedCount },
        ]).map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => { setActiveFilter(filter.id); triggerHaptic(8); }}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] font-mono px-1.5 rounded-full ${
                isActive ? 'bg-zinc-950 text-emerald-400' : 'bg-zinc-950/60 text-zinc-500'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══ TASK CARDS ═══ */}
      <div className="flex flex-col gap-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm font-bold">
            {activeFilter === 'mine' ? 'У вас пока нет задач' : activeFilter === 'done' ? 'Ещё нет завершённых' : 'Все задачи выполнены! 🎉'}
          </div>
        ) : (
          filteredTasks.map(task => {
            const isUrgent = task.priority === 'urgent' || task.type === 'vet';
            const isClaimed = !!task.claimed_by;
            const isMyTask = task.claimed_by === profile?.id;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-4 transition-all shadow-sm ${
                  task.isCompleted
                    ? 'bg-zinc-900/50 border-zinc-800/60 opacity-75'
                    : isUrgent
                    ? 'bg-zinc-900 border-rose-500/30 shadow-rose-500/5'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 border touch-manipulation ${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-600'
                    }`}
                    aria-label={task.isCompleted ? 'Снять отметку' : 'Выполнено'}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </button>

                  {/* Content */}
                  <div className="flex flex-col flex-1 gap-1.5 min-w-0">
                    {/* Title */}
                    <span className={`text-base font-bold leading-snug break-words ${
                      task.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-100'
                    }`}>
                      {task.title}
                    </span>

                    {/* Note */}
                    {task.note && (
                      <p className="text-xs text-zinc-400 leading-relaxed break-words">
                        {task.note}
                      </p>
                    )}

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {/* Priority badge */}
                      {isUrgent && !task.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle size={10} />
                          Срочно
                        </span>
                      )}

                      {!isUrgent && !task.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <Clock size={10} />
                          Планово
                        </span>
                      )}

                      {/* Elephant */}
                      {task.elephantName && (
                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                          🐘 {task.elephantName}
                        </span>
                      )}

                      {/* Claimed by */}
                      {isClaimed && !task.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/40 px-2 py-1 rounded-lg border border-sky-500/30">
                          <UserCheck size={10} />
                          {task.claimed_by_name}
                        </span>
                      )}

                      {/* Completed */}
                      {task.isCompleted && task.completedAt && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/30 font-bold">
                          ✓ {task.completedAt} — {task.completedBy}
                        </span>
                      )}

                      {/* Created by */}
                      {task.createdBy && (
                        <span className="text-[10px] text-zinc-600 font-medium">
                          от {task.createdBy}
                        </span>
                      )}
                    </div>

                    {/* Claim button */}
                    {!task.isCompleted && !isClaimed && (
                      <button
                        type="button"
                        onClick={() => claimTask(task.id)}
                        className="mt-1 self-start min-h-[44px] px-4 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-black flex items-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation hover:bg-sky-500/25"
                      >
                        <UserCheck size={14} />
                        <span>Забрать себе</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ CREATE TASK MODAL ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h2 className="text-sm font-black text-white">Новая задача</h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3 py-3 overflow-y-auto">

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Текст задачи <span className="text-rose-400">*</span>
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
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer touch-manipulation ${
                        newPriority === p.id
                          ? p.id === 'urgent'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-blue-500/20 border-blue-500 text-blue-300'
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
                <label className="text-xs font-bold text-zinc-300">Объект</label>
                <select
                  value={newElephant}
                  onChange={(e) => setNewElephant(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Все слонихи">🐘 Все слонихи</option>
                  <option value="Марго">🐘 Марго</option>
                  <option value="Одри">🐘 Одри</option>
                  <option value="Прэтти">🐘 Прэтти</option>
                  <option value="Слоновник">🏠 Слоновник</option>
                  <option value="Кухня">🥣 Кормокухня</option>
                  <option value="Территория">🌲 Территория</option>
                </select>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Инструкция (опц.)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Детали, дозировка..."
                  className="w-full h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer touch-manipulation"
              >
                Поставить задачу
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
