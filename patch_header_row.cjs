const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* HEADER CARD \*\/\}([\s\S]*?)\{\/\* ACTIVE ELEPHANT CONTENT \*\/\}/;

if (regex.test(content)) {
  const newHeader = `{/* HEADER CARD */}
      <div className="bg-white/80 backdrop-blur-md border border-white/40 p-3 sm:p-5 rounded-[28px] shadow-lg flex flex-row items-center justify-between gap-2 sm:gap-4">
        
        {/* LEFT SIDE: MINI PROFILE */}
        <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl shadow-sm transition-all shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-[12px] font-black shrink-0 shadow-inner ring-2 ring-white">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-tight tracking-tight truncate max-w-[75px] sm:max-w-full">{profile?.name || 'Гость'}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase leading-tight truncate">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: DATE */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedDate !== todayStr && (
            <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-600 hidden md:flex">
              {isFutureDate ? 'План' : 'Архив'}
            </span>
          )}
          
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-all shadow-md shadow-slate-900/20 active:scale-95 shrink-0"
            >
              Сегодня
            </button>
          )}
          <button onClick={() => setIsDatePickerOpen(true)} className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1 shrink-0">
            {formattedDateLabel} <span className="text-[10px] sm:text-sm opacity-50">▼</span>
          </button>
        </div>

      </div>

      {/* ACTIVE ELEPHANT CONTENT */}`;

  content = content.replace(regex, newHeader);
  fs.writeFileSync(path, content);
  console.log("Successfully forced header to a single row!");
} else {
  console.log("Regex not found!");
}
