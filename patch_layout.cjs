const fs = require('fs');
const path = './src/components/Layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add logout
content = content.replace(
  'const { profile, elephants, activeElephantId, setActiveElephantId, globalSaveStatus } = useStore();',
  'const { profile, elephants, activeElephantId, setActiveElephantId, globalSaveStatus, logout } = useStore();'
);

// Add LogOut icon
content = content.replace(
  "import { Menu, X } from 'lucide-react';",
  "import { Menu, X, LogOut } from 'lucide-react';"
);

// Replace profile section
const oldProfile = `          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-wider">
              {profile.role === 'vet' ? 'Ветврач' : profile.role === 'director' ? 'Дрессировщик' : 'Текущий кипер'}
            </div>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
              <span className="font-bold">{profile.name} {profile.role === 'vet' ? '(Ветврач)' : profile.role === 'director' ? '(Дрессировщик)' : ''}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <button 
              onClick={() => handleNav('settings')}
              className="mt-2 text-xs text-blue-600 font-semibold text-center w-full block"
            >
              Сменить
            </button>
          </div>`;

const newProfile = `          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
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
          </div>`;

content = content.replace(oldProfile, newProfile);
fs.writeFileSync(path, content);
