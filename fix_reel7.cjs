const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// Replace the buggy timer layout in Reel 7
code = code.replace(
  /<div className="text-5xl font-black font-mono tracking-wider text-center py-4 rounded-3xl bg-slate-900 border border-emerald-500\/30 text-emerald-400 my-2">\s*14:23:05\s*<\/div>/,
  `<div className="text-5xl font-black font-mono tracking-wider text-center py-4 rounded-3xl bg-slate-900 border border-emerald-500/30 text-emerald-400 my-2">
            23:59:05
          </div>`
);

fs.writeFileSync(file, code);
