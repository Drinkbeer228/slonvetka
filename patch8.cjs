const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add logout to useStore destructuring
content = content.replace(
  'const { profile, elephants, assignments, selectedDate, setSelectedDate, activeElephantId, setActiveElephantId, setGlobalSaveStatus } = useStore();',
  'const { profile, elephants, assignments, selectedDate, setSelectedDate, activeElephantId, setActiveElephantId, setGlobalSaveStatus, logout } = useStore();'
);

// Add LogOut to lucide-react imports if not present
if (!content.includes('LogOut')) {
  content = content.replace(
    'import { Calendar as CalendarIcon, CheckCircle2, Loader2, Save, UserCheck, AlertCircle, Clock, Trash2, Camera, User, FileText, ChevronRight, X } from \'lucide-react\';',
    'import { Calendar as CalendarIcon, CheckCircle2, Loader2, Save, UserCheck, AlertCircle, Clock, Trash2, Camera, User, FileText, ChevronRight, X, LogOut } from \'lucide-react\';'
  );
}

// Update the badge to include logout button
const oldBadge = `<div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white/80 px-3 py-1.5 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-inner">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-800 leading-tight">{profile?.name || 'Гость'}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase leading-tight">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
            </div>
          </div>
        </div>`;

const newBadge = `<div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-white/80 px-2 py-1.5 rounded-2xl shadow-sm pr-3 transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-[12px] font-black shrink-0 shadow-inner ring-2 ring-white">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-800 leading-tight tracking-tight">{profile?.name || 'Гость'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-slate-200"></div>
            <button 
              onClick={() => { if(confirm('Выйти из аккаунта?')) logout(); }}
              className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all"
              title="Выйти"
            >
              <LogOut size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>`;

content = content.replace(oldBadge, newBadge);

fs.writeFileSync(path, content);
