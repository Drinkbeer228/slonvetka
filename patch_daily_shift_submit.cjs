const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Modifying ShiftSummaryModal properties
code = code.replace(
  /onConfirmCompleteShift=\{\(\) => \{\s*handleShiftFieldChange\('status', 'completed', true\);\s*\}\}/,
  `onConfirmCompleteShift={() => {
          setIsEndMatchModalOpen(false);
          setIsHandoverModalOpen(true);
        }}`
);

fs.writeFileSync(file, code);
