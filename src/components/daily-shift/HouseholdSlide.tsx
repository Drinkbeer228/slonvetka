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

interface HouseholdSlideProps {
  slideWrapperClass: string;
  addEvent: (title: string) => void;
}

type ElephantId = 'margo' | 'audrey' | 'pretty';
type SkinCareId = 'shower' | 'scrub' | 'mud' | 'pool';
type TechNodeId = 'hydro_gates' | 'drinkers_pressure' | 'barriers_perimeter' | 'heavy_tools';
type HandoverTaskId = 'gates_locks' | 'night_forage' | 'clean_drinkers' | 'corral_gates';
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
  { id: 'clean_drinkers', title: 'Автопоилки промыты и наполнены' },
  { id: 'corral_gates', title: 'Выгул: ворота заперты, периметр чист' }
];

export function HouseholdSlide({ slideWrapperClass, addEvent }: HouseholdSlideProps) {
  // 1. SKIN CARE & HYDROTHERAPY
  const [selectedElephant, setSelectedElephant] = useState<ElephantId>('margo');
  const [skinCareState, setSkinCareState] = useState<Record<ElephantId, SkinCareId[]>>(() => {
    try {
      const saved = localStorage.getItem('household_skin_care');
      return saved ? JSON.parse(saved) : { margo: [], audrey: [], pretty: [] };
    } catch {
      return { margo: [], audrey: [], pretty: [] };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('household_skin_care', JSON.stringify(skinCareState));
    } catch {}
  }, [skinCareState]);

  const toggleSkinCare = (procedureId: SkinCareId) => {
    const elName = ELEPHANTS.find(e => e.id === selectedElephant)?.name || selectedElephant;
    const proc = SKIN_CARE_PROCEDURES.find(p => p.id === procedureId);
    const currentList = skinCareState[selectedElephant] || [];
    const isAlreadyActive = currentList.includes(procedureId);

    const updated = isAlreadyActive
      ? currentList.filter(id => id !== procedureId)
      : [...currentList, procedureId];

    setSkinCareState(prev => ({ ...prev, [selectedElephant]: updated }));

    if (navigator.vibrate) navigator.vibrate(12);

    if (!isAlreadyActive) {
      addEvent(`🚿 ${proc?.title || procedureId} выполнено для ${elName}`);
    } else {
      addEvent(`↩ Отменена отметка «${proc?.title || procedureId}» для ${elName}`);
    }
  };

  // 2. DUNG & BEDDING WHEELBARROWS COUNTERS
  const [dungCount, setDungCount] = useState<number>(() => {
    try {
      const s = localStorage.getItem('household_dung_count');
      return s ? parseInt(s, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [beddingCount, setBeddingCount] = useState<number>(() => {
    try {
      const s = localStorage.getItem('household_bedding_count');
      return s ? parseInt(s, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('household_dung_count', dungCount.toString());
    } catch {}
  }, [dungCount]);

  useEffect(() => {
    try {
      localStorage.setItem('household_bedding_count', beddingCount.toString());
    } catch {}
  }, [beddingCount]);

  const updateDung = (delta: number) => {
    const nextVal = Math.max(0, dungCount + delta);
    if (nextVal === dungCount) return;
    setDungCount(nextVal);
    if (navigator.vibrate) navigator.vibrate(15);
    addEvent(`💩 Навоз вывезен: ${nextVal} тачек (${delta > 0 ? '+1' : '-1'})`);
  };

  const updateBedding = (delta: number) => {
    const nextVal = Math.max(0, beddingCount + delta);
    if (nextVal === beddingCount) return;
    setBeddingCount(nextVal);
    if (navigator.vibrate) navigator.vibrate(15);
    addEvent(`🚜 Свежая подстилка: ${nextVal} тачек (${delta > 0 ? '+1' : '-1'})`);
  };

  // 3. INFRASTRUCTURE & CLASS "A" SAFETY STATUS
  const [techStatuses, setTechStatuses] = useState<Record<TechNodeId, 'normal' | 'attention'>>(() => {
    try {
      const saved = localStorage.getItem('household_tech_statuses');
      return saved ? JSON.parse(saved) : {
        hydro_gates: 'normal',
        drinkers_pressure: 'normal',
        barriers_perimeter: 'normal',
        heavy_tools: 'normal'
      };
    } catch {
      return {
        hydro_gates: 'normal',
        drinkers_pressure: 'normal',
        barriers_perimeter: 'normal',
        heavy_tools: 'normal'
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('household_tech_statuses', JSON.stringify(techStatuses));
    } catch {}
  }, [techStatuses]);

  const toggleTechNode = (nodeId: TechNodeId) => {
    const current = techStatuses[nodeId] || 'normal';
    const nextStatus = current === 'normal' ? 'attention' : 'normal';
    const node = TECH_NODES.find(n => n.id === nodeId);

    setTechStatuses(prev => ({ ...prev, [nodeId]: nextStatus }));

    if (navigator.vibrate) navigator.vibrate(nextStatus === 'attention' ? [25, 40, 25] : 15);

    if (nextStatus === 'attention') {
      addEvent(`⚠️ Заявка технику: ${node?.label || nodeId} (требует осмотра/внимания)`);
    } else {
      addEvent(`🟢 ${node?.label || nodeId}: статус переведён в норму`);
    }
  };

  // 4. HANDOVER CHECKLIST (RESPECTFUL NON-TOXIC)
  const [checklist, setChecklist] = useState<Record<HandoverTaskId, TaskStatus | null>>(() => {
    try {
      const saved = localStorage.getItem('household_handover_checklist');
      return saved ? JSON.parse(saved) : {
        gates_locks: 'done',
        night_forage: 'done',
        clean_drinkers: 'done',
        corral_gates: 'done'
      };
    } catch {
      return {
        gates_locks: 'done',
        night_forage: 'done',
        clean_drinkers: 'done',
        corral_gates: 'done'
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('household_handover_checklist', JSON.stringify(checklist));
    } catch {}
  }, [checklist]);

  const setTaskStatus = (taskId: HandoverTaskId, status: TaskStatus) => {
    const current = checklist[taskId];
    const newStatus = current === status ? null : status;
    const task = HANDOVER_TASKS.find(t => t.id === taskId);

    setChecklist(prev => ({ ...prev, [taskId]: newStatus }));
    if (navigator.vibrate) navigator.vibrate(12);

    if (newStatus === 'done') {
      addEvent(`✓ Задача закрыта: «${task?.title || taskId}»`);
    } else if (newStatus === 'colleague') {
      addEvent(`🤝 Передано сменщику: «${task?.title || taskId}» (в процессе)`);
    } else {
      addEvent(`↩ Сброшен статус задачи «${task?.title || taskId}»`);
    }
  };

  // 5. PROTECTED SWIPE TO FINISH SHIFT
  const [handoverComplete, setHandoverComplete] = useState<boolean>(() => {
    try {
      return localStorage.getItem('household_shift_completed') === 'true';
    } catch {
      return false;
    }
  });

  const [handoverTime, setHandoverTime] = useState<string>(() => {
    try {
      return localStorage.getItem('household_shift_completed_time') || '';
    } catch {
      return '';
    }
  });

  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const handleSliderDrag = (clientX: number) => {
    if (!sliderTrackRef.current || handoverComplete) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
    setSliderValue(percentage);

    if (percentage >= 92) {
      completeHandover();
    }
  };

  const completeHandover = () => {
    setSliderValue(100);
    setHandoverComplete(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setHandoverTime(timeStr);

    try {
      localStorage.setItem('household_shift_completed', 'true');
      localStorage.setItem('household_shift_completed_time', timeStr);
    } catch {}

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    addEvent(`🏁 Смена успешно передана в ${timeStr}! Отчёт дежурства зафиксирован.`);
  };

  const revertHandover = () => {
    setHandoverComplete(false);
    setSliderValue(0);
    setHandoverTime('');

    try {
      localStorage.removeItem('household_shift_completed');
      localStorage.removeItem('household_shift_completed_time');
    } catch {}

    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    addEvent(`↺ Отменена передача смены. Режим дежурства снова активен.`);
  };

  return (
    <div className={slideWrapperClass}>
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>🧹</span>
              <span>Хозяйство</span>
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              ТБ Класса «А»
            </span>
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
              const isSelected = selectedElephant === el.id;
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
              const activeList = skinCareState[selectedElephant] || [];
              const isActive = activeList.includes(proc.id);

              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => toggleSkinCare(proc.id)}
                  className={`h-8 px-2 rounded-lg text-left transition-all flex items-center justify-between border cursor-pointer ${
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

        {/* 2. БЛОК 2: БАЛАНС ГРУНТА И ПАССАЖА ЖКТ (СИММЕТРИЧНЫЕ СЧЕТЧИКИ) */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* Dung Wheelbarrows */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1 truncate">
                <span>💩</span>
                <span className="truncate">Навоз (тачек)</span>
              </span>
              <span className="text-[9px] text-emerald-400/80 font-mono uppercase">ЖКТ</span>
            </div>

            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg h-9 px-1">
              <button
                type="button"
                onClick={() => updateDung(-1)}
                disabled={dungCount <= 0}
                className="w-7 h-7 rounded-md bg-slate-900 hover:bg-rose-950/60 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-900 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
                title="Уменьшить"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="font-mono text-base font-black text-white px-2">
                {dungCount}
              </span>

              <button
                type="button"
                onClick={() => updateDung(1)}
                className="w-7 h-7 rounded-md bg-slate-900 hover:bg-emerald-950/60 active:scale-95 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                title="Добавить тачку"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Bedding / Sand Wheelbarrows */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1 truncate">
                <span>🚜</span>
                <span className="truncate">Грунт / Песок</span>
              </span>
              <span className="text-[9px] text-amber-400/80 font-mono uppercase">Слой</span>
            </div>

            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg h-9 px-1">
              <button
                type="button"
                onClick={() => updateBedding(-1)}
                disabled={beddingCount <= 0}
                className="w-7 h-7 rounded-md bg-slate-900 hover:bg-rose-950/60 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-900 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
                title="Уменьшить"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="font-mono text-base font-black text-white px-2">
                {beddingCount}
              </span>

              <button
                type="button"
                onClick={() => updateBedding(1)}
                className="w-7 h-7 rounded-md bg-slate-900 hover:bg-amber-950/60 active:scale-95 text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                title="Добавить тачку"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
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
                  onClick={() => toggleTechNode(node.id)}
                  className={`h-8 px-2 rounded-lg text-left flex items-center justify-between border transition-all cursor-pointer ${
                    isAttention
                      ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-sm shadow-amber-950/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className="text-xs shrink-0">{node.icon}</span>
                    <span className="text-[10px] font-bold truncate leading-tight">
                      {node.label}
                    </span>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 border ${
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
                      onClick={() => setTaskStatus(task.id, 'done')}
                      className={`h-5 px-1.5 rounded text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer ${
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
                      onClick={() => setTaskStatus(task.id, 'colleague')}
                      className={`h-5 px-1.5 rounded text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer ${
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
        {handoverComplete ? (
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
              handleSliderDrag(e.clientX);
            }}
            onPointerMove={(e) => {
              if (isDragging) handleSliderDrag(e.clientX);
            }}
            onPointerUp={() => {
              setIsDragging(false);
              if (sliderValue < 92) setSliderValue(0);
            }}
            onPointerCancel={() => {
              setIsDragging(false);
              if (sliderValue < 92) setSliderValue(0);
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
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSliderValue(val);
                if (val >= 92) {
                  completeHandover();
                }
              }}
              onMouseUp={() => {
                if (sliderValue < 92) setSliderValue(0);
              }}
              onTouchEnd={() => {
                if (sliderValue < 92) setSliderValue(0);
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
