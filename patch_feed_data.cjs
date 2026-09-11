const fs = require('fs');
const pathFeed = './src/components/daily-shift/FeedControl.tsx';
const pathShift = './src/screens/DailyShiftPage.tsx';

let contentFeed = fs.readFileSync(pathFeed, 'utf8');
contentFeed = contentFeed.replace(
  'salad_notes: string;\n}',
  'salad_notes: string;\n  coarse_branches?: boolean;\n}'
);
contentFeed = contentFeed.replace(
  `  { id: 'Ветки', label: 'Ветки', emoji: '🌿' },\n  { id: 'Веники', label: 'Веники', emoji: '🍂' },\n  { id: 'Деревья', label: 'Деревья', emoji: '🌳' },\n  { id: 'Бамбук', label: 'Бамбук', emoji: '🎋' },`,
  ''
);

// Add onBranchesToggle to FeedControlProps
contentFeed = contentFeed.replace(
  '  onVegetableToggle: (chip: string) => void;\n  onSaladNotesChange: (notes: string) => void;\n}',
  '  onVegetableToggle: (chip: string) => void;\n  onSaladNotesChange: (notes: string) => void;\n  onBranchesToggle: (val: boolean) => void;\n}'
);

contentFeed = contentFeed.replace(
  '  onSaladNotesChange\n}: FeedControlProps) {',
  '  onSaladNotesChange,\n  onBranchesToggle\n}: FeedControlProps) {'
);

fs.writeFileSync(pathFeed, contentFeed);

let contentShift = fs.readFileSync(pathShift, 'utf8');
contentShift = contentShift.replace(
  "salad_notes: ''",
  "salad_notes: '',\n    coarse_branches: false"
);

contentShift = contentShift.replace(
  "salad_notes: parsed.salad_notes || ''",
  "salad_notes: parsed.salad_notes || '',\n      coarse_branches: !!parsed.coarse_branches"
);

fs.writeFileSync(pathShift, contentShift);

