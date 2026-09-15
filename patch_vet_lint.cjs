const fs = require('fs');
let code = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');

code = code.replace(
  /<img src=\{record\.photos\[0\]\.dataUrl\} className="w-full h-full object-cover" \/>/,
  '<img src={(record.photos[0] as any).dataUrl || ""} className="w-full h-full object-cover" />'
);

fs.writeFileSync('src/screens/VetDashboard.tsx', code);
