const fs = require('fs');
const file = 'src/components/daily-shift/ExcretionControl.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add cooldowns for sleep
const cooldownInitRegex = /const cdPrettyUrine = useCooldown\('pretty_urine', 3\);/;
const newCooldownInit = `const cdPrettyUrine = useCooldown('pretty_urine', 3);
  const cdMargoSleep = useCooldown('margo_sleep', 3);
  const cdOdriSleep = useCooldown('odri_sleep', 3);
  const cdPrettySleep = useCooldown('pretty_sleep', 3);`;
code = code.replace(cooldownInitRegex, newCooldownInit);

const getCooldownHookRegex = /if \(elephantId === 'pretty' && tab === 'urine'\) return cdPrettyUrine;\s+return null;/;
const newGetCooldownHook = `if (elephantId === 'pretty' && tab === 'urine') return cdPrettyUrine;
    if (elephantId === 'margo' && tab === 'sleep') return cdMargoSleep;
    if (elephantId === 'odri' && tab === 'sleep') return cdOdriSleep;
    if (elephantId === 'pretty' && tab === 'sleep') return cdPrettySleep;
    return null;`;
code = code.replace(getCooldownHookRegex, newGetCooldownHook);

// Update handleIncrementSleep
const handleIncrSleepRegex = /const handleIncrementSleep = \(elephantId: string\) => \{\s+if \(isLocked\) return;\s+handleHaptic\(10\);\s+const current = metrics\?\.\[elephantId\]\?\.sleep_minutes \?\? 0;/;
const newHandleIncrSleep = `const handleIncrementSleep = (elephantId: string, elephantName: string) => {
    if (isLocked) return;
    const cd = getCooldownHook(elephantId, 'sleep');
    if (cd && cd.isBlocked) return;
    
    handleHaptic(10);
    const current = metrics?.[elephantId]?.sleep_minutes ?? 0;`;
code = code.replace(handleIncrSleepRegex, newHandleIncrSleep);

const handleIncrSleepEndRegex = /onMetricChange\?\(elephantId, 'sleep_intervals', \[\s+\{ id: \`sleep-\$\{Date\.now\(\)\}\`, start: '01:00', end: '01:00' \},\s+\]\);\s+\}\s+\};/;
const newHandleIncrSleepEnd = `onMetricChange?.(elephantId, 'sleep_intervals', [
          { id: \`sleep-\${Date.now()}\`, start: '01:00', end: '01:00' },
        ]);
      }
      
      cd?.triggerCooldown();
      
      onAddEvent?.(\`+30 мин сна для \${elephantName}\`, '🌙', {
        type: 'physiology',
        elephant_id: elephantId,
        field: 'sleep_minutes',
        value: current
      });
    };`;
code = code.replace(handleIncrSleepEndRegex, newHandleIncrSleepEnd);

// Visuals for sleep buttons
const sleepRenderRegex = /elephants\.map\(elephant => \{\s+const sleepMinutes = metrics\?\.\[elephant\.id\]\?\.sleep_minutes \?\? 0;/;
const newSleepRender = `elephants.map(elephant => {
              const sleepMinutes = metrics?.[elephant.id]?.sleep_minutes ?? 0;
              const cd = getCooldownHook(elephant.id, 'sleep');
              const isBlocked = cd?.isBlocked || false;
              const remaining = cd?.remaining || 0;`;
code = code.replace(sleepRenderRegex, newSleepRender);

const sleepButtonRegex = /<button\s+type="button"\s+disabled=\{isLocked \|\| sleepMinutes >= 720\}\s+onClick=\{\(\) => handleIncrementSleep\(elephant\.id\)\}\s+className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"[\s\S]*?aria-label="Увеличить сон">[\s\S]*?\+/;

const newSleepButton = `<button
                      type="button"
                      disabled={isLocked || isBlocked || sleepMinutes >= 720}
                      onClick={() => handleIncrementSleep(elephant.id, elephant.name)}
                      className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"
                      style={{
                        background: isBlocked ? 'rgba(241,245,249,0.9)' : 'rgba(255,255,255,0.9)',
                        color: isBlocked ? '#94a3b8' : sleepMinutes > 0 ? '#4f46e5' : '#94a3b8',
                      }}
                      aria-label="Увеличить сон"
                    >
                      {isBlocked ? (
                        <span className="text-sm font-black flex items-center gap-1">
                          <Clock size={14} className="animate-pulse" />
                          {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                        </span>
                      ) : (
                        '+'
                      )}`;
code = code.replace(sleepButtonRegex, newSleepButton);

fs.writeFileSync(file, code);
