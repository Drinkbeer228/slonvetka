import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Clock, Send, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ElephantShiftChecklist, ELEPHANTS_CHECKLIST_CONFIG } from '../../types/conservation';
import { ChecklistEvaluationResult } from '../../utils/conservationStandard';

interface ShiftSubmitSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklists: Record<string, ElephantShiftChecklist>;
  evaluations: Record<string, ChecklistEvaluationResult>;
  onSubmitShift: () => Promise<void>;
  triggerHaptic?: (ms?: number) => void;
}

export function ShiftSubmitSummaryModal({
  isOpen,
  onClose,
  checklists,
  evaluations,
  onSubmitShift,
  triggerHaptic,
}: ShiftSubmitSummaryModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submittedTime, setSubmittedTime] = useState<string | null>(null);

  if (!isOpen) return null;

  const elephantMetas = Object.values(ELEPHANTS_CHECKLIST_CONFIG);

  // Safety rule: completed >= 7 AND all 4 critical blocks filled
  const canSubmitAll = elephantMetas.every((meta) => {
    const ev = evaluations[meta.id];
    return ev?.isReadyToSubmit;
  });

  const handleConfirm = async () => {
    if (!canSubmitAll) return;
    setSubmitting(true);
    triggerHaptic?.(30);
    try {
      await onSubmitShift();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSubmittedTime(timeStr);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-black text-white">Сдача смены (12 часов)</h2>
              <p className="text-[11px] text-zinc-400">Проверка критических блоков и готовности чек-листов</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Success confirmation if already submitted */}
        {submittedTime ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="text-lg font-black text-white">Смена успешно сдана!</h3>
            <p className="text-sm font-mono text-emerald-400">Время фиксации: {submittedTime}</p>
            <p className="text-xs text-zinc-400">
              Данные смены и чек-листы зафиксированы в базе данных Supabase и переданы ветврачу.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] rounded-xl bg-white text-zinc-950 font-black text-xs mt-4 active:scale-95 cursor-pointer touch-manipulation"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            {/* 3 Elephants list with checks */}
            <div className="space-y-3">
              {elephantMetas.map((meta) => {
                const ev = evaluations[meta.id];
                const count = ev?.completedBlocksCount ?? 0;
                const isReady = ev?.isReadyToSubmit;
                const missingCritical = ev?.missingCriticalBlocks || [];

                return (
                  <div key={meta.id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.avatarEmoji}</span>
                        <div>
                          <span className="text-sm font-black text-white">{meta.name}</span>
                          <span className="text-[10px] text-zinc-400 block">{meta.categoryLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          isReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {count}/9 блоков
                        </span>
                        {isReady ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-400" />
                        )}
                      </div>
                    </div>

                    {/* Missing critical blocks warning */}
                    {missingCritical.length > 0 && (
                      <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/50 text-[11px] text-rose-300 flex items-start gap-1.5">
                        <ShieldAlert size={14} className="shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <span className="font-bold">Пропущены критические блоки:</span>
                          <span className="block text-rose-200 mt-0.5">{missingCritical.join(', ')}</span>
                        </div>
                      </div>
                    )}

                    {/* Blocks mini-breakdown */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-900 text-[10px]">
                      {Object.entries(ev?.blockSummaries || {}).map(([num, b]) => (
                        <div key={num} className="flex items-center gap-1 text-zinc-400">
                          <span>{b.isFilled ? '✓' : b.isCritical ? '🔴' : '⚠️'}</span>
                          <span className={b.isCritical ? 'font-bold text-zinc-300 break-words' : 'break-words'}>
                            {b.title.split(' ')[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety policy banner */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs space-y-1">
              <span className="font-bold text-white block">Правило безопасности смены:</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Минимум <strong>7 из 9 блоков</strong>. 4 критических блока (Срочные признаки, Дефекация, Копыта/походка, Кормление/вода) <strong>обязательны для каждой слонихи</strong>.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="button"
              disabled={!canSubmitAll || submitting}
              onClick={handleConfirm}
              className={`w-full min-h-[50px] rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation ${
                canSubmitAll && !submitting
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
              <span>{submitting ? 'Отправка в базу данных...' : 'Подтвердить и сдать смену'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
