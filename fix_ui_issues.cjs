const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Fix Incident Drum - remove nested scroll
// Find the block: <div className="flex gap-3 h-36 border-y border-slate-800 my-2 overflow-y-auto snap-y snap-mandatory relative">
// And replace it with a simple grid/list
code = code.replace(
  /<div className="flex gap-3 h-36 border-y border-slate-800 my-2 overflow-y-auto snap-y snap-mandatory relative">([\s\S]*?)<button onClick=\{\(\) => addEvent\('🚨 Зафиксировано ЧП'\)\}/,
  `<div className="grid grid-cols-2 gap-2 my-2">
              {['🧹 Метла', '🪣 Ведро', '⚡ Пастух', '🚿 Шланг', '🪝 Багор', '🚪 Засов'].map((inc, i) => (
                <button key={i} onClick={() => addEvent('ЧП: ' + inc)} className="p-2 bg-rose-900/40 border border-rose-800 rounded-xl text-xs font-bold text-rose-300 active:scale-95 text-center">
                  {inc}
                </button>
              ))}
            </div>
            
            <button onClick={() => addEvent('🚨 Зафиксировано ЧП')}`
);


// 3. Fix Log Badge close action
// Currently the absolute inset-0 div has: onClick={() => setLogOpen(false)}
// Let's add a visible close button to the header of the log sheet too.
code = code.replace(
  /<h2 className="text-xl font-bold text-slate-100 mb-2">Лента событий<\/h2>/,
  `<div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-100">Лента событий</h2>
              <button onClick={() => setLogOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 active:scale-95"><X className="w-5 h-5"/></button>
            </div>`
);


// 2. Add Reel 7 if it's missing or fix the one that is there.
// Ah, the issue is the reel 7 index is 6, but the floating indicator maps [0,1,2,3,4,5,6].
// Let's check if the reels exist.
fs.writeFileSync(file, code);
