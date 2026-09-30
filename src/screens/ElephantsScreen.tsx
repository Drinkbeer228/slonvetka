import React, { useState, useMemo } from 'react';
import { useDailyShift } from '../hooks/useDailyShift';
import { canCreateMedicalAssignment } from '../lib/permissions';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { Assignment, Elephant } from '../types';

// ─── КИТАЙСКИЙ СТАНДАРТ (XISHUANGBANNA & CHENGDU) ───
import {
  ElephantShiftChecklist,
  createInitialChecklist,
  ELEPHANTS_CHECKLIST_CONFIG
} from '../types/conservation';
import { evaluateChecklist } from '../utils/conservationStandard';
import { ElephantCardsHeader } from '../components/elephants/ElephantCardsHeader';
import { ChineseElephantAccordion } from '../components/elephants/ChineseElephantAccordion';
import { ShiftSubmitSummaryModal } from '../components/elephants/ShiftSubmitSummaryModal';
import { VetDigestSummaryModal } from '../components/elephants/VetDigestSummaryModal';

// Shared Sections
import { VetAssignmentsSection } from '../components/elephants/VetAssignmentsSection';
import { ShiftActivityFeed } from '../components/daily-shift/ShiftActivityFeed';
import { ExecutionBottomSheet } from '../components/daily-shift/ExecutionBottomSheet';
import { AssignmentModal } from '../components/AssignmentModal';
import { ObservationModal } from '../components/ObservationModal';
import { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';
import { ChiefApprovalModal } from '../components/chief/ChiefApprovalModal';
import { ChiefApprovalRequest } from '../types/approval';

import { Camera, HeartPulse, Send, ShieldCheck } from 'lucide-react';

/**
 * ElephantsScreen — экран «СЛОНЫ»
 * Перестроен в систему сменных чек-листов по стандартам Xishuangbanna и Chengdu.
 * 3 карточки слоних в ряд (Марго, Одри, Прэтти) + аккордеон из 9 блоков.
 */
export function ElephantsScreen() {
  const hook = useDailyShift();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 9-Block Checklists state for all 3 elephants
  const [checklists, setChecklists] = useState<Record<string, ElephantShiftChecklist>>(() => {
    try {
      const saved = localStorage.getItem(`slonovet_checklists_${todayStr}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      margo: createInitialChecklist('margo', todayStr),
      audrey: createInitialChecklist('audrey', todayStr),
      pretty: createInitialChecklist('pretty', todayStr),
    };
  });

  const saveChecklists = (next: Record<string, ElephantShiftChecklist>) => {
    setChecklists(next);
    try {
      localStorage.setItem(`slonovet_checklists_${todayStr}`, JSON.stringify(next));
    } catch {}
  };

  const handleChecklistChange = (elephantId: string, updated: ElephantShiftChecklist) => {
    const next = { ...checklists, [elephantId]: updated };
    saveChecklists(next);

    // Sync key clinical metrics back to the shift hook for cross-system consistency
    if (updated.eehv.cyanosis || updated.eehv.facial_edema || updated.eehv.trunk_lethargy) {
      hook.updateMetricField({ vital_alert: true });
    }
  };

  // Automated health evaluation across all 3 elephants
  const evaluations = useMemo(() => {
    return {
      margo: evaluateChecklist(checklists.margo || createInitialChecklist('margo', todayStr)),
      audrey: evaluateChecklist(checklists.audrey || createInitialChecklist('audrey', todayStr)),
      pretty: evaluateChecklist(checklists.pretty || createInitialChecklist('pretty', todayStr)),
    };
  }, [checklists, todayStr]);

  // Modals state
  const [executionTask, setExecutionTask] = useState<{ assignment: Assignment; elephant: Elephant } | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isVetDigestOpen, setIsVetDigestOpen] = useState(false);
  const [isChiefApprovalOpen, setIsChiefApprovalOpen] = useState(false);

  // Chief Approval Requests state (persisted locally)
  const [approvalRequests, setApprovalRequests] = useState<ChiefApprovalRequest[]>(() => {
    try {
      const saved = localStorage.getItem('slonovet_chief_approvals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveApprovalRequests = (reqs: ChiefApprovalRequest[]) => {
    setApprovalRequests(reqs);
    try {
      localStorage.setItem('slonovet_chief_approvals', JSON.stringify(reqs));
    } catch {}
  };

  const handleSubmitApprovalRequest = (newReqData: Omit<ChiefApprovalRequest, 'id' | 'created_at' | 'status'>) => {
    const newReq: ChiefApprovalRequest = {
      ...newReqData,
      id: `req-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
    };
    const next = [newReq, ...approvalRequests];
    saveApprovalRequests(next);
    hook.logEvent(`📢 Запрос решения Шефу: ${newReq.title} (${newReq.elephant_name})`, '📢');
    hook.triggerHaptic(25);
  };

  const handleResolveApprovalRequest = (requestId: string, approved: boolean, comment?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let resolvedItem: ChiefApprovalRequest | undefined;

    const next = approvalRequests.map(r => {
      if (r.id !== requestId) return r;
      resolvedItem = {
        ...r,
        status: approved ? ('approved' as const) : ('rejected' as const),
        resolved_at: now.toISOString(),
        chief_comment: comment,
      };
      return resolvedItem;
    });

    saveApprovalRequests(next);

    if (resolvedItem) {
      if (approved) {
        hook.logEvent(`Шеф дал добро: ${resolvedItem.title} (${timeStr})`, '✅');
        hook.triggerHaptic(35);
      } else {
        hook.logEvent(`Шеф отклонил: ${resolvedItem.title} (${timeStr})`, '❌');
        hook.triggerHaptic(20);
      }
    }
  };

  // Check if any elephant has a critical alert
  const hasAnyCriticalAlert = useMemo(() => {
    return Object.values(evaluations).some(ev => ev.dot === 'red');
  }, [evaluations]);

  const pendingApprovalsCount = useMemo(() => {
    return approvalRequests.filter(r => r.status === 'pending').length;
  }, [approvalRequests]);

  const isChiefRole = hook.profile?.role === 'admin' || hook.profile?.role === 'vet' || hook.profile?.role === 'chief';

  const activeElephantId = hook.activeElephant.id === 'audrey' || hook.activeElephant.id === 'pretty' ? hook.activeElephant.id : 'margo';
  const currentChecklist = checklists[activeElephantId] || createInitialChecklist(activeElephantId, todayStr);
  const currentEvaluation = evaluations[activeElephantId] || evaluateChecklist(currentChecklist);

  return (
    <div className="space-y-4 pb-4">
      {/* ═══ PENDING HANDOVER BANNER ═══ */}
      {hook.pendingHandoverShift && hook.profile?.id && (
        <HandoverAcceptBanner
          pendingShift={hook.pendingHandoverShift}
          currentUserId={hook.profile.id}
          onAccept={() => {
            hook.setPendingHandoverShift(null);
            hook.loadShiftData();
          }}
          onReject={() => hook.setPendingHandoverShift(null)}
        />
      )}

      {/* ═══ TOP BAR: [ ВЕТ-СВОДКА (9 ИКОНОК) ] & [ ЗАПРОС ДОБРА ] ═══ */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            hook.triggerHaptic(15);
            setIsVetDigestOpen(true);
          }}
          className={`min-h-[48px] px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation ${
            hasAnyCriticalAlert
              ? 'bg-rose-500/25 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20 animate-pulse'
              : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <HeartPulse size={16} className={hasAnyCriticalAlert ? 'text-rose-400' : 'text-emerald-400'} />
          <span>Вет-сводка (9 маркеров)</span>
          {hasAnyCriticalAlert && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            hook.triggerHaptic(15);
            setIsChiefApprovalOpen(true);
          }}
          className={`min-h-[48px] px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer touch-manipulation ${
            pendingApprovalsCount > 0
              ? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <span>📢</span>
          <span>Запрос Добра</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-mono font-black">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══ 3 КАРТОЧКИ В РЯД: МАРГО · ОДРИ · ПРЭТТИ ═══ */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Слонихи на смене • 12 часов
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            Стандарт заповедника
          </span>
        </div>
        <ElephantCardsHeader
          activeElephantId={activeElephantId}
          onSelect={(id) => {
            hook.setActiveElephantId(id);
            hook.triggerHaptic(12);
          }}
          evaluations={evaluations}
          triggerHaptic={hook.triggerHaptic}
        />
      </section>

      {/* ═══ ВЕРТИКАЛЬНЫЙ АККОРДЕОН ИЗ 9 БЛОКОВ ОПРОСА ═══ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Сменный чек-лист • {ELEPHANTS_CHECKLIST_CONFIG[activeElephantId]?.name}
          </span>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${currentEvaluation.dotBgClass} ${currentEvaluation.dotBorderClass}`}>
            {currentEvaluation.statusLabel}
          </span>
        </div>

        <ChineseElephantAccordion
          elephantId={activeElephantId}
          elephantName={hook.activeElephant.name}
          checklist={currentChecklist}
          evaluation={currentEvaluation}
          onChange={(updated) => handleChecklistChange(activeElephantId, updated)}
          onLogShiftEvent={(title, icon) => hook.logEvent(title, icon)}
          onRequestChiefApproval={() => setIsChiefApprovalOpen(true)}
          triggerHaptic={hook.triggerHaptic}
        />
      </section>

      {/* ═══ ВЕТ-НАЗНАЧЕНИЯ ═══ */}
      <VetAssignmentsSection
        elephantName={hook.activeElephant.name}
        assignments={hook.elephantAssignments}
        isAssignmentDone={hook.isAssignmentDone}
        isLocked={hook.shift?.status === 'completed' || hook.shift?.status === 'submitted'}
        canCreateAssignment={canCreateMedicalAssignment(hook.profile)}
        onExecute={(assignment, elephant) => setExecutionTask({ assignment, elephant })}
        onQuickExecute={hook.handleQuickExecute}
        onUnmark={async (recordId) => {
          await supabaseService.deleteTreatmentRecord(recordId);
          hook.fetchTodayRecords();
        }}
        onCreateNew={() => setIsAssignmentModalOpen(true)}
        activeElephant={hook.activeElephant}
        todayRecords={hook.todayRecords}
      />

      {/* ═══ ОПЕРАТИВНЫЙ ЖУРНАЛ СМЕНЫ ═══ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Оперативный журнал
          </span>
          <button
            type="button"
            onClick={() => setIsObservationModalOpen(true)}
            className="min-h-[38px] px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
          >
            <Camera size={14} />
            <span>Наблюдение</span>
          </button>
        </div>
        <ShiftActivityFeed
          events={hook.events}
          currentUserId={hook.profile?.id}
          onUndo={(event) => hook.removeEvent(event.id)}
        />
      </section>

      {/* ═══ КНОПКА СДАТЬ СМЕНУ ═══ */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => {
            hook.triggerHaptic(20);
            setIsSubmitModalOpen(true);
          }}
          className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/30 transition active:scale-95 cursor-pointer touch-manipulation"
        >
          <ShieldCheck size={18} />
          <span>Сдать смену (проверка чек-листов)</span>
        </button>
      </section>

      {/* ═══ МОДАЛКА: СДАТЬ СМЕНУ ═══ */}
      <ShiftSubmitSummaryModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        checklists={checklists}
        evaluations={evaluations}
        onSubmitShift={async () => {
          if (!hook.shift) return;
          const nextShift = { ...hook.shift, status: 'submitted' as const };
          hook.setShift(nextShift);
          hook.persistChanges(hook.metrics, nextShift);
          hook.logEvent('Смена официально сдана дежурным кипером', '✅');
        }}
        triggerHaptic={hook.triggerHaptic}
      />

      {/* ═══ МОДАЛКА: ВЕТ-СВОДКА ДЛЯ ВРАЧА И ШЕФА ═══ */}
      <VetDigestSummaryModal
        isOpen={isVetDigestOpen}
        onClose={() => setIsVetDigestOpen(false)}
        checklists={checklists}
        evaluations={evaluations}
        triggerHaptic={hook.triggerHaptic}
      />

      {/* ═══ МОДАЛКА: ЗАПРОС ДОБРА ШЕФУ ═══ */}
      <ChiefApprovalModal
        isOpen={isChiefApprovalOpen}
        onClose={() => setIsChiefApprovalOpen(false)}
        isChiefRole={isChiefRole}
        currentUserId={hook.profile?.id || 'anon'}
        currentUserName={hook.profile?.name || 'Кипер'}
        elephants={hook.elephants}
        activeElephantId={activeElephantId}
        activeRequests={approvalRequests}
        onSubmitRequest={handleSubmitApprovalRequest}
        onResolveRequest={handleResolveApprovalRequest}
        triggerHaptic={hook.triggerHaptic}
      />

      {/* ═══ МОДАЛКА: ВЫПОЛНЕНИЕ НАЗНАЧЕНИЯ ═══ */}
      {executionTask && (
        <ExecutionBottomSheet
          assignment={executionTask.assignment}
          elephant={executionTask.elephant}
          onClose={() => setExecutionTask(null)}
          onComplete={async (data) => {
            if (!hook.profile) return;
            await SyncManager.saveRecordLocally(
              {
                assignment_id: executionTask.assignment.id,
                elephant_id: executionTask.elephant.id,
                keeper_id: hook.profile.id,
                performed_at: new Date().toISOString(),
                assessment: data.assessment,
                medicine_used: data.medicineUsed,
                comment: data.comment,
              },
              data.photoBlob
            );
            hook.logEvent(
              `Выполнено с фото: ${executionTask.assignment.title} (${executionTask.elephant.name})`,
              '📸'
            );
            setExecutionTask(null);
            await hook.fetchTodayRecords();
          }}
        />
      )}

      {/* ═══ МОДАЛКА: НОВОЕ НАЗНАЧЕНИЕ ═══ */}
      {isAssignmentModalOpen && (
        <AssignmentModal
          elephants={hook.elephants}
          initialData={{ elephant_id: activeElephantId } as Assignment}
          onClose={() => setIsAssignmentModalOpen(false)}
          onSaved={async () => {
            setIsAssignmentModalOpen(false);
            await hook.refreshAssignments();
          }}
        />
      )}

      {/* ═══ МОДАЛКА: НАБЛЮДЕНИЕ В ЛЕНТУ ═══ */}
      {isObservationModalOpen && (
        <ObservationModal
          elephants={hook.elephants}
          onClose={() => setIsObservationModalOpen(false)}
          onComplete={async ({ elephantId, comment, photoBlob }) => {
            if (!hook.profile) return;
            let storagePath: string | null = null;
            if (photoBlob) {
              try {
                storagePath = await supabaseService.uploadShiftMedia(
                  photoBlob,
                  new Date().toISOString().split('T')[0],
                  'general_observation'
                );
              } catch {}
            }
            const elName = hook.elephants.find(e => e.id === elephantId)?.name || 'Слон';
            hook.logEvent(`Наблюдение: ${elName} (${comment})${storagePath ? ' 📷' : ''}`, '📷');
            setIsObservationModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
