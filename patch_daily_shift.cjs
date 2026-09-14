const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix read-only mode and auto-capture
const readOnlyRegex = /\/\/ Режим только чтения: если смена в прогрессе, но назначена ДРУГОМУ киперу\s+const isReadOnlyMode = shift\?\.status === 'in_progress' && \s+shift\.duty_keeper_id && \s+shift\.duty_keeper_id !== profile\?\.id && \s+!isAdmin && profile\?\.role !== 'vet';\s+const isEditingDisabled = isLocked \|\| isReadOnlyMode;/;

const newReadOnly = `// Режим только чтения: архив или чужая смена
  const isArchiveOrOtherKeeper = Boolean(
    shift && (
      shift.status === 'completed' || 
      (shift.duty_keeper_id && shift.duty_keeper_id !== profile?.id && !isAdmin && profile?.role !== 'vet')
    )
  );
                         
  const isEditingDisabled = isLocked || isArchiveOrOtherKeeper;`;
  
if (readOnlyRegex.test(code)) {
  code = code.replace(readOnlyRegex, newReadOnly);
} else {
  console.log("Could not find readOnlyRegex");
}

const autoCaptureRegex = /\/\/ ИСПРАВЛЕНО: Забираем смену ТОЛЬКО если у нее вообще нет дежурного \(duty_keeper_id === null\)\s+if \(!isThisShiftLocked && profile\?\.id && !loadedShift\.duty_keeper_id\) \{/;

const newAutoCapture = `// ИСПРАВЛЕНО: Забираем смену ТОЛЬКО если у нее вообще нет дежурного (duty_keeper_id === null) и это не передача
        if (!isThisShiftLocked && profile?.id && !loadedShift.duty_keeper_id && loadedShift.status !== 'handover_pending') {`;

if (autoCaptureRegex.test(code)) {
  code = code.replace(autoCaptureRegex, newAutoCapture);
} else {
  console.log("Could not find autoCaptureRegex");
}

// 2. Insert HandoverAcceptBanner component rendering
const bannerContainerRegex = /(<div className="flex justify-between items-center bg-white\/80 backdrop-blur-md sticky top-0 z-50 p-4 border-b border-zinc-200">)/;

const newBannerContainer = `{/* HANDOVER ACCEPT BANNER */}
      {shift?.status === 'handover_pending' && shift?.handover_to_keeper_id === profile?.id && (
        <HandoverAcceptBanner 
          pendingShift={shift} 
          currentUserId={profile.id}
          onAccept={loadShiftData}
          onReject={loadShiftData}
        />
      )}
      $1`;

if (bannerContainerRegex.test(code)) {
  code = code.replace(bannerContainerRegex, newBannerContainer);
} else {
  console.log("Could not find bannerContainerRegex");
}

// Ensure HandoverAcceptBanner is imported
if (!code.includes('import { HandoverAcceptBanner }')) {
  code = code.replace(
    `import { DynamicCounterSection, CounterItem } from '../components/daily-shift/DynamicCounterSection';`,
    `import { DynamicCounterSection, CounterItem } from '../components/daily-shift/DynamicCounterSection';\nimport { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';`
  );
}

// 3. Add Read-Only Badge in Header
const headerBadgeRegex = /(\{isEditOverride && isAdmin && \(\s+<div className="bg-red-100 text-red-800 px-3 py-1\.5 rounded-full flex items-center gap-2 mb-2 sm:mb-0 shadow-sm border border-red-200">\s+<ShieldAlert size=\{14\} \/>\s+<div className="text-xs font-bold">Режим редактирования архива \(Админ\)<\/div>\s+<\/div>\s+\)\})/;

const newHeaderBadge = `$1
            {isArchiveOrOtherKeeper && !isEditOverride && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full flex items-center gap-2 mb-2 sm:mb-0 shadow-sm border border-amber-200">
                <Archive size={14} className="opacity-75" />
                <div className="text-xs font-bold uppercase tracking-wider">Режим просмотра (Архив / Чужая смена)</div>
              </div>
            )}`;

if (headerBadgeRegex.test(code)) {
  code = code.replace(headerBadgeRegex, newHeaderBadge);
} else {
  console.log("Could not find headerBadgeRegex");
}

// 4. Add DynamicCounterSection
const dynamicCounterRegex = /(<FeedControl \s*shift=\{shift\}\s*onUpdate=\{handleShiftFieldChange\}\s*isReadOnly=\{isEditingDisabled\}\s*\/>\s*<\/section>)/;

const newDynamicCounter = `$1

        {/* ХОЗЯЙСТВЕННЫЙ БЛОК */}
        <section className="mb-6">
          <DynamicCounterSection 
            selectedDate={selectedDate}
            isLocked={isEditingDisabled}
            dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
          />
        </section>`;

if (dynamicCounterRegex.test(code)) {
  code = code.replace(dynamicCounterRegex, newDynamicCounter);
} else {
  console.log("Could not find dynamicCounterRegex");
}

fs.writeFileSync(file, code);
console.log('Patched DailyShiftPage.tsx');
