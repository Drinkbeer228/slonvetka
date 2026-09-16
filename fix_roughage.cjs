const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Add states: distributed and lastUpdatedTime, hayWatered
code = code.replace(
  /const \[inventory, setInventory\] = useState<any>\(\{ bales: 42, rolls: 8, branches: 15 \}\);/,
  `const [inventory, setInventory] = useState<any>({ bales: 42, rolls: 8, branches: 15 });
  const [distributed, setDistributed] = useState<any>({ bales: 0, rolls: 0, branches: 0 });
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('--:--');
  const [hayWatered, setHayWatered] = useState(false);`
);

// 2. Add handleDistribute logic (we will just replace `updateInventory` entirely)
code = code.replace(
  /const updateInventory = \(field: string, val: number\) => \{[\s\S]*?addEvent\(`Склад: \$\{field\} \$\{val > 0 \? '\+' : ''\}\$\{val\}`\);\n  \};/,
  `const handleDistribute = (field: string, delta: number) => {
    if (delta > 0) {
      if (inventory[field] < delta) return;
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(\`Роздано: \${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (+1)\`);
    } else {
      if (distributed[field] < Math.abs(delta)) return;
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(\`Возврат на склад: \${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (-1)\`);
    }
    setLastUpdatedTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  };`
);

// 3. Replace the entire JSX block for Reel 2
const oldReel2Start = '<div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">';
const oldReel2Regex = /<div className="flex justify-between items-center bg-slate-900\/80 p-3 rounded-2xl border border-slate-800">[\s\S]*?<button onClick=\{\(\) => \{ addEvent\('Зафиксирована дача грубых кормов'\); setRoughageFixed\(true\); \}\} className=\{`w-full mt-4 py-3\.5 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all \$\{roughageFixed \? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-200 active:bg-slate-700'\}\`\}>\n            \{roughageFixed \? <Check className="w-5 h-5"\/> : null\}\n            Зафиксировать дневную дачу\n          <\/button>/;

const newReel2 = `<div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-sm font-medium text-slate-300">Остаток на складе: Тюки {inventory.bales} шт | Рулоны {inventory.rolls} шт</span>
            <button onClick={() => { setInvDraft(inventory); setInventoryOpen(true); }} className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация</button>
          </div>

          <p className="text-center text-sm font-semibold text-slate-400 mt-2 mb-1">Роздано слонам за смену</p>
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
                <button onClick={() => handleDistribute(col.id, 1)} className="h-[52px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-t-xl active:bg-amber-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center">
                  +
                </button>
                <div className="text-3xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {distributed[col.id]}
                </div>
                <button onClick={() => handleDistribute(col.id, -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center">
                  -
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => toggleHayIssue('dusty')} className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \${hayIssues.includes('dusty') ? 'border-amber-400 bg-amber-500 text-slate-900 shadow-md' : 'border-amber-800 bg-amber-950/40 text-amber-300'}\`}>
              ⚠️ Пыльное / Сухое
            </button>
            <button onClick={() => toggleHayIssue('mold')} className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \${hayIssues.includes('mold') ? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950/40 text-rose-300'}\`}>
              🍄 Плесень / Гниль (+📷 Фото)
            </button>
          </div>

          {hayIssues.includes('dusty') && (
            <div className="mt-2 bg-sky-950/40 border border-sky-800 p-2.5 rounded-xl animate-slide-up flex flex-col gap-3">
              <p className="text-xs text-sky-200 font-medium leading-relaxed">
                🚿 <strong>Протокол обеспыливания:</strong> тщательно пролить сено водой из шланга перед дачей!
              </p>
              <button 
                onClick={() => {
                  if(!hayWatered) {
                    setHayWatered(true);
                    addEvent('Сено обеспылено водой');
                    setLastUpdatedTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                  }
                }} 
                className={\`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 \${hayWatered ? 'bg-sky-500 text-white shadow-md border border-sky-400' : 'bg-sky-900/50 text-sky-300 border border-sky-700'}\`}
              >
                {hayWatered ? '💧 Пролито / Замочено (✓)' : '💧 Пролито / Замочено'}
              </button>
            </div>
          )}

          {lastUpdatedTime !== '--:--' && (
            <p className="text-center text-xs text-slate-500 mt-6 mb-2">Автосохранение в лог смены • {lastUpdatedTime}</p>
          )}`;

code = code.replace(oldReel2Regex, newReel2);

fs.writeFileSync(file, code);
