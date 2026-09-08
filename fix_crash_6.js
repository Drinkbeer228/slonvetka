import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /if \(prevData\.shift\.duty_keeper_id\) {/g,
  "if (prevData?.shift?.duty_keeper_id) {"
);

code = code.replace(
  /prevData\.shift/g,
  "prevData?.shift"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed prevData.shift access');
