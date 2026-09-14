const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/isReadOnlyMode/g, 'isArchiveOrOtherKeeper');

fs.writeFileSync(file, code);
