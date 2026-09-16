const fs = require('fs');

let dailyCode = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
dailyCode = dailyCode.replace(/=== 'Не ложилась ⚠️' \|\|/g, '');
dailyCode = dailyCode.replace(/sState\.duration === 'Не ложилась ⚠️'/g, "sState.duration === '❌ Не легла'");
dailyCode = dailyCode.replace(/CheckCircle2/g, 'CheckCircle');
fs.writeFileSync('src/screens/DailyShiftPage.tsx', dailyCode);

let vetCode = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');
vetCode = vetCode.replace(/sState\.duration === 'Не ложилась ⚠️' \|\| /g, '');
vetCode = vetCode.replace(/sState\.duration === '1-2ч' \|\| sState\.duration === '<1ч' \|\| /g, '');
fs.writeFileSync('src/screens/VetDashboard.tsx', vetCode);

let healthCode = fs.readFileSync('src/utils/elephantHealthStatus.ts', 'utf8');
// remove the sleep_minutes checks
healthCode = healthCode.replace(/if \([^\{]*sleep_minutes[^\{]*\)\s*\{\s*\}\s*/g, '');
healthCode = healthCode.replace(/if \([^\{]*sleep_minutes[^\{]*\)\s*\{[^\}]*\}/g, '');
fs.writeFileSync('src/utils/elephantHealthStatus.ts', healthCode);
