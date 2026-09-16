const fs = require('fs');

let code = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');

// 1. Root container
code = code.replace(
  /<div className="max-w-5xl mx-auto space-y-6 pb-28 px-3.5 sm:px-6 pt-4 antialiased">/,
  '<div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 p-4 pb-12 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+1rem)] flex flex-col gap-4">'
);

// 2. Fix the Header
const headerRegex = /\{\/\* 1\. HEADER & DATE SELECTOR \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
const newHeader = `{/* 1. HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => onNavigate && onNavigate('daily_shift')} className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 active:scale-95 text-lg font-bold min-h-[48px]">
          ‹ Назад к смене
        </button>
        <h1 className="font-bold text-xl text-emerald-400 flex items-center gap-2">
          🩺 Веткабинет
          {isVetOrAdmin ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-900/40 px-2 py-0.5 rounded-full border border-teal-800">
              Ветврач
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 bg-sky-900/40 px-2 py-0.5 rounded-full border border-sky-800">
              Кипер
            </span>
          )}
        </h1>
      </div>`;
code = code.replace(headerRegex, newHeader);

// 3. Fix colors globally in this file
code = code.replace(/bg-white\/80 backdrop-blur-xl border border-white\/80/g, 'bg-slate-900 border border-slate-800');
code = code.replace(/bg-white\/80 backdrop-blur-xl border border-white\/90/g, 'bg-slate-900 border border-slate-800');
code = code.replace(/bg-white\/90 backdrop-blur-xl border border-slate-200\/60/g, 'bg-slate-900 border border-slate-800');
code = code.replace(/bg-white/g, 'bg-slate-900');
code = code.replace(/shadow-\[0_4px_16px_rgba\(15,23,42,0\.03\)\]/g, 'shadow-2xl');
code = code.replace(/shadow-\[0_4px_20px_rgba\(15,23,42,0\.03\)\]/g, 'shadow-2xl');
code = code.replace(/bg-slate-50\/70/g, 'bg-slate-800/50');
code = code.replace(/bg-slate-50\/80/g, 'bg-slate-800/80');
code = code.replace(/bg-slate-50/g, 'bg-slate-800');
code = code.replace(/bg-slate-100/g, 'bg-slate-800');
code = code.replace(/border-slate-100/g, 'border-slate-700');
code = code.replace(/border-slate-200\/80/g, 'border-slate-700');
code = code.replace(/border-slate-200\/60/g, 'border-slate-700');
code = code.replace(/border-slate-200/g, 'border-slate-700');

code = code.replace(/text-slate-900/g, 'text-slate-100');
code = code.replace(/text-slate-800/g, 'text-slate-200');
code = code.replace(/text-slate-700/g, 'text-slate-300');
code = code.replace(/text-slate-600/g, 'text-slate-400');
code = code.replace(/text-slate-500/g, 'text-slate-400');

code = code.replace(/bg-indigo-50\/70/g, 'bg-indigo-900/20');
code = code.replace(/border-indigo-100/g, 'border-indigo-800/50');
code = code.replace(/text-indigo-700/g, 'text-indigo-400');
code = code.replace(/text-indigo-950/g, 'text-indigo-200');

code = code.replace(/bg-orange-50/g, 'bg-orange-950/40');
code = code.replace(/text-orange-700/g, 'text-orange-400');

code = code.replace(/bg-rose-50/g, 'bg-rose-950/40');
code = code.replace(/text-rose-700/g, 'text-rose-400');

code = code.replace(/bg-teal-50\/60/g, 'bg-teal-950/30');
code = code.replace(/border-teal-100/g, 'border-teal-800');
code = code.replace(/text-teal-700/g, 'text-teal-400');
code = code.replace(/text-teal-800/g, 'text-teal-300');

code = code.replace(/bg-amber-50\/60/g, 'bg-amber-950/30');
code = code.replace(/border-amber-100/g, 'border-amber-800');
code = code.replace(/text-amber-800/g, 'text-amber-400');

code = code.replace(/bg-sky-50\/60/g, 'bg-sky-950/30');
code = code.replace(/bg-sky-50/g, 'bg-sky-950/30');
code = code.replace(/border-sky-100/g, 'border-sky-800');
code = code.replace(/text-sky-700/g, 'text-sky-400');

// Replace table grid with flex col
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">/g, '<div className="flex flex-col gap-4 w-full">');

fs.writeFileSync('src/screens/VetDashboard.tsx', code);
