const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/DynamicCounterSection.tsx', 'utf8');

// The wheel picker
code = code.replace(
  /<div className="flex-1 bg-white rounded-\[20px\] shadow-inner overflow-y-auto snap-y snap-mandatory border border-slate-200 scrollbar-hide py-\[50px\] relative">/,
  `<div className="flex-1 bg-white rounded-[20px] shadow-inner border border-slate-200 p-2 flex flex-col gap-2">`
);

code = code.replace(
  /<div className="absolute top-1\/2 left-0 right-0 h-\[40px\] -mt-\[20px\] bg-rose-50\/50 border-y border-rose-200 pointer-events-none"><\/div>/,
  ``
);

code = code.replace(
  /h-\[40px\] snap-center flex items-center justify-center text-sm font-bold transition-all cursor-pointer/g,
  `p-2 flex items-center justify-center text-sm font-bold transition-all cursor-pointer rounded-xl`
);

code = code.replace(
  /className="flex gap-3 h-\[140px\]"/g,
  `className="flex flex-col gap-3"`
);

// also remove any other overflow-y-auto
code = code.replace(/\boverflow-y-auto\b/g, '');

fs.writeFileSync('src/components/daily-shift/DynamicCounterSection.tsx', code);
