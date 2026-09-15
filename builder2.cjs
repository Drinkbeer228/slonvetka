const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `
  const incrementMetric = (eid: string, field: 'poop_count'|'urination_count'|'sleep_minutes', val: number) => {
    setMetrics(prev => {
      const current = prev[eid]?.[field] || 0;
      return { ...prev, [eid]: { ...prev[eid], [field]: Math.max(0, current + val) } };
    });
    addEvent(\`\${eid}: \${field} \${val > 0 ? '+' : ''}\${val}\`);
  };

  const updateInventory = (field: string, val: number) => {
    setInventory(prev => ({ ...prev, [field]: Math.max(0, prev[field] + val) }));
    addEvent(\`Склад: \${field} \${val > 0 ? '+' : ''}\${val}\`);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory scroll-smooth touch-pan-y overscroll-none select-none bg-slate-950 text-slate-100" ref={containerRef}>
      
      {/* SMART AUTO-HIDING HEADER */}
      <div className={\`fixed top-0 left-0 right-0 z-40 px-4 h-[52px] flex items-center justify-between bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-transform duration-300 \${scrollDir === 'down' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}\`}>
        <div className="font-bold text-lg text-emerald-400 flex items-center gap-2">
          🐘 СлоноВет
        </div>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-rose-500" />}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">
            <Calendar className="w-5 h-5" />
          </button>
          <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FLOATING INDICATOR */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={\`w-1.5 rounded-full transition-all duration-300 \${activeReel === i ? 'h-6 bg-emerald-400' : 'h-1.5 bg-slate-700'}\`} />
        ))}
      </div>

      {/* FLOATING LOG BADGE */}
      <button onClick={() => setLogOpen(true)} className="fixed bottom-5 right-4 z-30 pointer-events-auto shadow-2xl flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 text-xs font-medium active:scale-95">
        <ClipboardList className="w-4 h-4 text-emerald-400" />
        Лента смены
        <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">{events.length}</span>
      </button>

      {/* REEL 1: PHYSIO */}
      <div className="reel-section snap-start snap-always h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 pb-6 box-border shrink-0 relative pt-[60px]" data-index="0">
        <div className="flex flex-col gap-2.5 flex-1 justify-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">💩 Физиология и дефекация</h2>
          
          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {[{ id: 'poop', label: '💩 Кучи' }, { id: 'urine', label: '💧 Лужи' }, { id: 'sleep', label: '🌙 Сон' }].map(tab => (
              <button key={tab.id} onClick={() => setPhysioTab(tab.id as any)} className={\`py-2 rounded-xl text-sm transition-all active:scale-95 \${physioTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 font-medium'}\`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full">
            {['margo', 'audrey', 'pretty'].map((eid) => (
              <div key={eid} className="flex flex-col">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <div className={\`w-2 h-2 rounded-full \${eid === 'margo' ? 'bg-emerald-400' : eid === 'audrey' ? 'bg-amber-400' : 'bg-purple-400'}\`} />
                  <span className="text-sm font-bold capitalize">{eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти'}</span>
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes', physioTab === 'sleep' ? 30 : 1)} className="h-[52px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-t-xl active:bg-emerald-500 active:text-slate-950 text-2xl font-bold flex items-center justify-center transition-colors">
                  +
                </button>
                <div className="text-4xl font-black font-mono py-2 text-center text-white bg-slate-900/60 border-x border-slate-800">
                  {metrics[eid]?.[physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes'] || 0}
                </div>
                <button onClick={() => incrementMetric(eid, physioTab === 'poop' ? 'poop_count' : physioTab === 'urine' ? 'urination_count' : 'sleep_minutes', physioTab === 'sleep' ? -30 : -1)} className="h-[44px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-b-xl active:bg-rose-500 active:text-white text-xl font-bold flex items-center justify-center transition-colors">
                  -
                </button>
              </div>
            ))}
          </div>

          {physioTab === 'poop' && (
            <div className="mt-2">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Характер стула</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'norm', label: '🟢 Сформирован (норма)', activeClass: 'bg-emerald-600 text-white font-bold border-emerald-400' },
                  { id: 'dry', label: '🌾 Сухой / Рассыпчатый', activeClass: 'bg-amber-600 text-white font-bold border-amber-400' },
                  { id: 'liquid', label: '⚠️ Жидкий / Понос', activeClass: 'bg-rose-600 text-white font-bold border-rose-400 animate-pulse', requirePhoto: true },
                  { id: 'blood', label: '🩸 Слизь / Кровь / Гельминты', activeClass: 'bg-rose-700 text-white font-bold border-rose-500 animate-pulse', requirePhoto: true }
                ].map(chip => (
                  <button key={chip.id} onClick={() => { addEvent(\`Стул: \${chip.label}\`); }} className={\`p-3 rounded-2xl border border-slate-700 bg-slate-800/50 text-sm font-medium active:scale-95 transition-all text-left\`}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
`;
fs.appendFileSync(file, code);
