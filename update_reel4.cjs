const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add new states
const newStates = `  const [washedElephants, setWashedElephants] = useState<string[]>([]);
  const [dungWheelbarrows, setDungWheelbarrows] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<string>('Метла');
  const [incidentCount, setIncidentCount] = useState<number>(0);
  const [spotWash, setSpotWash] = useState<{ elephant: string; zone: string } | null>(null);`;

// Insert after activeVetTab to keep them together
code = code.replace(/const \[activeVetTab, setActiveVetTab\] = useState\('margo'\);/, `const [activeVetTab, setActiveVetTab] = useState('margo');\n${newStates}`);

// 2. Replace Reel 4
const reel4Regex = /<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты<\/h2>[\s\S]*?<\/div>\n      <\/div>\n\n      \{\/\* REEL 5: VET & STEREOTYPIES \*\/\}/;

const newReel4 = `<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты</h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-300">Помывка (душ)</span>
               <span className="text-xs font-bold text-emerald-400">Помыто: {washedElephants.length}/3</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'margo', label: 'Марго' },
                { id: 'audrey', label: 'Одри' },
                { id: 'pretty', label: 'Прэтти' }
              ].map(el => {
                 const isWashed = washedElephants.includes(el.id);
                 return (
                   <button 
                     key={el.id}
                     onClick={() => {
                       if (!isWashed) {
                         setWashedElephants(p => [...p, el.id]);
                         addEvent(\`Помыта \${el.label} (душ)\`);
                       } else {
                         setWashedElephants(p => p.filter(id => id !== el.id));
                       }
                     }}
                     className={\`py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border \${isWashed ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-800/50 border-slate-700 text-slate-400'}\`}
                   >
                     🐘 {el.label} {isWashed ? '🚿' : ''}
                   </button>
                 );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button 
              onClick={() => {
                setCarpetsCleaned(!carpetsCleaned);
                if (!carpetsCleaned) addEvent('🧼 Ковры зачищены');
              }} 
              className={\`border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all \${carpetsCleaned ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-300'}\`}
            >
              <span className="text-2xl">{carpetsCleaned ? '✓' : '🧼'}</span>
              <span className="text-xs font-bold text-center">Ковры зачищены</span>
              {carpetsCleaned && <span className="text-[9px] font-black bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 mt-1">+25 XP в карму смены</span>}
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-300 text-center">🚜 Вывезено тачек</span>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                    if(dungWheelbarrows > 0) {
                        setDungWheelbarrows(p => p - 1);
                        addEvent('Отмена тачки');
                    }
                }} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 text-slate-300">-</button>
                <span className="text-2xl font-black font-mono text-white">{dungWheelbarrows}</span>
                <button onClick={() => {
                    setDungWheelbarrows(p => p + 1);
                    addEvent('Вывезена тачка навоза (+1)');
                }} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95 text-slate-300">+</button>
              </div>
            </div>

            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300 mb-2 block">🚿 Точечная замывка (выбран: {activeVetTab === 'margo' ? 'Марго' : activeVetTab === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
              <div className="flex gap-2">
                {['Ноги', 'Круп', 'Бок'].map(zone => {
                  const isActive = spotWash?.elephant === activeVetTab && spotWash?.zone === zone;
                  return (
                    <button 
                      key={zone}
                      onClick={() => {
                        setSpotWash({ elephant: activeVetTab, zone });
                        const eName = activeVetTab === 'margo' ? 'Марго' : activeVetTab === 'audrey' ? 'Одри' : 'Прэтти';
                        addEvent(\`🚿 Замывка (\${eName}): \${zone}\`);
                      }} 
                      className={\`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border \${isActive ? 'bg-sky-600 border-sky-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'}\`}
                    >
                      {zone}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 rounded-2xl p-3 border border-rose-900/50 mt-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">Барабан поломок и ЧП</span>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инцидентов: {incidentCount}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 my-2">
              {['Метла', 'Ведро', 'Пастух', 'Шланг', 'Багор', 'Засов'].map((inc) => {
                const isActive = selectedIncident === inc;
                return (
                  <button 
                    key={inc} 
                    onClick={() => setSelectedIncident(inc)} 
                    className={\`p-2 border rounded-xl text-xs font-bold active:scale-95 text-center transition-all \${isActive ? 'bg-rose-600 border-rose-500 text-white shadow-md ring-2 ring-rose-400' : 'bg-rose-900/40 border-rose-800 text-rose-300'}\`}
                  >
                    {inc}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={() => {
                setIncidentCount(p => p + 1);
                addEvent(\`ЧП: \${selectedIncident} поврежден(а)\`);
                if (navigator.vibrate) navigator.vibrate(50);
              }}
              className="mt-2 w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              +1 Зафиксировать ЧП
            </button>
          </div>
        </div>
      </div>

      {/* REEL 5: VET & STEREOTYPIES */}`;

code = code.replace(reel4Regex, newReel4);

fs.writeFileSync(file, code);
