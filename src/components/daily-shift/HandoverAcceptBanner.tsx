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
      <div className="fixed top-4 left-4 right-4 z-[90] sm:left-auto sm:right-6 sm:top-6 sm:w-96 bg-white/95 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
        <div className="p-4 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
            <Bell size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-slate-800 leading-tight mb-1">
              {senderName} передает вам смену
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Заполните опросник приёмки дежурства перед началом работы.
            </p>
            
            {pendingShift.handover_notes && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                «{pendingShift.handover_notes}»
              </div>
            )}
          </div>
        </div>
        
        <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={16} strokeWidth={3} />
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => setIsChecklistOpen(true)}
            disabled={isProcessing}
            className="flex-1 py-3.5 flex items-center justify-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider hover:bg-teal-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ClipboardCheck size={17} strokeWidth={2.5} />
            Принять смену
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
