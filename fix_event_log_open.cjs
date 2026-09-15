const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(/const \[replenishModalOpen, setReplenishModalOpen\] = useState\(false\);/, 
  `const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [eventLogOpen, setEventLogOpen] = useState(false);`);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
