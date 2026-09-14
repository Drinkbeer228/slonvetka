import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, Plus, Minus, Flame, Sparkles, 
  Smile, AlertTriangle, Lock, Clock, History, Check, X
} from 'lucide-react';
import { useStore } from '../../store';

export interface CounterItem {
  id: string;
  label: string;
  emoji: string;
  count: number;
  type: 'merit' | 'damage';
  isLocked?: boolean;
}

export interface ActionLog {
  id: string;
  text: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  type: 'merit' | 'damage' | 'custom';
}

const DEFAULT_MERITS: CounterItem[] = [
  { id: 'elephants_washed', label: 'Слонов помыто', emoji: '🐘', count: 0, type: 'merit' },
  { id: 'carpets_cleaned', label: 'Ковров зачищено', emoji: '🧼', count: 0, type: 'merit' },
  { id: 'wheelbarrows_dumped', label: 'Тачек вывезено', emoji: '🚜', count: 0, type: 'merit' },
];

const DEFAULT_DAMAGES: CounterItem[] = [
  { id: 'brooms_eaten', label: 'Мётел съедено', emoji: '🧹', count: 0, type: 'damage' },
  { id: 'shovels_broken', label: 'Ведер/лопат сломано', emoji: '🪣', count: 0, type: 'damage' },
  { id: 'hoses_bitten', label: 'Шлангов откусано', emoji: '🚿', count: 0, type: 'damage' },
  { id: 'fence_torn', label: 'Пастух порван', emoji: '⚡', count: 0, type: 'damage' },
  { id: 'hooks_chewed', label: 'Багров сожрано', emoji: '🪝', count: 0, type: 'damage' },
  { id: 'escapes_attempted', label: 'Побегов', emoji: '🏃‍♂️', count: 0, type: 'damage', isLocked: true },
];

const QUICK_EMOJIS = ['💥', '🔨', '⚡', '🪣', '🚪', '🌾', '🦷', '🧱', '🍌', '🪓', '🛞', '🪵', '🥣', '🪑'];

interface DynamicCounterSectionProps {
  selectedDate: string;
  isLocked?: boolean;
  dutyKeeperName?: string;
  onStatsChange?: (stats: { meritsTotal: number; damageTotal: number; merits: CounterItem[]; damages: CounterItem[] }) => void;
  onAddEvent?: (title: string, icon: string, type: string, id: string) => void;
}

