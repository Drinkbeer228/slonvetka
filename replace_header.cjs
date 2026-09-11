const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldHeader = `      {/* HEADER CARD */}
      <div className="bg-white/80 backdrop-blur-md border border-white/40 p-5 rounded-[28px] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Дата</h2>
            {selectedDate !== todayStr && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-600">
                {isFutureDate ? 'План' : 'Архив'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button onClick={() => setIsDatePickerOpen(true)} className="text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">{formattedDateLabel} <span className="text-sm opacity-50">▼</span></button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="w-8 h-8 rounded-full bg-white/60 border border-white/40 shadow-sm hover:bg-white flex items-center justify-center text-slate-600 text-sm font-bold transition-all active:scale-95"
                title="Предыдущий день"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="w-8 h-8 rounded-full bg-white/60 border border-white/40 shadow-sm hover:bg-white flex items-center justify-center text-slate-600 text-sm font-bold transition-all active:scale-95"
                title="Следующий день"
              >
                →
              </button>
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-all ml-1 shadow-md shadow-slate-900/20 active:scale-95"
                >
                  Сегодня
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-white/80 px-3 py-1.5 rounded-2xl shadow-sm transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-[12px] font-black shrink-0 shadow-inner ring-2 ring-white">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-800 leading-tight tracking-tight">{profile?.name || 'Гость'}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{profile?.role === 'vet' ? 'Ветврач' : 'Кипер'} {isLocked ? '(Чтение)' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;

const newHeader = `      {/* HEADER CARD */}
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

      </div>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync(path, content);
