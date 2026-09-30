import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Clock, Send, ShieldCheck } from 'lucide-react';
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
  const canSubmitAll = elephantMetas.every((meta) => {
    const ev = evaluations[meta.id];
    return (ev?.completedBlocksCount ?? 0) >= 7;
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
              <p className="text-[11px] text-zinc-400">Проверка готовности чек-листов всех слоних</p>
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
            <p className="text-xs text-zinc-400">Все 9 блоков занесены в базу данных Supabase и отправлены ветврачу.</p>
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
                const isReady = count >= 7;

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

                    {/* Blocks mini-breakdown */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-900 text-[10px]">
                      {Object.entries(ev?.blockSummaries || {}).map(([num, b]) => (
                        <div key={num} className="flex items-center gap-1 text-zinc-400">
                          <span>{b.isFilled ? '✓' : '⚠️'}</span>
                          <span className="break-words">{b.title.split(' ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning if blocked */}
            {!canSubmitAll && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <span>
                  Для сдачи смены требуется заполнить минимум <strong>7 из 9 блоков</strong> по каждой слонихе.
                </span>
              </div>
            )}

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
              <span>{submitting ? 'Отправка в Supabase...' : 'Подтвердить и отправить смену'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
