import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Layout({ children, currentScreen, onNavigate }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { keepers, activeKeeperId } = useStore();
  
  const activeKeeper = keepers.find(k => k.id === activeKeeperId);

  const navItems = [
    { id: 'today', label: 'Сегодня' },
    { id: 'journal', label: 'Журнал' },
    { id: 'elephants', label: 'Слоны' },
    { id: 'assignments', label: 'Назначения' },
    { id: 'settings', label: 'Настройки' }
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* HEADER */}
      <header className="bg-zinc-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 select-none cursor-pointer"
            onClick={() => onNavigate('today')}
          >
            <span className="text-2xl leading-none">🐘</span>
            <span className="text-lg font-black tracking-tight text-white">СЛОНЫ</span>
          </div>

          <div className="flex items-center gap-3">
            {activeKeeper && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{activeKeeper.name}</span>
              </div>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition border border-zinc-700"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:px-6">
        {children}
      </main>

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
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>Меню</span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)} 
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {navItems.map(item => (
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
        
        {activeKeeper && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-wider">Текущий кипер</div>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
              <span className="font-bold">{activeKeeper.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <button 
              onClick={() => handleNav('settings')}
              className="mt-2 text-xs text-blue-600 font-semibold text-center w-full block"
            >
              Сменить
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
