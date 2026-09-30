/**
 * Сменный чек-лист слонов
 * Разработан на основе регламентов ухода за слонами и адаптирован под ежедневные наблюдения кипера.
 * 9 разделов по приоритету клинического риска.
 */

export type ElephantAgeCategory = 'adult' | 'juvenile' | 'elderly';

export interface ElephantChecklistMeta {
  id: string;
  name: string;
  ageCategory: ElephantAgeCategory;
  categoryLabel: string;
  avatarEmoji: string;
  focus: string;
  typicalPoopIntervalHours: number; // Индивидуальная норма паузы между дефекациями
}

export const ELEPHANTS_CHECKLIST_CONFIG: Record<string, ElephantChecklistMeta> = {
  margo: {
    id: 'margo',
    name: 'Марго',
    ageCategory: 'adult',
    categoryLabel: 'Взрослая (матриарх)',
    avatarEmoji: '👑',
    focus: 'Контроль кондиции и массы',
    typicalPoopIntervalHours: 4.0,
  },
  audrey: {
    id: 'audrey',
    name: 'Одри',
    ageCategory: 'juvenile',
    categoryLabel: 'Подросток (рост)',
    avatarEmoji: '🌱',
    focus: 'Повышенное наблюдение и социализация',
    typicalPoopIntervalHours: 3.5,
  },
  pretty: {
    id: 'pretty',
    name: 'Прэтти',
    ageCategory: 'elderly',
    categoryLabel: 'Пожилая',
    avatarEmoji: '👵',
    focus: 'Ортопедия и височные железы',
    typicalPoopIntervalHours: 4.5,
  },
};

export type BlockStatus = 'completed' | 'in_progress' | 'empty';
export type HealthDot = 'green' | 'yellow' | 'red';

// ─── 1. 🚨 ПРИЗНАКИ, ТРЕБУЮЩИЕ ВНИМАНИЯ ВЕТВРАЧА ───
export interface UrgentSignsBlockData {
  // Ранние наблюдательные маркеры (требуют внимания)
  appetite_drop: boolean;      // Снижение аппетита
  drinking_drop: boolean;      // Снижение питья
  behavior_change: boolean;    // Изменение поведения / беспокойство
  fecal_change: boolean;       // Изменение характера стула
  lameness_pain: boolean;      // Хромота / скованность / боль
  sleep_change: boolean;       // Изменение сна

  // Критические признаки
  cyanosis: boolean;           // 🔴 Синюшность слизистой / языка
  facial_edema: boolean;       // 🔴 Отёк головы / морды / хобота
  severe_lethargy: boolean;    // 🔴 Выраженная вялость
  photo_url?: string;          // Фото подтверждение
}

// ─── 2. 💩 ДЕФЕКАЦИЯ ───
export type FecesConsistency = 'formed' | 'porridge' | 'liquid' | 'mucus' | 'blood';
export type FecesContent = 'undigested_grain' | 'whole_branches' | 'sand';

export interface DefecationBlockData {
  poop_count: number;          // 0-20
  consistency: FecesConsistency;
  contents: FecesContent[];
  last_poop_time?: string;     // HH:MM
}

// ─── 3. 💧 МОЧЕИСПУСКАНИЕ ───
export type UrineColor = 'clear' | 'light_yellow' | 'dark' | 'cloudy';
export type UrineFrequency = 'normal' | 'frequent_small' | 'rare';

export interface UrinationBlockData {
  urination_count: number;
  color: UrineColor;
  frequency: UrineFrequency;
  bladder_note?: string;
}

// ─── 4. 🦶 КОПЫТА И ПОХОДКА ───
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

// ─── 5. 🍽 КОРМЛЕНИЕ И ВОДА ───
export type FeedingSlotTime = '07:00' | '13:00' | '17:00' | '19:00';
export type AppetiteIssue = 'sluggish' | 'selective' | 'refused';
export type WaterIntakeStatus = 'normal' | 'reduced' | 'refused';
export type WaterBowlStatus = 'clean' | 'needs_cleaning';

export interface MealSlotStatus {
  served: boolean;             // Выдано
  finished: boolean;           // Съедено полностью
  reason?: AppetiteIssue;      // Причина, если не съедено
}

export interface FeedingWaterBlockData {
  slots: Record<FeedingSlotTime, MealSlotStatus>;
  water_bowl: WaterBowlStatus;       // Поилка чистая / требует мытья
  water_intake: WaterIntakeStatus;   // Наблюдение: норма / снижение / отказ
}

// ─── 6. 😴 СОН И ПОВЕДЕНИЕ ───
export interface SleepIntervalItem {
  id: string;
  start: string;               // HH:MM
  end: string;                 // HH:MM
  posture: 'side' | 'standing' | 'calf_on_mother';
}

