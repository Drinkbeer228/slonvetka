const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Replace Reel 5 & 6
const regex = /\{\/\* 5\. ВЕТЕРИНАРНЫЕ НАЗНАЧЕНИЯ \/ ПРОЦЕДУРЫ \(ЕСЛИ ЕСТЬ АКТИВНЫЕ\) \*\/\}[\s\S]*?(?=\{\/\* 7\. НИЖНЯЯ ПАНЕЛЬ)/;

const newReels = `
      {/* 5. РИЛС 5: ЗДОРОВЬЕ, НАЗНАЧЕНИЯ И СТЕРЕОТИПИИ */}
      <div className="snap-start h-[calc(100dvh-3.5rem)] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-start space-y-4">
        {activeElephant && (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <span className="text-base leading-none">🩺</span> Здоровье и стереотипии
            </div>
            
            <ElephantSelector
              elephants={elephants || []}
              activeElephantId={activeElephant.id}
              onSelect={setActiveElephantId}
              metrics={metrics}
            />

            {assignmentsForEle.length > 0 && (
              <div className="space-y-3">
                {assignmentsForEle.map(assignment => {
                  const relatedRecord = (shiftRecords || []).find(r => r.assignment_id === assignment.id);
                  const isCompletedToday = !!relatedRecord;
                  const keeperName = relatedRecord?.keeper?.name 
                    || staffList.find(s => s.id === relatedRecord?.keeper_id)?.name
                    || (relatedRecord?.keeper_id === profile?.id ? profile?.name : undefined);
                  const completedTime = relatedRecord?.performed_at
                    ? new Date(relatedRecord.performed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : undefined;
                  
                  return (
                    <VeterinaryAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      isCompletedToday={isCompletedToday}
                      isLocked={isLocked || canManageMedicalAssignments}
                      completedAt={completedTime}
                      completedByKeeperName={keeperName}
                      onExecute={() => setSelectedTask({ assignment, elephant: activeElephant, existingRecord: relatedRecord })}
                      onQuickExecute={() => handleQuickExecuteTask(assignment)}
                      onUnmark={() => relatedRecord && handleUnmarkTask(relatedRecord.id, assignment.id)}
                      onEdit={() => setSelectedTask({ assignment, elephant: activeElephant, existingRecord: relatedRecord })}
                    />
                  );
                })}
              </div>
            )}

            <CircusElephantMonitoring 
              elephant={activeElephant}
              metrics={m || {}}
              isLocked={isEditingDisabled}
              onMetricChange={(field, val) => handleMetricChange(activeElephant.id, field as any, val)}
            />
          </>
        )}
      </div>

      {/* 6. РИЛС 6: СОЦИАЛЬНАЯ ДИНАМИКА */}
      <div className="snap-start h-[calc(100dvh-3.5rem)] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto justify-start">
         <SocialDynamicsSection 
            elephantId={activeElephantId}
            isLocked={isEditingDisabled}
            onAddEvent={(text, icon) => addEvent({
               keeper_id: profile?.id || '',
               keeper_name: profile?.name || 'Кипер',
               action_title: text,
               icon
            })}
         />
      </div>

      `;

code = code.replace(regex, newReels);
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
