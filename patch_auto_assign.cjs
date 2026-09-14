const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /loadedShift = \{ \.\.\.loadedShift, duty_keeper_id: profile\.id \};\s+\/\/ Trigger immediate save/,
  `loadedShift = { ...loadedShift, duty_keeper_id: profile.id };\n           setDutyKeeperName(profile.name);\n           // Trigger immediate save`
);

fs.writeFileSync(file, code);