export type BehaviorState = 'calm' | 'playful' | 'aggressive' | 'apathetic' | 'stereotypy';

export interface SleepBehaviorBlockData {
  intervals: SleepIntervalItem[];
  total_minutes: number;
  primary_posture: 'side' | 'standing' | 'calf_on_mother';
  behavior: BehaviorState;
}

// ─── 7. 🧴 УХОД ЗА ТЕЛОМ ───
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

// ─── 8. 📷 ФОТОФИКСАЦИЯ И ЗАМЕТКИ ───
export interface PhotoNotesBlockData {
  overall_photo_url?: string;  // Силуэт для оценки кондиции
  close_up_photos: string[];   // Рот, глаза, кожа, копыта крупно
  vet_notes: string;           // Наблюдения для ветврача
}

// ─── 9. 🐘 СОЦИАЛЬНАЯ ДИНАМИКА И ПОВЕДЕНИЕ В ГРУППЕ ───
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
  behavior_media_url?: string; // Видео/фото поведения
}

// ─── ПОЛНЫЙ СМЕННЫЙ ЧЕК-ЛИСТ СЛОНИХИ ───
export interface ElephantShiftChecklist {
  elephant_id: string;
  shift_date: string;
  shift_type: 'day' | 'night';
  urgent_signs: UrgentSignsBlockData;
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
    urgent_signs: {
      appetite_drop: false,
      drinking_drop: false,
      behavior_change: false,
      fecal_change: false,
      lameness_pain: false,
      sleep_change: false,
      cyanosis: false,
      facial_edema: false,
      severe_lethargy: false,
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
      water_bowl: 'clean',
      water_intake: 'normal',
    },
    sleep_behavior: {
      intervals: [],
      total_minutes: 240, // 4 часа по умолчанию
      primary_posture: 'side',
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

/**
 * Нормализует сменный чек-лист, восстанавливая все обязательные поля,
 * если объект был сохранён в старой структуре или повреждён в localStorage.
 */
export function normalizeChecklist(raw: any, elephantId: string, shiftDate: string): ElephantShiftChecklist {
  const initial = createInitialChecklist(elephantId, shiftDate || new Date().toISOString().split('T')[0]);
  if (!raw || typeof raw !== 'object') {
    return initial;
  }

  // Миграция старого блока eehv в urgent_signs
  const urgent_signs: UrgentSignsBlockData = {
    appetite_drop: Boolean(raw.urgent_signs?.appetite_drop),
    drinking_drop: Boolean(raw.urgent_signs?.drinking_drop),
    behavior_change: Boolean(raw.urgent_signs?.behavior_change),
    fecal_change: Boolean(raw.urgent_signs?.fecal_change),
    lameness_pain: Boolean(raw.urgent_signs?.lameness_pain),
    sleep_change: Boolean(raw.urgent_signs?.sleep_change),
    cyanosis: Boolean(raw.urgent_signs?.cyanosis || raw.eehv?.cyanosis),
    facial_edema: Boolean(raw.urgent_signs?.facial_edema || raw.eehv?.facial_edema),
    severe_lethargy: Boolean(raw.urgent_signs?.severe_lethargy || raw.eehv?.trunk_lethargy),
    photo_url: raw.urgent_signs?.photo_url || raw.eehv?.photo_url || undefined,
  };

  // Дефекация
  const defecation: DefecationBlockData = {
    poop_count: typeof raw.defecation?.poop_count === 'number' ? raw.defecation.poop_count : initial.defecation.poop_count,
    consistency: raw.defecation?.consistency || initial.defecation.consistency,
    contents: Array.isArray(raw.defecation?.contents) ? raw.defecation.contents : initial.defecation.contents,
    last_poop_time: raw.defecation?.last_poop_time || initial.defecation.last_poop_time,
  };

  // Мочеиспускание
  const urination: UrinationBlockData = {
    urination_count: typeof raw.urination?.urination_count === 'number' ? raw.urination.urination_count : initial.urination.urination_count,
    color: raw.urination?.color || initial.urination.color,
    frequency: raw.urination?.frequency || initial.urination.frequency,
    bladder_note: raw.urination?.bladder_note || initial.urination.bladder_note,
  };

  // Копыта и походка
  const feet_gait: FeetGaitBlockData = {
    front_right: raw.feet_gait?.front_right || initial.feet_gait.front_right,
    front_left: raw.feet_gait?.front_left || initial.feet_gait.front_left,
    rear_right: raw.feet_gait?.rear_right || initial.feet_gait.rear_right,
    rear_left: raw.feet_gait?.rear_left || initial.feet_gait.rear_left,
    gait: raw.feet_gait?.gait || initial.feet_gait.gait,
    top_photo_url: raw.feet_gait?.top_photo_url || initial.feet_gait.top_photo_url,
    sole_photo_url: raw.feet_gait?.sole_photo_url || initial.feet_gait.sole_photo_url,
  };

  // Кормление и вода
  const rawSlots = raw.feeding_water?.slots || {};
  const feeding_water: FeedingWaterBlockData = {
    slots: {
      '07:00': { ...initial.feeding_water.slots['07:00'], ...(rawSlots['07:00'] || {}) },
      '13:00': { ...initial.feeding_water.slots['13:00'], ...(rawSlots['13:00'] || {}) },
      '17:00': { ...initial.feeding_water.slots['17:00'], ...(rawSlots['17:00'] || {}) },
      '19:00': { ...initial.feeding_water.slots['19:00'], ...(rawSlots['19:00'] || {}) },
    },
    water_bowl: raw.feeding_water?.water_bowl || (raw.feeding_water?.water_clean_fresh === false ? 'needs_cleaning' : 'clean'),
    water_intake: raw.feeding_water?.water_intake || (raw.feeding_water?.water_refusal ? 'refused' : 'normal'),
  };

  // Сон и поведение
  const sleep_behavior: SleepBehaviorBlockData = {
    intervals: Array.isArray(raw.sleep_behavior?.intervals) ? raw.sleep_behavior.intervals : initial.sleep_behavior.intervals,
    total_minutes: typeof raw.sleep_behavior?.total_minutes === 'number' ? raw.sleep_behavior.total_minutes : initial.sleep_behavior.total_minutes,
    primary_posture: raw.sleep_behavior?.primary_posture || (raw.sleep_behavior?.posture === 'standing' ? 'standing' : 'side'),
    behavior: raw.sleep_behavior?.behavior || initial.sleep_behavior.behavior,
  };

  // Уход за телом
  const body_care: BodyCareBlockData = {
    washing: raw.body_care?.washing || initial.body_care.washing,
    skin: raw.body_care?.skin || initial.body_care.skin,
    temporal_gland_score: typeof raw.body_care?.temporal_gland_score === 'number' ? raw.body_care.temporal_gland_score : 0,
    temporal_gland_washed: Boolean(raw.body_care?.temporal_gland_washed),
    temporal_gland_ointment: Boolean(raw.body_care?.temporal_gland_ointment),
    dust_bath: Boolean(raw.body_care?.dust_bath),
    eyes: raw.body_care?.eyes || initial.body_care.eyes,
    trunk: raw.body_care?.trunk || initial.body_care.trunk,
  };

  // Фото и заметки
  const photo_notes: PhotoNotesBlockData = {
    overall_photo_url: raw.photo_notes?.overall_photo_url || initial.photo_notes.overall_photo_url,
    close_up_photos: Array.isArray(raw.photo_notes?.close_up_photos) ? raw.photo_notes.close_up_photos : initial.photo_notes.close_up_photos,
    vet_notes: typeof raw.photo_notes?.vet_notes === 'string' ? raw.photo_notes.vet_notes : initial.photo_notes.vet_notes,
  };

  // Социальная динамика
  const rawContacts = raw.social_dynamics?.contacts || {};
  const social_dynamics: SocialDynamicsBlockData = {
    contacts: {
      margo_audrey: { ...initial.social_dynamics.contacts.margo_audrey, ...(rawContacts.margo_audrey || {}) },
      margo_pretty: { ...initial.social_dynamics.contacts.margo_pretty, ...(rawContacts.margo_pretty || {}) },
      audrey_pretty: { ...initial.social_dynamics.contacts.audrey_pretty, ...(rawContacts.audrey_pretty || {}) },
    },
    conflicts: Array.isArray(raw.social_dynamics?.conflicts) ? raw.social_dynamics.conflicts : initial.social_dynamics.conflicts,
    initiator_id: raw.social_dynamics?.initiator_id,
    victim_id: raw.social_dynamics?.victim_id,
    stereotypy_observed: Boolean(raw.social_dynamics?.stereotypy_observed),
    stereotypy_types: Array.isArray(raw.social_dynamics?.stereotypy_types) ? raw.social_dynamics.stereotypy_types : initial.social_dynamics.stereotypy_types,
    stereotypy_duration: raw.social_dynamics?.stereotypy_duration || initial.social_dynamics.stereotypy_duration,
    vocalizations: Array.isArray(raw.social_dynamics?.vocalizations) ? raw.social_dynamics.vocalizations : initial.social_dynamics.vocalizations,
    behavior_media_url: raw.social_dynamics?.behavior_media_url,
  };

  return {
    elephant_id: elephantId,
    shift_date: shiftDate || initial.shift_date,
    shift_type: raw.shift_type || initial.shift_type,
    urgent_signs,
    defecation,
    urination,
    feet_gait,
    feeding_water,
    sleep_behavior,
    body_care,
    photo_notes,
    social_dynamics,
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}
