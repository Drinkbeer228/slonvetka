const fs = require('fs');
const file = 'src/components/daily-shift/ExcretionControl.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  const handleIncrement = (elephantId: string) => {
    if (isLocked) return;
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    onMetricChange?.(elephantId, field, clampCount(current + 1));
  };`;

const replacement = `
  const cdMargoPoop = useCooldown('margo_poop', 3);
  const cdOdriPoop = useCooldown('odri_poop', 3);
  const cdPrettyPoop = useCooldown('pretty_poop', 3);
  const cdMargoUrine = useCooldown('margo_urine', 3);
  const cdOdriUrine = useCooldown('odri_urine', 3);
  const cdPrettyUrine = useCooldown('pretty_urine', 3);
  const cdMargoSleep = useCooldown('margo_sleep', 3);
  const cdOdriSleep = useCooldown('odri_sleep', 3);
  const cdPrettySleep = useCooldown('pretty_sleep', 3);

  const getCooldownHook = (elephantId: string, tab: string) => {
    if (elephantId === 'margo' && tab === 'stool') return cdMargoPoop;
    if (elephantId === 'odri' && tab === 'stool') return cdOdriPoop;
    if (elephantId === 'pretty' && tab === 'stool') return cdPrettyPoop;
    if (elephantId === 'margo' && tab === 'urine') return cdMargoUrine;
    if (elephantId === 'odri' && tab === 'urine') return cdOdriUrine;
    if (elephantId === 'pretty' && tab === 'urine') return cdPrettyUrine;
    if (elephantId === 'margo' && tab === 'sleep') return cdMargoSleep;
    if (elephantId === 'odri' && tab === 'sleep') return cdOdriSleep;
    if (elephantId === 'pretty' && tab === 'sleep') return cdPrettySleep;
    return null;
  };

  const handleIncrement = (elephantId: string, elephantName: string) => {
    if (isLocked) return;
    const cd = getCooldownHook(elephantId, activeTab);
    if (cd && cd.isBlocked) return;
    
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    const next = clampCount(current + 1);
    onMetricChange?.(elephantId, field, next);
    
    cd?.triggerCooldown();
    const actionName = activeTab === 'stool' ? 'куча' : 'лужа';
    const icon = activeTab === 'stool' ? '💩' : '💦';
    onAddEvent?.(\`+1 \${actionName} для \${elephantName}\`, icon, {
      type: 'physiology',
      elephant_id: elephantId,
      field,
      value: current
    });
  };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
} else {
  console.log("target not found");
}

fs.writeFileSync(file, code);
