const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Replace Reel 5 States
// First, remove old vet states if possible. Or just insert new ones next to activeVetTab.
const stateInsert = `  const [selectedVetElephant, setSelectedVetElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [hoofCare, setHoofCare] = useState<Record<string, { foot: string | null, photoBefore: boolean, photoAfter: boolean }>>({ margo: { foot: null, photoBefore: false, photoAfter: false }, audrey: { foot: null, photoBefore: false, photoAfter: false }, pretty: { foot: null, photoBefore: false, photoAfter: false } });
  const [vetTaskDone, setVetTaskDone] = useState<Record<string, boolean>>({ margo: false, audrey: false, pretty: false });
  const [stereotypyMode, setStereotypyMode] = useState<Record<string, 'normal' | 'abnormal'>>({ margo: 'normal', audrey: 'normal', pretty: 'normal' });
  const [lameLeg, setLameLeg] = useState<Record<string, string | null>>({ margo: null, audrey: null, pretty: null });
  const [symptoms, setSymptoms] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });`;

// Replace `const [activeVetTab...` with our new states but keep others.
code = code.replace(/  const \[activeVetTab, setActiveVetTab\] = useState\('margo'\);/, stateInsert);
// activeVetTab is used in Reel 4 for spotWash now! Wait. "Точечная замывка (выбран: {activeVetTab === 'margo'..."
// If I remove activeVetTab, Reel 4 will break!
// I must replace activeVetTab with selectedVetElephant in the whole file.
code = code.replace(/activeVetTab/g, 'selectedVetElephant');

// 2. Replace Reel 5 block
const reel5Regex = /\{\/\* REEL 5: VET & STEREOTYPIES \*\/\}[\s\S]*?<\/div>\n      <\/div>\n\n      \{\/\* REEL 6: SOCIAL DYNAMICS \*\/\}/;

