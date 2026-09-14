const fs = require('fs');
let file = 'src/components/daily-shift/DynamicCounterSection.tsx';
let code = fs.readFileSync(file, 'utf8');

// Merits block
code = code.replace(
  /className="bg-emerald-500\/\[0\.07\] backdrop-blur-2xl border border-emerald-400\/30 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden"/,
  'className="bg-emerald-500/[0.07] backdrop-blur-2xl border border-emerald-400/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-visible pt-6"'
);
code = code.replace(
  /<h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">/,
  '<h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">'
);

// Damages block
code = code.replace(
  /className="bg-rose-500\/\[0\.07\] backdrop-blur-2xl border border-rose-300\/40 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden"/,
  'className="bg-rose-500/[0.07] backdrop-blur-2xl border border-rose-300/40 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-visible pt-6"'
);
code = code.replace(
  /<h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">/,
  '<h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">'
);

fs.writeFileSync(file, code);
