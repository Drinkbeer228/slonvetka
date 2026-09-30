import { DailyShift, ElephantDailyMetrics } from '../types/shift';

interface ShiftDraft {
  savedAt: string;
  shift: DailyShift;
  metrics: Record<string, ElephantDailyMetrics>;
}

const draftKey = (date: string) => `slonovet_shift_draft_${date}`;

export function saveShiftDraft(date: string, shift: DailyShift, metrics: Record<string, ElephantDailyMetrics>) {
  try {
    localStorage.setItem(draftKey(date), JSON.stringify({ savedAt: new Date().toISOString(), shift, metrics } satisfies ShiftDraft));
  } catch (error) {
    console.warn('Unable to save shift draft locally:', error);
  }
}

export function getShiftDraft(date: string): ShiftDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(date));
    return raw ? JSON.parse(raw) as ShiftDraft : null;
  } catch {
    return null;
  }
}

export function clearShiftDraft(date: string) {
  try {
    localStorage.removeItem(draftKey(date));
  } catch {
    // Local drafts are a resilience feature; an unavailable storage must not block the shift.
  }
}
