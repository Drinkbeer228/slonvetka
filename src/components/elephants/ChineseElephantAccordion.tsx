import React, { useState, useRef } from 'react';
import {
  ChevronDown, ChevronUp, Camera, Plus, Minus, CheckCircle2,
  AlertTriangle, ShieldAlert, Sparkles, X, Eye, Video, HeartPulse
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
  SleepDuration,
  SleepPosture,
  BehaviorState,
  WashingType,
  SkinCondition,
  EyeObservation,
  TrunkTone,
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
  checklist,
  evaluation,
  onChange,
  onLogShiftEvent,
  onRequestChiefApproval,
  triggerHaptic,
}: ChineseElephantAccordionProps) {
  // Currently expanded block (1 to 9, null means all collapsed)
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // File input refs
  const eehvPhotoRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="space-y-2.5">
      {/* ═══ 1. 🚨 КРАСНЫЕ ФЛАГИ (EEHV-ПРОТОКОЛ) ═══ */}
      <div className={`rounded-2xl border transition-all ${
        evaluation.blockSummaries[1]?.dot === 'red'
          ? 'bg-rose-950/30 border-rose-500 shadow-md shadow-rose-950/30'
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
                1. Красные флаги (EEHV-протокол)
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5 break-words">
                {evaluation.blockSummaries[1]?.summary}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${
              evaluation.blockSummaries[1]?.dot === 'red' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
            }`} />
            {expandedBlock === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedBlock === 1 && (
          <div className="p-3 pt-0 border-t border-zinc-800/80 space-y-3 mt-1">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-[11px] text-zinc-400">
              Китайский стандарт: EEHV (вирус герпеса) — смертельный риск для молодых слонов. Проверка слизистой и отёков каждое утро.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(10);
                  onChange({
                    ...checklist,
                    eehv: { ...checklist.eehv, mucosa_pink: !checklist.eehv.mucosa_pink }
                  });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.eehv.mucosa_pink
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <span>Слизистая розовая {checklist.eehv.mucosa_pink ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !checklist.eehv.cyanosis;
                  if (nextVal) {
                    triggerHaptic?.(35);
                    onLogShiftEvent?.(`🚨 СИНЮШНОСТЬ СЛИЗИСТОЙ (${elephantName})`, '🚨');
                  }
                  onChange({
                    ...checklist,
                    eehv: { ...checklist.eehv, cyanosis: nextVal }
                  });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.eehv.cyanosis
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <span>Синюшность (Цианоз) 🔴</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !checklist.eehv.facial_edema;
                  if (nextVal) {
                    triggerHaptic?.(35);
                    onLogShiftEvent?.(`🚨 ОТЁК МОРДЫ/ХОБОТА (${elephantName})`, '🚨');
                  }
                  onChange({
                    ...checklist,
                    eehv: { ...checklist.eehv, facial_edema: nextVal }
                  });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.eehv.facial_edema
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <span>Отёк морды/хобота 🔴</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !checklist.eehv.trunk_lethargy;
                  if (nextVal) {
                    triggerHaptic?.(30);
                    onLogShiftEvent?.(`🚨 ВЯЛОСТЬ ХОБОТА/ПЕТЛЯ (${elephantName})`, '🚨');
                  }
                  onChange({
                    ...checklist,
                    eehv: { ...checklist.eehv, trunk_lethargy: nextVal }
                  });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold p-2 transition ${
                  checklist.eehv.trunk_lethargy
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <span>Вялость / петля 🔴</span>
              </button>
            </div>

            {/* Photo capture for EEHV */}
            <div className="pt-1">
              <input
                ref={eehvPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadAndSetPhoto(file, 'eehv_photo', (url) => {
                      onChange({ ...checklist, eehv: { ...checklist.eehv, photo_url: url } });
                    });
                  }
                }}
              />
              {checklist.eehv.photo_url ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div
                    onClick={() => setZoomPhotoUrl(checklist.eehv.photo_url || null)}
                    className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-700 bg-black cursor-pointer shrink-0"
                  >
                    <img src={checklist.eehv.photo_url} alt="EEHV" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Фото слизистой сохранено ✓</span>
                  <button
                    type="button"
                    onClick={() => eehvPhotoRef.current?.click()}
                    className="text-xs text-zinc-400 underline cursor-pointer"
                  >
                    Переснять
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => eehvPhotoRef.current?.click()}
                  className="w-full min-h-[44px] rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Camera size={14} />
                  <span>Фото слизистой и морды</span>
                </button>
              )}
            </div>

            {/* Critical alert banner */}
            {(checklist.eehv.cyanosis || checklist.eehv.facial_edema || checklist.eehv.trunk_lethargy) && onRequestChiefApproval && (
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

      {/* ═══ 2. 💩 ДЕФЕКАЦИЯ ═══ */}
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
                      }
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
                      }
                    });
                  }}
                  className="h-10 w-10 rounded-xl bg-white text-zinc-950 font-bold flex items-center justify-center active:scale-90 cursor-pointer shadow-md"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Consistency chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Консистенция:
              </span>
              <div className="flex flex-wrap gap-1">
                {([
                  { val: 'formed' as const, label: 'Сформированный', alert: false },
                  { val: 'porridge' as const, label: 'Кашицеобразный', alert: false },
                  { val: 'liquid' as const, label: 'Жидкий 🟡', alert: true },
                  { val: 'mucus' as const, label: 'Слизь 🟡', alert: true },
                  { val: 'blood' as const, label: 'Кровь 🔴', alert: true },
                ]).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        defecation: { ...checklist.defecation, consistency: item.val }
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      checklist.defecation.consistency === item.val
                        ? item.val === 'blood'
                          ? 'bg-rose-500 border-rose-400 text-white font-black'
                          : item.alert
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
                          ? checklist.defecation.contents.filter(c => c !== item.val)
                          : [...checklist.defecation.contents, item.val];
                        onChange({
                          ...checklist,
                          defecation: { ...checklist.defecation, contents: next }
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

            {checklist.defecation.last_poop_time && (
              <p className="text-[11px] font-mono text-zinc-500">
                Время последнего акта: {checklist.defecation.last_poop_time}
              </p>
            )}
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
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-[11px] text-zinc-400">
              Китайский стандарт: постоянный мониторинг тонуса мочевого пузыря для предупреждения цистита.
            </div>

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
                      }
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
                      }
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
                  { val: 'clear' as const, label: 'Прозрачная', alert: false },
                  { val: 'light_yellow' as const, label: 'Светло-жёлтая', alert: false },
                  { val: 'dark' as const, label: 'Тёмная 🟡', alert: true },
                  { val: 'cloudy' as const, label: 'Мутная 🟡', alert: true },
                ]).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        urination: { ...checklist.urination, color: item.val }
                      });
                    }}
                    className={`min-h-[40px] px-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      checklist.urination.color === item.val
                        ? item.alert
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
                        urination: { ...checklist.urination, frequency: item.val }
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

      {/* ═══ 4. 🦶 КОПЫТА И ПОХОДКА (ОБЯЗАТЕЛЬНО ФОТО) ═══ */}
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
                4. Копыта и походка (фото)
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
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-[11px] text-zinc-400">
              Китайский стандарт: пододерматит — главная причина хромоты. Копыта осматриваются и фиксируются ежедневно.
            </div>

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
                              }
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
                        feet_gait: { ...checklist.feet_gait, gait: gait.val }
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
              {/* Photo Top */}
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

              {/* Photo Sole */}
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

      {/* ═══ 5. 🍽 КОРМЛЕНИЕ И ВОДА ═══ */}
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
            {/* Water row */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-white block">💧 Поилка (100–200 л в сутки)</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Чистая вода 24/7 по китайскому стандарту</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.(12);
                  onChange({
                    ...checklist,
                    feeding_water: {
                      ...checklist.feeding_water,
                      water_clean_fresh: !checklist.feeding_water.water_clean_fresh,
                    }
                  });
                }}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-black transition ${
                  checklist.feeding_water.water_clean_fresh
                    ? 'bg-sky-500 text-zinc-950'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {checklist.feeding_water.water_clean_fresh ? 'Свежая ✓' : 'Грязная'}
              </button>
            </div>

            {/* 4 slots */}
            <div className="space-y-2">
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
                                }
                              }
                            }
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
                                }
                              }
                            }
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

      {/* ═══ 6. 😴 СОН И ПОВЕДЕНИЕ ═══ */}
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
            {/* Sleep duration */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Длительность сна:
              </span>
              <div className="grid grid-cols-4 gap-1">
                {([
                  { val: 'did_not_sleep' as const, label: 'Не спала 🔴' },
                  { val: '1-2h' as const, label: '1–2ч 🟡' },
                  { val: '3-5h' as const, label: '3–5ч (норма)' },
                  { val: '>6h' as const, label: '>6ч 🟡' },
                ]).map((dur) => (
                  <button
                    key={dur.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        sleep_behavior: { ...checklist.sleep_behavior, duration: dur.val }
                      });
                    }}
                    className={`min-h-[40px] px-1 rounded-xl text-[11px] font-bold border transition text-center ${
                      checklist.sleep_behavior.duration === dur.val
                        ? dur.val === 'did_not_sleep'
                          ? 'bg-rose-500 text-white font-black'
                          : dur.val === '3-5h'
                          ? 'bg-emerald-500 text-zinc-950 font-black'
                          : 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{dur.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posture */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Поза сна:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { val: 'side' as const, label: 'На боку' },
                  { val: 'standing' as const, label: 'Стоя' },
                  ...(isAudrey ? [{ val: 'calf_on_mother' as const, label: 'У матери' }] : []),
                ]).map((pos) => (
                  <button
                    key={pos.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      onChange({
                        ...checklist,
                        sleep_behavior: { ...checklist.sleep_behavior, posture: pos.val }
                      });
                    }}
                    className={`min-h-[38px] px-1 rounded-xl text-xs font-bold border transition ${
                      checklist.sleep_behavior.posture === pos.val
                        ? 'bg-white text-zinc-950 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Behavior */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Поведение:
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
                        sleep_behavior: { ...checklist.sleep_behavior, behavior: beh.val }
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
                        body_care: { ...checklist.body_care, washing: w.val }
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
                    body_care: { ...checklist.body_care, dust_bath: !checklist.body_care.dust_bath }
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
                    body_care: { ...checklist.body_care, trunk: nextTrunk }
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
                          body_care: { ...checklist.body_care, temporal_gland_score: score }
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
            {/* Overall silhouette photo */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Обязательное фото общего вида (силуэт для кондиции):
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
                  <span className="text-xs text-emerald-400 font-bold">Силуэт слонихи загружен ✓</span>
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

            {/* Notes textarea */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Заметки для ветеринара:
              </span>
              <textarea
                value={checklist.photo_notes.vet_notes}
                onChange={(e) => {
                  onChange({
                    ...checklist,
                    photo_notes: { ...checklist.photo_notes, vet_notes: e.target.value }
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
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 text-[11px] text-zinc-400">
              Китайский стандарт: мониторинг иерархии, отталкиваний от поилки и стереотипии для раннего купирования хронического стресса.
            </div>

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
                                [pair.key]: { ...current, active: !current.active }
                              }
                            }
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
                                  [pair.key]: { ...current, type: e.target.value as SocialContactType }
                                }
                              }
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
                          ? checklist.social_dynamics.conflicts.filter(c => c !== conf.val)
                          : [...checklist.social_dynamics.conflicts, conf.val];
                        onChange({
                          ...checklist,
                          social_dynamics: { ...checklist.social_dynamics, conflicts: next }
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
                        stereotypy_observed: !checklist.social_dynamics.stereotypy_observed
                      }
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
                              social_dynamics: { ...checklist.social_dynamics, stereotypy_duration: dur }
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
                          ? checklist.social_dynamics.vocalizations.filter(v => v !== voc.val)
                          : [...checklist.social_dynamics.vocalizations, voc.val];
                        onChange({
                          ...checklist,
                          social_dynamics: { ...checklist.social_dynamics, vocalizations: next }
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

            {/* Video/Photo behaviour capture */}
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
