const fs = require('fs');
const file = 'src/components/daily-shift/DynamicCounterSection.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove max height from damages list
code = code.replace(/className="space-y-2\.5 relative z-10 max-h-\[360px\] overflow-y-auto pr-1 no-scrollbar"/, 'className="space-y-2.5 relative z-10 pt-1"');

// Same for merits if it has it
code = code.replace(/className="space-y-2\.5 relative z-10 max-h-\[360px\] overflow-y-auto pr-1 no-scrollbar"/, 'className="space-y-2.5 relative z-10 pt-1"');

// We also have to ensure there is no clipping
// Let's replace "overflow-hidden" with nothing on the main blocks, 
// wait, the glow needs overflow-hidden. We can keep it but just add pt-1 to the list wrapper.
code = code.replace(/<div className="space-y-2\.5 relative z-10">/g, '<div className="space-y-2.5 relative z-10 pt-1">');

fs.writeFileSync(file, code);
