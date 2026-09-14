const fs = require('fs');
let file = 'src/components/TreatmentRecordCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const target1 = `  // Determine keeper name: from joined keeper relation or fallback`;
const replacement1 = `  const ageMs = Date.now() - new Date(record.performed_at).getTime();
  const isAuthor = record.keeper_id === currentProfile?.id;
  const canDelete = isAuthor && ageMs < 5 * 60 * 1000;
  
  // Determine keeper name: from joined keeper relation or fallback`;
code = code.replace(target1, replacement1);

const target2 = `              {onDelete && (`;
const replacement2 = `              {onDelete && canDelete && (`;
code = code.replace(target2, replacement2);

fs.writeFileSync(file, code);
