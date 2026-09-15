const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ObservationEditor.tsx', 'utf8');

// Remove CircusElephantMonitoring import
code = code.replace(/import \{ CircusElephantMonitoring \} from '\.\/CircusElephantMonitoring';/, '');

// Remove the component rendering
code = code.replace(/<CircusElephantMonitoring[\s\S]*?\/>/, '');

fs.writeFileSync('src/components/daily-shift/ObservationEditor.tsx', code);
