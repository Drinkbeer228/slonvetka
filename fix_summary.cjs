const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ElephantSummaryCard.tsx', 'utf8');

code = code.replace(/const sleepText = metrics\.sleep_minutes \? formatDuration\(metrics\.sleep_minutes\) : 'Не указан';/g, 
  "const sleepText = metrics.sleep_state?.duration || 'Нет данных';");

fs.writeFileSync('src/components/daily-shift/ElephantSummaryCard.tsx', code);
