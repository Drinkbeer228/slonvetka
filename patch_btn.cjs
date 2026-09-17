const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf-8');

const regexUI = /\{slot\.isEvening \&\& \(\n.*?\{\/\* SCREEN 4: FODDER \*\/\}/s;

const newUI = `{slot.isEvening && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/50">
                  {['🎃 Тыква', '🍉 Арбуз', '🥒 Кабачки', '🍌 Бананы'].map(s => {
                    const isActive = activeSeasonals.includes(s);
                    return (
                      <button 
                        key={s}
                        onClick={() => setActiveSeasonals(p => isActive ? p.filter(i => i !== s) : [...p, s])}
                        className={'px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ' + (isActive ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800/50 text-slate-400')}
                      >
                        + {s}
                      </button>
                    )
                  })}
                </div>
              )}
              
              <button
                disabled={dispensedSlots[slot.id]}
                onClick={() => handleDispense(slot.id, activeRecipes[slot.id] || (slot.presets ? Object.keys(slot.presets)[0] : ''), slot.isEvening || false, activeSeasonals)}
                className={"w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center transition-all " + (dispensedSlots[slot.id] ? 'bg-slate-950 text-emerald-500/50 border border-emerald-900/30' : 'bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 hover:bg-slate-700')}
              >
                {dispensedSlots[slot.id] ? '✓ Выдано и списано' : '✓ Выдать и списать со склада'}
              </button>
              
              {slotProblems.length > 0 && (
                <div className="flex flex-col gap-2 mt-1 mb-2 border-t border-slate-800/50 pt-3">
                  {slotProblems.map((prob, idx) => (
                    <div key={idx} className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-2.5 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⚠️</span>
                      <div>
                        <span className="text-amber-400 font-bold text-xs block">{eleMap[prob.elephant]}</span>
                        <span className="text-amber-200/70 font-semibold text-xs">{prob.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {openProblemSlot === slot.id ? (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Кто?</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['margo', 'audrey', 'pretty'].map(el => (
                        <button
                          key={el}
                          onClick={() => setProblemForm(p => ({...p, elephant: el}))}
                          className={'h-10 rounded-xl text-xs font-bold border transition-all ' + (problemForm.elephant === el ? 'bg-amber-600/30 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400')}
                        >
                          {eleMap[el]}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Что случилось?</span>
                    <div className="flex flex-wrap gap-2">
                      {['🥣 Съела половину', '❌ Полный отказ', '💢 Отогнали от таза', '💧 Не пьёт воду', '💊 Выплюнула добавку'].map(reason => (
                        <button
                          key={reason}
                          onClick={() => setProblemForm(p => ({...p, reason}))}
                          className={'px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ' + (problemForm.reason === reason ? 'bg-rose-600/30 border-rose-500/50 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400')}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setOpenProblemSlot(null)} className="flex-1 h-11 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs">
                      Отмена
                    </button>
                    <button 
                      onClick={submitDietProblem}
                      disabled={!problemForm.reason}
                      className="flex-[2] h-11 bg-rose-500 text-rose-950 rounded-xl font-black text-xs disabled:opacity-50 transition-all active:scale-95"
                    >
                      Зафиксировать в лог
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-t border-slate-800/50 pt-3 mt-1">
                  <div className="flex-1 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-center items-center">
                    <span className="text-emerald-500 text-lg mb-1">🟢</span>
                    <span className="text-emerald-400/80 font-bold text-[10px] text-center leading-tight">Все слонихи: аппетит и<br/>водопой в норме</span>
                  </div>
                  <button 
                    onClick={() => { setOpenProblemSlot(slot.id); setProblemForm({ elephant: 'margo', reason: '' }); }}
                    className="w-16 h-full min-h-[72px] shrink-0 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/30 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <span className="text-amber-500 text-lg">⚠️</span>
                    <span className="text-amber-500/80 font-bold text-[9px] text-center leading-tight">Отклонение</span>
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>

      {/* SCREEN 4: FODDER */}`;

code = code.replace(regexUI, newUI);
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Button patched.');
