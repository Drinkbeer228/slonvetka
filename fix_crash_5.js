import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /elephants\.find/g,
  "(elephants || []).find"
);
code = code.replace(
  /elephants\[0\]/g,
  "(elephants || [])[0]"
);

code = code.replace(
  /shiftRecords\.find/g,
  "(shiftRecords || []).find"
);
code = code.replace(
  /shiftRecords\.filter/g,
  "(shiftRecords || []).filter"
);
code = code.replace(
  /staffList\.find/g,
  "(staffList || []).find"
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed elephants.find and others');
