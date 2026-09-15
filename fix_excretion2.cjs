const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ExcretionControl.tsx', 'utf8');

// The regex I used earlier: /\{\(\) => \{\s*const currentTone = metrics\?\.\[elephant\.id\]\?\.trunk_tone;[\s\S]*?\}\)\(\)\}/
// Let's use a simpler approach: replace the block from "Тонус хобота" comment to the end of the IIFE
code = code.replace(/\{\/\* Тонус хобота[\s\S]*?\}\)\(\)\}/g, '');

fs.writeFileSync('src/components/daily-shift/ExcretionControl.tsx', code);
