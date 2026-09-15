import React, { useState } from 'react';
import { 
  X, LogOut, Home, Stethoscope, HeartPulse, Moon, Sun,
  CheckCircle2, BookOpen, ClipboardList, Users 
} from 'lucide-react';
import { useStore } from '../store';
import { InstallPrompt } from './InstallPrompt';
import { Header } from './Header';
import { ProfileSettingsModal } from './ProfileSettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const NAV_ITEMS = [
  { id: 'daily_shift',   label: 'Слоновник',   icon: Home,        role: 'all' },
  { id: 'vet_dashboard', label: 'Вет-Кабинет', icon: Stethoscope, role: 'all' },
  { id: 'journal',       label: 'Журнал',      icon: BookOpen,    role: 'all' },
  { id: 'staff',         label: 'Сотрудники',  icon: Users,       role: 'admin' },
];

const ROLE_LABEL: Record<string, string> = {
  vet:      'Ветврач',
  director: 'Дрессировщик',
  admin:    'Администратор',
  keeper:   'Кипер',
};

export function Layout({ children, currentScreen, onNavigate }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('slonovet_theme') === 'dark');

  const toggleTheme = () => {
    setDarkMode(value => { 
      const next = !value; 
      localStorage.setItem('slonovet_theme', next ? 'dark' : 'light'); 
      return next; 
    });
  };
  const { profile, logout } = useStore();

  const handleNav = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  const isVetDashboard = currentScreen === 'vet_dashboard';
  const contentWidthClass = isVetDashboard 
    ? 'max-w-7xl px-2 sm:px-6' 
    : 'max-w-3xl lg:max-w-4xl px-3 sm:px-6';

  return (
    <div
      className="min-h-screen text-slate-800 flex flex-col font-sans antialiased"
      data-theme={darkMode ? 'dark' : 'light'}
      style={{ background: darkMode ? '#020617' : 'linear-gradient(160deg, #f1f5f9 0%, #e9f0f8 60%, #eff6ff 100%)' }}
    >
      {/* STICKY HEADER */}
      <Header 
        currentScreen={currentScreen} 
        onOpenMenu={() => setDrawerOpen(true)} 
        onNavigate={onNavigate}
      />

      {/* MAIN CONTENT */}
      <main className={`flex-1 w-full mx-auto pb-16 transition-all ${contentWidthClass}`}>
        {children}
      </main>

      <InstallPrompt />


      {/* DRAWER BACKDROP */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen
            ? 'pointer-events-auto bg-slate-900/40 backdrop-blur-sm'
            : 'pointer-events-none bg-transparent backdrop-blur-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* DRAWER — Liquid Glass */}
      <aside
        className={`fixed top-0 bottom-0 right-0 w-full max-w-[320px] z-[60] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: darkMode ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '-4px 0 40px rgba(15,23,42,0.14)',
          borderLeft: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        {/* Шапка drawer */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{
            borderBottom: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(255,255,255,0.4)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none select-none">🐘</span>
            <span className="text-base font-black tracking-tight text-slate-900">СлоноВет</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-[14px] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors active:scale-95 cursor-pointer tap-target"
            style={{
              background: 'rgba(148,163,184,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
            aria-label="Закрыть меню"
          >
            <X size={18} />
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.filter(i => i.role === 'all' || i.role === profile?.role).map(item => {
            const isActive = currentScreen === item.id ||
              (currentScreen === 'elephant_details' && item.id === 'elephants');
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-[18px] font-bold text-sm text-left transition-all active:scale-95 cursor-pointer tap-target ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={isActive ? {
                  background: 'rgba(255,255,255,0.85)',
                  boxShadow: '0 2px 12px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                } : {
                  background: 'transparent',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Профиль + выход */}
        {profile && (
          <div
            className="p-4 shrink-0"
            style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {ROLE_LABEL[profile.role] ?? 'Сотрудник'}
            </div>
            <div
              className="px-4 py-3 rounded-[18px] flex items-center justify-between mb-3"
              style={{
                background: 'rgba(255,255,255,0.7)',
                boxShadow: '0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <span className="font-bold text-slate-900 text-sm truncate">{profile.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full min-h-[44px] mb-2 flex items-center justify-center gap-2 rounded-[14px] bg-slate-100 text-slate-800 font-bold text-sm transition-all active:scale-95"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? 'Светлая тема' : 'Ночной режим'}
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileSettingsOpen(true);
                setDrawerOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-[14px] font-bold text-sm text-slate-700 transition-all active:scale-95 cursor-pointer tap-target"
              style={{
                background: 'rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              Настройки профиля
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Сменить сотрудника?')) {
                  logout();
                  setDrawerOpen(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] font-bold text-sm text-rose-600 transition-all active:scale-95 cursor-pointer tap-target"
              style={{
                background: 'rgba(254,226,226,0.6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <LogOut size={15} strokeWidth={2.5} />
              Сменить сотрудника
            </button>
          </div>
        )}
      </aside>

      {profileSettingsOpen && (
        <ProfileSettingsModal onClose={() => setProfileSettingsOpen(false)} />
      )}
    </div>
  );
}
