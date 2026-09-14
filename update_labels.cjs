const fs = require('fs');
let file = 'src/components/daily-shift/DynamicCounterSection.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\{ id: 'shovels_broken', label: 'Совков сломано', emoji: '🪣', count: 0, type: 'damage' \},/,
  `{ id: 'shovels_broken', label: 'Ведер/лопат сломано', emoji: '🪣', count: 0, type: 'damage' },`
);

fs.writeFileSync(file, code);
