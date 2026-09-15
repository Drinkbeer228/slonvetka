const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ExcretionControl.tsx', 'utf8');

code = code.replace(/<span\s*className=\{`text-\[10px\] font-black tracking-wider flex items-center justify-center gap-1 uppercase \$\{labelTextColorClass\}`\}\s*>\s*\{activeTab === 'stool' \? '💩 КУЧИ' : '💧 ЛУЖИ'\}\s*<\/span>/, '');

code = code.replace(/<span className="text-2xl font-black text-slate-950 leading-none dark:text-slate-100">\s*\{count\}\s*<\/span>/, '<span className="text-4xl font-mono font-black text-slate-950 leading-none dark:text-slate-100">{count}</span>');

fs.writeFileSync('src/components/daily-shift/ExcretionControl.tsx', code);
