const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update isReadOnlyMode
const searchReadOnly = 'const isReadOnlyMode = shift?.status === \'in_progress\' && \n                         shift.duty_keeper_id && \n                         shift.duty_keeper_id !== profile?.id && \n                         !isAdmin && profile?.role !== \'vet\';';
const newReadOnly = `const isReadOnlyMode = Boolean(
    shift && (
      shift.status === 'completed' || 
      (shift.duty_keeper_id && shift.duty_keeper_id !== profile?.id && !isAdmin && profile?.role !== 'vet')
    )
  );`;

if (code.includes(searchReadOnly)) {
  code = code.replace(searchReadOnly, newReadOnly);
} else {
  // Let's use regex with whitespace flexibility
  code = code.replace(/const isReadOnlyMode = shift\?\.status === 'in_progress'[\s\S]*?!isAdmin && profile\?\.role !== 'vet';/, newReadOnly);
}

// 2. Update auto capture logic
code = code.replace(
  /\/\/ ИСПРАВЛЕНО: Забираем смену ТОЛЬКО если у нее вообще нет дежурного \(duty_keeper_id === null\)\s+if \(!isThisShiftLocked && profile\?\.id && !loadedShift\.duty_keeper_id\) \{/,
  `// ИСПРАВЛЕНО: Забираем смену ТОЛЬКО если у нее вообще нет дежурного (duty_keeper_id === null) и это не передача\n        if (!isThisShiftLocked && profile?.id && !loadedShift.duty_keeper_id && loadedShift.status !== 'handover_pending') {`
);

// 3. Add HandoverAcceptBanner just after TOP NOTIFICATION BANNERS
code = code.replace(
  /\{\/\* TOP NOTIFICATION BANNERS \*\/\}/,
  `{/* HANDOVER ACCEPT BANNER */}
      {shift?.status === 'handover_pending' && shift?.handover_to_keeper_id === profile?.id && (
        <HandoverAcceptBanner 
          pendingShift={shift} 
          currentUserId={profile.id}
          onAccept={() => loadShiftData()}
          onReject={() => loadShiftData()}
        />
      )}

      {/* TOP NOTIFICATION BANNERS */}`
);

// Add imports
if (!code.includes('import { HandoverAcceptBanner }')) {
  code = code.replace(
    `import { ArchiveBanner } from '../components/daily-shift/ArchiveBanner';`,
    `import { ArchiveBanner } from '../components/daily-shift/ArchiveBanner';\nimport { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';\nimport { DynamicCounterSection } from '../components/daily-shift/DynamicCounterSection';`
  );
}

// 4. Update the red admin badge to also include amber read-only badge
const archiveBadgeBlock = `{isArchiveMode && !isEditOverride && !isReadOnlyMode && (
        <ArchiveBanner
          isAdmin={isAdmin}
          onReturnToToday={() => setSelectedDate(todayStr)}
          onUnlockAdmin={() => setIsEditOverride(true)}
        />
      )}`;

const readOnlyBadgeBlock = `{isReadOnlyMode && !isEditOverride && (
        <div className="mb-4 bg-amber-50 border border-amber-200/60 rounded-[24px] p-3 shadow-sm mx-4 sm:mx-0 flex items-center justify-between">
          <p className="text-amber-800 font-bold text-sm flex items-center gap-2">
            <Lock size={16} className="shrink-0" />
            Режим просмотра (Архив / Чужая смена)
          </p>
          <div className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-100/50 px-2 py-1 rounded-lg">Read-Only</div>
        </div>
      )}`;

// replace the old readOnly banner with the new one
code = code.replace(
  /\{isReadOnlyMode && \([\s\S]*?<\/div>\s*\)\}/,
  readOnlyBadgeBlock
);

// 5. Add DynamicCounterSection after FeedControl
const feedControlEnd = /<FeedControl[\s\S]*?\/>\s*<\/div>/;
const dynamicCounterBlock = `
      {/* 5. ХОЗЯЙСТВЕННЫЙ БЛОК (Инциденты и счетчики) */}
      <section className="mb-6 mx-4 sm:mx-0">
        <DynamicCounterSection 
          selectedDate={selectedDate}
          isLocked={isEditingDisabled}
          dutyKeeperName={dutyKeeperName || dutyKeeper?.name}
        />
      </section>`;

code = code.replace(feedControlEnd, match => match + dynamicCounterBlock);

fs.writeFileSync(file, code);
console.log('Patched DailyShiftPage.tsx completely.');