export function DynamicCounterSection({
  selectedDate,
  isLocked = false,
  dutyKeeperName,
  onStatsChange,
  onAddEvent
}: DynamicCounterSectionProps) {
  const { profile } = useStore();
  const currentKeeper = dutyKeeperName || profile?.name || 'Олег';

  // Storage key per day
  const storageKey = `shift_counters_v2_${selectedDate}`;
  const logsStorageKey = `shift_counter_logs_v2_${selectedDate}`;

  // State
  const [merits, setMerits] = useState<CounterItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_merits`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_MERITS;
  });

  const [damages, setDamages] = useState<CounterItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_damages`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_DAMAGES;
  });

  const [logs, setLogs] = useState<ActionLog[]>(() => {
    try {
      const saved = localStorage.getItem(logsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'init-1',
        text: '+1 Тачку вывез Олег',
        authorName: 'Олег',
        timestamp: '11:15',
        type: 'merit'
      },
      {
        id: 'init-2',
        text: '+1 Мётлу съела Марго',
        authorName: 'Иван',
        timestamp: '12:40',
        type: 'damage'
      }
    ];
  });

  // Adding new custom incident state
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💥');
  const [lockToast, setLockToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_merits`, JSON.stringify(merits));
      localStorage.setItem(`${storageKey}_damages`, JSON.stringify(damages));
    } catch {
      // ignore
    }

    const meritsTotal = merits.reduce((acc, cur) => acc + cur.count, 0);
    const damageTotal = damages.reduce((acc, cur) => acc + cur.count, 0);
    onStatsChange?.({ meritsTotal, damageTotal, merits, damages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merits, damages, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(logsStorageKey, JSON.stringify(logs.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [logs, logsStorageKey]);

  // Handle count change with tactile feedback and micro-log
  const handleCountChange = (id: string, delta: number, type: 'merit' | 'damage') => {
    if (isLocked) return;

    // Tactile vibration
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }

    const nowStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (type === 'merit') {
      let changedItemLabel = '';
      setMerits(prev =>
        prev.map(item => {
          if (item.id === id) {
            const nextCount = Math.max(0, item.count + delta);
            changedItemLabel = item.label;
            return { ...item, count: nextCount };
          }
          return item;
        })
      );

      if (delta > 0 && changedItemLabel) {
        const newLog: ActionLog = {
          id: `${Date.now()}-${Math.random()}`,
          text: `+1 ${changedItemLabel} записал(а) ${currentKeeper}`,
          authorName: currentKeeper,
          timestamp: nowStr,
          type: 'merit'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }
    } else {
      let changedItemLabel = '';
      let isItemLocked = false;

      setDamages(prev =>
        prev.map(item => {
          if (item.id === id) {
            if (item.isLocked) {
              isItemLocked = true;
              return item;
            }
            const nextCount = Math.max(0, item.count + delta);
            changedItemLabel = item.label;
            return { ...item, count: nextCount };
          }
          return item;
        })
      );

      if (isItemLocked) {
        showLockedWarning();
        return;
      }

      if (delta > 0 && changedItemLabel) {
        const newLog: ActionLog = {
          id: `${Date.now()}-${Math.random()}`,
          text: `+1 ${changedItemLabel} зафиксировал(а) ${currentKeeper}`,
          authorName: currentKeeper,
          timestamp: nowStr,
          type: 'damage'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }
    }
  };

  const showLockedWarning = () => {
    setLockToast('🏃‍♂️ Побегов: 0. Вольер заблокирован намертво! Побег невозможен!');
    setTimeout(() => setLockToast(null), 3500);
  };

  // Add custom damage incident
  const handleCreateIncident = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newIncidentTitle.trim() || isLocked) return;

    const trimmed = newIncidentTitle.trim();
    const newItem: CounterItem = {
      id: `custom_damage_${Date.now()}`,
      label: trimmed,
      emoji: selectedEmoji,
      count: 1, // Start with 1 on creation
      type: 'damage'
    };

    setDamages(prev => [...prev, newItem]);

    const nowStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newLog: ActionLog = {
      id: `${Date.now()}-${Math.random()}`,
      text: `Казус: "${trimmed}" добавлен ${currentKeeper}`,
      authorName: currentKeeper,
      timestamp: nowStr,
      type: 'custom'
    };

    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setNewIncidentTitle('');
    setIsAddingIncident(false);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification for Locked Escape */}
      {lockToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-amber-400 shrink-0" />
          <span>{lockToast}</span>
        </div>
      )}

      {/* TWO MAIN BLOCKS: MERITS & DAMAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* BLOCK 1: MERITS (ЗЕЛЕНОВАТЫЙ ОТТЕНОК СТЕКЛА) */}
        <div className="bg-emerald-500/[0.07] backdrop-blur-2xl border border-emerald-400/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-visible pt-6">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center text-xl shadow-inner shrink-0 border border-emerald-400/20">
                <Trophy size={20} className="text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                  Боевые заслуги
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-bold">
                    Смена
                  </span>
                </h3>
                <p className="text-xs font-semibold text-emerald-800/70">
                  Полезная работа и регламент чистоты
                </p>
              </div>
            </div>

            <span className="text-xl font-black text-emerald-700 bg-white/70 px-3 py-1 rounded-2xl border border-emerald-200/60 shadow-xs">
              +{merits.reduce((acc, c) => acc + c.count, 0)}
            </span>
          </div>

          {/* List of Merits Counters */}
          <div className="space-y-2.5 relative z-10 pt-1">
            {merits.map(item => (
              <div
                key={item.id}
                className="bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl p-3 sm:px-4 sm:py-3.5 flex items-center justify-between shadow-xs transition-all hover:bg-white/90"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{item.emoji}</span>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-tight">
                    {item.label}
                  </span>
                </div>

                {/* Counter Stepper Controls */}
                <div className="flex items-center gap-1.5 bg-emerald-50/70 p-1 rounded-xl border border-emerald-200/50">
                  <button
                    type="button"
                    disabled={isLocked || item.count <= 0}
                    onClick={() => handleCountChange(item.id, -1, 'merit')}
                    className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-emerald-100/50 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    title="Уменьшить"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>

                  <span className="w-9 text-center font-black text-sm sm:text-base text-emerald-950 tabular-nums">
                    {item.count}
                  </span>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleCountChange(item.id, 1, 'merit')}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shadow-xs"
                    title="Увеличить"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCK 2: DAMAGE & DESTRUCTION (ЯНТАРНО-КРАСНОВАТЫЙ ОТТЕНОК СТЕКЛА) */}
        <div className="bg-rose-500/[0.07] backdrop-blur-2xl border border-rose-300/40 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-visible pt-6">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-800 flex items-center justify-center text-xl shadow-inner shrink-0 border border-rose-400/20">
                <Flame size={20} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                  Слоновий дестрой & Ущерб
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-800 font-bold">
                    Казусы
                  </span>
                </h3>
                <p className="text-xs font-semibold text-rose-800/70">
                  Потери инвентаря и поломки за день
                </p>
              </div>
            </div>

            <span className="text-xl font-black text-rose-700 bg-white/70 px-3 py-1 rounded-2xl border border-rose-200/60 shadow-xs">
              {damages.reduce((acc, c) => acc + c.count, 0)}
            </span>
          </div>

          {/* List of Damages Counters */}
          <div className="space-y-2.5 relative z-10 pt-1">
            {damages.map(item => (
              <div
                key={item.id}
                className={`bg-white/75 backdrop-blur-md border border-white/80 rounded-2xl p-3 sm:px-4 sm:py-3.5 flex items-center justify-between shadow-xs transition-all hover:bg-white/90 ${
                  item.isLocked ? 'opacity-90 ring-1 ring-slate-200/60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{item.emoji}</span>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-tight">
                      {item.label}
                    </span>
                    {item.isLocked && (
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Залочено намертво 🔒
                      </span>
                    )}
                  </div>
                </div>

                {/* Counter Stepper Controls */}
                {item.isLocked ? (
                  <button
                    type="button"
                    onClick={showLockedWarning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-black transition-all active:scale-95 shadow-inner"
                  >
                    <Lock size={13} />
                    <span>[ 0 ]</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-50/70 p-1 rounded-xl border border-rose-200/50">
                    <button
                      type="button"
                      disabled={isLocked || item.count <= 0}
                      onClick={() => handleCountChange(item.id, -1, 'damage')}
                      className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-rose-100/50 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      title="Уменьшить"
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>

                    <span className="w-9 text-center font-black text-sm sm:text-base text-rose-950 tabular-nums">
                      {item.count}
                    </span>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleCountChange(item.id, 1, 'damage')}
                      className="w-8 h-8 rounded-lg bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shadow-xs"
                      title="Увеличить"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* KILLER FEATURE: КНОПКА «+ Добавить новый казус» */}
          {!isLocked && (
            <div className="pt-2 relative z-10">
              {!isAddingIncident ? (
                <button
                  type="button"
                  onClick={() => setIsAddingIncident(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-white/80 hover:bg-white text-rose-800 text-xs sm:text-sm font-extrabold border border-rose-200/80 shadow-xs hover:shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} className="text-rose-600 stroke-[3]" />
                  <span>+ Добавить новый казус</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCreateIncident}
                  className="bg-white/95 backdrop-blur-xl border border-rose-200 p-4 rounded-2xl shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                      Новый слоновий инцидент
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingIncident(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Input and Emoji Picker */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="text-2xl p-1 bg-slate-100 rounded-xl inline-block shadow-inner select-none">
                        {selectedEmoji}
                      </span>
                    </div>

                    <input
                      type="text"
                      autoFocus
                      value={newIncidentTitle}
                      onChange={e => setNewIncidentTitle(e.target.value)}
                      placeholder="Например: Раздавлен таз, Оторван кабель..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Quick Emoji selection row */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {QUICK_EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setSelectedEmoji(em)}
                        className={`text-lg p-1.5 rounded-lg transition-all ${
                          selectedEmoji === em
                            ? 'bg-rose-100 ring-2 ring-rose-400 scale-110'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingIncident(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!newIncidentTitle.trim()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Зафиксировать казус</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 2. АВТОРСТВО И ТАЙМСТАМПЫ ДЕЙСТВИЙ (МИКРО-ЛОГ СМЕНЫ) */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <History size={17} className="text-slate-500" />
            <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
              Живой микро-лог смены
            </h4>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {logs.length} записей
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Авторство киперов бригады
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-4 text-xs font-semibold text-slate-400">
            В этой смене действий пока не зафиксировано
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar pt-1">
            {logs.slice(0, 15).map(log => (
              <div
                key={log.id}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                  log.type === 'merit'
                    ? 'bg-emerald-50/80 border-emerald-200/70 text-emerald-900'
                    : log.type === 'damage'
                    ? 'bg-rose-50/80 border-rose-200/70 text-rose-900'
                    : 'bg-amber-50/80 border-amber-200/70 text-amber-900'
                }`}
              >
                {/* Micro Avatar Icon */}
                <div className="w-5 h-5 rounded-full bg-white text-slate-700 font-black text-[10px] flex items-center justify-center shadow-xs uppercase">
                  {log.authorName.slice(0, 1)}
                </div>

                <span>{log.text}</span>

                <span className="text-[10px] font-semibold opacity-60 flex items-center gap-1 border-l pl-1.5">
                  <Clock size={10} />
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
