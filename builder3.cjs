const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `
      {/* REEL 2: ROUGHAGE */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="1">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🌾 Грубые корма и сеновал</h2>
          
          <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-sm font-medium text-slate-300">Остаток: Тюки {inventory.bales} | Рулоны {inventory.rolls}</span>
            <button className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация</button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full">
            {[
              { id: 'bales', icon: Package, label: 'Тюки сена' },
              { id: 'rolls', icon: CircleDot, label: 'Рулоны сена' },
              { id: 'branches', icon: TreeDeciduous, label: 'Веточный корм' }
            ].map(col => (
              <div key={col.id} className="flex flex-col">
                <div className="flex flex-col items-center justify-center gap-1 mb-2">
                  <col.icon className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] font-bold text-center leading-tight text-slate-400">{col.label}</span>
                </div>
                <button onClick={() => updateInventory(col.id, 1)} className="h-[52px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-t-xl active:bg-amber-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center">
                  +
                </button>
                <div className="text-3xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {inventory[col.id]}
                </div>
                <button onClick={() => updateInventory(col.id, -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center">
                  -
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => addEvent('⚠️ Пыльное / Прелое сено')} className="p-3 rounded-2xl border border-amber-800 bg-amber-950/40 text-amber-300 text-xs font-bold active:scale-95 text-left">
              ⚠️ Пыльное / Прелое сено
            </button>
            <button onClick={() => addEvent('🍄 Плесень в тюке (+Фото)')} className="p-3 rounded-2xl border border-rose-800 bg-rose-950/40 text-rose-300 text-xs font-bold active:scale-95 text-left">
              🍄 Плесень в тюке (+📷 Фото)
            </button>
          </div>

          <button onClick={() => addEvent('Зафиксирована дача грубых кормов')} className="w-full mt-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold active:bg-slate-700 flex items-center justify-center gap-2">
            Зафиксировать дневную дачу
          </button>
        </div>
      </div>

      {/* REEL 3: RATION & MASH */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="2">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-slate-300 text-sm">Техпроцесс запарки</span>
            <button onClick={() => addEvent('♨️ Запарка каши (кипяток)')} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-lg">
              ♨️ Запарить кашу
            </button>
          </div>

          <button onClick={() => addEvent('⚠️ Слоны после манежа')} className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-2xl flex items-center gap-2 text-sm font-bold active:scale-95 text-left">
            🎪 Слоны после манежа / силовой нагрузки
          </button>
          
          <div className="flex flex-col gap-2 mt-2">
            {[
              { id: 'm', label: '07:00 Утро (Запарка)' },
              { id: 'n', label: '13:00 Обед (Каша / Мэш)' },
              { id: 'e', label: '19:00 Ужин (Овощной салат)' }
            ].map(slot => (
              <div key={slot.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 mb-2">{slot.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => addEvent(\`\${slot.label}: Съедено чисто\`)} className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] font-bold py-2 rounded-xl active:bg-emerald-900/60 leading-tight">🟢 Съедено чисто</button>
                  <button onClick={() => addEvent(\`\${slot.label}: Есть остаток\`)} className="bg-amber-950/40 border border-amber-800 text-amber-400 text-[10px] font-bold py-2 rounded-xl active:bg-amber-900/60 leading-tight">🟡 Есть остаток</button>
                  <button onClick={() => addEvent(\`\${slot.label}: Отказ от корма\`)} className="bg-rose-950/40 border border-rose-800 text-rose-400 text-[10px] font-bold py-2 rounded-xl active:bg-rose-900/60 leading-tight flex flex-col items-center justify-center">
                    <span>🔴 Отказ ⚠️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => addEvent('⚠️ Подозрение на инородный предмет в корме')} className="w-full mt-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95">
            ⚠️ Подозрение на инородный предмет в корме (+📷)
          </button>
        </div>
      </div>
`;
fs.appendFileSync(file, code);
