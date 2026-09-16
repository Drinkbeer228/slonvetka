const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Add state
code = code.replace(
  /const \[logOpen, setLogOpen\] = useState\(false\);/,
  `const [logOpen, setLogOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [invDraft, setInvDraft] = useState({ bales: 42, rolls: 8, branches: 15 });`
);

// 2. Modify Button
code = code.replace(
  /<button className="bg-slate-800 text-slate-200 text-xs px-3 py-1\.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация<\/button>/,
  `<button onClick={() => { setInvDraft(inventory); setInventoryOpen(true); }} className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация</button>`
);

// 3. Add Modal at the bottom, just before {logOpen && (
const modalJSX = `
      {/* INVENTORY MODAL */}
      {inventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all" onClick={() => setInventoryOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /> Инвентаризация</h2>
              <button onClick={() => setInventoryOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 active:scale-95"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Тюки сена (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, bales: Math.max(0, p.bales - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.bales} onChange={e => setInvDraft(p => ({...p, bales: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, bales: p.bales + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Рулоны сена (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, rolls: Math.max(0, p.rolls - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.rolls} onChange={e => setInvDraft(p => ({...p, rolls: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, rolls: p.rolls + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Веточный корм (шт)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setInvDraft(p => ({...p, branches: Math.max(0, p.branches - 1)}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">-</button>
                  <input type="number" value={invDraft.branches} onChange={e => setInvDraft(p => ({...p, branches: parseInt(e.target.value) || 0}))} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl h-12 text-center text-xl font-bold text-slate-100" />
                  <button onClick={() => setInvDraft(p => ({...p, branches: p.branches + 1}))} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xl active:scale-95 border border-slate-700">+</button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setInventory(invDraft);
                setInventoryOpen(false);
                addEvent(\`Проведена инвентаризация: Тюки \${invDraft.bales}, Рулоны \${invDraft.rolls}, Веточный корм \${invDraft.branches}\`);
              }} 
              className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl active:scale-95 transition-all text-lg shadow-lg shadow-emerald-900/50"
            >
              Сохранить остатки
            </button>
          </div>
        </div>
      )}
`;

code = code.replace(
  /\{logOpen && \(/,
  modalJSX + "\n      {logOpen && ("
);

fs.writeFileSync(file, code);
