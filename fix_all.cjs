const fs = require('fs');
let code = fs.readFileSync('src/components/ElephantPhysiology.tsx', 'utf8');
const objMap = `[{id: 'brisk', label: 'Бодрое', emoji: '💪', activeClass: 'bg-emerald-600 border-emerald-500 text-white shadow-md'},
  {id: 'lethargic', label: 'Вялое', emoji: '🥱', activeClass: 'bg-rose-600 border-rose-500 text-white shadow-md'},
  {id: 'aggressive', label: 'Агрессивное', emoji: '💢', activeClass: 'bg-amber-600 border-amber-500 text-white shadow-md'},
  {id: 'calm', label: 'Спокойное', emoji: '😌', activeClass: 'bg-sky-600 border-sky-500 text-white shadow-md'},
  {id: 'playful', label: 'Игривое', emoji: '🎈', activeClass: 'bg-indigo-600 border-indigo-500 text-white shadow-md'}].map`;
code = code.replace(/\['Бодрое', 'Вялое', 'Агрессивное', 'Спокойное', 'Игривое'\]\.map/g, objMap);
fs.writeFileSync('src/components/ElephantPhysiology.tsx', code);

let ds = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
ds = ds.replace(/CheckCircle2/g, 'CheckCircle');
ds = ds.replace(/onActionAssigned=\{handleActionAssigned\}/g, '');
ds = ds.replace(/dateInputRef\.current\.click\(\);/g, 'if(dateInputRef.current && "click" in dateInputRef.current) (dateInputRef.current as HTMLInputElement).click();');
fs.writeFileSync('src/screens/DailyShiftPage.tsx', ds);
