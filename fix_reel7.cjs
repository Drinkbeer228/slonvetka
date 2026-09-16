const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!code.includes("import confetti from 'canvas-confetti'")) {
    code = code.replace(/import \{.*\} from 'lucide-react';/, "import { Camera, ChevronDown, Flame, Droplets, Map, AlignLeft, Calendar, FileText, CheckCircle2, FileVideo2 } from 'lucide-react';\nimport confetti from 'canvas-confetti';");
}

// 2. States
const newStates = `  const [dragProgress, setDragProgress] = useState(0);
  const [isShiftSubmitted, setIsShiftSubmitted] = useState(false);
  const [handoverIssues, setHandoverIssues] = useState<string[]>([]);
  const sliderRef = useRef<HTMLInputElement>(null);`;

code = code.replace(/  const \[incidents, setIncidents\] = useState<string\[\]>\(\[\]\);/, `${newStates}\n  const [incidents, setIncidents] = useState<string[]>([]);`);

// 3. Reel 7 Replacement
const reel7Regex = /\{\/\* REEL 7: HANDOVER & TIMER \*\/\}[\s\S]*?<\/div>\n      <\/div>\n\n      \{\/\* DRAWERS AND MODALS \*\/\}/;

const newReel7 = `{/* REEL 7: HANDOVER & TIMER */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-24 box-border shrink-0 relative pt-[60px]" data-index="6">
        <div className="flex flex-col gap-2.5 flex-1 justify-center relative">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">🏁 Сдача дежурства</h2>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col gap-2 relative z-10">
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Куч за смену:</span> <span className="text-emerald-400">{(metrics['margo']?.poop_count || 0) + (metrics['audrey']?.poop_count || 0) + (metrics['pretty']?.poop_count || 0)}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Вывезено тачек:</span> <span className="text-emerald-400">{dungWheelbarrows || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Роздано тюков:</span> <span className="text-emerald-400">{distributed.bales || 0}</span></div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-300"><span>Инциденты:</span> <span className="text-rose-400">{incidentCount || 0}</span></div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-200">
              <span>Чек-лист задач:</span>
              <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-800">Готово</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4 mt-4 relative z-10">
             {['🧹 Не вынесен навоз', '🌾 Мало сена на ночь', '🚰 Течь поилки'].map(issue => {
               const isActive = handoverIssues.includes(issue);
               return (
                 <button 
                   key={issue} 
                   onClick={() => {
                     if (navigator.vibrate) navigator.vibrate(40);
                     setHandoverIssues(p => isActive ? p.filter(i => i !== issue) : [...p, issue]);
                   }}
                   className={\`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 \${isActive ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}\`}
                 >
                   {issue}
                 </button>
               )
             })}
             
             <label className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer">
               📷 Фото косяка
               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                 if (e.target.files && e.target.files.length > 0) {
                    addEvent(\`📸 Прикреплено фото к сдаче смены\`);
                    if (navigator.vibrate) navigator.vibrate(50);
                 }
               }}/>
             </label>
          </div>
          
          <div className="mt-auto relative z-10 flex flex-col gap-2">
            {isShiftSubmitted ? (
               <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center animate-slide-up">
                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-2">
                   <CheckCircle2 className="w-8 h-8 text-slate-900" />
                 </div>
                 <h3 className="text-xl font-bold text-emerald-400">Смена сдана!</h3>
                 <p className="text-sm font-bold text-slate-400 mt-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
               </div>
            ) : (
               <div className="relative h-[60px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none group">
                 {/* Background fill */}
                 <div className="absolute left-0 top-0 bottom-0 bg-emerald-600/30 transition-all duration-100 ease-out" style={{ width: \`\${dragProgress}%\` }} />
                 
                 {/* Text */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className={\`font-bold transition-all \${dragProgress > 50 ? 'text-emerald-400' : 'text-slate-400'}\`}>
                     {dragProgress > 85 ? 'ОТПУСТИТЕ!' : 'Сдвиньте для сдачи смены ➔'}
                   </span>
                 </div>
                 
                 {/* Input Range (Hidden overlay) */}
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={dragProgress}
                   ref={sliderRef}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                   onChange={(e) => {
                     setDragProgress(Number(e.target.value));
                   }}
                   onTouchEnd={() => {
                     if (dragProgress >= 85) {
                       setIsShiftSubmitted(true);
                       if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                       confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                       addEvent('🏁 СМЕНА СДАНА');
                     } else {
                       setDragProgress(0);
                     }
                   }}
                   onMouseUp={() => {
                     if (dragProgress >= 85) {
                       setIsShiftSubmitted(true);
                       if (navigator.vibrate) navigator.vibrate([50, 100, 150]);
                       confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: ['#10b981', '#34d399', '#059669'] });
                       addEvent('🏁 СМЕНА СДАНА');
                     } else {
                       setDragProgress(0);
                     }
                   }}
                 />
                 
                 {/* Visual Thumb */}
                 <div 
                   className="absolute left-1 top-1 bottom-1 w-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100 ease-out z-10 pointer-events-none"
                   style={{ transform: \`translateX(calc(\${dragProgress / 100} * (100cqw - 56px)))\` }}
                 >
                   <span className="text-slate-900 font-black">➔</span>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* DRAWERS AND MODALS */}`;

code = code.replace(reel7Regex, newReel7);
// add inline container query support for translation
code = code.replace(/<div className="relative h-\[60px\] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none group">/, '<div className="relative h-[60px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 w-full touch-none group" style={{ containerType: "inline-size" }}>');

fs.writeFileSync(file, code);
