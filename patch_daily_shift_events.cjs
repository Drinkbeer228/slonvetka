const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Import useShiftEvents and ShiftActivityFeed
code = code.replace(
  `import { ShiftHandoverModal } from '../components/daily-shift/ShiftHandoverModal';`,
  `import { ShiftHandoverModal } from '../components/daily-shift/ShiftHandoverModal';\nimport { useShiftEvents, ShiftEvent } from '../hooks/useShiftEvents';\nimport { ShiftActivityFeed } from '../components/daily-shift/ShiftActivityFeed';`
);

// Add useShiftEvents hook in DailyShiftPage
const hookInjection = `const [prevKeeperName, setPrevKeeperName] = useState<string>('Не указан');
  
  const { events: shiftEvents, addEvent, removeEvent } = useShiftEvents(shift?.id || null);

  const handleUndoEvent = (event: ShiftEvent) => {
    if (!event.undo_payload) return;
    const { type, elephant_id, field, value, assignment_id, record_id } = event.undo_payload;
    
    if (type === 'physiology' && elephant_id && field && value) {
      handleMetricChange(elephant_id, field as keyof ElephantDailyMetrics, value);
      removeEvent(event.id);
    }
  };`;

code = code.replace(/const \[prevKeeperName, setPrevKeeperName\] = useState<string>\('Не указан'\);/, hookInjection);

// Pass onAddEvent to ExcretionControl
code = code.replace(
  /<ExcretionControl\s+isLocked=\{isEditingDisabled\}\s+elephants=\{elephants\}\s+metrics=\{metrics\}\s+onMetricChange=\{\(elephantId, field, val\) => handleMetricChange\(elephantId, field, val\)\}\s+\/>/,
  `<ExcretionControl
        isLocked={isEditingDisabled}
        elephants={elephants}
        metrics={metrics}
        onMetricChange={(elephantId, field, val) => handleMetricChange(elephantId, field, val)}
        onAddEvent={(actionTitle, icon, undoPayload) => addEvent({
          keeper_id: profile?.id || '',
          keeper_name: profile?.name || 'Кипер',
          action_title: actionTitle,
          icon,
          undo_payload: undoPayload
        })}
      />`
);

// Inject ShiftActivityFeed before ObservationEditor
const feedInjection = `{/* 5.5. ЛЕНТА СОБЫТИЙ */}
      <section className="mb-6 mx-4 sm:mx-0">
        <ShiftActivityFeed
          events={shiftEvents}
          currentUserId={profile?.id}
          onUndo={handleUndoEvent}
        />
      </section>

      {/* 6. ЖУРНАЛ НАБЛЮДЕНИЙ`;

code = code.replace(/\{\/\* 6\. ЖУРНАЛ НАБЛЮДЕНИЙ/, feedInjection);

fs.writeFileSync(file, code);
