const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/onAccept=\{\(\) => loadShiftData\(\)\}/g, 'onAccept={() => loadData()}');
code = code.replace(/onReject=\{\(\) => loadShiftData\(\)\}/g, 'onReject={() => loadData()}');

fs.writeFileSync(file, code);
