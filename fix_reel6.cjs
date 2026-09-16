const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Inject States
const newStates = `  const [actor, setActor] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [target, setTarget] = useState<'margo' | 'audrey' | 'pretty'>('audrey');
  const [flashingBtn, setFlashingBtn] = useState<string | null>(null);
  const [lastSocialEvent, setLastSocialEvent] = useState<string | null>(null);`;

code = code.replace(/  const \[events, setEvents\] = useState<any\[\]>\(\[\]\);/, `${newStates}\n  const [events, setEvents] = useState<any[]>([]);`);

// 2. Replace Reel 6
const reel6Regex = /\{\/\* REEL 6: SOCIAL DYNAMICS \*\/\}[\s\S]*?<\/div>\n      <\/div>\n\n      \{\/\* REEL 7: HANDOVER & TIMER \*\/\}/;

const newReel6 = `{/* REEL 6: SOCIAL DYNAMICS */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="5">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">👥 Социальная динамика</h2>
          
          <div className="flex flex-col gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Актор (кто действует)</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'margo', label: 'Марго' },
                  { id: 'audrey', label: 'Одри' },
                  { id: 'pretty', label: 'Прэтти' }
                ].map(el => (
                  <button
                    key={el.id}
                    onClick={() => {
                      setActor(el.id as any);
                      if (target === el.id) {
                        const newTarget = ['margo', 'audrey', 'pretty'].find(i => i !== el.id) as any;
                        setTarget(newTarget);
                      }
                    }}
                    className={\`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 \${actor === el.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}\`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
               <div className="bg-slate-900 p-1 rounded-full border border-slate-800">
                 <div className="bg-slate-800 text-slate-400 rounded-full p-1.5">
                   <span className="block text-[10px] leading-none transform rotate-90">➔</span>
                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Реципиент (на кого)</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'margo', label: 'Марго' },
                  { id: 'audrey', label: 'Одри' },
                  { id: 'pretty', label: 'Прэтти' }
                ].map(el => (
                  <button
                    key={el.id}
                    disabled={actor === el.id}
                    onClick={() => setTarget(el.id as any)}
                    className={\`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 \${target === el.id ? 'bg-indigo-600 text-white shadow-md' : actor === el.id ? 'bg-slate-950/50 text-slate-600 opacity-50 cursor-not-allowed border border-dashed border-slate-700' : 'bg-slate-800 text-slate-400'}\`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { id: 'fight', label: '💥 Стычка / Удар хоботом', colorClass: 'bg-rose-950/40 border-rose-800 text-rose-300 ring-rose-400' },
              { id: 'food', label: '🥐 Отобрала пайку / сено', colorClass: 'bg-amber-950/40 border-amber-800 text-amber-300 ring-amber-400' },
              { id: 'grooming', label: '🤗 Взаимный груминг / Игра', colorClass: 'bg-emerald-950/40 border-emerald-800 text-emerald-300 ring-emerald-400' },
              { id: 'jealousy', label: '👀 Ревность к киперу', colorClass: 'bg-purple-950/40 border-purple-800 text-purple-300 ring-purple-400' },
              { id: 'sleep', label: '💤 Спят рядом (контакт)', colorClass: 'bg-blue-950/40 border-blue-800 text-blue-300 ring-blue-400' },
              { id: 'roar', label: '🔊 Трубный глас / Рокот', colorClass: 'bg-orange-950/40 border-orange-800 text-orange-300 ring-orange-400' }
            ].map(action => (
              <button 
                key={action.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(40);
                  
                  const eNames: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
                  const actorName = eNames[actor];
                  const targetName = eNames[target];
                  const actionName = action.label.split(' ')[1]; // Short name
                  
                  const fullLogStr = \`\${actorName} ➔ \${targetName}: \${action.label}\`;
                  addEvent(fullLogStr);
                  
                  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  setLastSocialEvent(\`\${timeStr} \${actorName} ➔ \${targetName} (\${actionName}) ✓\`);
                  
                  setFlashingBtn(action.id);
                  setTimeout(() => setFlashingBtn(null), 300);
                }} 
                className={\`p-3 rounded-2xl border text-xs font-bold active:scale-95 text-left transition-all duration-200 \${action.colorClass} \${flashingBtn === action.id ? 'ring-2 scale-95 opacity-100 brightness-150' : ''}\`}
              >
                {action.label}
              </button>
            ))}
          </div>
          
          {lastSocialEvent && (
             <div className="bg-slate-900/80 border border-emerald-500/30 p-2.5 rounded-xl animate-slide-up flex items-center justify-between mt-1">
               <span className="text-[10px] font-bold text-slate-400">Последнее:</span>
               <span className="text-[11px] font-bold text-emerald-400">{lastSocialEvent}</span>
             </div>
          )}
        </div>
      </div>

      {/* REEL 7: HANDOVER & TIMER */}`;

code = code.replace(reel6Regex, newReel6);

fs.writeFileSync(file, code);
