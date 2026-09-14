const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const regexIsArchive = /const isArchiveOrOtherKeeper = Boolean\([\s\S]*?\);/;
const newIsArchive = `// Режим только чтения: архив или чужая смена
  const isSupervisor = profile?.role === 'admin' || profile?.role === 'director';
  const isOtherKeeper = shift?.duty_keeper_id && shift.duty_keeper_id !== profile?.id;
  const isArchiveOrOtherKeeper = Boolean(
    shift && (
      shift.status === 'completed' || 
      (isOtherKeeper && !isSupervisor)
    )
  );`;

code = code.replace(regexIsArchive, newIsArchive);

// Add isLocked={isEditingDisabled} to ExcretionControl and ObservationEditor
code = code.replace(/<ExcretionControl\s+elephants=\{elephants\}/, '<ExcretionControl\n        isLocked={isEditingDisabled}\n        elephants={elephants}');
code = code.replace(/<ObservationEditor\s+elephant=\{activeElephant\}/, '<ObservationEditor\n          isLocked={isEditingDisabled}\n          elephant={activeElephant}');

// Fix top notification banner for Supervisor
const topBannerRegex = /\{isArchiveOrOtherKeeper && !isEditOverride && \([\s\S]*?<\/div>\s*\)\}/;
const newTopBanner = `{isArchiveOrOtherKeeper && !isEditOverride && (
        <div className="mb-4 bg-amber-50 border border-amber-200/60 rounded-[24px] p-3 shadow-sm mx-4 sm:mx-0 flex items-center justify-between">
          <p className="text-amber-800 font-bold text-sm flex items-center gap-2">
            <Lock size={16} className="shrink-0" />
            Режим просмотра (Архив / Чужая смена)
          </p>
          <div className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-100/50 px-2 py-1 rounded-lg">Read-Only</div>
        </div>
      )}
      
      {isOtherKeeper && isSupervisor && !isArchiveMode && (
        <div className="mb-4 bg-blue-50 border border-blue-200/60 rounded-[24px] p-3 shadow-sm mx-4 sm:mx-0 flex items-center justify-between">
          <p className="text-blue-800 font-bold text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            Режим супервизора / директора
          </p>
          <div className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg">Супервизор</div>
        </div>
      )}`;

code = code.replace(topBannerRegex, newTopBanner);

fs.writeFileSync(file, code);
