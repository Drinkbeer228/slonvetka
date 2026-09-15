const fs = require('fs');

function removeScrolls(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Remove overflow-y-auto, overflow-y-scroll, overflow-scroll, overflow-auto
  code = code.replace(/\boverflow-y-auto\b/g, 'overflow-visible');
  code = code.replace(/\boverflow-y-scroll\b/g, 'overflow-visible');
  code = code.replace(/\boverflow-scroll\b/g, 'overflow-visible');
  code = code.replace(/\boverflow-auto\b/g, 'overflow-visible');
  
  // Also remove max-h-... which causes the need for scroll
  // Actually, wait, replacing with overflow-visible might just make it spill over other items.
  // We should just remove max-h-* entirely and let it grow.
  code = code.replace(/\bmax-h-\[?\w+(?:px|vh|rem)?\]?\b/g, '');
  
  fs.writeFileSync(filePath, code);
}

const files = [
  'src/components/daily-shift/DefecationTrackerSection.tsx',
  'src/components/daily-shift/ShiftActivityFeed.tsx'
];

files.forEach(removeScrolls);
