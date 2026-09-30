import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, Bell, ClipboardCheck } from 'lucide-react';
import { DailyShift } from '../../types/shift';
import { shiftService } from '../../services/shiftService';
import { supabaseService } from '../../services/supabaseService';
import { HandoverAcceptModal } from './HandoverAcceptModal';

interface HandoverAcceptBannerProps {
  pendingShift: DailyShift;
  currentUserId: string;
  onAccept: () => void;
  onReject: () => void;
}

export function HandoverAcceptBanner({ pendingShift, currentUserId, onAccept, onReject }: HandoverAcceptBannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [senderName, setSenderName] = useState<string>('Коллега');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    if (pendingShift.duty_keeper_id) {
      supabaseService.getProfile(pendingShift.duty_keeper_id).then(p => {
        if (p) setSenderName(p.name);
      });
    }
  }, [pendingShift.duty_keeper_id]);

  const handleReject = async () => {
    if (!confirm('Вы уверены, что хотите отклонить передачу дежурства?')) return;
    setIsProcessing(true);
    try {
      await shiftService.rejectHandover(pendingShift.id);
      onReject();
    } catch (err) {
      console.error('Failed to reject handover:', err);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed top-4 left-4 right-4 z-[90] sm:left-auto sm:right-6 sm:top-6 sm:w-96 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        <div className="p-4 flex gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <Bell size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white leading-tight mb-1 break-words">
              {senderName} передает вам смену
            </h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed break-words">
              Заполните опросник приёмки дежурства перед началом работы.
            </p>
            
            {pendingShift.handover_notes && (
              <div className="mt-2 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 italic break-words">
                «{pendingShift.handover_notes}»
              </div>
            )}
          </div>
        </div>
        
        <div className="flex border-t border-zinc-800 divide-x divide-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-zinc-400 font-semibold text-xs uppercase tracking-wider hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            <X size={16} strokeWidth={2.5} />
            <span>Отклонить</span>
          </button>
          <button
            type="button"
            onClick={() => setIsChecklistOpen(true)}
            disabled={isProcessing}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider hover:bg-emerald-950/30 transition-colors disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            <ClipboardCheck size={17} strokeWidth={2.5} />
            <span>Принять смену</span>
          </button>
        </div>
      </div>

      {/* Опросник приёмки смены с 5 ключевыми вопросами */}
      {isChecklistOpen && (
        <HandoverAcceptModal
          pendingShift={pendingShift}
          senderName={senderName}
          currentUserId={currentUserId}
          onClose={() => setIsChecklistOpen(false)}
          onSuccess={() => {
            setIsChecklistOpen(false);
            onAccept();
          }}
        />
      )}
    </>
  );
}
