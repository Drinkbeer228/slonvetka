export interface MedicalActionDefinition {
  id: string;
  title: string;
  category: 'treatment' | 'inspection' | 'control' | 'procedures' | 'custom';
  icon?: string;
  defaultMedicine?: string;
  requiresMedicine: boolean;
  defaultSchedule: 'daily' | 'weekly' | 'as_needed';
  requiresPhoto: 'none' | 'after' | 'before_after' | 'optional';
  assessmentType: 'none' | 'normal_or_issue' | 'needs_cleaning' | 'result' | 'foot_status';
  availableFields: {
    eyeSide?: boolean;
    dosage?: boolean;
    frequency?: boolean;
    limb?: boolean;
    area?: boolean;
  };
}

export const MEDICAL_CATEGORIES = [
  { id: 'treatment', title: 'Лечение', icon: '💊' },
  { id: 'inspection', title: 'Осмотр', icon: '🩺' },
  { id: 'control', title: 'Контроль', icon: '📸' },
  { id: 'procedures', title: 'Процедуры', icon: '🧹' },
  { id: 'custom', title: 'Свободное назначение', icon: '✏️' },
];

export const MEDICAL_ACTIONS: MedicalActionDefinition[] = [
  // Лечение
  {
    id: 'eye_drops',
    title: 'Закапать глаза',
    category: 'treatment',
    requiresMedicine: true,
    defaultMedicine: 'Тобрекс',
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { eyeSide: true, dosage: true, frequency: true }
  },
  {
    id: 'wound_treatment',
    title: 'Обработать рану',
    category: 'treatment',
    requiresMedicine: true,
    defaultMedicine: 'Хлоргексидин',
    defaultSchedule: 'daily',
    requiresPhoto: 'before_after',
    assessmentType: 'normal_or_issue',
    availableFields: { area: true, dosage: true, frequency: true }
  },
  {
    id: 'topical_application',
    title: 'Нанести препарат',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { area: true, frequency: true }
  },
  {
    id: 'oral_medication',
    title: 'Дать препарат',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'none',
    assessmentType: 'none',
    availableFields: { dosage: true, frequency: true }
  },
  {
    id: 'injection',
    title: 'Инъекция',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'as_needed',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { area: true, dosage: true }
  },
  {
    id: 'ear_treatment',
    title: 'Обработать ухо',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { frequency: true }
  },
  {
    id: 'nasal_treatment',
    title: 'Обработать нос',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'none',
    assessmentType: 'normal_or_issue',
    availableFields: { frequency: true }
  },
  {
    id: 'oral_cavity_treatment',
    title: 'Обработать полость рта',
    category: 'treatment',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { frequency: true }
  },

  // Осмотр
  {
    id: 'eye_inspection',
    title: 'Осмотр глаз',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'optional',
    assessmentType: 'normal_or_issue',
    availableFields: { eyeSide: true }
  },
  {
    id: 'skin_inspection',
    title: 'Осмотр кожи',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'optional',
    assessmentType: 'normal_or_issue',
    availableFields: { area: true }
  },
  {
    id: 'foot_inspection',
    title: 'Осмотр стопы',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'optional',
    assessmentType: 'foot_status',
    availableFields: { limb: true }
  },
  {
    id: 'nail_inspection',
    title: 'Осмотр ногтей',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'optional',
    assessmentType: 'normal_or_issue',
    availableFields: { limb: true }
  },
  {
    id: 'dental_inspection',
    title: 'Осмотр зубов',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'none',
    assessmentType: 'normal_or_issue',
    availableFields: {}
  },
  {
    id: 'temporal_gland_inspection',
    title: 'Осмотр височной железы',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'optional',
    assessmentType: 'result',
    availableFields: {}
  },
  {
    id: 'general_assessment',
    title: 'Общая оценка состояния',
    category: 'inspection',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'none',
    assessmentType: 'normal_or_issue',
    availableFields: {}
  },

  // Контроль
  {
    id: 'eye_photo',
    title: 'Фото глаза',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { eyeSide: true }
  },
  {
    id: 'wound_photo',
    title: 'Фото раны',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'result',
    availableFields: { area: true }
  },
  {
    id: 'foot_photo',
    title: 'Фото стопы',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { limb: true }
  },
  {
    id: 'nail_photo',
    title: 'Фото ногтей',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { limb: true }
  },
  {
    id: 'sole_photo',
    title: 'Фото подошвы',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { limb: true }
  },
  {
    id: 'general_photo',
    title: 'Общее фото состояния',
    category: 'control',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: {}
  },

  // Процедуры
  {
    id: 'clean_foot',
    title: 'Очистить стопу',
    category: 'procedures',
    requiresMedicine: false,
    defaultSchedule: 'weekly',
    requiresPhoto: 'before_after',
    assessmentType: 'needs_cleaning',
    availableFields: { limb: true }
  },
  {
    id: 'treat_foot',
    title: 'Обработать стопу',
    category: 'procedures',
    requiresMedicine: true,
    defaultMedicine: 'АСД-3',
    defaultSchedule: 'weekly',
    requiresPhoto: 'before_after',
    assessmentType: 'foot_status',
    availableFields: { limb: true }
  },
  {
    id: 'treat_nails',
    title: 'Обработать ногти',
    category: 'procedures',
    requiresMedicine: true,
    defaultSchedule: 'weekly',
    requiresPhoto: 'after',
    assessmentType: 'normal_or_issue',
    availableFields: { limb: true }
  },
  {
    id: 'wash_area',
    title: 'Промыть участок',
    category: 'procedures',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { area: true }
  },
  {
    id: 'apply_agent',
    title: 'Нанести средство',
    category: 'procedures',
    requiresMedicine: true,
    defaultSchedule: 'daily',
    requiresPhoto: 'after',
    assessmentType: 'none',
    availableFields: { area: true }
  },

  // Свободное назначение
  {
    id: 'custom_assignment',
    title: 'Свободное назначение',
    category: 'custom',
    requiresMedicine: false,
    defaultSchedule: 'daily',
    requiresPhoto: 'optional',
    assessmentType: 'normal_or_issue',
    availableFields: {}
  }
];
