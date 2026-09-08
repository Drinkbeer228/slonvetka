import fs from 'fs';
let code = fs.readFileSync('src/services/shiftService.ts', 'utf8');

// when reading from Supabase
code = code.replace(
  /behavior: m\.behavior \|\| \(m\.behavior_score === 1 \? 'Грустная \/ Вялая' : m\.behavior_score === 3 \? 'Бодрая \/ Отличный аппетит' : 'Спокойная \/ В норме'\)/g,
  `behavior: m.behavior || (m.behavior_score === 1 ? 'Грустная / Вялая' : m.behavior_score === 3 ? 'Бодрая / Отличный аппетит' : 'Спокойная / В норме'),
              sleep_minutes: m.behavior_score && m.behavior_score > 10 ? m.behavior_score : 420`
);

fs.writeFileSync('src/services/shiftService.ts', code);
console.log('Patched shiftService read');
