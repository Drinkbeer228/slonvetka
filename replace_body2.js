import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const startMarker = '<div className="pb-24 space-y-6 mt-4">';
const endMarker = '{/* REPLENISH MODAL */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found', startIndex, endIndex);
  process.exit(1);
}

const replacement = fs.readFileSync('render_body.tsx', 'utf8');

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', newCode);
console.log('Replaced body');
