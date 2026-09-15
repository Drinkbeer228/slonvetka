const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// The issue is justify-center with flex-1 on the container, and dynamic content removal.
// When 'poop' is active, the "Характер стула" block is rendered, increasing the content height.
// With justify-center, this pushes the counters block up.
// When switching to 'urine' or 'sleep', the "Характер стула" block is unmounted.
// The content becomes smaller, and justify-center pushes the counters block down (centers it vertically in the new smaller space).

// To fix this, we should change the container layout from `justify-center` to `justify-start` (flex-start)
// or add a fixed min-height to the "Характер стула" block area so it always takes up space.

// Let's change `justify-center` to `justify-start mt-4` on Reel 1
code = code.replace(
  /<div className="reel-section snap-start snap-always h-\[100dvh\] max-h-\[100dvh\] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-\[60px\]" data-index="0">\s*<div className="flex flex-col gap-2.5 flex-1 justify-center">/,
  `<div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="0">
        <div className="flex flex-col gap-2.5 flex-1 justify-start mt-2">`
);

// We should also pre-allocate space for the stool character section so the page doesn't shift,
// or just let it be top-aligned which naturally fixes the jump.
// Just top-aligning is standard and looks better.

fs.writeFileSync(file, code);
