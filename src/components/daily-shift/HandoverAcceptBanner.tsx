import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { DailyShift } from '../../types/shift';
import { HandoverAcceptModal } from './HandoverAcceptModal';

/**
 * HandoverAcceptBanner — баннер ожидающей передачи смены.
 * Показывается киперу, которому передали смену (status = 'handover_pending'),
 * и открывает существующий HandoverAcceptModal для приёма/отказа.
 */
interface HandoverAcceptBannerProps {
  pendingShift: DailyShift;
  currentUserId: string;
  onAccept: () => void;
  onReject: () => void;
}

export function HandoverAcceptBanner({
  pendingShift,
  currentUserId,
  onAccept,
  onReject,
}: HandoverAcceptBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-3 shadow-lg shadow-amber-950/20">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
          <ArrowLeftRight size={18} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-amber-300">Передача смены ожидает вас</p>
          <p className="text-xs text-amber-200/70 font-medium mt-0.5 leading-snug break-words">
            Смена за {pendingShift.date} передана вам
            {pendingShift.handover_notes ? `: «${pendingShift.handover_notes}»` : ''}.
            Примите смену, чтобы начать работу.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-[40px] px-4 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black transition active:scale-95 cursor-pointer touch-manipulation"
            >
              Принять смену
            </button>
            <button
              type="button"
              onClick={onReject}
              className="min-h-[40px] px-3.5 rounded-xl border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
            >
              <X size={14} />
              Отклонить
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <HandoverAcceptModal
          pendingShift={pendingShift}
          senderName={pendingShift.duty_keeper_id === currentUserId ? 'Текущий дежурный' : 'Прежний дежурный'}
          currentUserId={currentUserId}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            onAccept();
          }}
        />
      )}
    </>
  );
}
