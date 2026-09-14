const fs = require('fs');
const file = 'src/components/daily-shift/ExcretionControl.tsx';
let code = fs.readFileSync(file, 'utf8');

// I need to use the hook return values inside the map over elephants.
const renderMapRegex = /elephants\.map\(elephant => \{[\s\S]*?const hasCount = count > 0;/;
const newRenderMap = `elephants.map(elephant => {
              const currentMetric = metrics?.[elephant.id];
              const count = (currentMetric?.[activeTab === 'stool' ? 'poop_count' : 'urination_count'] as number) ?? 0;
              const hasCount = count > 0;
              const cd = getCooldownHook(elephant.id, activeTab);
              const isBlocked = cd?.isBlocked || false;
              const remaining = cd?.remaining || 0;`;

code = code.replace(renderMapRegex, newRenderMap);

// Replace button props
const buttonRegex = /<button\s+type="button"\s+disabled=\{isLocked\}\s+onClick=\{\(\) => handleIncrement\(elephant\.id, elephant\.name\)\}\s+className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"[\s\S]*?aria-label=\{(.*?)\}\s*>\s*\+/;

const newButton = `<button
                    type="button"
                    disabled={isLocked || isBlocked}
                    onClick={() => handleIncrement(elephant.id, elephant.name)}
                    className="h-11 w-full flex items-center justify-center text-xl font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none tap-target"
                    style={{
                      background: isBlocked ? 'rgba(241,245,249,0.9)' : 'rgba(255,255,255,0.9)',
                      color: isBlocked ? '#94a3b8' : hasCount
                        ? activeTab === 'stool' ? '#ea580c' : '#0284c7'
                        : '#94a3b8',
                    }}
                    aria-label={$1}
                  >
                    {isBlocked ? (
                      <span className="text-sm font-black flex items-center gap-1">
                        <Clock size={14} className="animate-pulse" />
                        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      '+'
                    )}`;

code = code.replace(buttonRegex, newButton);

// Also add Clock icon import if missing
if (!code.includes('import { Trash2, X, Moon, Waves, Leaf, Clock }')) {
  code = code.replace(/import \{ Trash2, X, Moon, Waves, Leaf \} from 'lucide-react';/, "import { Trash2, X, Moon, Waves, Leaf, Clock } from 'lucide-react';");
}

fs.writeFileSync(file, code);
