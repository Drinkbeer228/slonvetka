const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ExcretionControl.tsx', 'utf8');

// replace the if (activeTab === 'sleep') branch
const sleepBranchRegex = /if \(activeTab === 'sleep'\) \{[\s\S]*?const field = activeTab === 'stool' \? 'poop_count' : 'urination_count';/m;
code = code.replace(sleepBranchRegex, `if (activeTab === 'sleep') { return null; } const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';`);

// replace formatTotalSleepHours usage
code = code.replace(/activeTab === 'sleep' \? formatTotalSleepHours\(totalCount\) : totalCount/g, "totalCount");

// replace totalCount logic
code = code.replace(/if \(activeTab === 'sleep'\) return acc \+ \(metrics\?\.\[e\.id\]\?\.sleep_minutes \?\? 0\);/g, "if (activeTab === 'sleep') return acc;");

// remove handleIncrementSleep and handleDecrementSleep
code = code.replace(/const handleIncrementSleep[\s\S]*?const handleDecrementSleep[\s\S]*?const handlePhotoCapture/m, 'const handlePhotoCapture');

fs.writeFileSync('src/components/daily-shift/ExcretionControl.tsx', code);
