/**
 * Китайский стандарт ухода за слонами (Xishuangbanna & Chengdu Reserves)
 * 9 блоков опроса сменного чек-листа кипера + социальная динамика.
 */

export type ElephantAgeCategory = 'adult' | 'juvenile' | 'elderly';

export interface ElephantChecklistMeta {
  id: string;
  name: string;
  ageCategory: ElephantAgeCategory;
  categoryLabel: string;
  avatarEmoji: string;
  focus: string;
}

export const ELEPHANTS_CHECKLIST_CONFIG: Record<string, ElephantChecklistMeta> = {
  margo: {
    id: 'margo',
    name: 'Марго',
    ageCategory: 'adult',
    categoryLabel: 'Взрослая (матриарх)',
    avatarEmoji: '👑',
    focus: 'Контроль кондиции и массы',
  },
  audrey: {
    id: 'audrey',
    name: 'Одри',
    ageCategory: 'juvenile',
    categoryLabel: 'Подросток (рост)',
    avatarEmoji: '🌱',
    focus: 'EEHV-контроль и социализация',
  },
  pretty: {
    id: 'pretty',
    name: 'Прэтти',
    ageCategory: 'elderly',
    categoryLabel: 'Пожилая',
    avatarEmoji: '👵',
    focus: 'Ортопедия и височные железы',
  },
};

export type BlockStatus = 'completed' | 'in_progress' | 'empty';
export type HealthDot = 'green' | 'yellow' | 'red';

// ─── 1. КРАСНЫЕ ФЛАГИ (EEHV-ПРОТОКОЛ) ───
export interface EEHVBlockData {
  mucosa_pink: boolean;        // Норма
  cyanosis: boolean;           // 🔴 Синюшность
  facial_edema: boolean;       // 🔴 Отёк морды / хобота
  trunk_lethargy: boolean;     // 🔴 Вялость / петля
  photo_url?: string;          // Обязательное фото при алерте
}

// ─── 2. ДЕФЕКАЦИЯ ───
export type FecesConsistency = 'formed' | 'porridge' | 'liquid' | 'mucus' | 'blood';
export type FecesContent = 'undigested_grain' | 'whole_branches' | 'sand';

export interface DefecationBlockData {
  poop_count: number;          // 0-20
  consistency: FecesConsistency;
  contents: FecesContent[];
  last_poop_time?: string;     // HH:MM
}

// ─── 3. МОЧЕИСПУСКАНИЕ ───
export type UrineColor = 'clear' | 'light_yellow' | 'dark' | 'cloudy';
export type UrineFrequency = 'normal' | 'frequent_small' | 'rare';

export interface UrinationBlockData {
  urination_count: number;
  color: UrineColor;
  frequency: UrineFrequency;
  bladder_note?: string;
}

// ─── 4. КОПЫТА И ПОХОДКА ───
export type LimbStatus = 'ok' | 'crack' | 'delamination' | 'hot_coronet' | 'lameness';
export type GaitAssessment = 'confident' | 'cautious' | 'favors_leg';

export interface FeetGaitBlockData {
  front_right: LimbStatus;
  front_left: LimbStatus;
  rear_right: LimbStatus;
  rear_left: LimbStatus;
  gait: GaitAssessment;
  top_photo_url?: string;      // Фото копыт сверху
  sole_photo_url?: string;     // Фото копыт снизу (подошва)
}

// ─── 5. КОРМЛЕНИЕ И ВОДА ───
export type FeedingSlotTime = '07:00' | '13:00' | '17:00' | '19:00';
export type AppetiteIssue = 'sluggish' | 'selective' | 'refused';

export interface MealSlotStatus {
  served: boolean;             // Выдано
  finished: boolean;           // Съедено полностью
  reason?: AppetiteIssue;      // Причина, если не съедено
}

export interface FeedingWaterBlockData {
  slots: Record<FeedingSlotTime, MealSlotStatus>;
  water_clean_fresh: boolean;  // Поилка чистая, вода свежая
  water_refusal: boolean;      // Отказ от воды (100-200л)
}

// ─── 6. СОН И ПОВЕДЕНИЕ ───
export type SleepDuration = 'did_not_sleep' | '1-2h' | '3-5h' | '>6h';
export type SleepPosture = 'side' | 'standing' | 'calf_on_mother';
export type BehaviorState = 'calm' | 'playful' | 'aggressive' | 'apathetic' | 'stereotypy';

export interface SleepBehaviorBlockData {
  duration: SleepDuration;
  posture: SleepPosture;
  behavior: BehaviorState;
}

