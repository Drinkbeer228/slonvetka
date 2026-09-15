const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/ExcretionControl.tsx', 'utf8');

// Remove Trunk Tone button inside ExcretionControl completely
code = code.replace(/\{\(\) => \{\s*const currentTone = metrics\?\.\[elephant\.id\]\?\.trunk_tone;[\s\S]*?\}\)\(\)\}/, '');

// Remove 💩 КУЧИ and 💧 ЛУЖИ text inside the central value display
// For Sleep:
code = code.replace(/<span className="text-\[10px\] font-black tracking-wider text-violet-700 flex items-center justify-center gap-1 uppercase dark:text-violet-300">\s*🌙 СОН\s*<\/span>/, '');
// For others (stool/urine)
code = code.replace(/<span className="text-\[10px\] font-black tracking-wider [^>]+ flex items-center justify-center gap-1 uppercase[^>]*>\s*\{activeTab === 'stool' \? '💩 КУЧИ' : '💧 ЛУЖИ'\}\s*<\/span>/, '');

// Fix formatting of numbers: text-4xl font-bold font-mono
// For sleep:
code = code.replace(/<span className="text-2xl font-black text-slate-950 leading-none dark:text-slate-100">\s*\{formatTotalSleepHours\(sleepMinutes\)\}\s*<\/span>/, '<span className="text-3xl font-mono font-black text-slate-950 leading-none dark:text-slate-100">{formatTotalSleepHours(sleepMinutes)}</span>');
// For stool/urine:
code = code.replace(/<span className="text-3xl font-black text-slate-950 leading-none dark:text-slate-100">\s*\{count\}\s*<\/span>/, '<span className="text-4xl font-mono font-black text-slate-950 leading-none dark:text-slate-100">{count}</span>');

// Replace the Stool Trait grid
// Find the block: "ХАРАКТЕР СТУЛА"
const stoolTraitRegex = /\{activeTab === 'stool' && \(\s*<div className="space-y-3 p-4">[\s\S]*?<\/div>\s*\)\}/;

const newStoolTrait = `{activeTab === 'stool' && (
        <div className="space-y-3 p-4">
          <div className="font-bold text-slate-900 text-sm tracking-tight px-1 flex items-center justify-between">
            <span>Характер стула</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Сформирован (норма)', val: 'Сформирован (норма)' },
              { label: 'Рассыпчатый / Сухой', val: 'Рассыпчатый / Сухой' },
              { label: '⚠️ Жидкий / Понос', val: 'Жидкий / Понос ⚠️' },
              { label: '⚠️ Слизь / Непереварен', val: 'Слизь / Непереварен ⚠️' },
            ].map(trait => {
              const isActive = selectedStoolTrait === trait.val;
              return (
                <button
                  key={trait.val}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelectTrait(trait.val)}
                  className={\`min-h-[64px] rounded-[20px] px-3 py-2 text-sm font-black transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center text-center leading-tight shadow-sm \${
                    isActive
                      ? trait.val.includes('⚠️')
                        ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300'
                        : 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }\`}
                >
                  {trait.label}
                </button>
              );
            })}
          </div>
        </div>
      )}`;

code = code.replace(stoolTraitRegex, newStoolTrait);

fs.writeFileSync('src/components/daily-shift/ExcretionControl.tsx', code);
