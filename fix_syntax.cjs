const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
code = code.replace(/sState\.duration  sState\.duration === '❌ Не легла';/g, "sState.duration === '❌ Не легла';");
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
