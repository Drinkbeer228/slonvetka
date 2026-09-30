import React, { useState, useRef } from 'react';
import { 
  Check, 
  ChevronRight, 
  RotateCcw,
  ClipboardList,
  Lock
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useRole } from '../../context/RoleContext';

interface HouseholdSlideProps {
  slideWrapperClass: string;
  addEvent: (title: string) => void;
  onOpenLog?: () => void;
}

interface ChecklistItem {
  id: 'bedding' | 'locks' | 'drinkers' | 'forage' | 'bath';
  num: number;
  title: string;
  note?: string;
  mandatory: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'bedding',
    num: 1,
    title: 'Подстилка сухая, сено обновлено',
    mandatory: true
  },
  {
    id: 'locks',
    num: 2,
    title: 'Шиберы и вольеры на замках, периметр чист',
    mandatory: true
  },
  {
    id: 'drinkers',
    num: 3,
    title: 'Автопоилки промыты, вода есть',
    mandatory: true
  },
  {
    id: 'forage',
    num: 4,
    title: 'Ночной фураж (рулоны/сетки) развешан',
    mandatory: true
  },
  {
    id: 'bath',
    num: 5,
    title: 'Банный день (Кёрхер + мыло)',
    note: '(по графику / раз в неделю)',
    mandatory: false
  }
];

