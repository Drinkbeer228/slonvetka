import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { InstallPrompt } from './InstallPrompt';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Layout({ children, currentScreen, onNavigate }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { profile, elephants, activeElephantId, setActiveElephantId, globalSaveStatus, logout } = useStore();

  const navItems = [
    { id: 'daily_shift', label: 'Дежурство', role: 'all' },
    { id: 'today', label: 'Сегодня', role: 'all' },
    { id: 'journal', label: 'Журнал', role: 'all' },
    { id: 'elephants', label: 'Слоны', role: 'all' },
    { id: 'assignments', label: 'Назначения', role: 'vet' },
    { id: 'staff', label: 'Сотрудники', role: 'vet' },
    { id: 'settings', label: 'Настройки', role: 'all' }
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 pt-2 pb-2 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-6xl mx-auto h-14 bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[24px] px-3.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
          {/* LOGO - LEFT */}
          <button 
            type="button"
            onClick={() => handleNav('daily_shift')}
            className="flex items-center gap-2 select-none shrink-0 group text-left"
          >
            <div className="relative w-8 h-8 flex items-center justify-center perspective-[800px]">
              <style>{`
                @keyframes spin-y-gta-header {
                  from { transform: rotateY(0deg); }
                  to { transform: rotateY(360deg); }
                }
                .animate-gta-save-header {
                  animation: spin-y-gta-header 2.5s linear infinite;
                  display: block;
                  transform-style: preserve-3d;
                }
              `}</style>
              
              {globalSaveStatus === 'saving' ? (
                <span key="saving" className="text-[26px] leading-none animate-gta-save-header drop-shadow-md filter brightness-110">💾</span>
              ) : globalSaveStatus === 'saved' ? (
                <span key="saved" className="text-[26px] leading-none animate-in zoom-in duration-300 drop-shadow-md filter brightness-110">✅</span>
              ) : globalSaveStatus === 'error' ? (
                <span key="error" className="text-[26px] leading-none" title="Офлайн">⚠️</span>
              ) : (
                <span key="idle" className="text-[26px] leading-none transition-transform group-hover:scale-110">🐘</span>
              )}
            </div>
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 hidden xs:inline sm:inline">СлоноВет</span>
          </button>

          {/* ELEPHANTS SELECTOR IN HEADER - CENTER */}
          {elephants && elephants.length > 0 && (
            <div className="flex-1 max-w-md mx-auto flex items-center justify-center overflow-x-auto no-scrollbar py-1">
              <div className="flex bg-slate-100/80 p-1 rounded-2xl w-full max-w-sm border border-slate-200/50 shadow-inner">
                {elephants.map((elephant) => {
                  const isActive = elephant.id === activeElephantId;
                  return (
                    <button
                      key={elephant.id}
                      type="button"
                      onClick={() => {
                        setActiveElephantId(elephant.id);
                        if (currentScreen !== 'daily_shift') {
                          onNavigate('daily_shift');
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative truncate text-center ${
                        isActive
                          ? 'text-slate-900 bg-white shadow-sm border border-slate-100 font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title={elephant.name}
                    >
                      <span className="truncate block">{elephant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MENU BUTTON - RIGHT */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Открыть меню"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center transition shadow-sm border border-slate-200/70"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:px-6">
        {children}
      </main>

      <InstallPrompt />

      {/* DRAWER BACKDROP */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* DRAWER */}
      <aside 
        className={`fixed top-0 bottom-0 right-0 w-full max-w-xs bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-zinc-200 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🐘</span>
            <span className="text-base font-black tracking-tight text-white">СлоноВет</span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)} 
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {navItems.filter(i => i.role === 'all' || i.role === profile?.role).map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full text-left py-3 px-4 rounded-xl font-bold transition ${
                currentScreen === item.id || (currentScreen === 'elephant_details' && item.id === 'elephants')
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        {profile && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-wider">
              {profile.role === 'vet' ? 'Ветврач' : profile.role === 'director' ? 'Дрессировщик' : 'Текущий кипер'}
            </div>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200 shadow-sm">
              <span className="font-bold text-slate-800">{profile.name} {profile.role === 'vet' ? '(Ветврач)' : profile.role === 'director' ? '(Дрессировщик)' : ''}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            <div className="flex items-center justify-between mt-3 gap-2">
              <button 
                onClick={() => handleNav('settings')}
                className="flex-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg font-bold transition-all active:scale-95 text-center"
              >
                Настройки
              </button>
              <button 
                onClick={() => { if(confirm('Выйти из аккаунта?')) logout(); }}
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg text-[11px] font-bold transition-all active:scale-95"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Выйти
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

