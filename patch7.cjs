const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix getFirstDayOfMonth -> getFirstDayOfWeek
content = content.replace('const firstDay = getFirstDayOfMonth(viewYear, viewMonth);', 'const firstDay = getFirstDayOfWeek(viewYear, viewMonth);');

// 2. Change "Рабочая смена" to "Дата"
content = content.replace(
  '<h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Рабочая смена</h2>',
  '<h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Дата</h2>'
);

// 3. Remove the duty keeper selector and replace with compact liquid glass badge
const oldDutyBlock = `<div className="flex flex-col sm:items-end gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Дежурный: {dutyKeeper ? dutyKeeper.name : 'Не указан'} {isLocked ? '• Режим чтения' : ''}
          </div>
          {!isLocked && (
             <div className="flex -space-x-2">
                {staffList.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => handleShiftFieldChange('duty_keeper_id', s.id, true)}
                    className={\`w-10 h-10 rounded-full border-2 border-white/80 backdrop-blur-sm flex items-center justify-center text-xs font-bold transition-all shadow-md \${
                      shift?.duty_keeper_id === s.id ? 'bg-indigo-500 text-white z-10 scale-110 border-transparent shadow-indigo-500/30' : 'bg-white/60 text-slate-600 hover:bg-white/90 hover:scale-105'
                    }\`}
                    title={s.name}
                  >
                    {s.name.charAt(0)}
                  </button>
                ))}
             </div>
          )}
        </div>`;

const newDutyBlock = `<div className="flex flex-col sm:items-end gap-1.5 shrink-0">
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

content = content.replace(oldDutyBlock, newDutyBlock);

// 4. Update the triggerDebouncedSave & handleShiftFieldChange logic to auto-assign duty_keeper_id
// We need to inject logic so that when a shift is created/saved, it defaults to profile.id
// First, let's look at fetchShiftRecords fallback.
fs.writeFileSync(path, content);
