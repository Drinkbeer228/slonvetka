const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `
      {/* REEL 6: SOCIAL DYNAMICS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="5">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">👥 Социальная динамика</h2>
          
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
            <button className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95">Марго <ChevronDown className="w-4 h-4"/></button>
            <span className="text-slate-500 font-bold">➔</span>
            <button className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95">Одри <ChevronDown className="w-4 h-4"/></button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => addEvent('💥 Стычка / Удар хоботом')} className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">💥 Стычка / Удар хоботом</button>
            <button onClick={() => addEvent('🥐 Отобрала пайку / сено')} className="bg-amber-950/40 border border-amber-800 text-amber-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🥐 Отобрала пайку / сено</button>
            <button onClick={() => addEvent('🤗 Взаимный груминг / Игра')} className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🤗 Взаимный груминг / Игра</button>
            <button onClick={() => addEvent('👀 Ревность к киперу')} className="bg-purple-950/40 border border-purple-800 text-purple-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">👀 Ревность к киперу</button>
            <button onClick={() => addEvent('💤 Спят рядом (контакт)')} className="bg-blue-950/40 border border-blue-800 text-blue-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">💤 Спят рядом (контакт)</button>
            <button onClick={() => addEvent('🔊 Трубный глас')} className="bg-orange-950/40 border border-orange-800 text-orange-300 p-3 rounded-2xl text-xs font-bold active:scale-95 text-left">🔊 Трубный глас / Рокот</button>
          </div>
        </div>
      </div>

      {/* REEL 7: HANDOVER & TIMER */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="6">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🏁 Сдача дежурства</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Куч за смену:</span> <span className="text-emerald-400">{(metrics['margo']?.poop_count || 0) + (metrics['audrey']?.poop_count || 0) + (metrics['pretty']?.poop_count || 0)}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Вывезено тачек:</span> <span className="text-emerald-400">{inventory.barrows || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Роздано тюков:</span> <span className="text-emerald-400">{inventory.bales || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Инциденты:</span> <span className="text-rose-400">2</span></div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-200">
              <span>Чек-лист задач:</span>
              <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-800">8 / 8 выполнено</span>
            </div>
          </div>

          <div className="text-5xl font-black font-mono tracking-wider text-center py-4 rounded-3xl bg-slate-900 border border-emerald-500/30 text-emerald-400 my-2">
            14:23:05
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <button onClick={() => addEvent('Замечание: 🧹 Не вынесен навоз')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🧹 Не вынесен навоз</button>
            <button onClick={() => addEvent('Замечание: 🌾 Мало сена на ночь')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🌾 Мало сена на ночь</button>
            <button onClick={() => addEvent('Замечание: 🚰 Течь поилки')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">🚰 Течь поилки</button>
            <button onClick={() => addEvent('📷 Фото косяка')} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95">📷 Фото косяка</button>
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500 rounded-full h-[60px] relative overflow-hidden flex items-center justify-center mt-auto" onClick={handleHandover}>
            <span className="text-emerald-400 font-bold z-10 pointer-events-none">🛑 Сдвиньте для сдачи смены ➔➔➔</span>
            <div className="absolute left-1 top-1 bottom-1 w-12 bg-emerald-500 rounded-full cursor-pointer flex items-center justify-center">
              <span className="text-slate-900 font-black">➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWERS AND MODALS */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Меню</h2>
            <button onClick={() => { setMenuOpen(false); onNavigate('dashboard'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Stethoscope className="w-5 h-5 text-emerald-400"/> Веткабинет</button>
            <button onClick={() => { setMenuOpen(false); onNavigate('feed_inventory'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Package className="w-5 h-5 text-amber-400"/> Склад кормов</button>
            <button onClick={() => { setMenuOpen(false); setWheelOpen(true); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><Users className="w-5 h-5 text-purple-400"/> Жребий смены</button>
            <button onClick={() => { setMenuOpen(false); onNavigate('archive'); }} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200"><ClipboardList className="w-5 h-5 text-slate-400"/> Архив смен</button>
          </div>
        </div>
      )}

      {wheelOpen && (
        <ShiftWheelModal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} onActionAssigned={(a, p) => addEvent(\`Жребий: \${a} ➔ \${p}\`)} />
      )}

      {logOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setLogOpen(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl h-2/3 p-4 flex flex-col gap-2 animate-in slide-in-from-bottom border-t border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-2">Лента событий</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <div className="text-slate-500 text-center py-10 font-bold">Событий пока нет</div>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-emerald-400 text-xs font-bold mb-1">{ev.time}</div>
                    <div className="text-slate-200 font-medium text-sm">{ev.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;
fs.appendFileSync(file, code);
