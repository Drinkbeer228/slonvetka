const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace the old handleBranchesToggle
const oldHandle = `  const handleBranchesToggle = (val: boolean) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      coarse_branches: val
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };`;

const newHandle = `  const handleBranchesChange = (val: number) => {
    if (isLocked || !shift) return;
    const updatedRation: DailyRationData = {
      ...currentRation,
      coarse_branches: val
    };
    handleShiftFieldChange('feed_notes', serializeDailyRation(updatedRation), true);
  };`;

content = content.replace(oldHandle, newHandle);

// rename prop in FeedControl usage
const oldProp = `          onBranchesToggle={handleBranchesToggle}`;
const newProp = `          onBranchesChange={handleBranchesChange}`;

content = content.replace(oldProp, newProp);

// change default value for coarse_branches
content = content.replace(
  'coarse_branches: false',
  'coarse_branches: 0'
);

content = content.replace(
  'coarse_branches: !!parsed.coarse_branches',
  'coarse_branches: parsed.coarse_branches || 0'
);

fs.writeFileSync(path, content);
