import React, { useState, useRef } from 'react';
import {
  ChevronDown, ChevronUp, Camera, Plus, Minus, CheckCircle2,
  AlertTriangle, ShieldAlert, Sparkles, X, Eye, Video, HeartPulse, Clock, Trash2
} from 'lucide-react';
import {
  ElephantShiftChecklist,
  SocialPair,
  SocialContactType,
  HierarchyConflict,
  StereotypyType,
  StereotypyDuration,
  VocalizationType,
  LimbStatus,
  GaitAssessment,
  FecesConsistency,
  FecesContent,
  UrineColor,
  UrineFrequency,
  FeedingSlotTime,
  AppetiteIssue,
  SleepIntervalItem,
  WaterIntakeStatus,
  WaterBowlStatus,
  BehaviorState,
  WashingType,
  SkinCondition,
  EyeObservation,
  TrunkTone,
  normalizeChecklist,
} from '../../types/conservation';
import { ChecklistEvaluationResult } from '../../utils/conservationStandard';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

interface ChineseElephantAccordionProps {
  elephantId: string;
  elephantName: string;
  checklist: ElephantShiftChecklist;
  evaluation: ChecklistEvaluationResult;
  onChange: (updated: ElephantShiftChecklist) => void;
  onLogShiftEvent?: (title: string, icon: string) => void;
  onRequestChiefApproval?: () => void;
  triggerHaptic?: (ms?: number) => void;
}

