import React, { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { InstallPrompt } from './InstallPrompt';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Layout({ children, currentScreen, onNavigate }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { profile, logout } = useStore();

  const navItems = [
    { id: 'daily_shift', label: 'Слоновник', role: 'all' },
    { id: 'vet_dashboard', label: 'ВетПанель', role: 'all' },
    { id: 'elephants', label: 'Слоны', role: 'all' }
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* MONOLITHIC HEADER */}
      <Header
        currentScreen={currentScreen}
        onOpenMenu={() => setDrawerOpen(true)}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-8">
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
                onClick={() => { if(confirm('Сменить сотрудника?')) { logout(); setDrawerOpen(false); } }}
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg text-[11px] font-bold transition-all active:scale-95"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Сменить
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

