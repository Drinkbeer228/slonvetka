import React, { useState } from 'react';
import { 
  CheckSquare, 
  Camera, 
  BookOpen, 
  Settings, 
  User, 
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { BrigadeTasksScreen } from './BrigadeTasksScreen';
import { FeedScreen } from './FeedScreen';
import { HandbookScreen } from './HandbookScreen';
import { ProfileScreen } from './ProfileScreen';
import { FeedEntry, INITIAL_FEED_ENTRIES } from '../types/engine';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type MainAppTab = 'tasks' | 'feed' | 'handbook' | 'profile';

export function DynamicAppFrame() {
  const [currentTab, setCurrentTab] = useState<MainAppTab>('tasks');
  const { userRole, roleConfig } = useRole();

  const [feedEntries, setFeedEntries] = useLocalStorage<FeedEntry[]>(
    'slonovet_feed_entries_v2',
    INITIAL_FEED_ENTRIES
  );

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handleTabChange = (tab: MainAppTab) => {
    setCurrentTab(tab);
    triggerHaptic(10);
  };

  const handleAddFeedLog = (text: string, badge?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry: FeedEntry = {
      id: `feed-${Date.now()}`,
      time: timeStr,
      author: roleConfig.label,
      role: userRole as any,
      text,
      badge: badge || 'Системное событие',
      createdAt: now.toISOString()
    };
    setFeedEntries(prev => [newEntry, ...prev]);
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'tasks':
        return <BrigadeTasksScreen />;
      case 'feed':
        return <FeedScreen onAddEventExternal={handleAddFeedLog} />;
      case 'handbook':
        return <HandbookScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <BrigadeTasksScreen />;
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* TOP STATUS BAR (ULTRA-SLIM) */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md px-3 pt-[calc(env(safe-area-inset-top)+0.4rem)] pb-1.5 border-b border-zinc-850">
        <div className="max-w-lg mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🐘</span>
            <span className="text-xs font-black tracking-tight text-white">
              СЛОНОВНИК • ДВИЖОК СМЕНЫ
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span>{roleConfig.icon}</span>
              <span>{roleConfig.shortLabel}</span>
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT VIEW AREA */}
      <main className="flex-1 w-full max-w-lg mx-auto px-3 pt-2.5 overflow-y-auto">
        {renderActiveTab()}
      </main>

      {/* 3. НОВАЯ НАВИГАЦИЯ (BOTTOM TAB BAR — 4 ВКЛАДКИ) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-850 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 px-2">
        <div className="max-w-lg mx-auto w-full grid grid-cols-4 gap-1">
          
          {/* TAB 1: ЗАДАЧИ */}
          <button
            type="button"
            onClick={() => handleTabChange('tasks')}
            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              currentTab === 'tasks'
                ? 'bg-zinc-900 text-emerald-400 font-black border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base leading-none">✅</span>
            <span className="text-[11px] leading-tight">Задачи</span>
          </button>

          {/* TAB 2: ЛЕНТА */}
          <button
            type="button"
            onClick={() => handleTabChange('feed')}
            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              currentTab === 'feed'
                ? 'bg-zinc-900 text-emerald-400 font-black border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base leading-none">📸</span>
            <span className="text-[11px] leading-tight">Лента</span>
          </button>

          {/* TAB 3: СПРАВОЧНИК */}
          <button
            type="button"
            onClick={() => handleTabChange('handbook')}
            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              currentTab === 'handbook'
                ? 'bg-zinc-900 text-emerald-400 font-black border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base leading-none">📖</span>
            <span className="text-[11px] leading-tight">Справочник</span>
          </button>

          {/* TAB 4: ПРОФИЛЬ */}
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-zinc-900 text-emerald-400 font-black border border-zinc-800 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base leading-none">⚙️</span>
            <span className="text-[11px] leading-tight">Профиль</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
