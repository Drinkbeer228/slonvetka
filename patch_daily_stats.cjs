const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add state for damages
const stateInjection = `const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [shiftDamages, setShiftDamages] = useState<CounterItem[]>([]);`;

code = code.replace(/const \[staffList, setStaffList\] = useState<\{ id: string; name: string; role: string \}\[\]>\(\[\]\);/, stateInjection);

// Update DynamicCounterSection
const dynamicCounterBlock = `<DynamicCounterSection 
          selectedDate={selectedDate}
          isLocked={isEditingDisabled}
          dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
          onStatsChange={(stats) => setShiftDamages(stats.damages)}
        />`;

code = code.replace(/<DynamicCounterSection[\s\S]*?\/>/, dynamicCounterBlock);

// Pass damages to ShiftSummaryModal
const modalRegex = /<ShiftSummaryModal\s+isOpen=\{isEndMatchModalOpen\}/;
code = code.replace(modalRegex, `<ShiftSummaryModal\n        damages={shiftDamages}\n        isOpen={isEndMatchModalOpen}`);

// Ensure CounterItem is imported if not already. It is imported at line 21
fs.writeFileSync(file, code);
