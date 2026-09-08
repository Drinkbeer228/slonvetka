const fs = require('fs');

const page = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
const editor = fs.readFileSync('src/components/daily-shift/ObservationEditor.tsx', 'utf8');

// The error isn't this, I am sure. But I will fix it just in case.
