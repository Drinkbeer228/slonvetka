const fs = require('fs');

let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const updateSleepFn = `
  const updateSleepState = (eid: string, field: 'duration' | 'posture', value: string) => {
    setMetrics(prev => {
      const current = prev[eid]?.sleep_state || { duration: null, posture: null };
      return { ...prev, [eid]: { ...prev[eid], sleep_state: { ...current, [field]: value } } };
    });
    addEvent(\`\${eid}: Сон \${field} = \${value}\`);
  };
`;
code = code.replace(/const incrementMetric =/g, updateSleepFn + '\n  const incrementMetric =');

// Remove sleep_minutes from incrementMetric
code = code.replace(/\|'sleep_minutes'/g, '');

// Replace the Physio block
const physioGridStart = code.indexOf('<div className="grid grid-cols-3 gap-2.5 w-full">');
const physioGridEnd = code.indexOf('<div className={`mt-2 transition-all duration-300 ${physioTab === \'poop\'');

const poopUrineUI = `<div className="grid grid-cols-3 gap-2.5 w-full">
            {['margo', 'audrey', 'pretty'].map((eid) => (
              <div key={eid} className="flex flex-col">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <div className={\`w-2 h-2 rounded-full \${eid === 'margo' ? 'bg-emerald-400' : eid === 'audrey' ? 'bg-amber-400' : 'bg-purple-400'}\`} />
                  <span className="text-sm font-bold capitalize">{\${eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}}</span>
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : 'urination_count', 1)} className="h-[52px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-t-xl active:bg-emerald-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center transition-colors">
                  +
                </button>
                <div className="text-4xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {metrics[eid]?.[physioTab === 'poop' ? 'poop_count' : 'urination_count'] || 0}
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : 'urination_count', -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center transition-colors">
                  -
                </button>
              </div>
            ))}
          </div>`;

const sleepUI = `<div className="flex flex-col gap-3 w-full">
            {['margo', 'audrey', 'pretty'].map((eid) => {
              const sState = metrics[eid]?.sleep_state || { duration: null, posture: null };
              const isAlert = sState.duration === 'Не ложилась ⚠️' || sState.duration === '❌ Не легла';
              return (
                <div key={eid} className={\`flex flex-col p-3 rounded-2xl border \${isAlert ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 bg-slate-900/80'}\`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={\`w-2 h-2 rounded-full \${eid === 'margo' ? 'bg-emerald-400' : eid === 'audrey' ? 'bg-amber-400' : 'bg-purple-400'}\`} />
                    <span className="text-sm font-bold capitalize text-slate-200">{eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}</span>
                  </div>
                  
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Длительность</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {['❌ Не легла', '⏱️ 1-2ч', '🟢 3-4ч (норма)', '⚠️ >4ч'].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => updateSleepState(eid, 'duration', opt)}
                        className={\`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 \${sState.duration === opt ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}\`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Положение тела</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['🛌 Лев. бок', '🛌 Прав. бок', '🧍 Стоя'].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => updateSleepState(eid, 'posture', opt)}
                        className={\`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 \${sState.posture === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}\`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>`;

const newPhysioBlock = `
          {physioTab === 'sleep' ? (
            ${sleepUI}
          ) : (
            ${poopUrineUI}
          )}
          `;

code = code.substring(0, physioGridStart) + newPhysioBlock + code.substring(physioGridEnd);

code = code.replace(/{\\${eid === 'margo' \? 'Марго' : eid === 'audrey' \? 'Одри' : 'Прэтти'}}/g, "{eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}");

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
