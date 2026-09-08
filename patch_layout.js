import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Replace background and text
code = code.replace(/bg-zinc-100 text-zinc-900/g, 'bg-[#F4F5F7] text-slate-800');

// Replace header
code = code.replace(
  /<header className="bg-zinc-900 text-white sticky top-0 z-30 shadow-md">/g,
  '<header className="sticky top-0 z-50 pt-2 pb-2 px-4 pointer-events-none">'
);

code = code.replace(
  /<div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">/g,
  '<div className="max-w-6xl mx-auto h-14 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[24px] px-5 flex items-center justify-between pointer-events-auto">'
);

code = code.replace(
  /bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center transition border border-zinc-700/g,
  'bg-white hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center transition shadow-sm border border-slate-200/60 rounded-full'
);

code = code.replace(
  /text-zinc-100/g,
  'text-slate-800'
);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log('Patched Layout');
