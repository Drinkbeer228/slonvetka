import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /const url = supabaseService\.getPublicUrl\(p\.storage_path\);/g,
  "const url = p.storage_path.startsWith('blob:') ? p.storage_path : supabaseService.getPublicUrl(p.storage_path);"
);
code = code.replace(
  /const thumbUrl = supabaseService\.getPublicUrl\(p\.storage_path\);/g,
  "const thumbUrl = p.storage_path.startsWith('blob:') ? p.storage_path : supabaseService.getPublicUrl(p.storage_path);"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed blob urls');