const newReel5 = `{/* REEL 5: VET & STEREOTYPIES */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="4">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария</h2>
          
          <div className="grid grid-cols-3 w-full p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-2">
            {[
              { id: 'margo', label: 'Марго', color: 'bg-emerald-600' },
              { id: 'audrey', label: 'Одри', color: 'bg-purple-600' },
              { id: 'pretty', label: 'Прэтти', color: 'bg-rose-600' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setSelectedVetElephant(tab.id as 'margo' | 'audrey' | 'pretty')}
                className={\`py-2 rounded-xl text-sm transition-all active:scale-95 font-medium \${selectedVetElephant === tab.id ? \`\${tab.color} text-white shadow-md font-bold\` : 'text-slate-400 hover:text-slate-200'}\`}
              >
                🐘 {tab.label}
              </button>
            ))}
          </div>

          <div className={\`border p-3 rounded-2xl flex flex-col gap-2 transition-all \${vetTaskDone[selectedVetElephant] ? 'bg-emerald-950/40 border-emerald-800' : 'bg-slate-900 border-slate-800'}\`}>
            <span className="text-xs font-bold text-slate-400">Назначения ({selectedVetElephant === 'margo' ? 'Марго' : selectedVetElephant === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
            <p className="text-sm font-medium text-slate-300">Стопа ПП: промыть хлоргексидином, нанести дегтярную мазь</p>
            <button 
              onClick={() => {
                setVetTaskDone(p => ({ ...p, [selectedVetElephant]: true }));
                addEvent(\`✅ Процедура выполнена (\${selectedVetElephant})\`);
              }} 
              className={\`mt-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all border flex items-center justify-center gap-2 \${vetTaskDone[selectedVetElephant] ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}\`}
            >
              {vetTaskDone[selectedVetElephant] ? '✓ Процедура выполнена' : 'Отметить выполнение'}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-300">Педикюр / Расчистка подошвы</span>
            <div className="flex justify-between gap-2 mt-1">
              {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(foot => {
                const isSelected = hoofCare[selectedVetElephant]?.foot === foot;
                return (
                  <button 
                    key={foot} 
                    onClick={() => {
                      setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], foot } }));
                    }}
                    className={\`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-95 border \${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400'}\`}
                  >
                    {foot}
                  </button>
                )
              })}
            </div>
            {hoofCare[selectedVetElephant]?.foot && (
              <div className="flex gap-2 mt-2 animate-slide-up">
                <button 
                  onClick={() => setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], photoBefore: true } }))}
                  className={\`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border flex justify-center items-center gap-1 \${hoofCare[selectedVetElephant].photoBefore ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}\`}
                >
                  {hoofCare[selectedVetElephant].photoBefore ? '✓ Фото ДО' : '📷 Фото ДО'}
                </button>
                <button 
                  onClick={() => setHoofCare(p => ({ ...p, [selectedVetElephant]: { ...p[selectedVetElephant], photoAfter: true } }))}
                  className={\`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border flex justify-center items-center gap-1 \${hoofCare[selectedVetElephant].photoAfter ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}\`}
                >
                  {hoofCare[selectedVetElephant].photoAfter ? '✓ Фото ПОСЛЕ' : '📷 Фото ПОСЛЕ'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <button 
              onClick={() => {
                setStereotypyMode(p => ({ ...p, [selectedVetElephant]: p[selectedVetElephant] === 'normal' ? 'abnormal' : 'normal' }));
                if (stereotypyMode[selectedVetElephant] === 'abnormal') {
                   addEvent(\`Стереотипия (\${selectedVetElephant}): Поведение нормотипичное\`);
                }
              }}
              className={\`w-full p-3 rounded-2xl border active:scale-95 text-left flex justify-between transition-all text-xs font-bold \${stereotypyMode[selectedVetElephant] === 'normal' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-amber-600/20 border-amber-500 text-amber-300'}\`}
            >
              <span>{stereotypyMode[selectedVetElephant] === 'normal' ? '✨ Поведение нормотипичное' : '⚠️ Замечена стереотипия'}</span>
              <ChevronDown className={\`w-4 h-4 transition-transform \${stereotypyMode[selectedVetElephant] === 'abnormal' ? 'rotate-180' : ''}\`} />
            </button>
            
            {stereotypyMode[selectedVetElephant] === 'abnormal' && (
              <div className="grid grid-cols-2 gap-2 animate-slide-up">
                 {['🔄 Качание (weaving)', '↕️ Кивание головой', '👣 Переступание', '🪵 Игра хоботом'].map((ster, i) => {
                   const isActive = stereotypies[selectedVetElephant]?.includes(ster);
                   return (
                     <button 
                       key={i} 
                       onClick={() => {
                         setStereotypies(p => {
                           const cur = p[selectedVetElephant] || [];
                           return { ...p, [selectedVetElephant]: isActive ? cur.filter(s => s !== ster) : [...cur, ster] };
                         });
                         if (!isActive) addEvent(\`Стереотипия (\${selectedVetElephant}): \${ster}\`);
                       }} 
                       className={\`p-3 border rounded-xl text-xs font-bold active:scale-95 text-left leading-tight transition-all \${isActive ? 'bg-amber-600 border-amber-500 text-slate-900 shadow-md' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'}\`}
                     >
                       {ster}
                     </button>
                   )
                 })}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2 mt-2">
             <span className="text-xs font-bold text-slate-300 mb-1">Симптомы и отклонения</span>
             
             <div className="flex flex-col gap-2">
               <button 
                 onClick={() => {
                   const isActive = lameness[selectedVetElephant];
                   setLameness(p => ({ ...p, [selectedVetElephant]: !isActive }));
                   if (!isActive) {
                     addEvent(\`🚨 Хромота (\${selectedVetElephant})\`);
                     if (navigator.vibrate) navigator.vibrate(50);
                   }
                 }} 
                 className={\`p-3 rounded-xl border active:scale-95 text-left flex justify-between transition-all text-xs font-bold \${lameness[selectedVetElephant] ? 'border-rose-500 bg-rose-600/30 text-rose-300' : 'border-slate-800 bg-slate-800/50 text-slate-400'}\`}
               >
                 <span>🚨 Хромота {lameLeg[selectedVetElephant] ? \`(\${lameLeg[selectedVetElephant]})\` : ''}</span>
                 <ChevronDown className={\`w-4 h-4 transition-transform \${lameness[selectedVetElephant] ? 'rotate-180' : ''}\`} />
               </button>
               {lameness[selectedVetElephant] && (
                 <div className="grid grid-cols-4 gap-2 animate-slide-up bg-slate-950/50 p-2 rounded-xl">
                    {['ПП', 'ЛП', 'ПЗ', 'ЛЗ'].map(leg => (
                      <button 
                        key={leg} 
                        onClick={() => {
                          setLameLeg(p => ({ ...p, [selectedVetElephant]: leg }));
                          addEvent(\`Хромота (\${selectedVetElephant}): \${leg}\`);
                          if (navigator.vibrate) navigator.vibrate(50);
                        }} 
                        className={\`py-2 rounded-lg text-xs font-bold transition-all border \${lameLeg[selectedVetElephant] === leg ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}\`}
                      >
                        {leg}
                      </button>
                    ))}
                 </div>
               )}
               
               <div className="grid grid-cols-3 gap-2 mt-1">
                 {['Хобот плетью', 'Сопение / Хрип', 'Секреция желез'].map(symp => {
                   const isActive = symptoms[selectedVetElephant]?.includes(symp);
                   return (
                     <button 
                       key={symp} 
                       onClick={() => {
                         setSymptoms(p => {
                           const cur = p[selectedVetElephant] || [];
                           return { ...p, [selectedVetElephant]: isActive ? cur.filter(s => s !== symp) : [...cur, symp] };
                         });
                         if (!isActive) {
                           addEvent(\`Симптом (\${selectedVetElephant}): \${symp}\`);
                           if (navigator.vibrate) navigator.vibrate(50);
                         }
                       }} 
                       className={\`py-2 px-1 border rounded-xl text-[10px] font-bold active:scale-95 text-center leading-tight transition-all \${isActive ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-800/50 border-slate-700 text-slate-400'}\`}
                     >
                       {symp}
                     </button>
                   )
                 })}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* REEL 6: SOCIAL DYNAMICS */}`;

code = code.replace(reel5Regex, newReel5);

fs.writeFileSync(file, code);
