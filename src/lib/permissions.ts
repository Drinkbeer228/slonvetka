import { Profile } from '../types';
import { DailyShift } from '../types/shift';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function canManageUsers(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function canCreateMedicalAssignment(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'vet' || profile?.role === 'admin';
}

export function canCreateTrainingPlan(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'director' || profile?.role === 'admin';
}

export function canEditShift(
  profile: Pick<Profile, 'id' | 'role'> | null | undefined,
  shift: Pick<DailyShift, 'date' | 'duty_keeper_id' | 'status'> | null | undefined
): boolean {
  if (!profile || !shift) return false;
  if (profile.role === 'admin') return true;

  return (
    profile.role === 'keeper' &&
    shift.duty_keeper_id === profile.id &&
    shift.date === getTodayDateString() &&
    shift.status !== 'completed' &&
    shift.status !== 'submitted'
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
  return canManageUsers(profile) || canEditShift(profile, shift);
}
