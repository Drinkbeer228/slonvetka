import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /const recordDateStr = qr\.payload\.performed_at\.split\('T'\)\[0\];/g,
  "const recordDateStr = (qr.payload.performed_at || '').split('T')[0];"
);
code = code.replace(
  /new Date\(rec\.performed_at\)/g,
  "new Date(rec.performed_at || Date.now())"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed performed_at null check');
