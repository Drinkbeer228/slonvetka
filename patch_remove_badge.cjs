const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<span className=\{\`px-3 py-1 rounded-full text-\[10px\] font-bold uppercase tracking-wider flex items-center gap-1\.5 \$\{isLocked \? 'bg-slate-500\/10 text-slate-600 border border-slate-500\/20' : 'bg-emerald-500\/10 text-emerald-600 border border-emerald-500\/20'\}\`\}>\s*<span className=\{\`w-1\.5 h-1\.5 rounded-full \$\{isLocked \? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'\}\`\}><\/span>\s*\{isLocked \? 'Просмотр' : 'Ввод данных'\}\s*<\/span>/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync(path, content);
  console.log("Badge removed successfully.");
} else {
  console.log("Badge regex didn't match.");
}
