import React, { useState } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Clock, Send, Sparkles, MessageSquare, UserCheck
} from 'lucide-react';
import { ChiefApprovalRequest, APPROVAL_PRESETS, ApprovalCategory } from '../../types/approval';
import type { Elephant } from '../../types';

interface ChiefApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isChiefRole: boolean;
  currentUserId: string;
  currentUserName: string;
  elephants: Elephant[];
  activeElephantId: string;
  activeRequests: ChiefApprovalRequest[];
  onSubmitRequest: (req: Omit<ChiefApprovalRequest, 'id' | 'created_at' | 'status'>) => void;
  onResolveRequest: (requestId: string, approved: boolean, comment?: string) => void;
  triggerHaptic?: (ms?: number | number[]) => void;
}

export function ChiefApprovalModal({
  isOpen,
  onClose,
  isChiefRole,
  currentUserId,
  currentUserName,
  elephants,
  activeElephantId,
  activeRequests,
  onSubmitRequest,
  onResolveRequest,
  triggerHaptic,
}: ChiefApprovalModalProps) {
  if (!isOpen) return null;

  // New Request Form State
  const [selectedCategory, setSelectedCategory] = useState<ApprovalCategory>('workload_cancel');
  const [targetElephantId, setTargetElephantId] = useState(activeElephantId || 'margo');
  const [customComment, setCustomComment] = useState('');

  // Pending requests awaiting Chief resolution
  const pendingRequests = activeRequests.filter(r => r.status === 'pending');

  const selectedPreset = APPROVAL_PRESETS.find(p => p.category === selectedCategory) || APPROVAL_PRESETS[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic?.([25, 35]);

    const el = elephants.find(e => e.id === targetElephantId);

    onSubmitRequest({
      requester_id: currentUserId,
      requester_name: currentUserName,
      elephant_id: targetElephantId,
      elephant_name: el?.name || 'Слон',
      category: selectedCategory,
      title: selectedPreset.title,
      description: customComment.trim() || selectedPreset.description,
    });

    setCustomComment('');
    onClose();
  };

  const handleChiefDecision = (requestId: string, approved: boolean) => {
    if (approved) {
      triggerHaptic?.([30, 50, 40]);
    } else {
      triggerHaptic?.([20, 20]);
    }
    onResolveRequest(requestId, approved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 text-lg border border-amber-500/30">
              📢
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {isChiefRole && pendingRequests.length > 0
                  ? 'Согласование Шефа (Входящие)'
                  : 'Запрос решения у Шефа'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Критические развилки: нагрузка, рационы, препараты
              </p>
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

        {/* ═══ 1. ЕСЛИ ЕСТЬ ОЖИДАЮЩИЕ ЗАПРОСЫ (РЕЖИМ ШЕФА ИЛИ КИПЕРА) ═══ */}
        {pendingRequests.length > 0 && (
          <div className="py-3 border-b border-zinc-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock size={12} />
              <span>Ожидают решения Шефа ({pendingRequests.length}):</span>
            </span>

            {pendingRequests.map(req => {
              const timeStr = new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/50 shadow-md flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">🐘 {req.elephant_name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{timeStr}</span>
                      </div>
                      <h4 className="text-sm font-bold text-amber-300 leading-snug break-words">
                        {req.title}
                      </h4>
                      {req.description && (
                        <p className="text-xs text-zinc-300 mt-1 break-words">
                          {req.description}
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Запросил: <strong className="text-zinc-300">{req.requester_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* ═══ ДВЕ ГИГАНТСКИЕ КНОПКИ ДЛЯ ШЕФА ═══ */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleChiefDecision(req.id, false)}
                      className="min-h-[52px] rounded-2xl bg-zinc-900 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 active:scale-95 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer touch-manipulation"
                    >
                      <X size={18} />
                      <span>ОТКЛОНИТЬ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChiefDecision(req.id, true)}
                      className="min-h-[52px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 active:scale-95 font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer touch-manipulation"
                    >
                      <Check size={20} strokeWidth={3} />
                      <span>ДА, ДОБРО!</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ 2. ФОРМА СОЗДАНИЯ ЗАПРОСА КИПЕРОМ / ВЕТОМ ═══ */}
        <form onSubmit={handleSend} className="flex flex-col gap-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              Создать новый запрос решения:
            </span>
            <span className="text-[10px] text-zinc-500">В 1-2 тапа</span>
          </div>

          {/* Elephant selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Слониха:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {elephants.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(10);
                    setTargetElephantId(e.id);
                  }}
                  className={`min-h-[44px] px-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer touch-manipulation ${
                    targetElephantId === e.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-black'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  🐘 {e.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Fast Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Суть решения:</label>
            <div className="flex flex-col gap-1.5">
              {APPROVAL_PRESETS.map((p) => {
                const isSelected = selectedCategory === p.category;
                return (
                  <button
                    key={p.category}
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(12);
                      setSelectedCategory(p.category);
                    }}
                    className={`p-3 rounded-2xl border text-left transition active:scale-[0.99] cursor-pointer touch-manipulation flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white leading-snug break-words">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 break-words">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional comment */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Детали / Причина (кратко):</label>
            <input
              type="text"
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              placeholder="Например: бережет ПП лапу, вялая..."
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 min-h-[52px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-[0.98] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer touch-manipulation"
          >
            <Send size={18} />
            <span>ОТПРАВИТЬ ШЕФУ НА ДОБРО</span>
          </button>
        </form>
      </div>
    </div>
  );
}
