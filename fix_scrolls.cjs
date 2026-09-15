const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Fix main container
code = code.replace(
  /<div\s+className="space-y-6 mt-3 relative pb-52 sm:pb-56"\s+style={{ paddingBottom: 'calc\(14rem \+ env\(safe-area-inset-bottom, 0px\)\)' }}/,
  `<div\n      className="h-[calc(100dvh-3.5rem)] w-full overflow-y-auto snap-y snap-mandatory touch-pan-y overscroll-none"`
);

// Fix all reels
code = code.replace(/className="snap-start h-\[calc\(100dvh-3\.5rem\)\] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-start( space-y-4)?"/g, 
  'className="snap-start h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] w-full overflow-hidden flex flex-col justify-start p-2.5 box-border space-y-2"'
);
code = code.replace(/className="snap-start h-\[calc\(100dvh-3\.5rem\)\] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-center"/g, 
  'className="snap-start h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] w-full overflow-hidden flex flex-col justify-center p-2.5 box-border space-y-2"'
);

// Floating Log Badge
// Currently: fixed bottom-24 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-full font-black text-sm shadow-xl border border-slate-700/50 flex items-center gap-2 active:scale-95 transition-transform
code = code.replace(
  /className="fixed bottom-24 right-4 z-40 bg-slate-900\/90/,
  'className="fixed bottom-4 right-4 z-40 pointer-events-auto bg-slate-900/90'
);

// Make sure the main page itself doesn't wrap the floating badge in a pointer-events-none if it was. It wasn't.

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
