const fs = require('fs');
const content = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
// Just log the lines around the header card
const lines = content.split('\n');
let start = 0, end = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* HEADER CARD */}')) start = i;
  if (lines[i].includes('{/* ACTIVE ELEPHANT CONTENT */}')) end = i;
}
console.log(lines.slice(start, end).join('\n'));
