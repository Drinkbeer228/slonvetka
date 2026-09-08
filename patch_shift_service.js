import fs from 'fs';
let code = fs.readFileSync('src/services/shiftService.ts', 'utf8');

// when reading from Supabase
code = code.replace(
  /behavior: m\.behavior \|\|.*?\}\;/g,
  `behavior: m.behavior || (m.behavior_score === 1 ? 'Грустная / Вялая' : m.behavior_score === 3 ? 'Бодрая / Отличный аппетит' : 'Спокойная / В норме'),
              sleep_minutes: m.behavior_score && m.behavior_score > 10 ? m.behavior_score : 420
            };`
);

// when reading from IDB
code = code.replace(
  /metricsMap\[m\.elephant_id\] = m;/g,
  `metricsMap[m.elephant_id] = { ...m, sleep_minutes: m.sleep_minutes ?? (m.behavior_score && m.behavior_score > 10 ? m.behavior_score : 420) };`
);

// when saving to Supabase
code = code.replace(
  /const metricsArray = Object\.values\(metricsMap\);/g,
  `const metricsArray = Object.values(metricsMap).map(m => {
        const { sleep_minutes, ...rest } = m;
        return {
          ...rest,
          behavior_score: sleep_minutes
        };
      });`
);

fs.writeFileSync('src/services/shiftService.ts', code);
console.log('Patched shiftService');
