
export interface SleepInterval {
  id: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface ShiftPhoto {
  id: string;
  timestamp: string;
  section: 'stool' | 'urine' | 'sleep' | 'general';
  dataUrl: string;
}

export interface HandoverComplaint {
  id: string;
  author_name: string;
  tags: string[];
  comment: string;
  photo_url?: string;
  created_at: string;
}

export interface DailyShift {
  id: string;
  date: string; // YYYY-MM-DD
  duty_keeper_id: string | null;
  status: 'in_progress' | 'completed' | 'submitted';
  hay_bales_distributed: number;
  hay_bags_distributed: number;
  reminders: string[];
  feed_notes: string;
  handover_notes: string;
  handover_complaints?: HandoverComplaint[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Физиологические метрики слона за одну смену.
 * Хранится в таблице elephant_daily_metrics в Supabase.
 *
 * ВАЖНО: поле behavior_score — устаревшее (legacy), НЕ использовать для сна.
 * Для сна использовать sleep_minutes + sleep_intervals.
 */
export interface ElephantDailyMetrics {
  id?: string;
  shift_id: string;
  elephant_id: string;
  /** Количество дефекаций (>= 0) */
  poop_count: number;
  /** Характер стула (массив тегов) */
  feces_traits: string[];
  /** Количество мочеиспусканий (>= 0) */
  urination_count: number;
  /** Характеристики мочи (массив тегов) */
  urination_traits: string[];
  /** Поведенческое состояние (строка-идентификатор из ELEPHANT_MOODS) */
  behavior?: string;
  /**
   * @deprecated Устаревшее поле — было использовано для хранения sleep_minutes.
   * Оставлено для обратной совместимости при чтении старых данных.
   * При записи использовать sleep_minutes.
   */
  behavior_score?: number;
  /** Общее время сна в минутах (0..720 = 0..12ч) */
  sleep_minutes?: number;
  /** Детализированные интервалы укладок */
  sleep_intervals?: SleepInterval[];
  /** Текстовые заметки по слону */
  notes?: string;
  /** Фотографии за смену (хранятся как base64 dataUrl) */
  photos?: ShiftPhoto[];
}

/** Валидирует счётчик физиологии (не отрицательный, не аномально большой) */
export function clampCount(value: number, max = 50): number {
  return Math.max(0, Math.min(Math.round(value), max));
}

/** Валидирует sleep_minutes (0..720 минут = 12ч) */
export function clampSleepMinutes(value: number): number {
  return Math.max(0, Math.min(Math.round(value), 720));
}
