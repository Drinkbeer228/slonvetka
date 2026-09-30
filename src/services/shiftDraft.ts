import type { DailyShift, ElephantDailyMetrics } from '../types/shift';

/**
 * shiftDraft — локальный черновик смены (offline-first).
 *
 * Хранит незагруженное с сервером состояние смены (DailyShift + метрики
 * по слонам) в localStorage под ключом `slonovet_shift_draft_<date>`.
 * Используется хуком useDailyShift для мгновенного восстановления
 * рабочего состояния после перезагрузки/потери сети, пока
 * shiftService.getShiftData не вернёт актуальные данные из Supabase.
 */

export interface ShiftDraft {
  date: string;
  shift: DailyShift;
  metrics: Record<string, ElephantDailyMetrics>;
  updated_at: string;
}

const draftKey = (date: string) => `slonovet_shift_draft_${date}`;

/** Сохранить черновик смены за указанную дату. */
export function saveShiftDraft(
  date: string,
  shift: DailyShift,
  metrics: Record<string, ElephantDailyMetrics>
): void {
  try {
    const draft: ShiftDraft = {
      date,
      shift,
      metrics,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(date), JSON.stringify(draft));
  } catch (e) {
    console.warn('Failed to persist shift draft:', e);
  }
}

/** Прочитать черновик смены за указанную дату (или null, если его нет). */
export function getShiftDraft(date: string): ShiftDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShiftDraft;
    if (!parsed || !parsed.shift || !parsed.metrics) return null;
    return parsed;
  } catch (e) {
    console.warn('Failed to read shift draft:', e);
    return null;
  }
}

/** Удалить черновик (например, после успешной сдачи смены). */
export function clearShiftDraft(date: string): void {
  try {
    localStorage.removeItem(draftKey(date));
  } catch {}
}
