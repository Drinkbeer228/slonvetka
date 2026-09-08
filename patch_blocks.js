import fs from 'fs';
const content = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const regex2 = /\{\/\* BLOCK 2: VETERINARY ASSIGNMENTS & EDIT\/UNMARK ACTIONS \*\/\}(.|\n)*?\{\/\* BLOCK 3: INDEPENDENT FEED STREAMS \(BALES & ROLLS\/BAGS\) \*\/\}/m;

const replacement2 = `{/* BLOCK 2: VETERINARY ASSIGNMENTS */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <h2 className="text-lg font-black tracking-tight text-zinc-800">
              🩺 2. Назначения
            </h2>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-sm text-zinc-400 font-medium py-2">Назначений нет</p>
              ) : (
                assignments.map(assignment => {
                  const elephant = elephants.find(e => e.id === assignment.elephant_id);
                  const relatedRecord = shiftRecords.find(r => r.assignment_id === assignment.id);
                  const isCompletedToday = !!relatedRecord;

                  return (
                    <div key={assignment.id} className="p-4 rounded-2xl border bg-slate-50 border-slate-200 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 text-left">
                          <span className="font-bold text-sm text-slate-900">
                            {elephant ? elephant.name : 'Слон'} · {assignment.title}
                          </span>
                          <span className={\`text-xs font-bold \${isCompletedToday ? 'text-emerald-600' : 'text-amber-600'}\`}>
                            {isCompletedToday ? '✓ Выполнено' : '🟡 Активно'}
                          </span>
                          {assignment.medicine && (
                            <span className="text-xs text-slate-500 mt-1 line-clamp-1">💊 {assignment.medicine}</span>
                          )}
                        </div>
                        {relatedRecord?.photos && relatedRecord.photos.length > 0 && (
                          <div className="flex gap-1 shrink-0">
                            {relatedRecord.photos.slice(0,1).map(p => {
                              const thumbUrl = supabaseService.getPublicUrl(p.storage_path);
                              return (
                                <img
                                  key={p.id}
                                  src={thumbUrl}
                                  alt="Фотоотчет"
                                  onClick={() => setPreviewPhotoUrl(thumbUrl)}
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-sm"
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isCompletedToday ? (
                          !isLocked && elephant && (
                            <div className="flex items-center gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => setSelectedTask({ assignment, elephant, existingRecord: relatedRecord })}
                                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition text-center"
                              >
                                Редактировать
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnmarkTask(relatedRecord.id)}
                                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )
                        ) : (
                          !isLocked && elephant && (
                            <button
                              type="button"
                              onClick={() => setSelectedTask({ assignment, elephant })}
                              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition"
                            >
                              Выполнить
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BLOCK 3: INDEPENDENT FEED STREAMS (BALES & ROLLS/BAGS) */}`;

let newContent = content.replace(regex2, replacement2);

const regex3 = /\{\/\* BLOCK 3: INDEPENDENT FEED STREAMS \(BALES & ROLLS\/BAGS\) \*\/\}(.|\n)*?\{\/\* BLOCK 4: HANDOVER \(СДАЧА СМЕНЫ СЛЕДУЮЩЕМУ\) \*\/\}/m;

const replacement3 = `{/* BLOCK 3: КОРМ */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-zinc-800">🌾 3. Корм</h2>
              {isVet && (
                <button
                  type="button"
                  onClick={() => {
                    setModalBales(hayStockBales);
                    setModalRolls(hayStockRolls);
                    setReplenishModalOpen(true);
                  }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs"
                >
                  Склад
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-sm font-bold text-slate-800 mb-3">Тюки сена</div>
                <CounterButton
                  label="Выдано сегодня"
                  value={hayBalesDistributed}
                  onChange={(val) => handleShiftFieldChange('hay_bales_distributed', val, true)}
                />
                <div className="text-xs text-slate-400 mt-2 font-medium">На складе: {Math.max(0, hayStockBales - hayBalesDistributed)} тюков</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-sm font-bold text-slate-800 mb-3">Рулоны и мешки</div>
                <CounterButton
                  label="Выдано сегодня"
                  value={hayBagsDistributed}
                  onChange={(val) => handleShiftFieldChange('hay_bags_distributed', val, true)}
                />
                <div className="text-xs text-slate-400 mt-2 font-medium">На складе: {hayStockRolls} шт</div>
              </div>
            </div>
          </div>

          {/* BLOCK 4: HANDOVER (СДАЧА СМЕНЫ СЛЕДУЮЩЕМУ) */}`;

newContent = newContent.replace(regex3, replacement3);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', newContent);
console.log('Done replacing blocks 2 and 3.');
