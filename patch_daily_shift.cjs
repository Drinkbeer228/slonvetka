const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove ShiftActivityFeed import
code = code.replace(
  /import \{ ShiftActivityFeed \} from '\.\.\/components\/daily-shift\/ShiftActivityFeed';\n/,
  ''
);

// 2. Define isFeedEditingDisabled
const targetIsEditingDisabled = "  const isEditingDisabled = isLocked || isArchiveOrOtherKeeper;";
const replacementIsEditingDisabled = "  const isEditingDisabled = isLocked || isArchiveOrOtherKeeper;\n  const isFeedEditingDisabled = isEditingDisabled || profile?.role === 'vet';";
code = code.replace(targetIsEditingDisabled, replacementIsEditingDisabled);

// 3. Hide Склад button for vet
const targetSkaldButton = `            <button
              type="button"
              onClick={() => {
                setModalBales(feedInventory.hay_bales.quantity_in_stock);
                setModalRolls(feedInventory.hay_rolls.quantity_in_stock);
                setModalBranches(feedInventory.branches.quantity_in_stock);
                setReplenishModalOpen(true);
              }}
              className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Управление остатками на складе feed_inventory"
            >
              <Package size={13} className="text-amber-600" />
              <span>Склад</span>
            </button>`;

const replacementSkaldButton = `            {profile?.role !== 'vet' && (
              <button
                type="button"
                onClick={() => {
                  setModalBales(feedInventory.hay_bales.quantity_in_stock);
                  setModalRolls(feedInventory.hay_rolls.quantity_in_stock);
                  setModalBranches(feedInventory.branches.quantity_in_stock);
                  setReplenishModalOpen(true);
                }}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Управление остатками на складе feed_inventory"
              >
                <Package size={13} className="text-amber-600" />
                <span>Склад</span>
              </button>
            )}`;

code = code.replace(targetSkaldButton, replacementSkaldButton);

// 4. Update Feed controls to use isFeedEditingDisabled
// Hay Bales CounterButton
const targetBalesDisabled = `            <CounterButton
              value={hayBalesDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
              disabled={isEditingDisabled}
              variant="vertical"
              unit="тюков"
            />`;
const replacementBalesDisabled = `            <CounterButton
              value={hayBalesDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
              disabled={isFeedEditingDisabled}
              variant="vertical"
              unit="тюков"
            />`;
code = code.replace(targetBalesDisabled, replacementBalesDisabled);

// Hay Rolls CounterButton
const targetRollsDisabled = `            <CounterButton
              value={hayBagsDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
              disabled={isEditingDisabled}
              variant="vertical"
              unit="рулонов"
            />`;
const replacementRollsDisabled = `            <CounterButton
              value={hayBagsDistributed}
              onChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
              disabled={isFeedEditingDisabled}
              variant="vertical"
              unit="рулонов"
            />`;
code = code.replace(targetRollsDisabled, replacementRollsDisabled);

// Branches CounterButton
const targetBranchesDisabled = `            <CounterButton
              value={currentRation.branches_distributed}
              onChange={handleBranchesChange}
              disabled={isEditingDisabled}
              variant="vertical"
              unit="веников"
            />`;
const replacementBranchesDisabled = `            <CounterButton
              value={currentRation.branches_distributed}
              onChange={handleBranchesChange}
              disabled={isFeedEditingDisabled}
              variant="vertical"
              unit="веников"
            />`;
code = code.replace(targetBranchesDisabled, replacementBranchesDisabled);

// FeedControl Component
const targetFeedControl = `      <div>
        <FeedControl
          ration={currentRation}
          isLocked={isLocked}
          dutyKeeperName={dutyKeeper?.name}`;
const replacementFeedControl = `      <div>
        <FeedControl
          ration={currentRation}
          isLocked={isFeedEditingDisabled}
          dutyKeeperName={dutyKeeper?.name}`;
code = code.replace(targetFeedControl, replacementFeedControl);
code = code.replace(/isLocked=\{isEditingDisabled\}\n          dutyKeeperName=\{dutyKeeper\?.name\}/g, "isLocked={isFeedEditingDisabled}\n          dutyKeeperName={dutyKeeper?.name}"); // Just in case it was written differently


// 5. Remove ShiftActivityFeed usage
const targetActivityFeed = `      {/* 5.5. ЛЕНТА СОБЫТИЙ */}
      <section className="mb-6 mx-4 sm:mx-0">
        <ShiftActivityFeed
          events={shiftEvents}
          currentUserId={profile?.id}
          onUndo={handleUndoEvent}
        />
      </section>`;
code = code.replace(targetActivityFeed, '');

fs.writeFileSync(file, code);
