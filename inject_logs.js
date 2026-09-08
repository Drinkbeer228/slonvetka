const fs = require('fs');

function injectLog(file, componentName) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    new RegExp(`export function ${componentName}\\([^)]+\\) {`),
    `$& \n  console.log("Rendering ${componentName}");\n`
  );
  fs.writeFileSync(file, content);
}

injectLog('src/components/daily-shift/ElephantSelector.tsx', 'ElephantSelector');
injectLog('src/components/daily-shift/ElephantSummaryCard.tsx', 'ElephantSummaryCard');
injectLog('src/components/daily-shift/VeterinaryAssignmentCard.tsx', 'VeterinaryAssignmentCard');
injectLog('src/components/daily-shift/FeedControl.tsx', 'FeedControl');
injectLog('src/components/daily-shift/ShiftHandover.tsx', 'ShiftHandover');
injectLog('src/components/daily-shift/ObservationEditor.tsx', 'ObservationEditor');
console.log('Injected logs');
