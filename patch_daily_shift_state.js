import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// add editingObservation state
code = code.replace(
  /const \[shiftCompletedModalOpen, setShiftCompletedModalOpen\] = useState\(false\);/,
  `const [shiftCompletedModalOpen, setShiftCompletedModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState(false);`
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('State added');
