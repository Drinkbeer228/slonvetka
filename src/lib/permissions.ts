import { Profile } from '../types';
import { DailyShift } from '../types/shift';
import { UserRole } from '../types/roles';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

export function canManageStaff(role: UserRole | null | undefined): boolean {
  return isAdmin(role);
}

export function canEditAssignmentsOrTreatments(role: UserRole | null | undefined): boolean {
  return role === 'vet' || isAdmin(role);
}

export function canEditShiftByRole(role: UserRole | null | undefined, isDutyKeeper: boolean): boolean {
  return isAdmin(role) || (role === 'keeper' && isDutyKeeper);
}

export function canManageInventory(role: UserRole | null | undefined, isDutyKeeper: boolean): boolean {
  return isAdmin(role) || (role === 'keeper' && isDutyKeeper);
}

export function canManageUsers(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return canManageStaff(profile?.role);
}

export function canCreateMedicalAssignment(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return canEditAssignmentsOrTreatments(profile?.role);
}

export function canCreateTrainingPlan(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'director' || isAdmin(profile?.role);
}

export function canEditShift(
  profile: Pick<Profile, 'id' | 'role'> | null | undefined,
  shift: Pick<DailyShift, 'date' | 'duty_keeper_id' | 'handover_to_keeper_id' | 'status'> | null | undefined
): boolean {
  if (!profile || !shift) return false;
  if (isAdmin(profile.role)) return true;

  const isTodayShift = shift.date === getTodayDateString();
  if (!isTodayShift || profile.role !== 'keeper') return false;

  return (
    (
      shift.duty_keeper_id === profile.id &&
      shift.status !== 'completed' &&
      shift.status !== 'submitted'
    ) ||
    (
      shift.handover_to_keeper_id === profile.id &&
      shift.status === 'handover_pending'
    )
  );
}

export function canClaimShift(
  profile: Pick<Profile, 'role'> | null | undefined,
  shift: Pick<DailyShift, 'date' | 'duty_keeper_id' | 'status'> | null | undefined
): boolean {
  return Boolean(
    profile?.role === 'keeper' &&
    shift &&
    shift.date === getTodayDateString() &&
    !shift.duty_keeper_id &&
    shift.status !== 'completed' &&
    shift.status !== 'submitted' &&
    shift.status !== 'handover_pending'
  );
}

export function canAdjustInventory(
  profile: Pick<Profile, 'id' | 'role'> | null | undefined,
  shift: Pick<DailyShift, 'date' | 'duty_keeper_id' | 'status'> | null | undefined
): boolean {
  const isDutyKeeper = Boolean(
    profile?.id &&
    shift &&
    shift.date === getTodayDateString() &&
    shift.duty_keeper_id === profile.id
  );

  return Boolean(
    canManageInventory(profile?.role, isDutyKeeper)
  );
}
