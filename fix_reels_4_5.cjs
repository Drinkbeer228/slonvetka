const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// Add states for Reel 4 and Reel 5
const stateInsert = `const [hayWatered, setHayWatered] = useState(false);
  const [porridgeBrewTime, setPorridgeBrewTime] = useState<string | null>(null);
  const [isAfterArena, setIsAfterArena] = useState(false);
  const [feedStatus, setFeedStatus] = useState<Record<string, string>>({ m: 'clean', n: 'clean', e: 'clean' });
  const [washedAll, setWashedAll] = useState(false);
  const [carpetsCleaned, setCarpetsCleaned] = useState(false);
  const [washParts, setWashParts] = useState<string[]>([]);
  const [activeVetTab, setActiveVetTab] = useState('margo');
  const [stereotypies, setStereotypies] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });
  const [lameness, setLameness] = useState<Record<string, boolean>>({ margo: false, audrey: false, pretty: false });
  const [incidents, setIncidents] = useState<string[]>([]);`;

code = code.replace(/const \[hayWatered.*setFeedStatus.*clean'\}\ \}\);/s, stateInsert);


// Reel 4 update
const reel4Regex = /<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты<\/h2>[\s\S]*?<\/button>\n          <\/div>\n        <\/div>\n      <\/div>/;

const newReel4 = `<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🧹 Хозработы и инциденты</h2>
          
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button 
              onClick={() => {
                setWashedAll(!washedAll);
                if (!washedAll) addEvent('🐘 Все 3 слона помыты');
              }} 
              className={\`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all \${washedAll ? 'bg-emerald-600/30 border-emerald-500 shadow-md text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'}\`}
            >
              <span className="text-3xl">🐘</span>
              <span className="text-xs font-bold">Все 3 помыты</span>
            </button>
            <button 
              onClick={() => {
                setCarpetsCleaned(!carpetsCleaned);
                if (!carpetsCleaned) addEvent('🧼 Ковры зачищены');
              }} 
              className={\`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all \${carpetsCleaned ? 'bg-emerald-600/30 border-emerald-500 shadow-md text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'}\`}
            >
              <span className="text-3xl">🧼</span>
              <span className="text-xs font-bold">Ковры зачищены</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center col-span-2">
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xs font-bold text-slate-300">🚜 Вывезено тачек:</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateInventory('barrows', -1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95">-</button>
                  <span className="text-2xl font-black font-mono">{inventory.barrows || 0}</span>
                  <button onClick={() => updateInventory('barrows', 1)} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-lg active:scale-95">+</button>
                </div>
              </div>
            </div>
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300 mb-2 block">🚿 Замывка загрязнений:</span>
              <div className="flex gap-2">
                {['Ноги', 'Круп', 'Бок'].map(part => {
                  const isActive = washParts.includes(part);
                  return (
                    <button 
                      key={part}
                      onClick={() => {
                        setWashParts(p => isActive ? p.filter(i => i !== part) : [...p, part]);
                        if (!isActive) addEvent(\`🚿 Замывка: \${part}\`);
                      }} 
                      className={\`flex-1 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border \${isActive ? 'bg-sky-600 border-sky-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'}\`}
                    >
                      {part}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-rose-950/20 rounded-2xl p-3 border border-rose-900/50 mt-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400">Барабан поломок и ЧП</span>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инцидентов: {incidents.length}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 my-2">
              {['🧹 Метла', '🪣 Ведро', '⚡ Пастух', '🚿 Шланг', '🪝 Багор', '🚪 Засов'].map((inc, i) => {
                const isActive = incidents.includes(inc);
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                      setIncidents(p => isActive ? p.filter(i => i !== inc) : [...p, inc]);
                      if (!isActive) addEvent('ЧП: ' + inc);
                    }} 
                    className={\`p-2 border rounded-xl text-xs font-bold active:scale-95 text-center transition-all \${isActive ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-rose-900/40 border-rose-800 text-rose-300'}\`}
                  >
                    {inc}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>`;

code = code.replace(reel4Regex, newReel4);

// Reel 5 update
const reel5Regex = /<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария<\/h2>[\s\S]*?<\/button>\n        <\/div>\n      <\/div>/;

const newReel5 = `<h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🩺 Ветеринария</h2>
          
          <div className="grid grid-cols-3 w-full p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-2">
            {[
              { id: 'margo', label: 'Марго' },
              { id: 'audrey', label: 'Одри' },
              { id: 'pretty', label: 'Прэтти' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveVetTab(tab.id)}
                className={\`py-2 rounded-xl text-sm transition-all active:scale-95 font-medium \${activeVetTab === tab.id ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                🐘 {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-emerald-400">Назначения ({activeVetTab === 'margo' ? 'Марго' : activeVetTab === 'audrey' ? 'Одри' : 'Прэтти'}):</span>
            <p className="text-sm font-medium text-slate-300">Стопа ПП: промыть хлоргексидином, нанести дегтярную мазь</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => addEvent('📷 Фотоотчет процедуры')} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold active:scale-95 border border-slate-700">📷 Фотоотчет</button>
              <button onClick={() => addEvent('🦶 Фото подошв (День копыт)')} className="flex-1 bg-indigo-900/40 text-indigo-300 py-2 rounded-xl text-xs font-bold border border-indigo-800 active:scale-95">🦶 День копыт</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['🔄 Качание (weaving)', '↕️ Кивание головой', '👣 Переступание', '🪵 Игра хоботом'].map((ster, i) => {
              const isActive = stereotypies[activeVetTab]?.includes(ster);
              return (
                <button 
                  key={i} 
                  onClick={() => {
                    setStereotypies(p => {
                      const cur = p[activeVetTab] || [];
                      return { ...p, [activeVetTab]: isActive ? cur.filter(s => s !== ster) : [...cur, ster] };
                    });
                    if (!isActive) addEvent(\`Стереотипия (\${activeVetTab}): \${ster}\`);
                  }} 
                  className={\`p-3 border rounded-2xl text-xs font-bold active:scale-95 text-left leading-tight transition-all \${isActive ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}\`}
                >
                  {ster}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => {
                const isActive = lameness[activeVetTab];
                setLameness(p => ({ ...p, [activeVetTab]: !isActive }));
                if (!isActive) addEvent(\`🚨 Хромота (\${activeVetTab})\`);
              }} 
              className={\`p-3 rounded-2xl border active:scale-95 text-left flex justify-between transition-all text-xs font-bold \${lameness[activeVetTab] ? 'border-rose-500 bg-rose-600/30 text-rose-300' : 'border-amber-800 bg-amber-950/40 text-amber-300'}\`}
            >
              <span>🚨 Замечена хромота {lameness[activeVetTab] ? '(Зафиксировано)' : ''}</span>
              <ChevronDown className={\`w-4 h-4 transition-transform \${lameness[activeVetTab] ? 'rotate-180' : ''}\`} />
            </button>
            {lameness[activeVetTab] && (
              <div className="bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-xl animate-slide-up">
                 <p className="text-xs text-rose-300 font-medium mb-2">Укажите конечность:</p>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => addEvent('Хромота ПЛ')} className="py-2 bg-rose-900/40 rounded border border-rose-800 text-xs text-rose-300">ПЛ (Перед Левая)</button>
                    <button onClick={() => addEvent('Хромота ПП')} className="py-2 bg-rose-900/40 rounded border border-rose-800 text-xs text-rose-300">ПП (Перед Правая)</button>
                    <button onClick={() => addEvent('Хромота ЗЛ')} className="py-2 bg-rose-900/40 rounded border border-rose-800 text-xs text-rose-300">ЗЛ (Зад Левая)</button>
                    <button onClick={() => addEvent('Хромота ЗП')} className="py-2 bg-rose-900/40 rounded border border-rose-800 text-xs text-rose-300">ЗП (Зад Правая)</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>`;

code = code.replace(reel5Regex, newReel5);

fs.writeFileSync(file, code);
