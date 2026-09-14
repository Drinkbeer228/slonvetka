const fs = require('fs');
const file = 'src/components/daily-shift/ExcretionControl.tsx';
let code = fs.readFileSync(file, 'utf8');

const target1 = `            const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
            const count = (metrics?.[elephant.id]?.[field] as number) ?? 0;
            const hasCount = count > 0;`;

const replacement1 = `            const field = activeTab === 'stool' ? 'poop_count' : 'urination_count';
            const count = (metrics?.[elephant.id]?.[field] as number) ?? 0;
            const hasCount = count > 0;
            const cd = getCooldownHook(elephant.id, activeTab);
            const isBlocked = cd?.isBlocked || false;
            const remaining = cd?.remaining || 0;`;

code = code.replace(target1, replacement1);

const target2 = `onClick={() => handleIncrementSleep(elephant.id)}`;
const replacement2 = `onClick={() => handleIncrementSleep(elephant.id, elephant.name)}`;

code = code.replace(target2, replacement2);

fs.writeFileSync(file, code);
