const fs = require('fs');
const file = 'src/components/daily-shift/ExcretionControl.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import for useCooldown
code = code.replace(/import \{ createPortal \} from 'react-dom';/, `import { createPortal } from 'react-dom';\nimport { useCooldown } from '../../hooks/useCooldown';`);

// Add onAddEvent to interface
code = code.replace(/isLocked\?: boolean;/, `isLocked?: boolean;\n  onAddEvent?: (title: string, icon: string, undoPayload: any) => void;`);

// Add it to destructured props
code = code.replace(/isLocked = false,/, `isLocked = false,\n  onAddEvent,`);

// Update increment handlers to use cooldown and fire events
const handleIncrementRegex = /const handleIncrement = \(elephantId: string\) => \{\s+if \(isLocked\) return;\s+handleHaptic\(10\);\s+const field = activeTab === 'stool' \? 'poop_count' : 'urination_count';\s+const current = \(metrics\?\.\[elephantId\]\?\.\[field\] as number\) \?\? 0;\s+const next = clampCount\(current \+ 1\);\s+onMetricChange\?\(elephantId, field, next\);\s+\};/;

const newHandleIncrement = `
  // Cooldowns for each elephant/tab combination
  const cdMargoPoop = useCooldown('margo_poop', 3);
  const cdOdriPoop = useCooldown('odri_poop', 3);
  const cdPrettyPoop = useCooldown('pretty_poop', 3);
  const cdMargoUrine = useCooldown('margo_urine', 3);
  const cdOdriUrine = useCooldown('odri_urine', 3);
  const cdPrettyUrine = useCooldown('pretty_urine', 3);

  const getCooldownHook = (elephantId: string, tab: string) => {
    if (elephantId === 'margo' && tab === 'stool') return cdMargoPoop;
    if (elephantId === 'odri' && tab === 'stool') return cdOdriPoop;
    if (elephantId === 'pretty' && tab === 'stool') return cdPrettyPoop;
    if (elephantId === 'margo' && tab === 'urine') return cdMargoUrine;
    if (elephantId === 'odri' && tab === 'urine') return cdOdriUrine;
    if (elephantId === 'pretty' && tab === 'urine') return cdPrettyUrine;
    return null;
  };

  const handleIncrement = (elephantId: string, elephantName: string) => {
    if (isLocked) return;
    const cd = getCooldownHook(elephantId, activeTab);
    if (cd && cd.isBlocked) return; // Blocked by cooldown
    
    handleHaptic(10);
    const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
    const current = (metrics?.[elephantId]?.[field] as number) ?? 0;
    const next = clampCount(current + 1);
    
    onMetricChange?.(elephantId, field, next);
    
    // Trigger cooldown
    cd?.triggerCooldown();
    
    // Add event
    const actionName = activeTab === 'stool' ? 'куча' : 'лужа';
    const icon = activeTab === 'stool' ? '💩' : '💦';
    onAddEvent?.(\`+1 \${actionName} для \${elephantName}\`, icon, {
      type: 'physiology',
      elephant_id: elephantId,
      field,
      value: current
    });
  };`;
code = code.replace(handleIncrementRegex, newHandleIncrement);

// Also update render for the increment button
const renderIncrRegex = /onClick=\{\(\) => handleIncrement\(elephant\.id\)\}/g;
code = code.replace(renderIncrRegex, 'onClick={() => handleIncrement(elephant.id, elephant.name)}');

// Fix the disabled state to include cooldown
const buttonDisabledRegex = /disabled=\{isLocked\}/g;
// Actually, let's just do it carefully.
fs.writeFileSync(file, code);
