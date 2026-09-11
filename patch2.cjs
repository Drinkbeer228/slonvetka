const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  '<div className="text-2xl font-black text-slate-800 tracking-tight">{formattedDateLabel}</div>',
  `<button onClick={() => setIsDatePickerOpen(true)} className="text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">{formattedDateLabel} <span className="text-sm opacity-50">▼</span></button>`
);
fs.writeFileSync(path, content);
