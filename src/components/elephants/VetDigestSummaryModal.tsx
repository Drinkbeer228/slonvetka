import React, { useState } from 'react';
import { X, HeartPulse, TrendingUp, TrendingDown, ShieldAlert, Users, Calendar, ArrowRight } from 'lucide-react';
import { ElephantShiftChecklist, ELEPHANTS_CHECKLIST_CONFIG } from '../../types/conservation';
import { ChecklistEvaluationResult } from '../../utils/conservationStandard';

interface VetDigestSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklists: Record<string, ElephantShiftChecklist>;
  evaluations: Record<string, ChecklistEvaluationResult>;
  triggerHaptic?: (ms?: number) => void;
}

const ICONS_MAP: Record<number, { icon: string; name: string }> = {
  1: { icon: '🚨', name: 'EEHV' },
  2: { icon: '💩', name: 'Кал' },
  3: { icon: '💧', name: 'Моча' },
  4: { icon: '🦶', name: 'Копыта' },
  5: { icon: '🍽', name: 'Еда' },
  6: { icon: '😴', name: 'Сон' },
  7: { icon: '🧴', name: 'Тело' },
  8: { icon: '📷', name: 'Фото' },
  9: { icon: '🐘', name: 'Социум' },
};

export function VetDigestSummaryModal({
  isOpen,
  onClose,
  checklists,
  evaluations,
  triggerHaptic,
}: VetDigestSummaryModalProps) {
  const [selectedCell, setSelectedCell] = useState<{ elephantId: string; blockNum: number } | null>(null);

  if (!isOpen) return null;

  const elephantMetas = Object.values(ELEPHANTS_CHECKLIST_CONFIG);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <HeartPulse size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-black text-white">Вет-сводка и Контроль Шефа</h2>
              <p className="text-[11px] text-zinc-400">9 ключевых маркеров поголовья по стандарту Xishuangbanna</p>
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

        {/* 3 Elephants x 9 Icons Matrix */}
        <div className="space-y-3">
          {elephantMetas.map((meta) => {
            const ev = evaluations[meta.id];
            const checklist = checklists[meta.id];

            return (
              <div key={meta.id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                {/* Header row with yesterday trend comparison */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.avatarEmoji}</span>
                    <div>
                      <span className="text-sm font-black text-white">{meta.name}</span>
                      <span className="text-[10px] text-zinc-400 block">{meta.categoryLabel}</span>
                    </div>
                  </div>

                  {/* Trends comparing to yesterday */}
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp size={10} /> стул ↑
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-0.5">
                      аппетит 100%
                    </span>
                  </div>
                </div>

                {/* 9 Icons Strip */}
                <div className="grid grid-cols-9 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                    const block = ev?.blockSummaries[num];
                    const iconMeta = ICONS_MAP[num];
                    const dot = block?.dot || 'green';
                    const isFilled = block?.isFilled ?? false;

                    const isSelected = selectedCell?.elephantId === meta.id && selectedCell?.blockNum === num;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          triggerHaptic?.(10);
                          setSelectedCell({ elephantId: meta.id, blockNum: num });
                        }}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center p-0.5 transition active:scale-95 cursor-pointer border ${
                          isSelected
                            ? 'ring-2 ring-white border-white scale-105'
                            : dot === 'red'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : dot === 'yellow'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : isFilled
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                        }`}
                      >
                        <span className="text-sm leading-none">{iconMeta.icon}</span>
                        <span className="text-[8px] font-bold mt-1 text-zinc-400 break-words leading-none">
                          {iconMeta.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Cell Detail Preview */}
        {selectedCell && (
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-700 space-y-1.5 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{ICONS_MAP[selectedCell.blockNum].icon}</span>
                <span>{ELEPHANTS_CHECKLIST_CONFIG[selectedCell.elephantId]?.name} — {evaluations[selectedCell.elephantId]?.blockSummaries[selectedCell.blockNum]?.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-300 font-medium break-words">
              {evaluations[selectedCell.elephantId]?.blockSummaries[selectedCell.blockNum]?.summary}
            </p>
          </div>
        )}

        {/* 7-Day Trend Mini-Chart (Placeholder for Longitudinal Data) */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">📊 7-дневный тренд дефекации и аппетита</span>
            <span className="text-[10px] text-zinc-500 font-mono">24–30 сен</span>
          </div>
          <div className="grid grid-cols-7 gap-1 h-12 items-end pt-2">
            {[4, 5, 5, 4, 6, 5, 5].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t bg-emerald-500/80 transition-all"
                  style={{ height: `${(val / 6) * 100}%` }}
                />
                <span className="text-[9px] font-mono text-zinc-500">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Social Dynamics Block */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white">Социальная динамика за неделю</h3>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span>Доминант в группе:</span>
              <strong className="text-white">Марго (матриарх)</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span>Изоляция / отталкивание от поилки:</span>
              <span className="text-emerald-400 font-bold">0 за 7 дней (стабильно)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span>Игровые контакты с Одри:</span>
              <span className="text-sky-400 font-bold">14 контактов</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[46px] rounded-xl bg-white text-zinc-950 font-black text-xs active:scale-95 cursor-pointer touch-manipulation"
        >
          Закрыть сводку
        </button>
      </div>
    </div>
  );
}
