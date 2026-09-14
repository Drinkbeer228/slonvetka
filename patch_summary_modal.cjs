const fs = require('fs');
const file = 'src/components/daily-shift/ShiftSummaryModal.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove bonus badge
const bonusRegex = /<div className="flex justify-center">\s*<div className="text-sm font-bold text-slate-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">\s*Премия за смену: \{finalBonus\} ₽ десятками\s*<\/div>\s*<\/div>/;
code = code.replace(bonusRegex, '');

// Also remove finalBonus definition if unused
code = code.replace(/const finalBonus = Math.max\(0, baseBonus \+ meritsScore - damageScore\);\n?/g, '');
code = code.replace(/const baseBonus = 150;\n?/g, '');
code = code.replace(/const meritsScore = stats\.meritsTotal \* 10;\n?/g, '');
code = code.replace(/const damageScore = stats\.damageTotal \* 50;\n?/g, '');

// Replace submit button text and add icon
const submitButtonTextRegex = /Подтвердить и закрыть день/;
code = code.replace(submitButtonTextRegex, 'Сдать дежурство (Передать смену)');

fs.writeFileSync(file, code);
