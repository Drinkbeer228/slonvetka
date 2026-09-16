const fs = require('fs');

let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');
code = code.replace(
  /<div className="h-\[100dvh\] max-h-\[100dvh\] w-full overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y overscroll-none select-none bg-slate-950 text-slate-100" ref=\{containerRef\}>/,
  '<div className="w-screen min-w-full h-[100dvh] max-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-slate-950 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y overscroll-none select-none text-slate-100" ref={containerRef}>'
);
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
