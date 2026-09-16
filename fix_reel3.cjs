const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. New states for timer and photos
const newStates = `  const [porridgeBrewTimestamp, setPorridgeBrewTimestamp] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [refusePhotos, setRefusePhotos] = useState<Record<string, string>>({});
  const [activeRefuseSlot, setActiveRefuseSlot] = useState<string | null>(null);
  const refusePhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);`;

// Insert after porridgeBrewTime
code = code.replace(/  const \[porridgeBrewTime, setPorridgeBrewTime\] = useState<string \| null>\(null\);/, `  const [porridgeBrewTime, setPorridgeBrewTime] = useState<string | null>(null);\n${newStates}`);

// 2. Replace Reel 3
const reel3Regex = /\{\/\* REEL 3: RATION & MASH \*\/\}[\s\S]*?<\/div>\n      <\/div>\n\n      \{\/\* REEL 4: CHORES & INCIDENTS \*\/\}/;

const newReel3 = `{/* REEL 3: RATION & MASH */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="2">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🥣 Концентраты, каша</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-slate-300 text-sm">Техпроцесс запарки</span>
              {!porridgeBrewTime ? (
                <button 
                  onClick={() => {
                    const now = Date.now();
                    const timeStr = new Date(now).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    setPorridgeBrewTimestamp(now);
                    setPorridgeBrewTime(timeStr);
                    addEvent('Каша запарена кипятком');
                  }} 
                  className="bg-emerald-600 text-white px-3 py-3 rounded-xl text-xs font-bold active:scale-95 shadow-lg w-full text-center"
                >
                  ♨️ Запарить кашу
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {(() => {
                    const elapsedMins = porridgeBrewTimestamp ? Math.floor((currentTime - porridgeBrewTimestamp) / 60000) : 0;
                    
                    if (elapsedMins >= 150) {
                      return (
                        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span className="text-sm">⚠️ Проверь температуру / не закисла ли!</span>
                        </div>
                      );
                    } else if (elapsedMins >= 45) {
                      return (
                        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span className="text-sm">🟢 Каша настоялась и остыла (готова к раздаче)</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-3 rounded-xl text-xs font-bold flex flex-col gap-1 items-center text-center">
                           <span>⏳ Запарена в {porridgeBrewTime} (прошло {elapsedMins} мин)</span>
                           <span>Настаивается...</span>
                        </div>
                      );
                    }
                  })()}
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
              <p className="text-xs text-amber-200 font-medium leading-relaxed">⚠️ Слоны остывают 45 минут! Сено можно сразу. Поение водой и раздача каши — строго после остывания.</p>
            </div>
          )}
          
          <input 
            ref={refusePhotoInputRef} 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && activeRefuseSlot) {
                const url = URL.createObjectURL(e.target.files[0]);
                setRefusePhotos(p => ({ ...p, [activeRefuseSlot]: url }));
                
                const slotLabels: any = { m: 'Утро', n: 'Обед', e: 'Ужин' };
                addEvent(\`Отказ от концентратов (\${slotLabels[activeRefuseSlot]}) + фото\`);
                setActiveRefuseSlot(null);
                if (navigator.vibrate) navigator.vibrate(50);
              }
            }} 
          />

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
                  <div className="mt-1 animate-slide-up flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (!refusePhotos[slot.id]) {
                          setActiveRefuseSlot(slot.id);
                          refusePhotoInputRef.current?.click();
                        }
                      }} 
                      className={\`py-2 rounded-xl text-xs font-bold border transition-all flex justify-center gap-2 items-center active:scale-95 \${refusePhotos[slot.id] ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'}\`}
                    >
                      {refusePhotos[slot.id] ? '📷 Кормушка сфотографирована ✓' : '📷 Снять нетронутую кормушку'}
                    </button>
                    
                    {refusePhotos[slot.id] && (
                      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                        <img src={refusePhotos[slot.id]} alt="Отказ" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                        <button onClick={() => { 
                          setRefusePhotos(p => { const nv = {...p}; delete nv[slot.id]; return nv; }); 
                        }} className="text-xs font-bold text-rose-400 p-2 active:scale-95 bg-rose-500/10 rounded-lg">Удалить</button>
                        <button onClick={() => {
                          setActiveRefuseSlot(slot.id);
                          refusePhotoInputRef.current?.click();
                        }} className="text-xs font-bold text-sky-400 p-2 active:scale-95 bg-sky-500/10 rounded-lg">Переснять</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REEL 4: CHORES & INCIDENTS */}`;

code = code.replace(reel3Regex, newReel3);
fs.writeFileSync(file, code);
