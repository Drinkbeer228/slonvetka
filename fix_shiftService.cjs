const fs = require('fs');
let code = fs.readFileSync('src/services/shiftService.ts', 'utf8');

code = code.replace(/sleep_minutes: m\.sleep_minutes != null \? m\.sleep_minutes : 0,/g, '');
code = code.replace(/const sleepMinutes = m\.sleep_minutes != null \? m\.sleep_minutes : 0;/g, '');
code = code.replace(/sleep_minutes: sleepMinutes,/g, 'sleep_state: m.sleep_state,');
code = code.replace(/metric\.sleep_minutes = clampSleepMinutes\(metric\.sleep_minutes \?\? 0\);/g, '');
code = code.replace(/\/\/ sleep_minutes сохраняется в sleep_minutes \(не в behavior_score!\)/g, '');
code = code.replace(/sleep_minutes: normalized\.sleep_minutes,/g, "sleep_state: normalized.sleep_state,");
code = code.replace(/sleep_minutes: clampSleepMinutes\(rawMetric\.sleep_minutes \?\? 0\),/g, 'sleep_state: rawMetric.sleep_state,');

// replace occurrences of sleep_minutes in selects
code = code.replace(/sleep_minutes, /g, 'sleep_state, ');
code = code.replace(/sleep_minutes\?\: number;/g, 'sleep_state?: any;');

code = code.replace(/const hasSleep = shiftsMetrics\.some\(\(m\) =>\n\s*\(m\.sleep_minutes != null && m\.sleep_minutes > 0\)\n\s*\);/g, `const hasSleep = shiftsMetrics.some((m) =>
    (m.sleep_state?.duration != null)
  );`);

fs.writeFileSync('src/services/shiftService.ts', code);
