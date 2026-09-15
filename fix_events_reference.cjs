const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Replace (events || []) with (shiftEvents || [])
code = code.replace(/\(events \|\| \[\]\)/g, '(shiftEvents || [])');

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
