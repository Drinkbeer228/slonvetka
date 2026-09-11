const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldRegex = /<div className="flex items-center justify-between">\s*<div className="flex items-center gap-3">\s*<h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-2 drop-shadow-sm">\s*<span className="text-2xl">🐘<\/span> \{elephant\.name\}\s*<\/h3>\s*<\/div>\s*\{onClose && \(\s*<button\s*onClick=\{onClose\}\s*className="w-10 h-10 rounded-full bg-white\/50 backdrop-blur-md border border-white\/40 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 hover:bg-white\/80"\s*title="Закрыть"\s*>\s*<X size=\{18\} \/>\s*<\/button>\s*\)\}\s*<\/div>/m;

if (oldRegex.test(content)) {
  const replacement = `{onClose && (
        <div className="flex items-center justify-end mb-[-12px]">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 hover:bg-white/80"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
      )}`;
  content = content.replace(oldRegex, replacement);
  fs.writeFileSync(path, content);
  console.log("Successfully removed elephant name header from ObservationEditor!");
} else {
  console.log("Regex didn't match.");
}
