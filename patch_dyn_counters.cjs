const fs = require('fs');
const file = 'src/components/daily-shift/DynamicCounterSection.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add onAddEvent to interface
code = code.replace(/onStatsChange\?: \(stats: \{ meritsTotal: number; damageTotal: number; merits: CounterItem\[\]; damages: CounterItem\[\] \}\) => void;/,
  `onStatsChange?: (stats: { meritsTotal: number; damageTotal: number; merits: CounterItem[]; damages: CounterItem[] }) => void;\n  onAddEvent?: (title: string, icon: string, type: string, id: string) => void;`);

// Add to props
code = code.replace(/onStatsChange\s+\}: DynamicCounterSectionProps\) \{/,
  `onStatsChange,\n  onAddEvent\n}: DynamicCounterSectionProps) {`);

// Call onAddEvent inside handleAddMerit and handleAddDamage
const meritRegex = /const newLog: ActionLog = \{\s+id: \`log-\$\{Date\.now\(\)\}\`,\s+text: `\+\$\{merit\.label\}`,\s+authorName: dutyKeeperName \|\| profile\?\.name \|\| 'Кипер',\s+timestamp: new Date\(\)\.toISOString\(\),\s+type: 'merit'\s+\};\s+setLogs\(prev => \[newLog, \.\.\.prev\.slice\(0, 19\)\]\);/g;

const newMerit = `const newLog: ActionLog = {
          id: \`log-\${Date.now()}\`,
          text: \`+\${merit.label}\`,
          authorName: dutyKeeperName || profile?.name || 'Кипер',
          timestamp: new Date().toISOString(),
          type: 'merit'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        onAddEvent?.(\`+\${merit.label}\`, merit.emoji, 'merit', merit.id);`;

code = code.replace(meritRegex, newMerit);

const damageRegex = /const newLog: ActionLog = \{\s+id: \`log-\$\{Date\.now\(\)\}\`,\s+text: `\+\$\{damage\.label\}`,\s+authorName: dutyKeeperName \|\| profile\?\.name \|\| 'Кипер',\s+timestamp: new Date\(\)\.toISOString\(\),\s+type: 'damage'\s+\};\s+setLogs\(prev => \[newLog, \.\.\.prev\.slice\(0, 19\)\]\);/g;

const newDamage = `const newLog: ActionLog = {
          id: \`log-\${Date.now()}\`,
          text: \`+\${damage.label}\`,
          authorName: dutyKeeperName || profile?.name || 'Кипер',
          timestamp: new Date().toISOString(),
          type: 'damage'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        onAddEvent?.(\`+\${damage.label}\`, damage.emoji, 'damage', damage.id);`;
code = code.replace(damageRegex, newDamage);

const customRegex = /const newLog: ActionLog = \{\s+id: \`log-\$\{Date\.now\(\)\}\`,\s+text: newIncidentTitle\.trim\(\),\s+authorName: dutyKeeperName \|\| profile\?\.name \|\| 'Кипер',\s+timestamp: new Date\(\)\.toISOString\(\),\s+type: 'damage'\s+\};\s+setLogs\(prev => \[newLog, \.\.\.prev\.slice\(0, 19\)\]\);/g;

const newCustom = `const newLog: ActionLog = {
      id: \`log-\${Date.now()}\`,
      text: newIncidentTitle.trim(),
      authorName: dutyKeeperName || profile?.name || 'Кипер',
      timestamp: new Date().toISOString(),
      type: 'damage'
    };

    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    onAddEvent?.(newIncidentTitle.trim(), selectedEmoji, 'custom', newIncident.id);`;

code = code.replace(customRegex, newCustom);

fs.writeFileSync(file, code);
