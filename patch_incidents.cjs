const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const counterRegex = /<DynamicCounterSection\s+selectedDate=\{selectedDate\}\s+isLocked=\{isEditingDisabled\}\s+dutyKeeperName=\{dutyKeeperName \|\| dutyKeeper\?\.name\}\s+onStatsChange=\{setCountersStats\}\s+\/>/;

const newCounter = `<DynamicCounterSection 
          selectedDate={selectedDate}
          isLocked={isEditingDisabled}
          dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
          onStatsChange={setCountersStats}
          onAddEvent={(title, icon, type, id) => addEvent({
            keeper_id: profile?.id || '',
            keeper_name: profile?.name || 'Кипер',
            action_title: title,
            icon: icon,
          })}
        />`;
code = code.replace(counterRegex, newCounter);

fs.writeFileSync(file, code);
