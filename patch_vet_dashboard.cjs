const fs = require('fs');

let code = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');

// Replace the specific line where riskReasons are rendered to also include sleep info before it.
const searchStr = `<ul className="mt-4 space-y-2 text-sm text-slate-300">
              {riskReasons.map(reason => (
                <li key={reason} className="flex gap-2">`;
                
const replacement = `{metric?.sleep_state?.duration ? (() => {
  const sState = metric.sleep_state;
  const isAlert = sState.duration === 'Не ложилась ⚠️' || sState.duration === '❌ Не легла';
  const isLow = sState.duration === '1-2ч' || sState.duration === '<1ч' || sState.duration === '⏱️ 1-2ч';
  let badgeText = '🟢 Норма';
  let badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
  if (isAlert) {
    badgeText = '🔴 Внимание врача';
    badgeColor = 'text-rose-400 bg-rose-950/40 border-rose-500/30';
  } else if (isLow) {
    badgeText = '🟡 Мало';
    badgeColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
  }
  
  return (
    <div className="mt-4 flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
        <span className="text-lg">🛌</span>
        <span>{sState.duration}</span>
        {sState.posture && <span className="text-slate-400">({sState.posture})</span>}
      </div>
      <span className={\`text-xs font-bold px-2.5 py-1 rounded-lg border \${badgeColor}\`}>
        {badgeText}
      </span>
    </div>
  );
})() : (
    <div className="mt-4 flex items-center p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
        <span className="text-lg">🛌</span>
        <span>Нет данных о сне</span>
      </div>
    </div>
)}
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {riskReasons.map(reason => (
                <li key={reason} className="flex gap-2">`;

code = code.replace(searchStr, replacement);
fs.writeFileSync('src/screens/VetDashboard.tsx', code);
