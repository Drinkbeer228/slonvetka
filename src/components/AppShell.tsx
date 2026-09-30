import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ElephantsScreen } from '../screens/ElephantsScreen';
import { BrigadeTasksScreen } from '../screens/BrigadeTasksScreen';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DailyTask, INITIAL_DAILY_TASKS } from '../types/engine';
import {
  Loader2, CheckCircle2, Clock
} from 'lucide-react';

type AppScreen = 'elephants' | 'tasks';

/**
 * AppShell — корневой shell PWA «СлоноВет»
 * 2 экрана с Bottom Navigation: СЛОНЫ | ЗАДАЧИ
 */
export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('elephants');
  const { profile, globalSaveStatus } = useStore();

  // Read tasks count for badge
  const [tasks] = useLocalStorage<DailyTask[]>('slonovet_daily_tasks_v2', INITIAL_DAILY_TASKS);
  const activeTasksCount = useMemo(() => tasks.filter(t => !t.isCompleted).length, [tasks]);

  const triggerHaptic = (ms: number = 10) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-y-auto overscroll-y-contain flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">

        {/* ═══ TOP HEADER ═══ */}
        <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <span className="text-lg">🐘</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-white">
                    СлоноВет
                  </h1>
                  {globalSaveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Сохранение</span>
                    </span>
                  )}
                  {globalSaveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Сохранено</span>
                    </span>
                  )}
                  {globalSaveStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-bold">
                      <span>Офлайн</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  {profile?.name || 'Дежурный кипер'} • {profile?.role === 'vet' ? 'Ветврач' : profile?.role === 'admin' ? 'Администратор' : 'Кипер'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                На смене
              </div>
            </div>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 px-4 pb-32 pt-4">
          {activeScreen === 'elephants' && <ElephantsScreen />}
          {activeScreen === 'tasks' && <BrigadeTasksScreen />}
        </main>

        {/* ═══ BOTTOM NAVIGATION (2 TABS) ═══ */}
        <nav className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-2xl px-3 pb-3">
            <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="grid grid-cols-2 gap-2">
                {/* TAB: СЛОНЫ */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveScreen('elephants');
                  }}
                  className={[
                    'flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 transition cursor-pointer touch-manipulation',
                    activeScreen === 'elephants'
                      ? 'bg-white text-zinc-950 font-black shadow-md'
                      : 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 font-bold',
                  ].join(' ')}
                >
                  <span className="text-xl">🐘</span>
                  <span className="text-xs leading-tight tracking-tight">СЛОНЫ</span>
                </button>

                {/* TAB: ЗАДАЧИ */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveScreen('tasks');
                  }}
                  className={[
                    'flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 transition cursor-pointer touch-manipulation relative',
                    activeScreen === 'tasks'
                      ? 'bg-white text-zinc-950 font-black shadow-md'
                      : 'text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 font-bold',
                  ].join(' ')}
                >
                  <span className="text-xl">✅</span>
                  <span className="text-xs leading-tight tracking-tight">ЗАДАЧИ</span>
                  {/* Badge */}
                  {activeTasksCount > 0 && (
                    <span className={`absolute top-1 right-3 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full flex items-center justify-center ${
                      activeScreen === 'tasks'
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    }`}>
                      {activeTasksCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

      </div>
    </div>
  );
}
