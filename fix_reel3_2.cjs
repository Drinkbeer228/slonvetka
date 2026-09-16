const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

const oldReel3Regex = /<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша<\/h2>[\s\S]*?<\/button>\n        <\/div>\n      <\/div>/;

const newReel3 = `<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-sm">Техпроцесс запарки</span>
              {!porridgeBrewTime ? (
                <button 
                  onClick={() => {
                    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    setPorridgeBrewTime(timeStr);
                    addEvent('Каша запарена кипятком');
                  }} 
                  className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-lg"
                >
                  ♨️ Запарить кашу
                </button>
              ) : (
                <div className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold">
                  ⏳ Запарена в {porridgeBrewTime} • Настаивается
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsAfterArena(!isAfterArena)} 
            className={\`w-full p-3 rounded-2xl flex items-center gap-2 text-sm font-bold active:scale-95 text-left transition-all \${isAfterArena ? 'bg-amber-600/30 border border-amber-500 text-amber-400' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}\`}
          >
            🎪 Слоны после манежа / силовой нагрузки
          </button>
          {isAfterArena && (
            <div className="bg-amber-950/40 border border-amber-800 p-2.5 rounded-xl animate-slide-up">
              <p className="text-xs text-amber-200 font-medium">⚠️ Выждать 45 минут, напоить водой и дать сено перед кашей!</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2 mt-2">
            {[
              { id: 'm', label: '07:00 Утро (Запарка)' },
              { id: 'n', label: '13:00 Обед (Каша / Мэш)' },
              { id: 'e', label: '19:00 Ужин (Овощной салат)' }
            ].map(slot => (
              <div key={slot.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-400">{slot.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'clean' }));
                      addEvent(\`\${slot.label}: Съедено чисто\`);
                    }} 
                    className={\`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all \${feedStatus[slot.id] === 'clean' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}\`}
                  >
                    🟢 Съедено чисто
                  </button>
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'leftovers' }));
                      addEvent(\`\${slot.label}: Есть остаток\`);
                    }} 
                    className={\`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all \${feedStatus[slot.id] === 'leftovers' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}\`}
                  >
                    🟡 Есть остаток
                  </button>
                  <button 
                    onClick={() => {
                      setFeedStatus(p => ({ ...p, [slot.id]: 'refusal' }));
                      addEvent(\`\${slot.label}: Отказ от корма\`);
                    }} 
                    className={\`text-[10px] font-bold py-2 rounded-xl active:scale-95 leading-tight transition-all \${feedStatus[slot.id] === 'refusal' ? 'bg-rose-600 text-white shadow-md animate-pulse' : 'bg-slate-900/60 border border-slate-700 text-slate-400'}\`}
                  >
                    🔴 Отказ ⚠️
                  </button>
                </div>
                {feedStatus[slot.id] === 'refusal' && (
                  <button onClick={() => addEvent('Снята нетронутая кормушка (+фото)')} className="mt-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 animate-slide-up flex justify-center gap-2 items-center active:scale-95">
                    📷 Снять нетронутую кормушку
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>`;

code = code.replace(oldReel3Regex, newReel3);

fs.writeFileSync(file, code);
