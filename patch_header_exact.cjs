const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* HEADER CARD \*\/\}([\s\S]*?)\{\/\* ACTIVE ELEPHANT CONTENT \*\/\}/;

if (regex.test(content)) {
  const newHeader = `{/* HEADER CARD */}
      <div className="bg-white/80 backdrop-blur-md border border-white/40 p-4 sm:p-5 rounded-[28px] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* LEFT SIDE: MINI PROFILE */}
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-white/80 px-3 py-1.5 rounded-2xl shadow-sm transition-all hover:bg-white/80 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-[12px] font-black shrink-0 shadow-inner ring-2 ring-white">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-[11px] font-black text-slate-800 leading-tight tracking-tight">{profile?.name || 'Гость'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: DATE */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap w-full">
            {selectedDate !== todayStr && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-600 hidden sm:flex">
                {isFutureDate ? 'План' : 'Архив'}
              </span>
            )}
            
            <div className="flex items-center gap-3">
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-all shadow-md shadow-slate-900/20 active:scale-95"
                >
                  Сегодня
                </button>
              )}
              <button onClick={() => setIsDatePickerOpen(true)} className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                {formattedDateLabel} <span className="text-sm opacity-50">▼</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ACTIVE ELEPHANT CONTENT */}`;

  content = content.replace(regex, newHeader);
  fs.writeFileSync(path, content);
  console.log("Successfully replaced header!");
} else {
  console.log("Regex not found!");
}
