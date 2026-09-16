const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Inject states for Mold photo
const moldStates = `  const [moldPhotoUrl, setMoldPhotoUrl] = useState<string | null>(null);
  const moldPhotoInputRef = useRef<HTMLInputElement>(null);`;
code = code.replace(/  const \[hayIssues, setHayIssues\] = useState<string\[\]>\(\[\]\);/, `  const [hayIssues, setHayIssues] = useState<string[]>([]);\n${moldStates}`);

// 2. Fix handleDistribute
const distributeOld = /  const handleDistribute = \(field: string, delta: number\) => \{[\s\S]*?setLastUpdatedTime\(new Date\(\)\.toLocaleTimeString\(\[\], \{hour: '2-digit', minute:'2-digit'\}\)\);\n  \};/;
const distributeNew = `  const handleDistribute = (field: string, delta: number) => {
    if (delta > 0) {
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(\`Выдача: \${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (+1)\`);
    } else {
      if (distributed[field] < Math.abs(delta)) return;
      setInventory(p => ({ ...p, [field]: p[field] - delta }));
      setDistributed(p => ({ ...p, [field]: p[field] + delta }));
      addEvent(\`Возврат на склад: \${field === 'bales' ? 'Тюк сена' : field === 'rolls' ? 'Рулон сена' : 'Веточный корм'} (-1)\`);
    }
    setLastUpdatedTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  };`;
code = code.replace(distributeOld, distributeNew);

// 3. Replace Reel 2 Inventory Bar
const reel2InvOld = /<div className="flex justify-between items-center bg-slate-900\/80 p-3 rounded-2xl border border-slate-800">\s*<span className="text-sm font-medium text-slate-300">Остаток на складе: Тюки \{inventory\.bales\} шт \| Рулоны \{inventory\.rolls\} шт<\/span>\s*<button onClick=\{\(\) => \{ setInvDraft\(inventory\); setInventoryOpen\(true\); \}\} className="bg-slate-800 text-slate-200 text-xs px-3 py-1\.5 rounded-lg border border-slate-700 active:scale-95">📦 Инвентаризация<\/button>\s*<\/div>/;
const reel2InvNew = `<div className={\`flex justify-between items-center p-3 rounded-2xl border \${inventory.bales < 0 || inventory.rolls < 0 ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-900/80 border-slate-800'}\`}>
            <span className={\`text-sm font-medium \${inventory.bales < 0 || inventory.rolls < 0 ? 'text-rose-400' : 'text-slate-300'}\`}>
              Остаток на складе: Тюки {inventory.bales} шт | Рулоны {inventory.rolls} шт
              {(inventory.bales < 0 || inventory.rolls < 0) && <span className="block text-xs font-bold mt-0.5 text-rose-500">⚠️ долг/не учтено</span>}
            </span>
            <button onClick={() => { setInvDraft(inventory); setInventoryOpen(true); }} className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95 whitespace-nowrap ml-2">📦 Инвентаризация</button>
          </div>`;
code = code.replace(reel2InvOld, reel2InvNew);

// 4. Replace Reel 2 Mold Button
const moldBtnOld = /<button onClick=\{\(\) => toggleHayIssue\('mold'\)\} className=\{`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \$\{hayIssues.includes\('mold'\) \? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950\/40 text-rose-300'\}`\}>\s*🍄 Плесень \/ Гниль \(\+📷 Фото\)\s*<\/button>/;
const moldBtnNew = `<input 
              ref={moldPhotoInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const url = URL.createObjectURL(e.target.files[0]);
                  setMoldPhotoUrl(url);
                  addEvent('📸 Зафиксирована плесень/гниль в сене');
                  if (!hayIssues.includes('mold')) {
                    setHayIssues(p => [...p, 'mold']);
                  }
                }
              }} 
            />
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (moldPhotoUrl) {
                    toggleHayIssue('mold');
                  } else {
                    moldPhotoInputRef.current?.click();
                  }
                }} 
                className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \${hayIssues.includes('mold') && moldPhotoUrl ? 'border-emerald-400 bg-emerald-500 text-slate-900 shadow-md flex items-center justify-between' : hayIssues.includes('mold') ? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950/40 text-rose-300'}\`}
              >
                {hayIssues.includes('mold') && moldPhotoUrl ? '🍄 Плесень зафиксирована ✓' : '🍄 Плесень / Гниль (+📷 Фото)'}
              </button>
              {moldPhotoUrl && (
                <div className="flex items-center gap-2 animate-slide-up bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                  <img src={moldPhotoUrl} alt="Плесень" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                  <button onClick={() => { setMoldPhotoUrl(null); toggleHayIssue('mold'); }} className="text-xs font-bold text-rose-400 p-2 active:scale-95 bg-rose-500/10 rounded-lg">Удалить</button>
                  <button onClick={() => moldPhotoInputRef.current?.click()} className="text-xs font-bold text-sky-400 p-2 active:scale-95 bg-sky-500/10 rounded-lg">Переснять</button>
                </div>
              )}
            </div>`;
code = code.replace(moldBtnOld, moldBtnNew);

fs.writeFileSync(file, code);
