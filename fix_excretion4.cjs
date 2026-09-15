const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ExcretionControl.tsx', 'utf8');

// Remove header with badge
code = code.replace(/<div className="flex items-center justify-between px-0\.5 mb-2\.5">[\s\S]*?<\/div>/, `<div className="font-bold text-slate-900 text-sm tracking-tight px-1 mb-2">
            Характер и особенности
          </div>`);

// Replace chipClasses logic
code = code.replace(/let chipClasses = 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200\/70 dark:bg-slate-800\/60 dark:text-slate-300 dark:border-slate-700';[\s\S]*?(?=return \()/m, 
`let chipClasses = 'bg-white text-slate-700 border border-slate-200 shadow-sm';
            if (isSelected) {
              if (isWarning) {
                chipClasses = 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300';
              } else {
                chipClasses = 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300';
              }
            } else if (isWarning) {
              chipClasses = 'bg-rose-50 text-rose-800 border border-rose-200';
            }
            `);

fs.writeFileSync('src/components/daily-shift/ExcretionControl.tsx', code);
