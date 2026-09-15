const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Add state for the two buttons
code = code.replace(
  /const \[physioTab, setPhysioTab\] = useState<'poop'\|'urine'\|'sleep'>\('poop'\);/,
  `const [physioTab, setPhysioTab] = useState<'poop'|'urine'|'sleep'>('poop');
  
  // Reel 2 state
  const [hayIssues, setHayIssues] = useState<string[]>([]);
  
  const toggleHayIssue = (issue: string) => {
    setHayIssues(prev => {
      if (prev.includes(issue)) return prev.filter(i => i !== issue);
      addEvent('Зафиксировано: ' + issue);
      return [...prev, issue];
    });
  };`
);

// 2. Replace the buttons in Reel 2 to use the state
code = code.replace(
  /<div className="grid grid-cols-2 gap-2 mt-2">\s*<button onClick=\{\(\) => addEvent\('⚠️ Пыльное \/ Прелое сено'\)\} className="p-3 rounded-2xl border border-amber-800 bg-amber-950\/40 text-amber-300 text-xs font-bold active:scale-95 text-left">\s*⚠️ Пыльное \/ Прелое сено\s*<\/button>\s*<button onClick=\{\(\) => addEvent\('🍄 Плесень в тюке \(\+Фото\)'\)\} className="p-3 rounded-2xl border border-rose-800 bg-rose-950\/40 text-rose-300 text-xs font-bold active:scale-95 text-left">\s*🍄 Плесень в тюке \(\+📷 Фото\)\s*<\/button>\s*<\/div>/,
  `<div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => toggleHayIssue('dusty')} className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \${hayIssues.includes('dusty') ? 'border-amber-400 bg-amber-500 text-slate-900 shadow-md' : 'border-amber-800 bg-amber-950/40 text-amber-300'}\`}>
              ⚠️ Пыльное / Прелое сено
            </button>
            <button onClick={() => toggleHayIssue('mold')} className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all \${hayIssues.includes('mold') ? 'border-rose-400 bg-rose-500 text-white shadow-md' : 'border-rose-800 bg-rose-950/40 text-rose-300'}\`}>
              🍄 Плесень в тюке (+📷 Фото)
            </button>
          </div>`
);

// 3. Fix the bottom padding on all reel sections
// change `pb-6` to `pb-24` across all reel sections so there's enough space for the floating log badge
code = code.replace(/pb-6 box-border/g, 'pb-24 box-border');

// Also, the "Зафиксировать дневную дачу" button isn't a state toggle, but it can trigger an animation or color change.
// Let's add a state for it just so it gives feedback.
code = code.replace(
  /const \[hayIssues, setHayIssues\] = useState<string\[\]>\(\[\]\);/,
  `const [hayIssues, setHayIssues] = useState<string[]>([]);
  const [roughageFixed, setRoughageFixed] = useState(false);`
);

code = code.replace(
  /<button onClick=\{\(\) => addEvent\('Зафиксирована дача грубых кормов'\)\} className="w-full mt-4 py-3\.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold active:bg-slate-700 flex items-center justify-center gap-2">/,
  `<button onClick={() => { addEvent('Зафиксирована дача грубых кормов'); setRoughageFixed(true); }} className={\`w-full mt-4 py-3.5 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all \${roughageFixed ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-200 active:bg-slate-700'}\`}>
            {roughageFixed ? <Check className="w-5 h-5"/> : null}`
);

fs.writeFileSync(file, code);
