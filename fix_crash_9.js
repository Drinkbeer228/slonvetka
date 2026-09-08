import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /const url = p\.storage_path\.startsWith\('blob:'\)/g,
  "const url = (p.storage_path || '').startsWith('blob:')"
);
code = code.replace(
  /const thumbUrl = p\.storage_path\.startsWith\('blob:'\)/g,
  "const thumbUrl = (p.storage_path || '').startsWith('blob:')"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed storage_path null check');
