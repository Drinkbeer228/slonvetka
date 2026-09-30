import React, { useState } from 'react';
import { useDailyShift } from '../hooks/useDailyShift';
import { canCreateMedicalAssignment } from '../lib/permissions';
import { supabaseService } from '../services/supabaseService';
import { SyncManager } from '../services/SyncManager';
import { Assignment, Elephant } from '../types';
import { createDefaultElephantMetrics } from '../types/shift';

// Section Components
import { ElephantSelector } from '../components/daily-shift/ElephantSelector';
import { PhysiologySection } from '../components/elephants/PhysiologySection';
import { FeedingSection } from '../components/elephants/FeedingSection';
import { BodyCareSection } from '../components/elephants/BodyCareSection';
import { VetAssignmentsSection } from '../components/elephants/VetAssignmentsSection';

// Modals
import { ExecutionBottomSheet } from '../components/daily-shift/ExecutionBottomSheet';
import { AssignmentModal } from '../components/AssignmentModal';
import { ObservationModal } from '../components/ObservationModal';
import { ShiftActivityFeed } from '../components/daily-shift/ShiftActivityFeed';
import { ShiftHandover } from '../components/daily-shift/ShiftHandover';
import { SubmitShiftButton } from '../components/daily-shift/SubmitShiftButton';
import { HandoverAcceptBanner } from '../components/daily-shift/HandoverAcceptBanner';
import { ShiftHandoverModal } from '../components/daily-shift/ShiftHandoverModal';

import { Camera } from 'lucide-react';

/**
 * ElephantsScreen — экран «СЛОНЫ»
 * Лайв-мониторинг слоних: физиология, кормление, уход, вет-назначения.
 */
export function ElephantsScreen() {
  const hook = useDailyShift();

  // Modal states
  const [executionTask, setExecutionTask] = useState<{ assignment: Assignment; elephant: Elephant } | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  return (
    <div className="space-y-4 pb-4">
      {/* Pending Handover Banner */}
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

      {/* 1. ELEPHANT SELECTOR */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Выбор слонихи
          </span>
        </div>
        <ElephantSelector
          elephants={hook.elephants}
          activeElephantId={hook.activeElephant.id}
          onSelect={(id) => {
            hook.setActiveElephantId(id);
            hook.triggerHaptic(12);
          }}
          metrics={hook.metrics}
        />
      </section>

      {/* 2. PHYSIOLOGY */}
      <PhysiologySection
        elephantName={hook.activeElephant.name}
        metric={hook.activeMetric}
        onUpdateFeces={hook.handleUpdateFeces}
        onUpdateUrine={hook.handleUpdateUrine}
        onToggleFecesAnomaly={hook.handleToggleFecesAnomaly}
        onToggleUrineAnomaly={hook.handleToggleUrineAnomaly}
        onSetSleepState={hook.handleSetSleepState}
        onSetBehavior={hook.handleSetBehavior}
      />

      {/* 3. FEEDING */}
      <FeedingSection
        elephantId={hook.activeElephant.id}
        elephantName={hook.activeElephant.name}
        metric={hook.activeMetric}
        onMarkServed={hook.handleMarkFeedingServed}
        onToggleWaterCheck={hook.handleToggleWaterCheck}
      />

      {/* 4. BODY CARE */}
      <BodyCareSection
        elephantName={hook.activeElephant.name}
        metric={hook.activeMetric}
        onSetWashStatus={hook.handleSetWashStatus}
        onSetLimbCondition={hook.handleSetLimbCondition}
      />

      {/* 5. VET ASSIGNMENTS */}
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

      {/* 6. ACTIVITY FEED + OBSERVATION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Оперативный журнал
          </span>
          <button
            type="button"
            onClick={() => setIsObservationModalOpen(true)}
            className="min-h-[44px] px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
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

      {/* 7. HANDOVER */}
      <section className="space-y-3">
        <ShiftHandover
          handoverNotes={hook.shift?.handover_notes || ''}
          isLocked={hook.shift?.status === 'completed' || hook.shift?.status === 'submitted'}
          isSaving={hook.globalSaveStatus === 'saving'}
          onChange={(val) => {
            if (!hook.shift) return;
            const nextShift = { ...hook.shift, handover_notes: val };
            hook.setShift(nextShift);
            hook.persistChanges(hook.metrics, nextShift);
          }}
          onSubmit={() => setIsHandoverModalOpen(true)}
        />
        <SubmitShiftButton
          isIdeal={true}
          disabled={hook.shift?.status === 'completed' || hook.shift?.status === 'submitted'}
          onClick={() => setIsHandoverModalOpen(true)}
        />
      </section>

      {/* ═══ MODALS ═══ */}
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

      {isAssignmentModalOpen && (
        <AssignmentModal
          elephants={hook.elephants}
          initialData={{ elephant_id: hook.activeElephant.id } as Assignment}
          onClose={() => setIsAssignmentModalOpen(false)}
          onSaved={async () => {
            setIsAssignmentModalOpen(false);
            await hook.refreshAssignments();
          }}
        />
      )}

      {isObservationModalOpen && (
        <ObservationModal
          elephants={hook.elephants}
          onClose={() => setIsObservationModalOpen(false)}
          onComplete={async ({ elephantId, comment, photoBlob }) => {
            if (!hook.profile) return;
            let storagePath: string | null = null;
            if (photoBlob) {
              try {
                storagePath = await supabaseService.uploadShiftMedia(photoBlob, new Date().toISOString().split('T')[0], 'general_observation');
              } catch {}
            }
            const elName = hook.elephants.find(e => e.id === elephantId)?.name || 'Слон';
            hook.logEvent(`Наблюдение: ${elName} (${comment})${storagePath ? ' 📷' : ''}`, '📷');
            setIsObservationModalOpen(false);
          }}
        />
      )}

      {isHandoverModalOpen && hook.shift && hook.profile && (
        <ShiftHandoverModal
          shiftId={hook.shift.id}
          currentUserId={hook.profile.id}
          onClose={() => setIsHandoverModalOpen(false)}
          onSuccess={() => {
            setIsHandoverModalOpen(false);
            hook.loadShiftData();
          }}
        />
      )}
    </div>
  );
}
