const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/FeedControl.tsx', 'utf8');

code = code.replace(/\bspace-y-4\b/g, 'space-y-2');
code = code.replace(/\bp-4\b/g, 'p-2.5');
code = code.replace(/\bgap-4\b/g, 'gap-2.5');

fs.writeFileSync('src/components/daily-shift/FeedControl.tsx', code);