export function HouseholdSlide({ slideWrapperClass, addEvent, onOpenLog }: HouseholdSlideProps) {
  const { isKeeper, roleConfig } = useRole();
  const canInteract = isKeeper;

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // 1. ЧЕК-ЛИСТ ОБХОДНОГО ЛИСТА
  const [checklist, setChecklist] = useLocalStorage<Record<string, boolean>>(
    'slonovet_household_checklist_v2',
    {
      bedding: false,
      locks: false,
      drinkers: false,
      forage: false,
      bath: false
    }
  );

  const toggleItem = (id: string) => {
    if (!canInteract) return;
    const isDoneNow = !checklist[id];
    setChecklist(prev => ({ ...prev, [id]: isDoneNow }));
    triggerHaptic(12);

    const item = CHECKLIST_ITEMS.find(i => i.id === id);
    if (isDoneNow) {
      addEvent(`✓ Выполнено: «${item?.title || id}»`);
    } else {
      addEvent(`↩ Снята отметка: «${item?.title || id}»`);
    }
  };

  // Первые 4 пункта обязательны для передачи смены
  const isMandatoryDone = Boolean(
    checklist.bedding && 
    checklist.locks && 
    checklist.drinkers && 
    checklist.forage
  );

  const completedCount = CHECKLIST_ITEMS.filter(i => checklist[i.id]).length;

  // 2. СДАЧА СМЕНЫ
  const [handoverComplete, setHandoverComplete] = useLocalStorage<boolean>(
    'slonovet_household_shift_completed',
    false,
    ['household_shift_completed']
  );

  const [handoverTime, setHandoverTime] = useLocalStorage<string>(
    'slonovet_household_shift_completed_time',
    '',
    ['household_shift_completed_time']
  );

  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const lastVibratedStepRef = useRef<number>(0);
  const hasTriggeredCompleteRef = useRef<boolean>(false);

  const handleSliderDrag = (clientX: number) => {
    if (!sliderTrackRef.current || handoverComplete || !isMandatoryDone) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
    setSliderValue(percentage);

    const step = Math.floor(percentage / 25);
    if (step > lastVibratedStepRef.current && percentage < 90) {
      lastVibratedStepRef.current = step;
      triggerHaptic(12);
    }

    if (percentage >= 90 && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true;
      completeHandover();
    }
  };

  const completeHandover = () => {
    setSliderValue(100);
    setHandoverComplete(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setHandoverTime(timeStr);

    triggerHaptic([35, 50, 60]);
    addEvent(`🏁 Смена успешно передана в ${timeStr}! Обходной лист зафиксирован.`);
  };

  const revertHandover = () => {
    setHandoverComplete(false);
    setSliderValue(0);
    setHandoverTime('');
    hasTriggeredCompleteRef.current = false;
    lastVibratedStepRef.current = 0;

    triggerHaptic([20, 30, 20]);
    addEvent(`↺ Отменена передача смены. Режим дежурства снова активен.`);
  };

  return (
    <div className={slideWrapperClass}>
      <div className="flex flex-col gap-3 max-w-lg mx-auto w-full h-full justify-between">
        
        {/* HEADER */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>🧹</span>
              <span>Сдача дежурства</span>
            </h1>
            {!isKeeper ? (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded-full">
                🔒 Режим просмотра ({roleConfig.shortLabel})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
            {handoverComplete ? (
              <span className="text-emerald-400 font-mono font-black">✓ Сдано {handoverTime}</span>
            ) : (
              <span className="text-amber-400">● В процессе</span>
            )}
          </div>
        </div>

        {/* NON-KEEPER NOTICE */}
        {!canInteract && (
          <div className="px-3 py-2 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center justify-between shrink-0">
            <span>🔒 Режим просмотра: отмечать чек-лист могут только киперы</span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">{roleConfig.shortLabel}</span>
          </div>
        )}

        {/* ЦЕНТРАЛЬНЫЙ БЛОК: ОБХОДНОЙ ЛИСТ (5 ПУНКТОВ) */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col flex-1 min-h-0 shadow-sm gap-2.5">
          
          {/* Header блока */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h2 className="text-xs font-black text-white leading-tight">
                Обходной лист (Сдача дежурства)
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono font-bold">
              <span className={isMandatoryDone ? "text-emerald-400 font-black" : "text-amber-400"}>
                {completedCount}/5
              </span>
              {isMandatoryDone && <span className="text-emerald-400 font-bold text-[10px]">✓ Ок</span>}
            </div>
          </div>

          {/* Список 5 пунктов */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {CHECKLIST_ITEMS.map((item) => {
              const isDone = Boolean(checklist[item.id]);

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                      isDone 
                        ? 'bg-emerald-500 text-zinc-950' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                    }`}>
                      {item.num}
                    </span>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold leading-tight">
                        {item.title}
                      </span>
                      {item.note && (
                        <span className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5">
                          {item.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    disabled={!canInteract}
                    className={`h-9 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 ${
                      !canInteract ? 'cursor-not-allowed opacity-60' : ''
                    } ${
                      isDone
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isDone ? 'text-zinc-950' : 'text-zinc-400'}`} />
                    <span>{isDone ? 'Сделано' : 'Сделать'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Информационная плашка внизу чек-листа */}
          <div className="pt-2 border-t border-zinc-800/80 shrink-0 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate">
              {isMandatoryDone 
                ? '🟢 Обязательные пункты закрыты, можно передавать смену' 
                : '⚠️ Пункты 1–4 обязательны перед сдачей смены'}
            </span>
          </div>

        </div>

        {/* ФИНАЛЬНОЕ ДЕЙСТВИЕ: СЛАЙДЕР СДАЧИ СМЕНЫ + КНОПКА ЛЕНТЫ */}
        <div className="shrink-0 w-full pt-1">
          {!canInteract ? (
            <div className="h-12 px-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold shadow-sm">
              <span>🔒 Режим просмотра: передача смены доступна только киперам</span>
            </div>
          ) : handoverComplete ? (
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-12 px-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
                    ✓
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-emerald-200 truncate">
                      Смена передана! Отчёт зафиксирован
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-mono">
                      Время: {handoverTime}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={revertHandover}
                  className="h-8 px-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 active:scale-95 border border-zinc-700 hover:border-rose-500/60 text-zinc-300 hover:text-rose-200 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title="Отменить закрытие смены и вернуться к редактированию"
                >
                  <RotateCcw className="w-3 h-3 text-rose-400" />
                  <span>Отменить</span>
                </button>
              </div>

              {onOpenLog && (
                <button
                  type="button"
                  onClick={onOpenLog}
                  className="h-12 px-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs font-bold active:scale-95 transition-all cursor-pointer hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  title="Открыть ленту событий"
                >
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Лента</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1">
                {!isMandatoryDone ? (
                  <div className="h-12 px-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center gap-2 text-zinc-500 text-xs font-bold shadow-sm select-none">
                    <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="truncate">Отметьте пункты 1–4 для передачи смены</span>
                  </div>
                ) : (
                  <div 
                    ref={sliderTrackRef}
                    className="relative h-12 bg-zinc-900 border border-emerald-500/50 rounded-2xl overflow-hidden flex items-center justify-center select-none shadow-lg shadow-emerald-500/10 touch-none"
                    onPointerDown={(e) => {
                      setIsDragging(true);
                      hasTriggeredCompleteRef.current = false;
                      lastVibratedStepRef.current = 0;
                      triggerHaptic(10);
                      handleSliderDrag(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (isDragging) handleSliderDrag(e.clientX);
                    }}
                    onPointerUp={() => {
                      setIsDragging(false);
                      if (sliderValue < 90) setSliderValue(0);
                      lastVibratedStepRef.current = 0;
                    }}
                    onPointerCancel={() => {
                      setIsDragging(false);
                      if (sliderValue < 90) setSliderValue(0);
                      lastVibratedStepRef.current = 0;
                    }}
                  >
                    {/* Filled track highlight */}
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-600/30 to-emerald-500/60 border-r border-emerald-400 transition-all duration-75 pointer-events-none"
                      style={{ width: `${sliderValue}%` }}
                    />

                    {/* Text instructions */}
                    <div className="relative z-10 flex items-center gap-1.5 text-xs font-black text-white pointer-events-none px-2 text-center">
                      <span>👉</span>
                      <span>Потяните вправо для передачи смены</span>
                    </div>

                    {/* Draggable thumb */}
                    <div 
                      className="absolute top-1 bottom-1 w-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-20 transition-all duration-75"
                      style={{ left: `calc(${sliderValue}% * 0.86 + 4px)` }}
                    >
                      <ChevronRight className="w-5 h-5 stroke-[3]" />
                    </div>

                    {/* Accessible input overlay */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValue}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSliderValue(val);
                        if (val >= 90 && !hasTriggeredCompleteRef.current) {
                          hasTriggeredCompleteRef.current = true;
                          completeHandover();
                        }
                      }}
                      onMouseUp={() => {
                        if (sliderValue < 90) setSliderValue(0);
                      }}
                      onTouchEnd={() => {
                        if (sliderValue < 90) setSliderValue(0);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      aria-label="Потяните вправо для передачи смены"
                    />
                  </div>
                )}
              </div>

              {onOpenLog && (
                <button
                  type="button"
                  onClick={onOpenLog}
                  className="h-12 px-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs font-bold active:scale-95 transition-all cursor-pointer hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                  title="Открыть ленту событий"
                >
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Лента</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
