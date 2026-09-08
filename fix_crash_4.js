import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /const m = metrics\[elephant.id\];/g,
  "const m = metrics[elephant.id] || {};"
);

// We need to ensure we don't crash when rendering the Quick Summary either, just in case.
// Also, is there another map or iteration that crashes? Let's check `sed -n '600,660p'` output.
