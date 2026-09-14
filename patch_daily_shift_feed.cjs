const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Inject onAddEvent to FeedControl
const feedRegex = /<FeedControl\s+ration=\{currentRation\}\s+isLocked=\{isEditingDisabled\}\s+dutyKeeperName=\{dutyKeeperName \|\| dutyKeeper\?\.name\}\s+onPorridgeFieldChange=\{handleRationChange\}\s+hayBalesDistributed=\{hayBalesDistributed\}\s+hayBagsDistributed=\{hayBagsDistributed\}\s+onBalesChange=\{\(val\) => handleShiftFieldChange\('hay_bales_distributed', val\)\}\s+onBagsChange=\{\(val\) => handleShiftFieldChange\('hay_bags_distributed', val\)\}\s+onFeedNotesChange=\{\(val\) => handleShiftFieldChange\('feed_notes', val\)\}\s+\/>/;

const newFeed = `<FeedControl
        ration={currentRation}
        isLocked={isEditingDisabled}
        dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
        onPorridgeFieldChange={handleRationChange}
        hayBalesDistributed={hayBalesDistributed}
        hayBagsDistributed={hayBagsDistributed}
        onBalesChange={(val) => {
          handleShiftFieldChange('hay_bales_distributed', val);
          if (val > hayBalesDistributed) {
            addEvent({
              keeper_id: profile?.id || '',
              keeper_name: profile?.name || 'Кипер',
              action_title: \`Выдано тюков сена: \${val}\`,
              icon: '🌾',
              undo_payload: { type: 'feed', field: 'hay_bales_distributed', value: hayBalesDistributed }
            });
          }
        }}
        onBagsChange={(val) => {
          handleShiftFieldChange('hay_bags_distributed', val);
          if (val > hayBagsDistributed) {
            addEvent({
              keeper_id: profile?.id || '',
              keeper_name: profile?.name || 'Кипер',
              action_title: \`Выдано рулонов сена: \${val}\`,
              icon: '🌿',
              undo_payload: { type: 'feed', field: 'hay_bags_distributed', value: hayBagsDistributed }
            });
          }
        }}
        onFeedNotesChange={(val) => handleShiftFieldChange('feed_notes', val)}
      />`;
code = code.replace(feedRegex, newFeed);

// Update handleUndoEvent to support feed
const undoRegex = /if \(type === 'physiology' && elephant_id && field && value\) \{\s+handleMetricChange\(elephant_id, field as keyof ElephantDailyMetrics, value\);\s+removeEvent\(event\.id\);\s+\}/;
const newUndo = `if (type === 'physiology' && elephant_id && field && value !== undefined) {
      handleMetricChange(elephant_id, field as keyof ElephantDailyMetrics, value);
      removeEvent(event.id);
    } else if (type === 'feed' && field && value !== undefined) {
      handleShiftFieldChange(field as any, value);
      removeEvent(event.id);
    }`;
code = code.replace(undoRegex, newUndo);

fs.writeFileSync(file, code);
