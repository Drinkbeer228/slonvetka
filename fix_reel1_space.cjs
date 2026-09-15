const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// The best way to prevent layout shift is to ALWAYS render the bottom block, 
// but make it invisible (opacity-0 pointer-events-none) when not on 'poop' tab,
// or just reserve the exact height.
// Let's replace the conditional render `{physioTab === 'poop' && (...)}` 
// with a class-based toggle.

code = code.replace(
  /\{physioTab === 'poop' && \(\s*<div className="mt-2">\s*<h3 className="text-sm font-bold text-slate-300 mb-2">Характер стула<\/h3>([\s\S]*?)<\/div>\s*\)\}/,
  `<div className={\`mt-2 transition-all duration-300 \${physioTab === 'poop' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}\`}>
              <h3 className="text-sm font-bold text-slate-300 mb-2">Характер стула</h3>$1</div>`
);

fs.writeFileSync(file, code);
