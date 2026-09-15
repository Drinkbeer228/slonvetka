const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

code = code.replace(
  /<div\s*className="space-y-6 mt-3 relative pb-52 sm:pb-56"\s*style={{ paddingBottom: 'calc\\(14rem \+ env\\(safe-area-inset-bottom, 0px\\)\\)' }}\s*onTouchStart={handleTouchStart}\s*onTouchMove={handleTouchMove}\s*onTouchEnd={handleTouchEnd}\s*>/m,
  '<div className="h-[calc(100dvh-3.5rem)] w-full overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>'
);

const sectionClass = 'snap-start h-[calc(100dvh-3.5rem)] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto';

code = code.replace(
  /<div className="space-y-6">/,
  `<div className="${sectionClass} justify-start">`
);

code = code.replace(
  /<div className="space-y-3">/,
  `<div className="${sectionClass} justify-start">`
);

code = code.replace(
  /<div className="space-y-4">/g,
  `<div className="${sectionClass} justify-start">`
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
