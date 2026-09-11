const fs = require('fs');
const path = './src/components/daily-shift/FeedControl.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `{ id: 'Кабачки', label: 'Кабачки', emoji: '🥒' },`,
  `{ id: 'Кабачки', label: 'Кабачки', emoji: '🥒' },
  { id: 'Ветки', label: 'Ветки', emoji: '🌿' },
  { id: 'Веники', label: 'Веники', emoji: '🍂' },
  { id: 'Деревья', label: 'Деревья', emoji: '🌳' },
  { id: 'Бамбук', label: 'Бамбук', emoji: '🎋' },`
);

content = content.replace(
  `<h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Рацион дня</h3>`,
  `<h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Рацион</h3>`
);

fs.writeFileSync(path, content);