// ─── 7. УХОД ЗА ТЕЛОМ ───
export type WashingType = 'none' | 'rinsed' | 'full_brush';
export type SkinCondition = 'normal' | 'dry' | 'cracks' | 'parasites';
export type EyeObservation = 'clear' | 'tearing' | 'squint';
export type TrunkTone = 'normal_tone' | 'passive' | 'dry_tip';

export interface BodyCareBlockData {
  washing: WashingType;
  skin: SkinCondition;
  temporal_gland_score: number; // 0-4 (для Прэтти)
  temporal_gland_washed?: boolean;
  temporal_gland_ointment?: boolean;
  dust_bath: boolean;
  eyes: EyeObservation;
  trunk: TrunkTone;
}

// ─── 8. ФОТОФИКСАЦИЯ И ЗАМЕТКИ ───
export interface PhotoNotesBlockData {
  overall_photo_url?: string;  // Обязательное фото (силуэт)
  close_up_photos: string[];   // Рот, глаза, кожа, копыта крупно
  vet_notes: string;           // Заметки для ветврача
}

// ─── 9. СОЦИАЛЬНАЯ ДИНАМИКА И ПОВЕДЕНИЕ В ГРУППЕ ───
export type SocialPair = 'margo_audrey' | 'margo_pretty' | 'audrey_pretty';
export type SocialContactType = 'peaceful' | 'play' | 'dominant' | 'aggressive';
export type HierarchyConflict = 'food_conflict' | 'spot_conflict' | 'water_push' | 'isolation';
export type StereotypyType = 'swaying' | 'head_bobbing' | 'licking' | 'trunk_wall_strike';
export type StereotypyDuration = '<5min' | '5-15min' | '>15min' | '>30min';
export type VocalizationType = 'rumble' | 'trumpet' | 'squeak' | 'roar';

export interface SocialDynamicsBlockData {
  contacts: Record<SocialPair, {
    active: boolean;
    type: SocialContactType;
  }>;
  conflicts: HierarchyConflict[];
  initiator_id?: string;
  victim_id?: string;
  stereotypy_observed: boolean;
  stereotypy_types: StereotypyType[];
  stereotypy_duration: StereotypyDuration;
  vocalizations: VocalizationType[];
  behavior_media_url?: string; // Видео/фото поведения 10-30 сек
}

// ─── ПОЛНЫЙ СМЕННЫЙ ЧЕК-ЛИСТ СЛОНИХИ ───
export interface ElephantShiftChecklist {
  elephant_id: string;
  shift_date: string;
  shift_type: 'day' | 'night';
  eehv: EEHVBlockData;
  defecation: DefecationBlockData;
  urination: UrinationBlockData;
  feet_gait: FeetGaitBlockData;
  feeding_water: FeedingWaterBlockData;
  sleep_behavior: SleepBehaviorBlockData;
  body_care: BodyCareBlockData;
  photo_notes: PhotoNotesBlockData;
  social_dynamics: SocialDynamicsBlockData;
  updated_at: string;
}

export function createInitialChecklist(elephantId: string, shiftDate: string): ElephantShiftChecklist {
  return {
    elephant_id: elephantId,
    shift_date: shiftDate,
    shift_type: 'day',
    eehv: {
      mucosa_pink: true,
      cyanosis: false,
      facial_edema: false,
      trunk_lethargy: false,
    },
    defecation: {
      poop_count: 0,
      consistency: 'formed',
      contents: [],
    },
    urination: {
      urination_count: 0,
      color: 'clear',
      frequency: 'normal',
    },
    feet_gait: {
      front_right: 'ok',
      front_left: 'ok',
      rear_right: 'ok',
      rear_left: 'ok',
      gait: 'confident',
    },
    feeding_water: {
      slots: {
        '07:00': { served: false, finished: false },
        '13:00': { served: false, finished: false },
        '17:00': { served: false, finished: false },
        '19:00': { served: false, finished: false },
      },
      water_clean_fresh: true,
      water_refusal: false,
    },
    sleep_behavior: {
      duration: '3-5h',
      posture: 'side',
      behavior: 'calm',
    },
    body_care: {
      washing: 'none',
      skin: 'normal',
      temporal_gland_score: 0,
      dust_bath: false,
      eyes: 'clear',
      trunk: 'normal_tone',
    },
    photo_notes: {
      close_up_photos: [],
      vet_notes: '',
    },
    social_dynamics: {
      contacts: {
        margo_audrey: { active: false, type: 'peaceful' },
        margo_pretty: { active: false, type: 'peaceful' },
        audrey_pretty: { active: false, type: 'peaceful' },
      },
      conflicts: [],
      stereotypy_observed: false,
      stereotypy_types: [],
      stereotypy_duration: '<5min',
      vocalizations: ['rumble'],
    },
    updated_at: new Date().toISOString(),
  };
}
