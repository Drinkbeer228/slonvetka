import React from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldAlert, HeartPulse, ChevronRight,
  Share2, Clock, Sparkles
} from 'lucide-react';
import type { ElephantDailyMetrics, DailyShift } from '../../types/shift';
import type { Elephant } from '../../types';

interface VetMorningDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  elephants: Elephant[];
  metrics: Record<string, ElephantDailyMetrics>;
  shift: DailyShift | null;
  onSelectElephant: (elephantId: string) => void;
  triggerHaptic?: (ms?: number) => void;
}

export function VetMorningDigestModal({
  isOpen,
  onClose,
  elephants,
  metrics,
  shift,
  onSelectElephant,
  triggerHaptic,
}: VetMorningDigestModalProps) {
  if (!isOpen) return null;

  // Evaluate clinical status for each elephant
  const getElephantReport = (el: Elephant) => {
    const m = metrics[el.id];
    const poopCount = m?.poop_count ?? 0;
    const urineCount = m?.urination_count ?? 0;
    const hasFecesAnomaly = m?.feces_traits?.some(t => t.includes('Диарея') || t.includes('Жидкий') || t.includes('Сухой')) ?? false;
    const hasUrineAnomaly = m?.urination_traits?.some(t => t.includes('Мутная') || t.includes('Осадок') || t.includes('Кровь')) ?? false;

    // Vitals
    const isEEHVAlert = m?.mucosa_tongue === 'cyanosis_blue';
    const isColicAlert = m?.trunk_tone === 'colic_clamping';
    const isGaitAlert = m?.gait_assessment === 'three_legs_pain';
    const isDyspnea = m?.breathing_observation === 'mouth_dyspnea';
    const isEdema = m?.facial_edema === 'trunk_periorbital';

    const hasRedFlag = isEEHVAlert || isColicAlert || isGaitAlert || isDyspnea || isEdema || m?.vital_alert;

    const hasYellowWarning =
      m?.trunk_tone === 'weak_loop' ||
      m?.mucosa_tongue === 'petechiae' ||
      m?.gait_assessment === 'weight_shift_high' ||
      m?.facial_edema === 'sunken_temples' ||
      hasFecesAnomaly ||
      hasUrineAnomaly ||
      (el.id === 'pretty' && (m?.temporal_gland_score ?? 0) >= 2);

    const severity: 'red' | 'yellow' | 'green' = hasRedFlag ? 'red' : hasYellowWarning ? 'yellow' : 'green';

    return {
      elephant: el,
      metric: m,
      severity,
      poopCount,
      urineCount,
      hasFecesAnomaly,
      hasUrineAnomaly,
      hasRedFlag,
      hasYellowWarning,
      isEEHVAlert,
      isColicAlert,
      isGaitAlert,
    };
  };

  const reports = elephants.map(getElephantReport);

  const handleCopyDigest = () => {
    triggerHaptic?.(25);
    const dateStr = new Date().toLocaleDateString('ru-RU');
    let text = `🩺 ВЕТ-СРЕЗ «СЛОНОВЕТ» (${dateStr}):\n\n`;

    reports.forEach(r => {
      const icon = r.severity === 'red' ? '🔴' : r.severity === 'yellow' ? '🟡' : '🟢';
      text += `${icon} ${r.elephant.name.toUpperCase()}:\n`;
      text += `  • Кал: ${r.poopCount} куч ${r.hasFecesAnomaly ? '(⚠️ Аномалия)' : '(норма)'}\n`;
      text += `  • Моча: ${r.urineCount} раз ${r.hasUrineAnomaly ? '(⚠️ Мутная)' : '(норма)'}\n`;

      if (r.elephant.id === 'audrey') {
        text += `  • EEHV: ${r.metric?.mucosa_tongue === 'cyanosis_blue' ? '🚨 ЦИАНОЗ ЯЗЫКА' : '🟢 Слизистая розовая'}\n`;
      }
      if (r.elephant.id === 'pretty') {
        text += `  • Ноги: ${r.metric?.gait_assessment === 'three_legs_pain' ? '🚨 Боль/3 ноги' : '🟢 Опора стабильна'}\n`;
        text += `  • TGS доли: ${r.metric?.temporal_gland_score ?? 0}/4\n`;
      }
      text += `\n`;
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Сводка скопирована в буфер обмена для отправки шефу / в чат ветслужбы.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 text-lg border border-emerald-500/30">
              🩺
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Утренний 10-секундный вет-срез</h2>
              <p className="text-[11px] text-zinc-400">Светофор по 3-м слонихам • Клинический экспресс-мониторинг</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ═══ 3 ELEPHANT STATUS CARDS ═══ */}
        <div className="flex flex-col gap-3 py-3">
          {reports.map((r) => {
            const isAudrey = r.elephant.id === 'audrey';
            const isPretty = r.elephant.id === 'pretty';

            return (
              <div
                key={r.elephant.id}
                onClick={() => {
                  triggerHaptic?.(15);
                  onSelectElephant(r.elephant.id);
                  onClose();
                }}
                className={`rounded-2xl border p-3.5 transition cursor-pointer active:scale-[0.99] touch-manipulation flex flex-col gap-2 ${
                  r.severity === 'red'
                    ? 'border-rose-500/80 bg-rose-950/25 shadow-rose-500/10'
                    : r.severity === 'yellow'
                    ? 'border-amber-500/60 bg-amber-950/20'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🐘</span>
                    <h3 className="text-sm font-black text-white">{r.elephant.name}</h3>
                    {isAudrey && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        EEHV-риск 12л
                      </span>
                    )}
                    {isPretty && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Ортопедия 38л
                      </span>
                    )}
                  </div>

                  {/* Status chip */}
                  <div className="flex items-center gap-1.5">
                    {r.severity === 'red' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                        🔴 КРИТИЧЕСКИЙ ФЛАГ
                      </span>
                    ) : r.severity === 'yellow' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px]">
                        🟡 ВНИМАНИЕ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        🟢 НОРМА
                      </span>
                    )}
                    <ChevronRight size={14} className="text-zinc-500" />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Left: General physiology */}
                  <div className="space-y-0.5 text-zinc-300">
                    <p className="flex items-center gap-1">
                      <span>💩</span>
                      <span>Стул: <strong className="text-white font-mono">{r.poopCount}</strong> {r.hasFecesAnomaly && <span className="text-rose-400 font-bold">аномалия!</span>}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span>💧</span>
                      <span>Моча: <strong className="text-white font-mono">{r.urineCount}</strong> {r.hasUrineAnomaly && <span className="text-amber-400 font-bold">мутная!</span>}</span>
                    </p>
                  </div>

                  {/* Right: Pathognomonic specifics */}
                  <div className="space-y-0.5 text-zinc-300">
                    {isAudrey && (
                      <>
                        <p className="text-[11px]">
                          Язык:{' '}
                          {r.metric?.mucosa_tongue === 'cyanosis_blue' ? (
                            <strong className="text-rose-400 font-bold">🚨 Цианоз!</strong>
                          ) : r.metric?.mucosa_tongue === 'petechiae' ? (
                            <strong className="text-amber-400 font-bold">⚠️ Петехии</strong>
                          ) : (
                            <strong className="text-emerald-400">Розовый ✓</strong>
                          )}
                        </p>
                        <p className="text-[11px]">
                          Хобот:{' '}
                          {r.metric?.trunk_tone === 'weak_loop' ? (
                            <strong className="text-amber-400">Вялый / петля</strong>
                          ) : (
                            <strong className="text-zinc-200">Активен ✓</strong>
                          )}
                        </p>
                      </>
                    )}

                    {isPretty && (
                      <>
                        <p className="text-[11px]">
                          Опора:{' '}
                          {r.metric?.gait_assessment === 'three_legs_pain' ? (
                            <strong className="text-rose-400 font-bold">🚨 На 3 ногах!</strong>
                          ) : r.metric?.gait_assessment === 'weight_shift_high' ? (
                            <strong className="text-amber-400">Переминание &gt;10</strong>
                          ) : (
                            <strong className="text-emerald-400">Стабильна ✓</strong>
                          )}
                        </p>
                        <p className="text-[11px]">
                          TGS железы:{' '}
                          <strong className={`font-mono ${
                            (r.metric?.temporal_gland_score ?? 0) >= 3 ? 'text-rose-400' : (r.metric?.temporal_gland_score ?? 0) >= 1 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {r.metric?.temporal_gland_score ?? 0}/4
                          </strong>
                        </p>
                      </>
                    )}

                    {!isAudrey && !isPretty && (
                      <>
                        <p className="text-[11px]">
                          Дыхание:{' '}
                          {r.metric?.breathing_observation === 'mouth_dyspnea' ? (
                            <strong className="text-rose-400 font-bold">🚨 Рот открыт</strong>
                          ) : (
                            <strong className="text-emerald-400">Носовое ✓</strong>
                          )}
                        </p>
                        <p className="text-[11px]">
                          Поведение:{' '}
                          <span className="text-zinc-200">{r.metric?.behavior || 'Спокойная'}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-bold pt-0.5 border-t border-zinc-800/60 flex items-center justify-between">
                  <span>Нажмите, чтобы открыть карту слонихи</span>
                  {r.metric?.vital_photo_url && (
                    <span className="text-emerald-400 font-bold">📸 Фото симптома прикреплено</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyDigest}
            className="flex-1 min-h-[46px] rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 active:scale-95 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer touch-manipulation"
          >
            <Share2 size={15} />
            <span>Скопировать для Шефа / Чата</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs transition cursor-pointer touch-manipulation"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
