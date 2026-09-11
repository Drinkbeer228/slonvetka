const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// The injected useEffect uses viewYear before it is declared. We need to move the useState hooks up.
const stateCode = `  const [viewYear, setViewYear] = useState<number>(() => parseDateString(selectedDate).year);
  const [viewMonth, setViewMonth] = useState<number>(() => parseDateString(selectedDate).month);`;

// Remove from old location
content = content.replace(stateCode, '');

// Insert before useEffect
content = content.replace(
  '  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);',
  '  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);\n' + stateCode
);

fs.writeFileSync(path, content);
