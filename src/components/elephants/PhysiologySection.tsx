import React, { useState, useRef } from 'react';
import {
  Plus, Minus, Camera, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle,
  ShieldAlert, Sparkles, X
} from 'lucide-react';
import type { ElephantDailyMetrics } from '../../types/shift';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

interface PhysiologySectionProps {
  elephantName: string;
  elephantId: string;
  metric: ElephantDailyMetrics;
  onUpdateFeces: (delta: number) => void;
  onUpdateUrine: (delta: number) => void;
  onToggleFecesAnomaly: (trait: string) => void;
  onToggleUrineAnomaly: (trait: string) => void;
  onSetSleepState: (duration: '🟢 3-4ч (норма)' | '⏱️ 1-2ч' | '❌ Не легла') => void;
  onSetBehavior: (behavior: string) => void;
  onUpdateMetricField?: (field: keyof ElephantDailyMetrics, value: any) => void;
  onLogShiftEvent?: (title: string, icon: string) => void;
  triggerHaptic?: (ms?: number) => void;
  onRequestChiefApproval?: () => void;
}

const FECES_ANOMALIES = ['Сухой', 'Жидкий', 'Слизь', 'Кровь', 'Непереваренное'];
const URINE_ANOMALIES = ['Мутная', 'Тёмная', 'Мало пьёт', 'Часто'];
const BEHAVIORS = ['Спокойное', 'Активное', 'Игривое', 'Настороженное', 'Угнетённое'];

/**
 * Единый монолитный блок «Физиология и Витальный осмотр»
 * Объединяет:
 * 1. Кал (+/-) и Моча (+/-) с чипсами аномалий
 * 2. Сон и Поведение
 * 3. Витальные маркеры хоботных (EEHV, ЖКТ, дыхание, ортопедия, отеки) по принципу Reporting by Exception
 */
