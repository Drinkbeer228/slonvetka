const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix ExcretionControl
code = code.replace(/<ExcretionControl\s+isLocked=\{isEditingDisabled\}\s+elephants=\{elephants\}\s+metrics=\{metrics\}\s+onMetricChange=\{\(elephantId, field, val\) => handleMetricChange\(elephantId, field, val\)\}\s+isLocked=\{isLocked\}\s+\/>/, 
`<ExcretionControl
        isLocked={isEditingDisabled}
        elephants={elephants}
        metrics={metrics}
        onMetricChange={(elephantId, field, val) => handleMetricChange(elephantId, field, val)}
      />`);

// Fix ObservationEditor
code = code.replace(/<ObservationEditor\s+isLocked=\{isEditingDisabled\}\s+elephant=\{activeElephant\}\s+elephants=\{elephants\}\s+allMetrics=\{metrics\}\s+metrics=\{m\}\s+isLocked=\{isLocked\}/,
`<ObservationEditor
          isLocked={isEditingDisabled}
          elephant={activeElephant}
          elephants={elephants}
          allMetrics={metrics}
          metrics={m}`);

// Fix ShiftSummaryModal damages duplicate
code = code.replace(/<ShiftSummaryModal\s+damages=\{shiftDamages\}\s+isOpen=\{isEndMatchModalOpen\}/, `<ShiftSummaryModal\n        isOpen={isEndMatchModalOpen}`);

// Wait, I should also make sure DynamicCounterSection passes stats to countersStats!
// I changed onStatsChange={(stats) => setShiftDamages(stats.damages)}. 
// Let's restore it to setCountersStats.
code = code.replace(/onStatsChange=\{\(stats\) => setShiftDamages\(stats\.damages\)\}/, 'onStatsChange={setCountersStats}');

fs.writeFileSync(file, code);
