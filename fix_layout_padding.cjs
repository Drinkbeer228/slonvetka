const fs = require('fs');
const file = 'src/components/Layout.tsx';

let code = fs.readFileSync(file, 'utf8');

// I will remove the top padding entirely when it's the daily shift.
// In Layout.tsx, the main element has `<main className={\`flex-1 w-full mx-auto transition-all \${isDailyShift ? 'pt-0' : 'pt-14'} \${contentWidthClass}\`}>`

// Wait, looking at the screenshots, the white header from the PWA/Browser is visible, BUT also there's a white background behind the dark app container in the first screenshot.
// Ah, the global background in Layout.tsx is set to `#f1f5f9` (light mode) or `#121212` (dark mode) on the root `div`!
// The DailyShiftPage forces a dark theme with `bg-slate-950 text-slate-100`, BUT it's constrained by the Layout's padding/margins.
// In Layout.tsx, when it's `isDailyShift`, we removed the header and `pt-14`, but the global `div` background is still light!

code = code.replace(
  /<div\n      className="min-h-screen text-slate-800 flex flex-col font-sans antialiased"\n      data-theme=\{darkMode \? 'dark' : 'light'\}\n      style=\{\{ background: darkMode \? '#121212' : 'linear-gradient\\(160deg, #f1f5f9 0%, #e9f0f8 60%, #eff6ff 100%\\)' \}\}\n    >/,
  `<div
      className="min-h-screen text-slate-800 flex flex-col font-sans antialiased"
      data-theme={darkMode ? 'dark' : 'light'}
      style={{ background: isDailyShift ? '#020617' : (darkMode ? '#121212' : 'linear-gradient(160deg, #f1f5f9 0%, #e9f0f8 60%, #eff6ff 100%)') }}
    >`
);

fs.writeFileSync(file, code);
