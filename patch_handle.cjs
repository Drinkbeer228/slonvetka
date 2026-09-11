const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `      if (shift) {
        persistChanges(shift, updatedMetrics);
      }
      return updatedMetrics;`;

const newCode = `      if (shift) {
        setTimeout(() => {
          if (field === 'notes' || field === 'photos') {
            triggerDebouncedSave(shift, updatedMetrics);
          } else {
            persistChanges(shift, updatedMetrics);
          }
        }, 0);
      }
      return updatedMetrics;`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
