
export interface SleepInterval {
  id: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface ShiftPhoto {
  id: string;
  timestamp: string;
  section: 'stool' | 'urine' | 'sleep' | 'general';
  storage_path?: string; // New field for Supabase storage path
  dataUrl?: string; // Kept for backward compatibility
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
  status: 'in_progress' | 'completed' | 'submitted' | 'handover_pending';
  hay_bales_distributed: number;
  hay_bags_distributed: number;
  reminders: string[];
  feed_notes: string;
  handover_notes: string;
  handover_to_keeper_id?: string | null;
  handover_complaints?: HandoverComplaint[];
  started_at?: string;
  ended_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Физиологические метрики слона за одну смену.
 * Хранится в таблице elephant_daily_metrics в Supabase.
 *
 * Учет сна ведется через sleep_minutes: number и sleep_intervals: SleepInterval[].
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

/** Типы грубых кормов на складе feed_inventory */
export type FeedInventoryType = 'hay_bales' | 'hay_rolls' | 'branches';

/** Запись остатков корма на складе */
export interface FeedInventoryItem {
  feed_type: FeedInventoryType;
  name: string;
  quantity_in_stock: number;
  unit: string;
  updated_at?: string;
}
