const fs = require('fs');
const files = [
  'src/components/daily-shift/SocialDynamicsSection.tsx',
  'src/components/daily-shift/CircusElephantMonitoring.tsx',
  'src/components/daily-shift/DynamicCounterSection.tsx',
];

files.forEach(file => {
  if(fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/\bspace-y-4\b/g, 'space-y-2');
    code = code.replace(/\bp-4\b/g, 'p-2.5');
    // For specific margin tops
    code = code.replace(/\bmt-4\b/g, 'mt-2.5');
    fs.writeFileSync(file, code);
  }
});
