
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
  /** Тонус хобота */
  trunk_tone?: string | null;
  /** Дыхание */
  breathing_observation?: string | null;
  /** Состояние кончика хобота */
  trunk_tip_condition?: string | null;
  /** Носовые выделения */
  nasal_discharge?: string | null;
  /** Пылевая/грязевая ванна */
  dust_bathing?: boolean;
  /** Работа ушами */
  ear_flapping?: string | null;
  /** Состояние височных желез */
  temporal_glands?: string | null;
  /** Наблюдения по глазам */
  eye_observations?: string[];
  /** Поедаемость */
  feed_consumption?: string | null;
  /** Выборочное поедание */
  selective_eating?: string;
  /** Подозрение на инородку */
  foreign_object_suspected?: boolean;
  /** Примечание по инородке */
  foreign_object_note?: string;
  /** Оценка походки */
  gait_assessment?: string | null;
  /** Какая нога бережется */
  favored_leg?: string | null;
  /** Теплота копытного башмака/венчика */
  hoof_warmth?: string | null;
  /** Реакция в манеже / на репетиции */
  arena_reaction?: string | null;
}

export function createDefaultElephantMetrics(shiftId: string, elephantId: string): ElephantDailyMetrics {
  return {
    shift_id: shiftId,
    elephant_id: elephantId,
    poop_count: 0,
    feces_traits: ['Сформирован (норма)'],
    urination_count: 0,
    urination_traits: ['Прозрачная (норма)'],
    behavior: 'Спокойная / В норме',
    sleep_minutes: 0,
    sleep_intervals: [],
    notes: '',
    photos: [],
    trunk_tone: null,
    breathing_observation: null,
    trunk_tip_condition: null,
    nasal_discharge: null,
    dust_bathing: false,
    ear_flapping: null,
    temporal_glands: null,
    eye_observations: [],
    feed_consumption: null,
    selective_eating: '',
    foreign_object_suspected: false,
    foreign_object_note: '',
    gait_assessment: null,
    favored_leg: null,
    hoof_warmth: null,
    arena_reaction: null,
  };
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
