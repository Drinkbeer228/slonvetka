const fs = require('fs');
const file = 'src/components/daily-shift/ShiftSummaryModal.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\/\/ Base bonus calculation \(just for show\)[\s\S]*?const finalBonus = Math\.max\(0, baseBonus - damagePenalty\);/, '');

fs.writeFileSync(file, code);
