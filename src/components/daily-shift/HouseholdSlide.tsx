import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Users, 
  ChevronRight, 
  Plus, 
  Minus, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useStore } from '../../store';
import { normalizeElephantSlug, getElephantName } from '../../utils/elephantUtils';
import { useRole } from '../../context/RoleContext';

interface HouseholdSlideProps {
  slideWrapperClass: string;
  addEvent: (title: string) => void;
}

type ElephantId = 'margo' | 'audrey' | 'pretty';
type SkinCareId = 'shower' | 'scrub' | 'mud' | 'pool';
type TechNodeId = 'hydro_gates' | 'drinkers_pressure' | 'barriers_perimeter' | 'heavy_tools';
type HandoverTaskId = 'gates_locks' | 'night_forage' | 'enrichment' | 'clean_drinkers' | 'corral_gates';
type TaskStatus = 'done' | 'colleague';

const ELEPHANTS: { id: ElephantId; name: string }[] = [
  { id: 'margo', name: 'Марго' },
  { id: 'audrey', name: 'Одри' },
  { id: 'pretty', name: 'Прэтти' }
];

const SKIN_CARE_PROCEDURES: { id: SkinCareId; title: string; subtitle: string; icon: string }[] = [
  { id: 'shower', title: 'Проливка / Душ', subtitle: 'терморегуляция и смыв пыли', icon: '🚿' },
  { id: 'scrub', title: 'Скраб / Щётки', subtitle: 'уход за эпидермисом', icon: '🧼' },
  { id: 'mud', title: 'Грязь / Песок', subtitle: 'защитный грязевой чехол', icon: '🪵' },
  { id: 'pool', title: 'Бассейн / Ров', subtitle: 'свободное купание', icon: '🏊' }
];

const TECH_NODES: { id: TechNodeId; label: string; icon: string }[] = [
  { id: 'hydro_gates', label: 'Гидро-шиберы / Замки', icon: '🔒' },
  { id: 'drinkers_pressure', label: 'Поилки / Давление', icon: '💧' },
  { id: 'barriers_perimeter', label: 'Барьеры / Периметр', icon: '⚡' },
  { id: 'heavy_tools', label: 'Тяжёлый инвентарь', icon: '🛠️' }
];

const HANDOVER_TASKS: { id: HandoverTaskId; title: string }[] = [
  { id: 'gates_locks', title: 'Шиберы и вольеры на замках (ТБ)' },
  { id: 'night_forage', title: 'Ночной фураж и ветки развешаны на высоте' },
  { id: 'enrichment', title: '🌳 Обогащение среды (игрушки, подвесы)' },
  { id: 'clean_drinkers', title: 'Автопоилки промыты и наполнены' },
  { id: 'corral_gates', title: 'Выгул: ворота заперты, периметр чист' }
];