export function ChineseElephantAccordion({
  elephantId,
  elephantName,
  checklist: incomingChecklist,
  evaluation,
  onChange,
  onLogShiftEvent,
  onRequestChiefApproval,
  triggerHaptic,
}: ChineseElephantAccordionProps) {
  const checklist = normalizeChecklist(incomingChecklist, elephantId, incomingChecklist?.shift_date || '');
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // New sleep interval inputs
  const [showAddInterval, setShowAddInterval] = useState(false);
  const [intervalStart, setIntervalStart] = useState('01:30');
  const [intervalEnd, setIntervalEnd] = useState('02:45');
  const [intervalPosture, setIntervalPosture] = useState<'side' | 'standing'>('side');

  // File input refs
  const urgentPhotoRef = useRef<HTMLInputElement>(null);
  const feetTopPhotoRef = useRef<HTMLInputElement>(null);
  const feetSolePhotoRef = useRef<HTMLInputElement>(null);
  const overallPhotoRef = useRef<HTMLInputElement>(null);
  const behaviorMediaRef = useRef<HTMLInputElement>(null);

  const isPretty = elephantId === 'pretty' || elephantName.toLowerCase().includes('прет');
  const isAudrey = elephantId === 'audrey' || elephantName.toLowerCase().includes('одр');

  const toggleBlock = (blockNumber: number) => {
    triggerHaptic?.(10);
    setExpandedBlock(expandedBlock === blockNumber ? null : blockNumber);
  };

  const uploadAndSetPhoto = async (
    file: File,
    section: string,
    onSuccess: (url: string) => void
  ) => {
    triggerHaptic?.(15);
    try {
      const compressedBlob = await compressImage(file);
      let photoUrl = '';
      try {
        const today = new Date().toISOString().split('T')[0];
        const storagePath = await supabaseService.uploadShiftMedia(
          compressedBlob,
          today,
          `${elephantId}_${section}`
        );
        photoUrl = supabaseService.getPublicUrl(storagePath);
      } catch {
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }
      onSuccess(photoUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
  };

  const handleAddSleepInterval = () => {
    if (!intervalStart || !intervalEnd) return;
    triggerHaptic?.(12);
    const newInterval: SleepIntervalItem = {
      id: `int-${Date.now()}`,
      start: intervalStart,
      end: intervalEnd,
      posture: intervalPosture,
    };
    const nextList = [...checklist.sleep_behavior.intervals, newInterval];
    onChange({
      ...checklist,
      sleep_behavior: {
        ...checklist.sleep_behavior,
        intervals: nextList,
      },
    });
    setShowAddInterval(false);
  };

  const handleRemoveSleepInterval = (id: string) => {
    triggerHaptic?.(10);
    const nextList = checklist.sleep_behavior.intervals.filter((i) => i.id !== id);
    onChange({
      ...checklist,
      sleep_behavior: {
        ...checklist.sleep_behavior,
        intervals: nextList,
      },
    });
  };

  return (
    <div className="space-y-2.5">
      {/* ═══ 1. 🚨 СРОЧНЫЕ ПРИЗНАКИ ВЕТВРАЧУ (КРИТИЧЕСКИЙ БЛОК) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[1]?.dot === 'red'
          ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/30'
          : evaluation.blockSummaries[1]?.dot === 'yellow'
          ? 'bg-amber-950/30 border-amber-500/60'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(1)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🚨</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                1. Срочные признаки ветврачу
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[1]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[1]?.dot === 'red'
                ? 'bg-rose-500 animate-pulse'
                : evaluation.blockSummaries[1]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 1 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-[11px] text-zinc-400 space-y-1">
              <p className="font-bold text-zinc-300">Признаки, требующие немедленного сообщения ветврачу</p>
              <p className="text-[10px] text-zinc-500">
                ⚠️ Возможный клинический риск. Не является диагнозом. Отметьте все замеченные отклонения от нормы.
              </p>
            </div>

            {/* Ранние признаки (требует внимания) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                ⚠️ Требует внимания (ранние наблюдения):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { key: 'appetite_drop' as const, label: 'Снижение аппетита' },
                  { key: 'drinking_drop' as const, label: 'Снижение питья' },
                  { key: 'behavior_change' as const, label: 'Изменение поведения' },
                  { key: 'fecal_change' as const, label: 'Изменение стула' },
                  { key: 'lameness_pain' as const, label: 'Хромота / боль' },
                  { key: 'sleep_change' as const, label: 'Изменение сна' },
                ]).map((item) => {
                  const isChecked = checklist.urgent_signs[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(10);
                        onChange({
                          ...checklist,
                          urgent_signs: {
                            ...checklist.urgent_signs,
                            [item.key]: !isChecked,
                          },
                        });
                      }}
                      className={`min-h-[40px] px-2 py-1 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                        isChecked
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="break-words">{item.label}</span>
                      <span>{isChecked ? '⚠️' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Критические признаки */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                🔴 Критично (немедленный вызов):
              </span>
              <div className="space-y-1.5">
                {([
                  { key: 'cyanosis' as const, label: 'Цианоз слизистой / языка (синюшность)' },
                  { key: 'facial_edema' as const, label: 'Отёк головы / морды / хобота' },
                  { key: 'severe_lethargy' as const, label: 'Выраженная вялость / пассивность' },
                ]).map((item) => {
                  const isChecked = checklist.urgent_signs[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const nextVal = !isChecked;
                        if (nextVal) {
                          triggerHaptic?.(35);
                          onLogShiftEvent?.(`🚨 КРИТИЧЕСКИЙ ПРИЗНАК: ${item.label} (${elephantName})`, '🚨');
                        }
                        onChange({
                          ...checklist,
                          urgent_signs: {
                            ...checklist.urgent_signs,
                            [item.key]: nextVal,
                          },
                        });
                      }}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-black transition flex items-center justify-between text-left ${
                        isChecked
                          ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="break-words">{item.label}</span>
                      <span>{isChecked ? '🔴' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo capture for urgent signs */}
            <div className="pt-1">
              <input
                ref={urgentPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadAndSetPhoto(file, 'urgent_photo', (url) => {
                      onChange({
                        ...checklist,
                        urgent_signs: { ...checklist.urgent_signs, photo_url: url },
                      });
                    });
                  }
                }}
              />
              {checklist.urgent_signs.photo_url ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div
                    onClick={() => setZoomPhotoUrl(checklist.urgent_signs.photo_url || null)}
                    className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-700 bg-black cursor-pointer shrink-0"
                  >
                    <img src={checklist.urgent_signs.photo_url} alt="Признак" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Фото симптома сохранено ✓</span>
                  <button
                    type="button"
                    onClick={() => urgentPhotoRef.current?.click()}
                    className="text-xs text-zinc-400 underline cursor-pointer"
                  >
                    Переснять
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => urgentPhotoRef.current?.click()}
                  className="w-full min-h-[44px] rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Camera size={14} />
                  <span>Фото симптома (слизистая, отёк)</span>
                </button>
              )}
            </div>

            {/* Emergency Chief/Vet alert push */}
            {(checklist.urgent_signs.cyanosis || checklist.urgent_signs.facial_edema || checklist.urgent_signs.severe_lethargy) && onRequestChiefApproval && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(25);
                  onRequestChiefApproval();
                }}
                className="w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer touch-manipulation"
              >
                <span>📢</span>
                <span>ЭКСТРЕННЫЙ ПУШ ВЕТУ И ШЕФУ</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ 2. 💩 ДЕФЕКАЦИЯ (КРИТИЧЕСКИЙ БЛОК) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[2]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[2]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(2)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">💩</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                2. Дефекация
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[2]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[2]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[2]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 2 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Counter */}
            <div className="flex items-center justify-between gap-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-zinc-300">Счётчик дефекаций:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onChange({
                      ...checklist,
                      defecation: {
                        ...checklist.defecation,
                        poop_count: Math.max(0, checklist.defecation.poop_count - 1),
                      },
                    });
                  }}
                  className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:scale-90 cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-mono font-black text-white w-8 text-center">
                  {checklist.defecation.poop_count}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(15);
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    onChange({
                      ...checklist,
                      defecation: {
                        ...checklist.defecation,
                        poop_count: checklist.defecation.poop_count + 1,
                        last_poop_time: timeStr,
                      },
                    });
                  }}
                  className="h-10 w-10 rounded-xl bg-white text-zinc-950 font-bold flex items-center justify-center active:scale-90 cursor-pointer shadow-md"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Time Notice (Contextual, non-punitive) */}
            {evaluation.poopTimeNotice && (
              <div className={`p-2.5 rounded-xl border text-xs ${
                evaluation.poopTimeNotice.includes('⚠️')
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}>
                {evaluation.poopTimeNotice}
              </div>
            )}

            {/* Consistency chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Консистенция:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'formed' as const, label: 'Сформированный' },
                  { val: 'porridge' as const, label: 'Кашицеобразный' },
                  { val: 'liquid' as const, label: 'Жидкий 🟡' },
                  { val: 'mucus' as const, label: 'Слизь 🟡' },
                  { val: 'blood' as const, label: 'Кровь 🔴' },
                ]).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        defecation: { ...checklist.defecation, consistency: item.val },
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      checklist.defecation.consistency === item.val
                        ? item.val === 'blood'
                          ? 'bg-rose-500 border-rose-400 text-white font-black'
                          : item.val === 'liquid' || item.val === 'mucus'
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                          : 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contents chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Содержимое каловых масс:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'undigested_grain' as const, label: 'Непереваренное зерно' },
                  { val: 'whole_branches' as const, label: 'Ветки целые' },
                  { val: 'sand' as const, label: 'Песок 🟡' },
                ]).map((item) => {
                  const isChecked = checklist.defecation.contents.includes(item.val);
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(10);
                        const next = isChecked
                          ? checklist.defecation.contents.filter((c) => c !== item.val)
                          : [...checklist.defecation.contents, item.val];
                        onChange({
                          ...checklist,
                          defecation: { ...checklist.defecation, contents: next },
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.label} {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 3. 💧 МОЧЕИСПУСКАНИЕ ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[3]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(3)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">💧</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                3. Мочеиспускание
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[3]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[3]?.dot === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            {expandedBlock === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 3 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Counter */}
            <div className="flex items-center justify-between gap-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-zinc-300">Счётчик мочеиспусканий:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onChange({
                      ...checklist,
                      urination: {
                        ...checklist.urination,
                        urination_count: Math.max(0, checklist.urination.urination_count - 1),
                      },
                    });
                  }}
                  className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:scale-90 cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-mono font-black text-white w-8 text-center">
                  {checklist.urination.urination_count}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(15);
                    onChange({
                      ...checklist,
                      urination: {
                        ...checklist.urination,
                        urination_count: checklist.urination.urination_count + 1,
                      },
                    });
                  }}
                  className="h-10 w-10 rounded-xl bg-white text-zinc-950 font-bold flex items-center justify-center active:scale-90 cursor-pointer shadow-md"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Color chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Цвет мочи:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { val: 'clear' as const, label: 'Прозрачная' },
                  { val: 'light_yellow' as const, label: 'Светло-жёлтая' },
                  { val: 'dark' as const, label: 'Тёмная 🟡' },
                  { val: 'cloudy' as const, label: 'Мутная 🟡' },
                ]).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        urination: { ...checklist.urination, color: item.val },
                      });
                    }}
                    className={`min-h-[40px] px-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      checklist.urination.color === item.val
                        ? item.val === 'dark' || item.val === 'cloudy'
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                          : 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Частота:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { val: 'normal' as const, label: 'Норма' },
                  { val: 'frequent_small' as const, label: 'Часто / мало 🟡' },
                  { val: 'rare' as const, label: 'Редко 🟡' },
                ]).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        urination: { ...checklist.urination, frequency: item.val },
                      });
                    }}
                    className={`min-h-[40px] px-1 rounded-xl text-[11px] font-bold border transition active:scale-95 cursor-pointer text-center ${
                      checklist.urination.frequency === item.val
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 4. 🦶 КОПЫТА И ПОХОДКА (КРИТИЧЕСКИЙ БЛОК) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[4]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[4]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(4)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🦶</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                4. Копыта и походка
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[4]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[4]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[4]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 4 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* 4 Limbs Grid */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'front_right' as const, label: 'ПП', title: 'Передняя Правая' },
                { key: 'front_left' as const, label: 'ЛП', title: 'Передняя Левая' },
                { key: 'rear_right' as const, label: 'ПЗ', title: 'Задняя Правая' },
                { key: 'rear_left' as const, label: 'ЛЗ', title: 'Задняя Левая' },
              ]).map((limb) => {
                const currentStatus = checklist.feet_gait[limb.key];
                return (
                  <div key={limb.key} className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{limb.label} ({limb.title.split(' ')[0]})</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        currentStatus === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : currentStatus === 'lameness'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {currentStatus === 'ok' ? 'Норма' : currentStatus === 'crack' ? 'Трещина' : currentStatus === 'delamination' ? 'Расслоение' : currentStatus === 'hot_coronet' ? 'Венчик' : 'Хромота'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { val: 'ok' as const, label: 'Норма' },
                        { val: 'crack' as const, label: 'Трещина' },
                        { val: 'lameness' as const, label: 'Хромота' },
                      ]).map((st) => (
                        <button
                          key={st.val}
                          type="button"
                          onClick={() => {
                            triggerHaptic?.(10);
                            onChange({
                              ...checklist,
                              feet_gait: {
                                ...checklist.feet_gait,
                                [limb.key]: st.val,
                              },
                            });
                          }}
                          className={`min-h-[32px] px-1 rounded-lg text-[10px] font-bold border transition ${
                            currentStatus === st.val
                              ? 'bg-white text-zinc-950 font-black'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gait assessment */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Оценка походки:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { val: 'confident' as const, label: '🟢 Уверенная' },
                  { val: 'cautious' as const, label: '🟡 Осторожная' },
                  { val: 'favors_leg' as const, label: '🔴 Бережёт ногу' },
                ]).map((gait) => (
                  <button
                    key={gait.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(12);
                      onChange({
                        ...checklist,
                        feet_gait: { ...checklist.feet_gait, gait: gait.val },
                      });
                    }}
                    className={`min-h-[40px] px-1 rounded-xl text-xs font-bold border transition text-center ${
                      checklist.feet_gait.gait === gait.val
                        ? gait.val === 'favors_leg'
                          ? 'bg-rose-500 border-rose-400 text-white font-black'
                          : gait.val === 'cautious'
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                          : 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{gait.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2 Photos: Top & Sole */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <input
                  ref={feetTopPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadAndSetPhoto(file, 'feet_top', (url) => {
                        onChange({ ...checklist, feet_gait: { ...checklist.feet_gait, top_photo_url: url } });
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => feetTopPhotoRef.current?.click()}
                  className={`w-full min-h-[42px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                    checklist.feet_gait.top_photo_url
                      ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <Camera size={14} />
                  <span>{checklist.feet_gait.top_photo_url ? 'Сверху ✓' : 'Фото сверху'}</span>
                </button>
              </div>

              <div>
                <input
                  ref={feetSolePhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadAndSetPhoto(file, 'feet_sole', (url) => {
                        onChange({ ...checklist, feet_gait: { ...checklist.feet_gait, sole_photo_url: url } });
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => feetSolePhotoRef.current?.click()}
                  className={`w-full min-h-[42px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                    checklist.feet_gait.sole_photo_url
                      ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <Camera size={14} />
                  <span>{checklist.feet_gait.sole_photo_url ? 'Подошва ✓' : 'Фото подошвы'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 5. 🍽 КОРМЛЕНИЕ И ВОДА (КРИТИЧЕСКИЙ БЛОК) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[5]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[5]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(5)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🍽</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                5. Кормление и вода
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[5]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[5]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[5]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 5 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Water Observation (Contextual and specific) */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">💧 Состояние поилки</span>
                  <span className="text-[10px] text-zinc-400">Чистота и свежесть воды</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(12);
                    const nextBowl = checklist.feeding_water.water_bowl === 'clean' ? 'needs_cleaning' : 'clean';
                    onChange({
                      ...checklist,
                      feeding_water: {
                        ...checklist.feeding_water,
                        water_bowl: nextBowl,
                      },
                    });
                  }}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-black transition ${
                    checklist.feeding_water.water_bowl === 'clean'
                      ? 'bg-sky-500 text-zinc-950'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  }`}
                >
                  {checklist.feeding_water.water_bowl === 'clean' ? 'Чистая ✓' : 'Требует мытья'}
                </button>
              </div>

              {/* Water Intake Observation */}
              <div className="space-y-1 pt-1 border-t border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Наблюдение за питьём:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { val: 'normal' as const, label: 'Нормальное питьё' },
                    { val: 'reduced' as const, label: 'Пьёт меньше ⚠️' },
                    { val: 'refused' as const, label: 'Отказ от воды 🔴' },
                  ]).map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(10);
                        onChange({
                          ...checklist,
                          feeding_water: {
                            ...checklist.feeding_water,
                            water_intake: item.val,
                          },
                        });
                      }}
                      className={`min-h-[38px] px-1 rounded-xl text-[11px] font-bold border transition text-center ${
                        checklist.feeding_water.water_intake === item.val
                          ? item.val === 'refused'
                            ? 'bg-rose-500 text-white font-black'
                            : item.val === 'reduced'
                            ? 'bg-amber-500 text-zinc-950 font-black'
                            : 'bg-emerald-500 text-zinc-950 font-black'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span className="break-words">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 slots */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Слоты кормления:
              </span>
              {(['07:00', '13:00', '17:00', '19:00'] as FeedingSlotTime[]).map((timeSlot) => {
                const currentSlot = checklist.feeding_water.slots[timeSlot];
                return (
                  <div key={timeSlot} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 w-12">{timeSlot}</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic?.(10);
                          onChange({
                            ...checklist,
                            feeding_water: {
                              ...checklist.feeding_water,
                              slots: {
                                ...checklist.feeding_water.slots,
                                [timeSlot]: {
                                  ...currentSlot,
                                  served: !currentSlot.served,
                                },
                              },
                            },
                          });
                        }}
                        className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-bold border transition ${
                          currentSlot.served
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {currentSlot.served ? 'Выдано ✓' : 'Не выдано'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic?.(10);
                          onChange({
                            ...checklist,
                            feeding_water: {
                              ...checklist.feeding_water,
                              slots: {
                                ...checklist.feeding_water.slots,
                                [timeSlot]: {
                                  ...currentSlot,
                                  finished: !currentSlot.finished,
                                },
                              },
                            },
                          });
                        }}
                        className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-bold border transition ${
                          currentSlot.finished
                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {currentSlot.finished ? 'Съедено ✓' : 'Остаток'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ 6. 😴 СОН И ПОВЕДЕНИЕ (С ПОДДЕРЖКОЙ ИНТЕРВАЛОВ И БУТОВ) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[6]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[6]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(6)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">😴</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                6. Сон и поведение
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[6]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[6]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[6]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 6 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 6 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Total Sleep & Intervals List */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Суммарный сон за смену:</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {evaluation.totalSleepFormatted}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInterval(!showAddInterval)}
                  className="min-h-[34px] px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center gap-1 hover:text-white"
                >
                  <Plus size={14} />
                  <span>Интервал укладки</span>
                </button>
              </div>

              {/* Add Interval Form */}
              {showAddInterval && (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Добавить интервал сна:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-0.5">Начало</span>
                      <input
                        type="time"
                        value={intervalStart}
                        onChange={(e) => setIntervalStart(e.target.value)}
                        className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white px-2"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-0.5">Конец</span>
                      <input
                        type="time"
                        value={intervalEnd}
                        onChange={(e) => setIntervalEnd(e.target.value)}
                        className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white px-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIntervalPosture('side')}
                      className={`flex-1 h-8 rounded-lg text-xs font-bold border ${
                        intervalPosture === 'side' ? 'bg-white text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Лёжа на боку
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntervalPosture('standing')}
                      className={`flex-1 h-8 rounded-lg text-xs font-bold border ${
                        intervalPosture === 'standing' ? 'bg-white text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Стоя
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddInterval(false)}
                      className="px-3 h-8 text-xs text-zinc-400"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSleepInterval}
                      className="px-4 h-8 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              {/* Intervals tags */}
              {checklist.sleep_behavior.intervals && checklist.sleep_behavior.intervals.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {checklist.sleep_behavior.intervals.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-850 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-zinc-400" />
                        <span className="font-mono text-white font-bold">{it.start} – {it.end}</span>
                        <span className="text-[11px] text-zinc-400">({it.posture === 'side' ? 'лёжа' : 'стоя'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSleepInterval(it.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">Интервалы укладок не добавлены (установлен базовый учёт).</p>
              )}
            </div>

            {/* Behavior */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Поведение слонихи:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'calm' as const, label: 'Спокойное' },
                  { val: 'playful' as const, label: 'Игривое' },
                  { val: 'aggressive' as const, label: 'Агрессивное 🟡' },
                  { val: 'apathetic' as const, label: 'Апатичное 🔴' },
                  { val: 'stereotypy' as const, label: 'Стереотипия (качание) 🟡' },
                ]).map((beh) => (
                  <button
                    key={beh.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        sleep_behavior: { ...checklist.sleep_behavior, behavior: beh.val },
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                      checklist.sleep_behavior.behavior === beh.val
                        ? beh.val === 'apathetic'
                          ? 'bg-rose-500 text-white font-black'
                          : beh.val.includes('🟡')
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-emerald-500 text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {beh.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 7. 🧴 УХОД ЗА ТЕЛОМ ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[7]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[7]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(7)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🧴</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                7. Уход за телом
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[7]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[7]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[7]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 7 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 7 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Washing */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Мытьё:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { val: 'none' as const, label: 'Не мыли' },
                  { val: 'rinsed' as const, label: 'Ополоснули' },
                  { val: 'full_brush' as const, label: 'Со щёткой ✨' },
                ]).map((w) => (
                  <button
                    key={w.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        body_care: { ...checklist.body_care, washing: w.val },
                      });
                    }}
                    className={`min-h-[38px] px-1 rounded-xl text-xs font-bold border transition ${
                      checklist.body_care.washing === w.val
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dust bath & Trunk */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(10);
                  onChange({
                    ...checklist,
                    body_care: { ...checklist.body_care, dust_bath: !checklist.body_care.dust_bath },
                  });
                }}
                className={`min-h-[42px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.body_care.dust_bath
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                Пылевая ванна {checklist.body_care.dust_bath ? 'Была ✓' : 'Не было'}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(10);
                  const nextTrunk = checklist.body_care.trunk === 'normal_tone' ? 'passive' : 'normal_tone';
                  onChange({
                    ...checklist,
                    body_care: { ...checklist.body_care, trunk: nextTrunk },
                  });
                }}
                className={`min-h-[42px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.body_care.trunk === 'normal_tone'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500 text-amber-300'
                }`}
              >
                Хобот: {checklist.body_care.trunk === 'normal_tone' ? 'Тонус норма' : 'Пассивный'}
              </button>
            </div>

            {/* Pretty TGS special */}
            {isPretty && (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
                <span className="text-xs font-black text-amber-300">Височные железы (Прэтти): TGS 0–4</span>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 1, 2, 3, 4].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(12);
                        onChange({
                          ...checklist,
                          body_care: { ...checklist.body_care, temporal_gland_score: score },
                        });
                      }}
                      className={`min-h-[38px] rounded-lg border text-xs font-bold ${
                        checklist.body_care.temporal_gland_score === score
                          ? score >= 3
                            ? 'bg-rose-500 text-white font-black'
                            : 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 8. 📷 ФОТОФИКСАЦИЯ И ЗАМЕТКИ ═══ */}
      <div className="rounded-2xl border bg-zinc-900 border-zinc-800">
        <button
          type="button"
          onClick={() => toggleBlock(8)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">📷</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                8. Фотофиксация и заметки
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[8]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[8]?.isFilled ? 'bg-emerald-400' : 'bg-zinc-600'
            }`} />
            {expandedBlock === 8 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 8 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Фото общего вида (силуэт для кондиции):
              </span>
              <input
                ref={overallPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadAndSetPhoto(file, 'overall_silhouette', (url) => {
                      onChange({ ...checklist, photo_notes: { ...checklist.photo_notes, overall_photo_url: url } });
                    });
                  }
                }}
              />
              {checklist.photo_notes.overall_photo_url ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div
                    onClick={() => setZoomPhotoUrl(checklist.photo_notes.overall_photo_url || null)}
                    className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-700 bg-black cursor-pointer shrink-0"
                  >
                    <img src={checklist.photo_notes.overall_photo_url} alt="Силуэт" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Силуэт загружен ✓</span>
                  <button
                    type="button"
                    onClick={() => overallPhotoRef.current?.click()}
                    className="text-xs text-zinc-400 underline cursor-pointer"
                  >
                    Переснять
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => overallPhotoRef.current?.click()}
                  className="w-full min-h-[44px] rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Camera size={14} />
                  <span>📸 Снять общий силуэт</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Заметки для ветеринара:
              </span>
              <textarea
                value={checklist.photo_notes.vet_notes}
                onChange={(e) => {
                  onChange({
                    ...checklist,
                    photo_notes: { ...checklist.photo_notes, vet_notes: e.target.value },
                  });
                }}
                rows={2}
                placeholder="Что необычного? Поведение, аппетит, внешний вид..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══ 9. 🐘 СОЦИАЛЬНАЯ ДИНАМИКА И ПОВЕДЕНИЕ В ГРУППЕ ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[9]?.dot === 'red'
          ? 'bg-rose-950/20 border-rose-500'
          : evaluation.blockSummaries[9]?.dot === 'yellow'
          ? 'bg-amber-950/20 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <button
          type="button"
          onClick={() => toggleBlock(9)}
          className="w-full min-h-[48px] p-3 flex items-center justify-between gap-2 text-left cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🐘</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight">
                9. Социальная динамика в группе
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[9]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[9]?.dot === 'red'
                ? 'bg-rose-500'
                : evaluation.blockSummaries[9]?.dot === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            {expandedBlock === 9 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 9 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            {/* Contacts between pairs */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Контакты за смену:
              </span>
              {([
                { key: 'margo_audrey' as const, label: 'Марго + Одри' },
                { key: 'margo_pretty' as const, label: 'Марго + Прэтти' },
                { key: 'audrey_pretty' as const, label: 'Одри + Прэтти' },
              ]).map((pair) => {
                const current = checklist.social_dynamics.contacts[pair.key];
                return (
                  <div key={pair.key} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-300">{pair.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic?.(10);
                          onChange({
                            ...checklist,
                            social_dynamics: {
                              ...checklist.social_dynamics,
                              contacts: {
                                ...checklist.social_dynamics.contacts,
                                [pair.key]: { ...current, active: !current.active },
                              },
                            },
                          });
                        }}
                        className={`min-h-[32px] px-2 rounded-lg text-[10px] font-bold border transition ${
                          current.active ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {current.active ? 'Был контакт ✓' : 'Нет контакта'}
                      </button>

                      {current.active && (
                        <select
                          value={current.type}
                          onChange={(e) => {
                            onChange({
                              ...checklist,
                              social_dynamics: {
                                ...checklist.social_dynamics,
                                contacts: {
                                  ...checklist.social_dynamics.contacts,
                                  [pair.key]: { ...current, type: e.target.value as SocialContactType },
                                },
                              },
                            });
                          }}
                          className="min-h-[32px] rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-white px-2 focus:outline-none"
                        >
                          <option value="peaceful">Мирный</option>
                          <option value="play">Игровой</option>
                          <option value="dominant">Доминантный</option>
                          <option value="aggressive">Агрессивный 🔴</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hierarchy conflicts */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Иерархия и стресс-маркеры:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'food_conflict' as const, label: 'Конфликт за еду' },
                  { val: 'spot_conflict' as const, label: 'Конфликт за место' },
                  { val: 'water_push' as const, label: 'Отталкивание от поилки' },
                  { val: 'isolation' as const, label: 'Изоляция (стоит одна)' },
                ]).map((conf) => {
                  const isChecked = checklist.social_dynamics.conflicts.includes(conf.val);
                  return (
                    <button
                      key={conf.val}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(10);
                        const next = isChecked
                          ? checklist.social_dynamics.conflicts.filter((c) => c !== conf.val)
                          : [...checklist.social_dynamics.conflicts, conf.val];
                        onChange({
                          ...checklist,
                          social_dynamics: { ...checklist.social_dynamics, conflicts: next },
                        });
                      }}
                      className={`px-2 py-1 rounded-xl text-[11px] font-bold border transition ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {conf.label} {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stereotypy */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Стереотипия (качание):</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onChange({
                      ...checklist,
                      social_dynamics: {
                        ...checklist.social_dynamics,
                        stereotypy_observed: !checklist.social_dynamics.stereotypy_observed,
                      },
                    });
                  }}
                  className={`min-h-[32px] px-2.5 rounded-lg text-xs font-bold transition ${
                    checklist.social_dynamics.stereotypy_observed
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  {checklist.social_dynamics.stereotypy_observed ? 'Наблюдалась ⚠️' : 'Не было'}
                </button>
              </div>

              {checklist.social_dynamics.stereotypy_observed && (
                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-zinc-400">Длительность:</span>
                    <div className="flex items-center gap-1">
                      {(['<5min', '5-15min', '>15min', '>30min'] as StereotypyDuration[]).map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => {
                            onChange({
                              ...checklist,
                              social_dynamics: { ...checklist.social_dynamics, stereotypy_duration: dur },
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            checklist.social_dynamics.stereotypy_duration === dur
                              ? dur === '>30min'
                                ? 'bg-rose-500 text-white'
                                : 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vocalization */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Вокализация:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'rumble' as const, label: 'Румблинг (норма)' },
                  { val: 'trumpet' as const, label: 'Трубление' },
                  { val: 'squeak' as const, label: 'Визг 🟡' },
                  { val: 'roar' as const, label: 'Рёв 🟡' },
                ]).map((voc) => {
                  const isChecked = checklist.social_dynamics.vocalizations.includes(voc.val);
                  return (
                    <button
                      key={voc.val}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(10);
                        const next = isChecked
                          ? checklist.social_dynamics.vocalizations.filter((v) => v !== voc.val)
                          : [...checklist.social_dynamics.vocalizations, voc.val];
                        onChange({
                          ...checklist,
                          social_dynamics: { ...checklist.social_dynamics, vocalizations: next },
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        isChecked
                          ? voc.val === 'squeak' || voc.val === 'roar'
                            ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {voc.label} {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video/Photo behavior capture */}
            <div>
              <input
                ref={behaviorMediaRef}
                type="file"
                accept="video/*,image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadAndSetPhoto(file, 'behavior_media', (url) => {
                      onChange({ ...checklist, social_dynamics: { ...checklist.social_dynamics, behavior_media_url: url } });
                    });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => behaviorMediaRef.current?.click()}
                className={`w-full min-h-[44px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  checklist.social_dynamics.behavior_media_url
                    ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <Video size={14} />
                <span>{checklist.social_dynamics.behavior_media_url ? 'Видео поведения сохранено ✓' : 'Снять поведение (10-30 сек)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo preview zoom modal */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div className="relative max-h-[85vh] max-w-full">
            <img src={zoomPhotoUrl} alt="Zoom" className="max-h-[80vh] w-auto rounded-2xl object-contain" />
            <button
              type="button"
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-2 right-2 h-9 w-9 rounded-full bg-zinc-900/80 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
