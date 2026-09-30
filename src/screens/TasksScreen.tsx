import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  X, 
  Clock, 
  AlertCircle, 
  Stethoscope, 
  ShieldCheck, 
  ClipboardCheck,
  Filter,
  UserCheck
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRole } from '../context/RoleContext';
import { DailyTask, TaskType, INITIAL_DAILY_TASKS } from '../types/engine';

interface TasksScreenProps {
  onAddFeedLog?: (text: string, badge?: string) => void;
}

export function TasksScreen({ onAddFeedLog }: TasksScreenProps) {
  const { userRole, canManageTasks, roleConfig } = useRole();

  const [tasks, setTasks] = useLocalStorage<DailyTask[]>(
    'slonovet_daily_tasks_v2',
    INITIAL_DAILY_TASKS
  );

  const [activeFilter, setActiveFilter] = useState<'all' | TaskType>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>(userRole === 'vet' ? 'vet' : 'routine');
  const [newAssignedTo, setNewAssignedTo] = useState<'keeper' | 'vet' | 'admin' | 'all'>('keeper');
  const [newElephant, setNewElephant] = useState('Все слонихи');
  const [newNote, setNewNote] = useState('');

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const toggleTask = (id: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    let taskName = '';
    let willComplete = false;

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        willComplete = !t.isCompleted;
        taskName = t.title;
        return {
          ...t,
          isCompleted: willComplete,
          completedAt: willComplete ? timeStr : undefined,
          completedBy: willComplete ? roleConfig.label : undefined
        };
      }
      return t;
    }));

    triggerHaptic(willComplete ? [20, 30] : 15);

    if (onAddFeedLog && taskName) {
      if (willComplete) {
        onAddFeedLog(`Выполнена задача: «${taskName}»`, '✓ Чек-лист');
      }
    }
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
      createdAt: new Date().toISOString(),
      createdBy: roleConfig.label
    };

    setTasks(prev => [newTask, ...prev]);
    triggerHaptic([30, 40]);

    if (onAddFeedLog) {
      onAddFeedLog(`Назначена новая задача: «${newTitle.trim()}» (${newElephant})`, '📋 Новая задача');
    }

    setNewTitle('');
    setNewNote('');
    setModalOpen(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'all') return true;
    return t.type === activeFilter;
  });

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case 'vet':
        return { label: 'Вет-назначение', icon: '🩺', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'admin':
        return { label: 'ТБ / Шеф', icon: '🔒', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'routine':
      default:
        return { label: 'Рутина', icon: '📋', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full pb-20">
      
      {/* HEADER С КНОПКОЙ ДОБАВЛЕНИЯ ЗАДАЧИ ДЛЯ VET/ADMIN */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>✅</span>
            <span>Задачи на смену</span>
          </h1>
          <span className="text-xs text-zinc-400 font-medium">
            Смена: {completedCount} из {totalCount} выполнено ({progressPercent}%)
          </span>
        </div>

        {canManageTasks && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Добавить задачу</span>
          </button>
        )}
      </div>

      {/* ПРОГРЕСС-БАР ВЫПОЛНЕНИЯ СМЕНЫ */}
      <div className="w-full bg-zinc-900 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <span>Прогресс дежурства</span>
          <span className="font-mono text-emerald-400 font-black">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ФИЛЬТРЫ ТИПОВ ЗАДАЧ */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-x-auto">
        {[
          { id: 'all', label: 'Все задачи', count: totalCount },
          { id: 'routine', label: 'Рутина', count: tasks.filter(t => t.type === 'routine').length },
          { id: 'vet', label: 'Врач', count: tasks.filter(t => t.type === 'vet').length },
          { id: 'admin', label: 'ТБ / Шеф', count: tasks.filter(t => t.type === 'admin').length }
        ].map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-zinc-950 text-emerald-400' : 'bg-zinc-950/60 text-zinc-500'
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ДИНАМИЧЕСКИЙ СПИСОК КАРТОЧЕК ЗАДАЧ */}
      <div className="flex flex-col gap-2">
        {filteredTasks.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 text-center text-zinc-500 text-xs font-bold">
            Нет задач в выбранной категории
          </div>
        ) : (
          filteredTasks.map(task => {
            const badge = getTypeBadge(task.type);

            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 shadow-sm ${
                  task.isCompleted
                    ? 'bg-zinc-900/60 border-zinc-800/60 opacity-80'
                    : 'bg-zinc-900 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* ЧЕКБОКС ВЫПОЛНЕНИЯ (КРУПНЫЙ, УДОБНЫЙ) */}
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 mt-0.5 border ${
                    task.isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-600'
                  }`}
                  aria-label={task.isCompleted ? 'Отметить невыполненной' : 'Отметить выполненной'}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                </button>

                {/* КОНТЕНТ ЗАДАЧИ — ТЕКСТ ПЕРЕНОСИТСЯ, НЕ ОБРЕЗАЕТСЯ */}
                <div className="flex flex-col flex-1 gap-1">
                  
                  {/* Заголовок задачи */}
                  <span className={`text-sm font-bold leading-snug break-words ${
                    task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100'
                  }`}>
                    {task.title}
                  </span>

                  {/* Заметка / Инструкция */}
                  {task.note && (
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed break-words">
                      {task.note}
                    </p>
                  )}

                  {/* Мета-данные задачи */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    
                    {/* Тип задачи */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    {/* Объект / Слониха */}
                    {task.elephantName && (
                      <span className="text-[10px] font-bold text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                        🐘 {task.elephantName}
                      </span>
                    )}

                    {/* Статус выполнения */}
                    {task.isCompleted && task.completedAt && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-bold">
                        ✓ {task.completedAt} ({task.completedBy || 'Выполнено'})
                      </span>
                    )}

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ЗАДАЧИ (VET / ADMIN) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h2 className="text-sm font-black text-white leading-tight">
                  Новая задача на смену
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3 py-3 overflow-y-auto pr-1">
              
              {/* Название задачи */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Текст задачи <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Промыть копыто Марго раствором марганцовки..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Тип задачи */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Тип задачи</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'routine' as TaskType, label: 'Рутина', icon: '📋' },
                    { id: 'vet' as TaskType, label: 'Врач', icon: '🩺' },
                    { id: 'admin' as TaskType, label: 'ТБ / Шеф', icon: '🔒' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        newType === t.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Объект / Слониха */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Объект / Животное</label>
                <select
                  value={newElephant}
                  onChange={(e) => setNewElephant(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Все слонихи">🐘 Все слонихи</option>
                  <option value="Марго">🐘 Марго</option>
                  <option value="Одри">🐘 Одри</option>
                  <option value="Прэтти">🐘 Прэтти</option>
                  <option value="Слоновник">🏠 Слоновник / Вольеры</option>
                  <option value="Кухня">🥣 Кормокухня</option>
                  <option value="Территория">🌲 Выгул / Периметр</option>
                </select>
              </div>

              {/* Кому адресовано */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Исполнитель</label>
                <select
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value as any)}
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="keeper">Дежурный кипер</option>
                  <option value="vet">Ветеринарный врач</option>
                  <option value="admin">Шеф / Дрессировщик</option>
                  <option value="all">Любой свободный сотрудник</option>
                </select>
              </div>

              {/* Дополнительная заметка */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Инструкция / Детали (опционально)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Дозировка, время или предосторожности..."
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Кнопка создания */}
              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Сохранить и отправить в смену
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