export function HouseholdSlide({ slideWrapperClass, addEvent }: HouseholdSlideProps) {
  const { elephants: storeElephants } = useStore();
  const { isChief, isKeeper, roleConfig } = useRole();
  const canInteract = isKeeper;

  // Helper for resilient vibration
  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // 1. SKIN CARE & HYDROTHERAPY
  const [selectedElephant, setSelectedElephant] = useLocalStorage<string>(
    'slonovet_active_elephant',
    'margo'
  );

  const normSelectedElephant = normalizeElephantSlug(selectedElephant, storeElephants);

  const [skinCareState, setSkinCareState] = useLocalStorage<Record<ElephantId, SkinCareId[]>>(
    'slonovet_household_skin_care',
    { margo: [], audrey: [], pretty: [] },
    ['household_skin_care']
  );

  const toggleSkinCare = (procedureId: SkinCareId) => {
    const elName = getElephantName(normSelectedElephant, storeElephants);
    const proc = SKIN_CARE_PROCEDURES.find(p => p.id === procedureId);
    const currentList = skinCareState[normSelectedElephant] || [];
    const isAlreadyActive = currentList.includes(procedureId);

    const updated = isAlreadyActive
      ? currentList.filter(id => id !== procedureId)
      : [...currentList, procedureId];

    setSkinCareState(prev => ({ ...prev, [normSelectedElephant]: updated }));

    triggerHaptic(12);

    if (!isAlreadyActive) {
      addEvent(`🚿 ${proc?.title || procedureId} выполнено для ${elName}`);
    } else {
      addEvent(`↩ Отменена отметка «${proc?.title || procedureId}» для ${elName}`);
    }
  };

  // 2. BEDDING / SAND WHEELBARROWS COUNTER (ПОДСТИЛКА В ВОЛЬЕРАХ)
  const [beddingCount, setBeddingCount] = useLocalStorage<number>(
    'slonovet_household_bedding_count',
    0,
    ['household_bedding_count']
  );

  const updateBedding = (delta: number) => {
    const nextVal = Math.max(0, beddingCount + delta);
    if (nextVal === beddingCount) return;
    setBeddingCount(nextVal);
    triggerHaptic(15);
    addEvent(`🚜 Свежая подстилка: ${nextVal} тачек (${delta > 0 ? '+1' : '-1'})`);
  };

  const setBeddingDirect = (val: number) => {
    const nextVal = Math.max(0, Math.min(20, val));
    setBeddingCount(nextVal);
    triggerHaptic(12);
    addEvent(`🚜 Подстилка/песок за смену: ${nextVal} тачек`);
  };

  // 3. INFRASTRUCTURE & CLASS "A" SAFETY STATUS
  const [techStatuses, setTechStatuses] = useLocalStorage<Record<TechNodeId, 'normal' | 'attention'>>(
    'slonovet_household_tech_statuses',
    {
      hydro_gates: 'normal',
      drinkers_pressure: 'normal',
      barriers_perimeter: 'normal',
      heavy_tools: 'normal'
    },
    ['household_tech_statuses']
  );

  const toggleTechNode = (nodeId: TechNodeId) => {
    const current = techStatuses[nodeId] || 'normal';
    const nextStatus = current === 'normal' ? 'attention' : 'normal';
    const node = TECH_NODES.find(n => n.id === nodeId);

    setTechStatuses(prev => ({ ...prev, [nodeId]: nextStatus }));

    triggerHaptic(nextStatus === 'attention' ? [25, 40, 25] : 15);

    if (nextStatus === 'attention') {
      addEvent(`⚠️ Заявка технику: ${node?.label || nodeId} (требует осмотра/внимания)`);
    } else {
      addEvent(`🟢 ${node?.label || nodeId}: статус переведён в норму`);
    }
  };

  // 4. HANDOVER CHECKLIST (RESPECTFUL NON-TOXIC)
  const [checklist, setChecklist] = useLocalStorage<Record<HandoverTaskId, TaskStatus | null>>(
    'slonovet_household_handover_checklist',
    {
      gates_locks: 'done',
      night_forage: 'done',
      enrichment: 'done',
      clean_drinkers: 'done',
      corral_gates: 'done'
    },
    ['household_handover_checklist']
  );

  const setTaskStatus = (taskId: HandoverTaskId, status: TaskStatus) => {
    const current = checklist[taskId];
    const newStatus = current === status ? null : status;
    const task = HANDOVER_TASKS.find(t => t.id === taskId);

    setChecklist(prev => ({ ...prev, [taskId]: newStatus }));
    triggerHaptic(12);

    if (newStatus === 'done') {
      addEvent(`✓ Задача закрыта: «${task?.title || taskId}»`);
    } else if (newStatus === 'colleague') {
      addEvent(`🤝 Передано сменщику: «${task?.title || taskId}» (в процессе)`);
    } else {
      addEvent(`↩ Сброшен статус задачи «${task?.title || taskId}»`);
    }
  };

  // 5. PROTECTED SWIPE TO FINISH SHIFT
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
    if (!sliderTrackRef.current || handoverComplete) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
    setSliderValue(percentage);

    // Haptic notch feedback at 25%, 50%, 75% milestones
    const step = Math.floor(percentage / 25);
    if (step > lastVibratedStepRef.current && percentage < 92) {
      lastVibratedStepRef.current = step;
      triggerHaptic(12); // subtle tactile tick on each threshold
    }

    if (percentage >= 92 && !hasTriggeredCompleteRef.current) {
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

    // Rich tactile multi-pulse haptic feedback confirming shift completion
    triggerHaptic([35, 50, 60]);
    addEvent(`🏁 Смена успешно передана в ${timeStr}! Отчёт дежурства зафиксирован.`);
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
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
              <span>🧹</span>
              <span>Хозяйство и ТБ</span>
            </h1>
            {!isKeeper ? (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded-full">
                🔒 Режим просмотра ({roleConfig.shortLabel})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <span>Дежурство</span>
            {handoverComplete ? (
              <span className="text-emerald-400 font-mono font-black">✓ Сдано {handoverTime}</span>
            ) : (
              <span className="text-amber-400 animate-pulse">● В процессе</span>
            )}
          </div>
        </div>

        {/* NON-KEEPER NOTICE */}
        {!canInteract && (
          <div className="px-2.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between">
            <span>🔒 Режим просмотра: отмечать хозяйство и ТБ могут только киперы</span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">{roleConfig.shortLabel}</span>
          </div>
        )}

        {/* 1. БЛОК 1: ГИГИЕНА КОЖИ И ВОДНЫЕ ПРОЦЕДУРЫ */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-200 flex items-center gap-1">
              <span>🚿</span>
              <span>Водные процедуры и уход за кожей</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1 тап</span>
          </div>

          {/* Elephant Selector */}
          <div className="grid grid-cols-3 gap-1">
            {ELEPHANTS.map(el => {
              const isSelected = normSelectedElephant === el.id;
              const count = (skinCareState[el.id] || []).length;
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => {
                    setSelectedElephant(el.id);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-500/20 border-teal-500/70 text-teal-300 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span>🐘</span>
                  <span>{el.name}</span>
                  {count > 0 && (
                    <span className="ml-0.5 text-[9px] font-mono px-1 rounded-full bg-teal-900/80 text-teal-300 border border-teal-500/40">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 4 Multi-select Procedure Chips for Active Elephant */}
          <div className="grid grid-cols-2 gap-1">
            {SKIN_CARE_PROCEDURES.map(proc => {
              const activeList = skinCareState[normSelectedElephant] || [];
              const isActive = activeList.includes(proc.id);

              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={!canInteract ? undefined : () => toggleSkinCare(proc.id)}
                  disabled={!canInteract}
                  className={`h-8 px-2 rounded-lg text-left transition-all flex items-center justify-between border ${
                    !canInteract ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    isActive
                      ? 'bg-teal-950/70 border-teal-500/60 text-teal-200 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className="text-xs shrink-0">{proc.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold truncate leading-tight">
                        {proc.title}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 ${isActive ? 'text-teal-300' : 'text-slate-600'}`}>
                    {isActive ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. БЛОК 2: ОБНОВЛЕНИЕ ПОДСТИЛКИ (ГРУНТ / ПЕСОК) */}
        <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col justify-between shadow-sm gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🚜</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  Грунт / Песок
                </span>
                <span className="text-[9px] text-slate-400 leading-none">
                  Обновление подстилки в вольерах за смену
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={!canInteract ? undefined : () => updateBedding(-1)}
                disabled={!canInteract}
                className={`w-6 h-6 rounded-lg text-slate-300 font-black text-xs flex items-center justify-center transition-all border border-slate-700 ${
                  !canInteract ? 'bg-slate-950 cursor-not-allowed opacity-50' : 'bg-slate-800 hover:bg-slate-700 active:scale-95 cursor-pointer'
                }`}
                title="Уменьшить на 1 тачку"
              >
                -
              </button>
              <span className="font-mono text-sm font-black text-amber-400 min-w-[50px] text-center">
                {beddingCount} <span className="text-[10px] font-normal text-slate-400">тачек</span>
              </span>
              <button
                type="button"
                onClick={!canInteract ? undefined : () => updateBedding(1)}
                disabled={!canInteract}
                className={`w-6 h-6 rounded-lg text-slate-300 font-black text-xs flex items-center justify-center transition-all border border-slate-700 ${
                  !canInteract ? 'bg-slate-950 cursor-not-allowed opacity-50' : 'bg-slate-800 hover:bg-slate-700 active:scale-95 cursor-pointer'
                }`}
                title="Добавить 1 тачку"
              >
                +
              </button>
            </div>
          </div>

          <input 
            type="range"
            min="0"
            max="15"
            step="1"
            value={beddingCount}
            disabled={!canInteract}
            onChange={(e) => setBeddingDirect(parseInt(e.target.value, 10))}
            className={`w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg my-1 ${
              !canInteract ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          />

          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 4, 6, 8].map(val => (
              <button
                key={val}
                type="button"
                onClick={!canInteract ? undefined : () => setBeddingDirect(val)}
                disabled={!canInteract}
                className={`h-6.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${
                  !canInteract ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  beddingCount === val
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {val} тач
              </button>
            ))}
          </div>
        </div>

        {/* 3. БЛОК 3: ИНФРАСТРУКТУРА И ТБ КЛАССА «А» (ТЕХ-СТАТУС) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-200 flex items-center gap-1">
              <span>🚨</span>
              <span>Инфраструктура и безопасность (Тех-служба)</span>
            </span>
            <span className="text-[9px] text-slate-400">тап: норма / заявка</span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            {TECH_NODES.map(node => {
              const status = techStatuses[node.id] || 'normal';
              const isAttention = status === 'attention';

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={!canInteract ? undefined : () => toggleTechNode(node.id)}
                  disabled={!canInteract}
                  className={`min-h-[38px] py-1 px-1.5 rounded-lg flex items-center justify-between border transition-all ${
                    !canInteract ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    isAttention
                      ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-sm shadow-amber-950/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0 pr-1 flex-1">
                    <span className="text-xs shrink-0">{node.icon}</span>
                    <span className="whitespace-normal text-center leading-tight text-[11px] font-bold flex-1">
                      {node.label}
                    </span>
                  </div>
                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full shrink-0 border ${
                    isAttention
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {isAttention ? 'Внимание' : 'Норма'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. БЛОК 4: ЧЕК-ЛИСТ ПЕРЕДАЧИ ДЕЖУРСТВА (БЕЗ ТОКСИЧНОСТИ) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-black text-slate-200 flex items-center gap-1">
              <span>📋</span>
              <span>Передача дежурства сменщику</span>
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Сделано / Коллеге</span>
          </div>

          <div className="flex flex-col gap-1">
            {HANDOVER_TASKS.map(task => {
              const status = checklist[task.id];
              const isDone = status === 'done';
              const isColleague = status === 'colleague';

              return (
                <div
                  key={task.id}
                  className="h-7 px-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-1"
                >
                  <span className="text-[10px] font-semibold text-slate-300 truncate pr-1">
                    {task.title}
                  </span>

                  {/* Two-part Segment Switch */}
                  <div className="flex items-center gap-0.5 shrink-0 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                    <button
                      type="button"
                      onClick={!canInteract ? undefined : () => setTaskStatus(task.id, 'done')}
                      disabled={!canInteract}
                      className={`h-5 px-1.5 rounded text-[9px] font-black flex items-center gap-0.5 transition-all ${
                        !canInteract ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                      } ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Сделано</span>
                    </button>

                    <button
                      type="button"
                      onClick={!canInteract ? undefined : () => setTaskStatus(task.id, 'colleague')}
                      disabled={!canInteract}
                      className={`h-5 px-1.5 rounded text-[9px] font-black flex items-center gap-0.5 transition-all ${
                        !canInteract ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                      } ${
                        isColleague
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Передать задачу сменщику без штрафов"
                    >
                      <Users className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Коллеге</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. ЗАЩИЩЕННЫЙ СВАЙПЕР ЗАКРЫТИЯ СМЕНЫ (SWIPE TO FINISH) */}
        {!canInteract ? (
          <div className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold shadow-sm">
            <span>🔒 Режим просмотра: передача смены доступна только киперам</span>
          </div>
        ) : handoverComplete ? (
          <div className="h-10 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                ✓
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-emerald-200 truncate">
                  Смена передана! Отчёт зафиксирован
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono">
                  Время фиксации: {handoverTime}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={revertHandover}
              className="h-7 px-2.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 active:scale-95 border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-200 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="Отменить закрытие смены и вернуться к редактированию"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Отменить</span>
            </button>
          </div>
        ) : (
          <div 
            ref={sliderTrackRef}
            className="relative h-10 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center select-none shadow-md touch-none"
            onPointerDown={(e) => {
              setIsDragging(true);
              hasTriggeredCompleteRef.current = false;
              lastVibratedStepRef.current = 0;
              triggerHaptic(10); // initial touch feedback
              handleSliderDrag(e.clientX);
            }}
            onPointerMove={(e) => {
              if (isDragging) handleSliderDrag(e.clientX);
            }}
            onPointerUp={() => {
              setIsDragging(false);
              if (sliderValue < 92) {
                if (sliderValue >= 20) {
                  triggerHaptic(15); // snap back rejection haptic
                }
                setSliderValue(0);
              }
              lastVibratedStepRef.current = 0;
            }}
            onPointerCancel={() => {
              setIsDragging(false);
              if (sliderValue < 92) {
                if (sliderValue >= 20) {
                  triggerHaptic(15);
                }
                setSliderValue(0);
              }
              lastVibratedStepRef.current = 0;
            }}
          >
            {/* Filled highlight track */}
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-600/30 to-emerald-500/50 border-r border-emerald-400/80 transition-all duration-75 pointer-events-none"
              style={{ width: `${sliderValue}%` }}
            />

            {/* Label with arrows */}
            <div className="relative z-10 flex items-center gap-1.5 text-[11px] font-bold text-slate-300 pointer-events-none">
              <span className="text-emerald-400 opacity-80 animate-pulse">›››</span>
              <span>Потяните вправо для передачи смены</span>
              <span className="text-emerald-400 opacity-80 animate-pulse">›››</span>
            </div>

            {/* Draggable Slider Thumb */}
            <div 
              className="absolute top-1 bottom-1 w-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950/50 cursor-grab active:cursor-grabbing z-20 transition-all duration-75"
              style={{ left: `calc(${sliderValue}% * 0.88 + 4px)` }}
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>

            {/* Accessible range input overlay for keyboard and standard interactions */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onPointerDown={() => {
                hasTriggeredCompleteRef.current = false;
                lastVibratedStepRef.current = 0;
                triggerHaptic(10);
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSliderValue(val);
                const step = Math.floor(val / 25);
                if (step > lastVibratedStepRef.current && val < 92) {
                  lastVibratedStepRef.current = step;
                  triggerHaptic(12);
                }
                if (val >= 92 && !hasTriggeredCompleteRef.current) {
                  hasTriggeredCompleteRef.current = true;
                  completeHandover();
                }
              }}
              onMouseUp={() => {
                if (sliderValue < 92) {
                  if (sliderValue >= 20) triggerHaptic(15);
                  setSliderValue(0);
                }
                lastVibratedStepRef.current = 0;
              }}
              onTouchEnd={() => {
                if (sliderValue < 92) {
                  if (sliderValue >= 20) triggerHaptic(15);
                  setSliderValue(0);
                }
                lastVibratedStepRef.current = 0;
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              aria-label="Провести для передачи смены"
            />
          </div>
        )}

      </div>
    </div>
  );
}
