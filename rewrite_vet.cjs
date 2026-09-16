const fs = require('fs');

let code = fs.readFileSync('src/components/VetCabinetDashboard.tsx', 'utf8');

// Rename export
code = code.replace(/export function VetCabinetDashboard/g, 'export function VetDashboard');

// 1. FONT & DARK THEME ROOT
code = code.replace(
  /<div className="min-h-screen bg-slate-50\/50 pb-20">/,
  '<div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 p-4 pb-12 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+1rem)] flex flex-col gap-4">'
);
code = code.replace(
  /<div className="max-w-4xl mx-auto space-y-4 px-2 sm:px-4 py-4">/,
  '<div className="w-full flex flex-col gap-4">'
);

// 2. HEADER
const headerRegex = /\{\/\* ШАПКА \*\/\}[\s\S]*?<\/header>/;
const newHeader = `{/* ШАПКА */}
      <div className="flex flex-col gap-3 mb-2">
        <button onClick={() => onNavigate && onNavigate('daily_shift')} className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 active:scale-95 text-lg font-bold min-h-[48px] self-start">
          ‹ Назад к смене
        </button>
        <h1 className="font-bold text-xl text-emerald-400 flex items-center gap-2">
          🩺 Веткабинет
        </h1>
      </div>`;
code = code.replace(headerRegex, newHeader);

// 3. DARK CARDS
code = code.replace(/bg-white/g, 'bg-slate-900');
code = code.replace(/shadow-sm/g, 'shadow-2xl');
code = code.replace(/border-slate-200\/60/g, 'border-slate-800');
code = code.replace(/border-slate-200/g, 'border-slate-800');
code = code.replace(/border-slate-100/g, 'border-slate-700');
code = code.replace(/bg-slate-50/g, 'bg-slate-800/50');
code = code.replace(/bg-slate-100/g, 'bg-slate-800');

code = code.replace(/text-slate-900/g, 'text-slate-100');
code = code.replace(/text-slate-800/g, 'text-slate-200');
code = code.replace(/text-slate-700/g, 'text-slate-300');
code = code.replace(/text-slate-600/g, 'text-slate-400');
code = code.replace(/text-slate-500/g, 'text-slate-400');

code = code.replace(/bg-indigo-50/g, 'bg-indigo-900/20');
code = code.replace(/text-indigo-700/g, 'text-indigo-400');
code = code.replace(/text-indigo-600/g, 'text-indigo-400');

code = code.replace(/bg-emerald-50/g, 'bg-emerald-900/20');
code = code.replace(/text-emerald-700/g, 'text-emerald-400');
code = code.replace(/text-emerald-600/g, 'text-emerald-400');

code = code.replace(/bg-amber-50/g, 'bg-amber-900/20');
code = code.replace(/text-amber-700/g, 'text-amber-400');

code = code.replace(/bg-rose-50/g, 'bg-rose-900/20');
code = code.replace(/text-rose-700/g, 'text-rose-400');

code = code.replace(/bg-teal-50/g, 'bg-teal-900/20');
code = code.replace(/text-teal-700/g, 'text-teal-400');

code = code.replace(/bg-sky-50/g, 'bg-sky-900/20');
code = code.replace(/text-sky-700/g, 'text-sky-400');

// Grid to Flex Col
code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">/g, '<div className="flex flex-col gap-4 w-full">');
code = code.replace(/<div className="grid grid-cols-2 gap-2 mt-4">/g, '<div className="flex flex-col gap-2 mt-4">');

fs.writeFileSync('src/screens/VetDashboard.tsx', code);
