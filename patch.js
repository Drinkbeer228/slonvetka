const fs = require('fs');
const content = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

let newContent = content.replace(
  /\<div className="grid grid-cols-1 md:grid-cols-2 gap-5"\>[\s\S]*?\<\/div\>\n\n\s*\{\/\* CONTAINER 3: MOOD & NOTES \*\/\}\n\s*\<div className="bg-slate-50 dark:bg-slate-800\/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3"\>[\s\S]*?\<\/div\>/,
  `<ElephantPhysiology 
                      elephant={activeElephant}
                      metrics={m}
                      isLocked={isLocked}
                      onMetricChange={(field, val) => handleMetricChange(activeElephant.id, field, val)}
                      onTraitToggle={(field, trait) => handleTraitToggle(activeElephant.id, field, trait)}
                      onNotesBlur={() => shift && persistChanges(shift, metrics)}
                    />`
);

// We need to also import ElephantPhysiology
newContent = newContent.replace(
  /import \{ ExecutionModal \} from '\.\.\/components\/ExecutionModal';/,
  `import { ExecutionModal } from '../components/ExecutionModal';\nimport { ElephantPhysiology } from '../components/ElephantPhysiology';`
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', newContent);
console.log('Done replacing physiology block.');
