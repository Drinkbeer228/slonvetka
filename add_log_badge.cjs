const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const badgeComponent = `
      {/* Floating Log Badge */}
      <button 
        onClick={() => setEventLogOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-full font-black text-sm shadow-xl border border-slate-700/50 flex items-center gap-2 active:scale-95 transition-transform"
      >
        <span>📋</span> Лента смены ({(events || []).length})
      </button>

      {/* Floating Log Sheet */}
      {eventLogOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEventLogOpen(false)}></div>
          <div className="bg-white rounded-t-[32px] p-6 pb-safe relative z-10 animate-fade-in-up h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-lg">Лента событий</h3>
              <button onClick={() => setEventLogOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {(events || []).length === 0 ? (
                <div className="text-center text-slate-500 py-10 font-bold text-sm opacity-60">Событий пока нет</div>
              ) : (
                (events || []).map(event => (
                  <div key={event.id} className="bg-slate-50 p-3 rounded-2xl flex items-start gap-3">
                    <span className="text-xl mt-0.5 leading-none">{event.icon}</span>
                    <div>
                      <div className="text-[13px] font-bold text-slate-900 leading-tight">{event.action_title}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                        {new Date(event.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} • {event.keeper_name}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
`;

// Insert after the last closing div of the main container, but before the final outer div.
// DailyShiftPage's main return ends around line 1332.
// Let's add state for eventLogOpen first
code = code.replace(/const \[isReplenishModalOpen, setReplenishModalOpen\] = useState\(false\);/, 
  `const [isReplenishModalOpen, setReplenishModalOpen] = useState(false);
  const [eventLogOpen, setEventLogOpen] = useState(false);`);

code = code.replace(/<div className="snap-start h-\[calc\(100dvh-3\.5rem\)\] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-center">\s*\{\/\* 7\. НИЖНЯЯ ПАНЕЛЬ: КНОПКА \[ ЗАВЕРШИТЬ СМЕНУ \] \*\/\}/, 
  badgeComponent + 
  `\n      <div className="snap-start h-[calc(100dvh-3.5rem)] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-center">
        {/* 7. НИЖНЯЯ ПАНЕЛЬ: КНОПКА [ ЗАВЕРШИТЬ СМЕНУ ] */`);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