export function PhysiologySection({
  elephantName,
  elephantId,
  metric,
  onUpdateFeces,
  onUpdateUrine,
  onToggleFecesAnomaly,
  onToggleUrineAnomaly,
  onSetSleepState,
  onSetBehavior,
  onUpdateMetricField,
  onLogShiftEvent,
  triggerHaptic,
  onRequestChiefApproval,
}: PhysiologySectionProps) {
  const hasFecesAnomaly = metric.feces_traits?.some(t => t !== 'Сформирован (норма)') || false;
  const hasUrineAnomaly = metric.urination_traits?.some(t => t !== 'Прозрачная (норма)') || false;

  // Vital Signs values
  const trunkTone = metric.trunk_tone || 'active';
  const mucosaTongue = metric.mucosa_tongue || 'normal_pink';
  const breathing = metric.breathing_observation || 'nasal_normal';
  const gait = metric.gait_assessment || 'stable';
  const facialEdema = metric.facial_edema || 'none';

  // Critical alerts
  const isTrunkAlert = trunkTone === 'colic_clamping';
  const isMucosaAlert = mucosaTongue === 'cyanosis_blue';
  const isBreathingAlert = breathing === 'mouth_dyspnea';
  const isGaitAlert = gait === 'three_legs_pain';
  const isEdemaAlert = facialEdema === 'trunk_periorbital';

  const hasCriticalAlert = isTrunkAlert || isMucosaAlert || isBreathingAlert || isGaitAlert || isEdemaAlert;
  const hasWarning =
    trunkTone === 'weak_loop' ||
    mucosaTongue === 'petechiae' ||
    gait === 'weight_shift_high' ||
    facialEdema === 'sunken_temples';

  // Accordion for vitals: open automatically if alert or warning, otherwise collapsed
  const [isVitalsExpanded, setIsVitalsExpanded] = useState(() => hasCriticalAlert || hasWarning);

  // Photo capture for vital symptom
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSelectVital = (field: keyof ElephantDailyMetrics, value: string, isAlert: boolean, label: string) => {
    if (isAlert) {
      triggerHaptic?.(35);
      onLogShiftEvent?.(`🚨 КЛИНИЧЕСКИЙ АЛЕРТ (${elephantName}): ${label}`, '🚨');
      onUpdateMetricField?.('vital_alert', true);
    } else {
      triggerHaptic?.(12);
    }
    onUpdateMetricField?.(field, value);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    triggerHaptic?.(20);

    try {
      const compressedBlob = await compressImage(file);
      let photoUrl = '';
      try {
        const today = new Date().toISOString().split('T')[0];
        const storagePath = await supabaseService.uploadShiftMedia(compressedBlob, today, 'vital_symptom');
        photoUrl = supabaseService.getPublicUrl(storagePath);
      } catch {
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }

      onUpdateMetricField?.('vital_photo_url', photoUrl);
      onLogShiftEvent?.(`📸 Фото витального признака сохранено (${elephantName})`, '📸');
      setUploadingPhoto(false);
    } catch (err) {
      console.warn('Photo compression failed:', err);
      setUploadingPhoto(false);
    }
  };

  return (
    <section className={`rounded-3xl border transition-all p-4 shadow-2xl space-y-4 ${
      hasCriticalAlert
        ? 'border-rose-500/80 bg-rose-950/20'
        : 'border-zinc-800 bg-zinc-900'
    }`}>
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Физиология и витальный статус • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Кал · Моча · Сон · Осмотр
          </h2>
        </div>
        <div className="text-2xl">🩺</div>
      </div>

      {/* ═══ 1. COUNTERS GRID: КАЛ И МОЧА ═══ */}
      <div className="grid grid-cols-2 gap-3">
        {/* 💩 КАЛ */}
        <div className={`rounded-2xl border p-3 flex flex-col gap-2.5 transition-colors ${
          hasFecesAnomaly
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-100">💩 Кал (кучи)</span>
            {hasFecesAnomaly && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Аномалия
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(12);
                onUpdateFeces(-1);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 active:scale-90 cursor-pointer touch-manipulation transition"
              aria-label="Минус кал"
            >
              <Minus size={20} strokeWidth={2.5} />
            </button>
            <div className="text-center flex-1">
              <span className="text-3xl font-black font-mono text-white leading-none">
                {metric.poop_count ?? 0}
              </span>
              <div className="text-[10px] text-zinc-500 font-bold mt-0.5">куч</div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(15);
                onUpdateFeces(1);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950 active:scale-90 cursor-pointer touch-manipulation shadow-md transition font-bold"
              aria-label="Плюс кал"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Anomaly chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {FECES_ANOMALIES.map(trait => {
              const isOn = metric.feces_traits?.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onToggleFecesAnomaly(trait);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    isOn
                      ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>

        {/* 💧 МОЧА */}
        <div className={`rounded-2xl border p-3 flex flex-col gap-2.5 transition-colors ${
          hasUrineAnomaly
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-100">💧 Моча (разы)</span>
            {hasUrineAnomaly && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Аномалия
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(12);
                onUpdateUrine(-1);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 active:scale-90 cursor-pointer touch-manipulation transition"
              aria-label="Минус моча"
            >
              <Minus size={20} strokeWidth={2.5} />
            </button>
            <div className="text-center flex-1">
              <span className="text-3xl font-black font-mono text-white leading-none">
                {metric.urination_count ?? 0}
              </span>
              <div className="text-[10px] text-zinc-500 font-bold mt-0.5">раз</div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(15);
                onUpdateUrine(1);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950 active:scale-90 cursor-pointer touch-manipulation shadow-md transition font-bold"
              aria-label="Плюс моча"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Anomaly chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {URINE_ANOMALIES.map(trait => {
              const isOn = metric.urination_traits?.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onToggleUrineAnomaly(trait);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    isOn
                      ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 2. СОН И ПОВЕДЕНИЕ ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Сон */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
          <span className="text-xs font-bold text-zinc-300">😴 Сон (лёжка):</span>
          <div className="grid grid-cols-3 gap-1">
            {([
              { val: '🟢 3-4ч (норма)' as const, label: '3-4ч (норма)' },
              { val: '⏱️ 1-2ч' as const, label: '1-2ч' },
              { val: '❌ Не легла' as const, label: 'Не легла' },
            ]).map(opt => {
              const isSelected = metric.sleep_state?.duration === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onSetSleepState(opt.val);
                  }}
                  className={`min-h-[40px] px-1 rounded-xl text-[11px] font-bold border transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center text-center ${
                    isSelected
                      ? opt.val.includes('❌')
                        ? 'bg-rose-500 border-rose-400 text-white font-black'
                        : opt.val.includes('⏱️')
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                        : 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="break-words">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Поведение */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
          <span className="text-xs font-bold text-zinc-300">🙂 Поведение:</span>
          <div className="flex flex-wrap gap-1">
            {BEHAVIORS.map(b => {
              const isSelected = metric.behavior === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    onSetBehavior(b);
                  }}
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    isSelected
                      ? b === 'Угнетённое'
                        ? 'bg-rose-500 border-rose-400 text-white font-black'
                        : 'bg-zinc-200 border-white text-zinc-950 font-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 3. ВИТАЛЬНЫЙ ЭКСПРЕСС-ОСМОТР (REPORTING BY EXCEPTION) ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
        <div
          onClick={() => {
            triggerHaptic?.(8);
            setIsVitalsExpanded(!isVitalsExpanded);
          }}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{hasCriticalAlert ? '🚨' : hasWarning ? '⚠️' : '🩺'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  Витальные маркеры хоботных
                </span>
                {hasCriticalAlert ? (
                  <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] animate-pulse">
                    ТРЕВОГА
                  </span>
                ) : hasWarning ? (
                  <span className="px-2 py-0.2 rounded-full bg-amber-500 text-zinc-950 font-bold text-[9px]">
                    ВНИМАНИЕ
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                    Норма ✓
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">
                EEHV-контроль, колика, дыхание, ортопедия
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label={isVitalsExpanded ? 'Свернуть' : 'Развернуть'}
            className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"
          >
            {isVitalsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Collapsed Green Status */}
        {!isVitalsExpanded && !hasCriticalAlert && !hasWarning && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>🟢 Все 5 маркеров в норме (язык розовый, хобот активен)</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-normal">Детали ▾</span>
          </div>
        )}

        {/* Expanded 5 groups */}
        {isVitalsExpanded && (
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            {/* 1. Хобот и ЖКТ */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                1. Тонус хобота и ЖКТ (Колики):
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'active', label: '🟢 Активен', alert: false },
                  { id: 'weak_loop', label: '⚠️ Вялый / Петля', alert: false },
                  { id: 'colic_clamping', label: '🚨 Зажимает зубами', alert: true },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectVital('trunk_tone', opt.id, opt.alert, opt.label)}
                    className={`min-h-[42px] px-1 rounded-xl text-[11px] font-bold border transition ${
                      trunkTone === opt.id
                        ? opt.alert
                          ? 'bg-rose-500/25 border-rose-500 text-rose-200 font-black'
                          : opt.id === 'weak_loop'
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-black'
                          : 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Слизистая и язык (EEHV) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                2. Слизистая и язык (EEHV-контроль):
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'normal_pink', label: '🟢 Розовый', alert: false },
                  { id: 'cyanosis_blue', label: '🚨 Цианоз / Синий', alert: true },
                  { id: 'petechiae', label: '⚠️ Петехии', alert: false },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectVital('mucosa_tongue', opt.id, opt.alert, opt.label)}
                    className={`min-h-[42px] px-1 rounded-xl text-[11px] font-bold border transition ${
                      mucosaTongue === opt.id
                        ? opt.alert
                          ? 'bg-rose-500/25 border-rose-500 text-rose-200 font-black'
                          : opt.id === 'petechiae'
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-black'
                          : 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Дыхание */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                3. Дыхание:
              </span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'nasal_normal', label: '🟢 Носовое (4–8 вд/мин)', alert: false },
                  { id: 'mouth_dyspnea', label: '🚨 Рот открыт / Одышка', alert: true },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectVital('breathing_observation', opt.id, opt.alert, opt.label)}
                    className={`min-h-[42px] px-2 rounded-xl text-[11px] font-bold border transition ${
                      breathing === opt.id
                        ? opt.alert
                          ? 'bg-rose-500/25 border-rose-500 text-rose-200 font-black'
                          : 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Опора и ортопедия */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                4. Опора и ортопедия:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'stable', label: '🟢 Ровная стойка', alert: false },
                  { id: 'weight_shift_high', label: '⚠️ Переминание >10', alert: false },
                  { id: 'three_legs_pain', label: '🚨 На 3 ногах / Тони', alert: true },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectVital('gait_assessment', opt.id, opt.alert, opt.label)}
                    className={`min-h-[42px] px-1 rounded-xl text-[11px] font-bold border transition ${
                      gait === opt.id
                        ? opt.alert
                          ? 'bg-rose-500/25 border-rose-500 text-rose-200 font-black'
                          : opt.id === 'weight_shift_high'
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-black'
                          : 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Отёки морды */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                5. Отёки морды:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: '🟢 Без отёков', alert: false },
                  { id: 'trunk_periorbital', label: '🚨 Отёк хобота/глаз', alert: true },
                  { id: 'sunken_temples', label: '⚠️ Впалые виски', alert: false },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectVital('facial_edema', opt.id, opt.alert, opt.label)}
                    className={`min-h-[42px] px-1 rounded-xl text-[11px] font-bold border transition ${
                      facialEdema === opt.id
                        ? opt.alert
                          ? 'bg-rose-500/25 border-rose-500 text-rose-200 font-black'
                          : opt.id === 'sunken_temples'
                          ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-black'
                          : 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="break-words">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Critical alert action row */}
            {(hasCriticalAlert || metric.vital_photo_url) && (
              <div className="pt-2 border-t border-rose-500/40 flex flex-col gap-2 bg-rose-950/30 p-2.5 rounded-xl">
                <span className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>ТРЕБУЕТСЯ ФОТОСИМПТОМ И СОГЛАСОВАНИЕ ШЕФА</span>
                </span>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex-1 min-h-[44px] rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
                  >
                    <Camera size={14} />
                    <span>{uploadingPhoto ? 'Сжатие...' : metric.vital_photo_url ? '📸 Переснять' : '📸 Снять симптом'}</span>
                  </button>

                  {onRequestChiefApproval && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(20);
                        onRequestChiefApproval();
                      }}
                      className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer touch-manipulation shadow-md"
                    >
                      <span>📢</span>
                      <span>ЗАПРОС ШЕФУ</span>
                    </button>
                  )}
                </div>

                {metric.vital_photo_url && (
                  <div className="h-24 w-full rounded-lg overflow-hidden border border-rose-500/40 relative">
                    <img src={metric.vital_photo_url} alt="Симптом" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-white">
                      Фото сохранено ✓
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
