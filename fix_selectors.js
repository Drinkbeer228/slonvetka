const fs = require('fs');

let page = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

page = page.replace(
  'metrics={metrics}',
  'metrics={metrics || {}}'
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', page);
console.log('Fixed metrics in ElephantSelector');
