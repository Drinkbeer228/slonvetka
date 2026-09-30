import {
  ElephantShiftChecklist,
  HealthDot,
  EEHVBlockData,
  DefecationBlockData,
  UrinationBlockData,
  FeetGaitBlockData,
  FeedingWaterBlockData,
  SleepBehaviorBlockData,
  BodyCareBlockData,
  PhotoNotesBlockData,
  SocialDynamicsBlockData,
} from '../types/conservation';

export interface ChecklistEvaluationResult {
  dot: HealthDot;
  dotColorClass: string;
  dotBgClass: string;
  dotBorderClass: string;
  statusLabel: string;
  completedBlocksCount: number;
  totalBlocks: 9;
  isReadyToSubmit: boolean; // >= 7 blocks
  criticalReasons: string[];
  warningReasons: string[];
  blockSummaries: Record<number, { title: string; summary: string; dot: HealthDot; isFilled: boolean }>;
}

export function evaluateChecklist(checklist: ElephantShiftChecklist): ChecklistEvaluationResult {
  const criticalReasons: string[] = [];
  const warningReasons: string[] = [];
  const summaries: Record<number, { title: string; summary: string; dot: HealthDot; isFilled: boolean }> = {};

  // ─── 1. EEHV ───
  let eehvDot: HealthDot = 'green';
  let eehvFilled = true;
  if (checklist.eehv.cyanosis || checklist.eehv.facial_edema || checklist.eehv.trunk_lethargy) {
    eehvDot = 'red';
    criticalReasons.push('🚨 EEHV-тревога (синюшность / отёк / вялость)');
  }
  summaries[1] = {
    title: '1. 🚨 Красные флаги (EEHV-протокол)',
    summary: eehvDot === 'red' ? '🔴 КЛИНИЧЕСКИЙ АЛЕРТ' : '🟢 Слизистая розовая, норма',
    dot: eehvDot,
    isFilled: eehvFilled,
  };

  // ─── 2. ДЕФЕКАЦИЯ ───
  let defDot: HealthDot = 'green';
  const defFilled = checklist.defecation.poop_count > 0 || checklist.defecation.consistency !== 'formed';
  if (checklist.defecation.consistency === 'blood') {
    defDot = 'red';
    criticalReasons.push('🔴 Кровь в каловых массах');
  } else if (checklist.defecation.consistency === 'liquid' || checklist.defecation.consistency === 'mucus') {
    defDot = 'yellow';
    warningReasons.push(`Жидкий стул / слизь (${checklist.defecation.poop_count} куч)`);
  } else if (checklist.defecation.consistency === 'porridge' || checklist.defecation.contents.includes('sand')) {
    defDot = 'yellow';
    warningReasons.push('Кашицеобразный стул или песок');
  }
  const consistencyLabels = {
    formed: 'Сформирован',
    porridge: 'Кашица',
    liquid: 'Жидкий',
    mucus: 'Слизь',
    blood: 'Кровь!',
  };
  summaries[2] = {
    title: '2. 💩 Дефекация',
    summary: `${checklist.defecation.poop_count} раз • ${consistencyLabels[checklist.defecation.consistency]}`,
    dot: defDot,
    isFilled: defFilled,
  };

  // ─── 3. МОЧЕИСПУСКАНИЕ ───
  let urinDot: HealthDot = 'green';
  const urinFilled = checklist.urination.urination_count > 0 || checklist.urination.color !== 'clear';
  if (checklist.urination.color === 'dark' || checklist.urination.color === 'cloudy') {
    urinDot = 'yellow';
    warningReasons.push(`Тёмная/мутная моча (${checklist.urination.urination_count} раз)`);
  }
  if (checklist.urination.frequency === 'frequent_small' || checklist.urination.frequency === 'rare') {
    urinDot = 'yellow';
    warningReasons.push('Аномальная частота мочеиспускания (риск цистита)');
  }
  const colorLabels = {
    clear: 'Прозрачная',
    light_yellow: 'Светло-жёлтая',
    dark: 'Тёмная',
    cloudy: 'Мутная',
  };
  summaries[3] = {
    title: '3. 💧 Мочеиспускание',
    summary: `${checklist.urination.urination_count} раз • ${colorLabels[checklist.urination.color]}`,
    dot: urinDot,
    isFilled: urinFilled,
  };

  // ─── 4. КОПЫТА И ПОХОДКА ───
  let feetDot: HealthDot = 'green';
  const feetFilled = Boolean(checklist.feet_gait.top_photo_url || checklist.feet_gait.sole_photo_url || checklist.feet_gait.gait !== 'confident');
  const limbs = [
    checklist.feet_gait.front_right,
    checklist.feet_gait.front_left,
    checklist.feet_gait.rear_right,
    checklist.feet_gait.rear_left,
  ];
  const hasLameness = limbs.includes('lameness') || checklist.feet_gait.gait === 'favors_leg';
  const hasCrack = limbs.some(l => l === 'crack' || l === 'delamination' || l === 'hot_coronet') || checklist.feet_gait.gait === 'cautious';

  if (hasLameness) {
    feetDot = 'red';
    criticalReasons.push('🔴 Выраженная хромота / бережёт ногу');
  } else if (hasCrack) {
    feetDot = 'yellow';
    warningReasons.push('Трещина/расслоение копыта или осторожная походка');
  }
  const okLimbsCount = limbs.filter(l => l === 'ok').length;
  summaries[4] = {
    title: '4. 🦶 Копыта и походка',
    summary: `${okLimbsCount}/4 норма • ${checklist.feet_gait.gait === 'confident' ? 'Уверенная' : checklist.feet_gait.gait === 'cautious' ? 'Осторожная' : 'Бережёт ногу'}`,
    dot: feetDot,
    isFilled: feetFilled,
  };

  // ─── 5. КОРМЛЕНИЕ И ВОДА ───
  let feedDot: HealthDot = 'green';
  const slotEntries = Object.values(checklist.feeding_water.slots);
  const servedCount = slotEntries.filter(s => s.served).length;
  const feedFilled = servedCount > 0 || !checklist.feeding_water.water_clean_fresh;

  const hasFoodRefusal = slotEntries.some(s => s.reason === 'refused');
  const hasSluggish = slotEntries.some(s => s.reason === 'sluggish' || s.reason === 'selective');

  if (checklist.feeding_water.water_refusal || hasFoodRefusal) {
    feedDot = 'red';
    criticalReasons.push('🔴 Отказ от воды или корма');
  } else if (hasSluggish || !checklist.feeding_water.water_clean_fresh) {
    feedDot = 'yellow';
    warningReasons.push('Вялый аппетит слонихи или грязная поилка');
  }
  summaries[5] = {
    title: '5. 🍽 Кормление и вода',
    summary: `${servedCount}/4 выдано • Вода: ${checklist.feeding_water.water_clean_fresh ? 'Свежая ✓' : 'Требует мойки'}`,
    dot: feedDot,
    isFilled: feedFilled,
  };

  // ─── 6. СОН И ПОВЕДЕНИЕ ───
  let sleepDot: HealthDot = 'green';
  const sleepFilled = true;
  if (checklist.sleep_behavior.duration === 'did_not_sleep') {
    sleepDot = 'red';
    criticalReasons.push('🔴 Слониха не ложилась спать за смену');
  } else if (checklist.sleep_behavior.duration === '1-2h' || checklist.sleep_behavior.duration === '>6h') {
    sleepDot = 'yellow';
    warningReasons.push(`Нестандартный сон: ${checklist.sleep_behavior.duration}`);
  }
  if (checklist.sleep_behavior.behavior === 'apathetic') {
    sleepDot = 'red';
    criticalReasons.push('🔴 Апатичное угнетённое состояние');
  } else if (checklist.sleep_behavior.behavior === 'aggressive' || checklist.sleep_behavior.behavior === 'stereotypy') {
    sleepDot = 'yellow';
    warningReasons.push(`Поведение: ${checklist.sleep_behavior.behavior === 'stereotypy' ? 'Стереотипия' : 'Агрессивное'}`);
  }
  summaries[6] = {
    title: '6. 😴 Сон и поведение',
    summary: `Сон: ${checklist.sleep_behavior.duration} • Поведение: ${checklist.sleep_behavior.behavior}`,
    dot: sleepDot,
    isFilled: sleepFilled,
  };

  // ─── 7. УХОД ЗА ТЕЛОМ ───
  let bodyDot: HealthDot = 'green';
  const bodyFilled = checklist.body_care.washing !== 'none' || checklist.body_care.dust_bath;
  if (checklist.body_care.temporal_gland_score >= 3) {
    bodyDot = 'red';
    criticalReasons.push(`🔴 Височные железы TGS ${checklist.body_care.temporal_gland_score}/4 (воспаление)`);
  } else if (checklist.body_care.temporal_gland_score >= 1) {
    bodyDot = 'yellow';
    warningReasons.push(`Височные железы TGS ${checklist.body_care.temporal_gland_score}/4`);
  }
  if (checklist.body_care.skin !== 'normal' || checklist.body_care.eyes !== 'clear' || checklist.body_care.trunk !== 'normal_tone') {
    bodyDot = 'yellow';
    warningReasons.push('Аномалия кожи, глаз или тонуса хобота');
  }
  summaries[7] = {
    title: '7. 🧴 Уход за телом',
    summary: `Мойка: ${checklist.body_care.washing === 'full_brush' ? 'Щётка' : checklist.body_care.washing === 'rinsed' ? 'Ополоснута' : 'Не мыта'} • Кожа: ${checklist.body_care.skin}`,
    dot: bodyDot,
    isFilled: bodyFilled,
  };

  // ─── 8. ФОТОФИКСАЦИЯ И ЗАМЕТКИ ───
  let photoDot: HealthDot = 'green';
  const photoFilled = Boolean(checklist.photo_notes.overall_photo_url || checklist.photo_notes.vet_notes.trim().length > 0);
  summaries[8] = {
    title: '8. 📷 Фотофиксация и заметки',
    summary: checklist.photo_notes.overall_photo_url ? 'Общий силуэт снят ✓' : 'Фото кондиции не загружено',
    dot: photoDot,
    isFilled: photoFilled,
  };

  // ─── 9. СОЦИАЛЬНАЯ ДИНАМИКА ───
  let socialDot: HealthDot = 'green';
  const hasAggressiveContact = Object.values(checklist.social_dynamics.contacts).some(c => c.active && c.type === 'aggressive');
  const hasVocalAlert = checklist.social_dynamics.vocalizations.includes('squeak') || checklist.social_dynamics.vocalizations.includes('roar');
  const stereotypyDuration = checklist.social_dynamics.stereotypy_duration;

  if (checklist.social_dynamics.stereotypy_observed && stereotypyDuration === '>30min') {
    socialDot = 'red';
    criticalReasons.push('🔴 Стереотипия >30 минут (тяжёлый стресс)');
  } else if (hasAggressiveContact) {
    socialDot = 'yellow';
    warningReasons.push('Агрессивный контакт между слонихами');
  } else if (checklist.social_dynamics.stereotypy_observed && stereotypyDuration === '>15min') {
    socialDot = 'yellow';
    warningReasons.push('Стереотипия >15 минут');
  } else if (hasVocalAlert) {
    socialDot = 'yellow';
    warningReasons.push('Визг/рёв в группе (маркер боли или стресса)');
  }

  const socialFilled = Object.values(checklist.social_dynamics.contacts).some(c => c.active) || checklist.social_dynamics.stereotypy_observed;
  summaries[9] = {
    title: '9. 🐘 Социальная динамика',
    summary: socialDot === 'red' ? '🔴 СТРЕСС/АГРЕССИЯ' : socialDot === 'yellow' ? '⚠️ Зафиксирован конфликт' : '🟢 Стабильная группа',
    dot: socialDot,
    isFilled: socialFilled,
  };

  // Calculate overall Dot
  let overallDot: HealthDot = 'green';
  if (criticalReasons.length > 0) {
    overallDot = 'red';
  } else if (warningReasons.length > 0) {
    overallDot = 'yellow';
  }

  const completedBlocksCount = Object.values(summaries).filter(s => s.isFilled).length;

  return {
    dot: overallDot,
    dotColorClass: overallDot === 'red' ? 'bg-rose-500' : overallDot === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400',
    dotBgClass: overallDot === 'red' ? 'bg-rose-500/20' : overallDot === 'yellow' ? 'bg-amber-500/20' : 'bg-emerald-500/20',
    dotBorderClass: overallDot === 'red' ? 'border-rose-500/50' : overallDot === 'yellow' ? 'border-amber-500/50' : 'border-emerald-500/40',
    statusLabel: overallDot === 'red' ? 'Критично 🔴' : overallDot === 'yellow' ? 'Аномалия 🟡' : 'Норма 🟢',
    completedBlocksCount,
    totalBlocks: 9,
    isReadyToSubmit: completedBlocksCount >= 7,
    criticalReasons,
    warningReasons,
    blockSummaries: summaries,
  };
}
