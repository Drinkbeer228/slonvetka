import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Just remove the LocalErrorBoundary completely to fix the syntax error.
code = code.replace(/<\/LocalErrorBoundary>\n/g, "");
code = code.replace(/<LocalErrorBoundary>\n/g, "");
code = code.replace(/class LocalErrorBoundary extends Component[\s\S]*?\}\n\}\n/m, "");

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Removed ErrorBoundary');
