const fs = require('fs');

// 1. types/shift.ts
let tCode = fs.readFileSync('src/types/shift.ts', 'utf8');
tCode = tCode.replace(/'<1ч' \| '1-2ч' \| '3-4ч \(норма\)' \| '>4ч' \| 'Не ложилась ⚠️'/g, 
  "'❌ Не легла' | '⏱️ 1-2ч' | '🟢 3-4ч (норма)' | '⚠️ >4ч'");
fs.writeFileSync('src/types/shift.ts', tCode);

// 2. DailyShiftPage.tsx
let dCode = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
// restore CheckCircle2 or add CheckCircle to import
dCode = dCode.replace(/CheckCircle,/g, 'CheckCircle2,');
dCode = dCode.replace(/<CheckCircle/g, '<CheckCircle2');
dCode = dCode.replace(/onActionAssigned=\{handleActionAssigned\}/g, '');
fs.writeFileSync('src/screens/DailyShiftPage.tsx', dCode);

// 3. VetDashboard.tsx
let vCode = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');
vCode = vCode.replace(/\{dashboardStates\.map\(\(\{ elephant, state, riskReasons \}\) =>/g, 
  '{dashboardStates.map(({ elephant, state, riskReasons, metric }) =>');
fs.writeFileSync('src/screens/VetDashboard.tsx', vCode);

// 4. shiftService.ts clampSleepMinutes import
let sCode = fs.readFileSync('src/services/shiftService.ts', 'utf8');
sCode = sCode.replace(/,\s*clampSleepMinutes/g, '');
sCode = sCode.replace(/clampSleepMinutes,\s*/g, '');
sCode = sCode.replace(/m\.sleep_minutes/g, 'm.sleep_state');
fs.writeFileSync('src/services/shiftService.ts', sCode);

// 5. utils/elephantHealthStatus.ts
let hCode = fs.readFileSync('src/utils/elephantHealthStatus.ts', 'utf8');
hCode = hCode.replace(/if \(metric\.sleep_minutes !== undefined && metric\.sleep_minutes < 180\) \{/g, 
  "if (metric.sleep_state?.duration === '❌ Не легла' || metric.sleep_state?.duration === '⏱️ 1-2ч') {");
fs.writeFileSync('src/utils/elephantHealthStatus.ts', hCode);

