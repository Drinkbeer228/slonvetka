const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `
      {/* REEL 4: CHORES & INCIDENTS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="3">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты</h2>
          
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button onClick={() => addEvent('🐘 Все 3 слона помыты')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95">
              <span className="text-3xl">🐘</span>
              <span className="text-xs font-bold text-slate-300">Все 3 помыты</span>
            </button>
            <button onClick={() => addEvent('🧼 Ковры зачищены')} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95">
              <span className="text-3xl">🧼</span>
              <span className="text-xs font-bold text-slate-300">Ковры зачищены</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center col-span-2">
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xs font-bold text-slate-300">🚜 Вывезено тачек:</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateInventory('barrows', -1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg">-</button>
                  <span className="text-2xl font-black font-mono">{inventory.barrows || 0}</span>
                  <button onClick={() => updateInventory('barrows', 1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg">+</button>
                </div>
              </div>
            </div>
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300 mb-2 block">🚿 Замывка загрязнений:</span>
              <div className="flex gap-2">
                <button onClick={() => addEvent('🚿 Замывка: Ноги')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Ноги</button>
                <button onClick={() => addEvent('🚿 Замывка: Круп')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Круп</button>
                <button onClick={() => addEvent('🚿 Замывка: Бок')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">Бок</button>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 rounded-2xl p-3 border border-rose-900/50 mt-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">Барабан поломок и ЧП</span>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инцидентов: 2</span>
            </div>
            
            <div className="flex gap-3 h-36 border-y border-slate-800 my-2 overflow-y-auto snap-y snap-mandatory relative">
              <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-rose-900/20 border-y border-rose-800 pointer-events-none"></div>
              <div className="flex-1 flex flex-col gap-0 py-[52px]">
                {['🧹 Метла съедена', '🪣 Ведро растоптано', '⚡ Пастух оборван', '🚿 Шланг пробит', '🪝 Багор согнут', '🚪 Засов сломан'].map((inc, i) => (
                  <div key={i} className="h-10 snap-center flex items-center justify-center text-sm font-bold text-slate-400 cursor-pointer">{inc}</div>
                ))}
              </div>
            </div>
            
            <button onClick={() => addEvent('🚨 Зафиксировано ЧП')} className="bg-rose-600 active:bg-rose-700 text-white font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2">
              +1 Зафиксировать ЧП
            </button>
          </div>
        </div>
      </div>

      {/* REEL 5: VET & STEREOTYPIES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="4">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария</h2>
          
          <div className="grid grid-cols-3 gap-2 w-full p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {['margo', 'audrey', 'pretty'].map(eid => (
              <button key={eid} className="py-2 rounded-xl text-sm transition-all active:scale-95 text-slate-400 font-medium capitalize">
                🐘 {eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-emerald-400">Назначения (Марго):</span>
            <p className="text-sm font-medium text-slate-300">Стопа ПП: промыть хлоргексидином, нанести дегтярную мазь</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => addEvent('📷 Фотоотчет процедуры')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95">📷 Фотоотчет</button>
              <button onClick={() => addEvent('🦶 Фото подошв (День копыт)')} className="flex-1 bg-indigo-900/40 text-indigo-300 py-2 rounded-xl text-xs font-bold border border-indigo-800 active:scale-95">🦶 День копыт</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['🔄 Качание (weaving)', '↕️ Кивание головой', '👣 Переступание', '🪵 Игра хоботом'].map((ster, i) => (
              <button key={i} onClick={() => addEvent(\`Стереотипия: \${ster}\`)} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 active:scale-95 text-left leading-tight">
                {ster}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button onClick={() => addEvent('🚨 Хромота (открыт выбор лап)')} className="p-3 rounded-2xl border border-amber-800 bg-amber-950/40 text-amber-300 text-xs font-bold active:scale-95 text-left flex justify-between">
              <span>🚨 Замечена хромота</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => addEvent('Хромота: ПП')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ПП</button>
              <button onClick={() => addEvent('Хромота: ЛП')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ЛП</button>
              <button onClick={() => addEvent('Хромота: ПЗ')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ПЗ</button>
              <button onClick={() => addEvent('Хромота: ЛЗ')} className="bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-bold active:bg-amber-900">ЛЗ</button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => addEvent('⚠️ Хобот плетью')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-rose-400 active:scale-95">⚠️ Хобот плетью</button>
            <button onClick={() => addEvent('⚠️ Сопение / Хрип')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-rose-400 active:scale-95">⚠️ Сопение / Хрип</button>
            <button onClick={() => addEvent('🟡 Височные железы (секреция)')} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] font-bold text-amber-400 active:scale-95">🟡 Секреция желез</button>
          </div>
        </div>
      </div>
`;
fs.appendFileSync(file, code);
