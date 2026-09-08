import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /setMetrics\(data\.metrics\);/g,
  "setMetrics(data.metrics || {});"
);
code = code.replace(
  /setShift\(data\.shift\);/g,
  "setShift(data.shift || null);"
);

// Let's also make sure `metrics` is never undefined during render just in case:
code = code.replace(
  /const m = metrics\[elephant\.id\]/g,
  "const m = (metrics || {})[elephant.id]"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed metrics undefined state');
