import {
  ElephantShiftChecklist,
  HealthDot,
  ELEPHANTS_CHECKLIST_CONFIG,
  normalizeChecklist,
} from '../types/conservation';

export interface ChecklistEvaluationResult {
  dot: HealthDot;
  dotColorClass: string;
  dotBgClass: string;
  dotBorderClass: string;
  statusLabel: string;
  completedBlocksCount: number;
  totalBlocks: 9;
  criticalBlocksCompleted: boolean;
  isReadyToSubmit: boolean; // >= 7 blocks AND all 4 critical blocks completed
  missingCriticalBlocks: string[];
  criticalReasons: string[];
  warningReasons: string[];
  blockSummaries: Record<number, { title: string; summary: string; dot: HealthDot; isFilled: boolean; isCritical: boolean }>;
  poopTimeNotice?: string;
  totalSleepFormatted: string;
}

export function evaluateChecklist(rawChecklist: ElephantShiftChecklist): ChecklistEvaluationResult {
  const elephantId = rawChecklist?.elephant_id || 'margo';
  const shiftDate = rawChecklist?.shift_date || new Date().toISOString().split('T')[0];
  const checklist = normalizeChecklist(rawChecklist, elephantId, shiftDate);
  const meta = ELEPHANTS_CHECKLIST_CONFIG[checklist.elephant_id] || ELEPHANTS_CHECKLIST_CONFIG.margo;
  const criticalReasons: string[] = [];
  const warningReasons: string[] = [];
  const summaries: Record<number, { title: string; summary: string; dot: HealthDot; isFilled: boolean; isCritical: boolean }> = {};

  // ─── 1. 🚨 СРОЧНЫЕ ПРИЗНАКИ ВЕТВРАЧУ (КРИТИЧЕСКИЙ БЛОК) ───
  let urgentDot: HealthDot = 'green';
  const u = checklist.urgent_signs;
  const hasCriticalUrgent = Boolean(u?.cyanosis || u?.facial_edema || u?.severe_lethargy);
  const hasAttentionUrgent = Boolean(
    u?.appetite_drop ||
    u?.drinking_drop ||
    u?.behavior_change ||
    u?.fecal_change ||
    u?.lameness_pain ||
    u?.sleep_change
  );

  if (hasCriticalUrgent) {
    urgentDot = 'red';
    criticalReasons.push('🚨 Критический симптом (цианоз / отёк / выраженная вялость)');
  } else if (hasAttentionUrgent) {
    urgentDot = 'yellow';
    warningReasons.push('⚠️ Требует внимания ветврача (ранние маркеры отклонения)');
  }

  const urgentFilled = true; // Заполняется с начала смены
  summaries[1] = {
    title: '1. 🚨 Срочные признаки ветврачу',
    summary: urgentDot === 'red' ? '🔴 КРИТИЧНО — СООБЩИТЬ ВРАЧУ' : urgentDot === 'yellow' ? '⚠️ Требует внимания' : '🟢 Отклонений не зафиксировано',
    dot: urgentDot,
    isFilled: urgentFilled,
    isCritical: true,
  };

  // ─── 2. 💩 ДЕФЕКАЦИЯ (КРИТИЧЕСКИЙ БЛОК) ───
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

  // Расчёт времени от последней дефекации (индивидуализированный контекст)
  let poopTimeNotice: string | undefined;
  if (checklist.defecation.last_poop_time) {
    const [h, m] = checklist.defecation.last_poop_time.split(':').map(Number);
    const now = new Date();
    const lastDate = new Date();
    lastDate.setHours(h, m, 0, 0);

    let diffMs = now.getTime() - lastDate.getTime();
    if (diffMs < 0) diffMs += 24 * 3600 * 1000;
    const diffHours = diffMs / (1000 * 60 * 60);

    const elapsedHours = Math.floor(diffHours);
    const elapsedMinutes = Math.floor((diffHours - elapsedHours) * 60);

    if (diffHours > meta.typicalPoopIntervalHours) {
      poopTimeNotice = `⚠️ Прошло ${elapsedHours}ч ${elapsedMinutes}м (дольше обычного для ${meta.name}). Проверь состояние и внеси наблюдение.`;
      if (defDot === 'green') defDot = 'yellow';
    } else {
      poopTimeNotice = `Последний акт: ${checklist.defecation.last_poop_time} (прошло ${elapsedHours}ч ${elapsedMinutes}м, в пределах нормы)`;
    }
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
    isCritical: true,
  };

  // ─── 3. 💧 МОЧЕИСПУСКАНИЕ ───
  let urinDot: HealthDot = 'green';
  const urinFilled = checklist.urination.urination_count > 0 || checklist.urination.color !== 'clear';
  if (checklist.urination.color === 'dark' || checklist.urination.color === 'cloudy') {
    urinDot = 'yellow';
    warningReasons.push(`Тёмная/мутная моча (${checklist.urination.urination_count} раз)`);
  }
  if (checklist.urination.frequency === 'frequent_small' || checklist.urination.frequency === 'rare') {
    urinDot = 'yellow';
    warningReasons.push('Аномальная частота мочеиспускания');
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
    isCritical: false,
  };

  // ─── 4. 🦶 КОПЫТА И ПОХОДКА (КРИТИЧЕСКИЙ БЛОК) ───
  let feetDot: HealthDot = 'green';
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
  const feetFilled = true; // Осмотр 4 лап доступен с начала смены

  summaries[4] = {
    title: '4. 🦶 Копыта и походка',
    summary: `${okLimbsCount}/4 норма • ${checklist.feet_gait.gait === 'confident' ? 'Уверенная' : checklist.feet_gait.gait === 'cautious' ? 'Осторожная' : 'Бережёт ногу'}`,
    dot: feetDot,
    isFilled: feetFilled,
    isCritical: true,
  };

  // ─── 5. 🍽 КОРМЛЕНИЕ И ВОДА (КРИТИЧЕСКИЙ БЛОК) ───
  let feedDot: HealthDot = 'green';
  const slotEntries = Object.values(checklist.feeding_water.slots);
  const servedCount = slotEntries.filter(s => s.served).length;
  const feedFilled = servedCount > 0 || checklist.feeding_water.water_intake !== 'normal' || checklist.feeding_water.water_bowl === 'needs_cleaning';

  const hasFoodRefusal = slotEntries.some(s => s.reason === 'refused');
  const hasSluggish = slotEntries.some(s => s.reason === 'sluggish' || s.reason === 'selective');

  if (checklist.feeding_water.water_intake === 'refused') {
    feedDot = 'red';
    criticalReasons.push('🔴 Зафиксирован отказ от питья');
  } else if (hasFoodRefusal) {
    feedDot = 'red';
    criticalReasons.push('🔴 Отказ от порции корма');
  } else if (hasSluggish || checklist.feeding_water.water_intake === 'reduced') {
    feedDot = 'yellow';
    warningReasons.push('Снижен аппетит или водопотребление');
  } else if (checklist.feeding_water.water_bowl === 'needs_cleaning') {
    feedDot = 'yellow';
    warningReasons.push('Поилка требует мытья');
  }

  const waterLabel = checklist.feeding_water.water_intake === 'refused'
    ? 'Отказ от воды 🔴'
    : checklist.feeding_water.water_intake === 'reduced'
    ? 'Снижено ⚠️'
    : 'Норма ✓';

  summaries[5] = {
    title: '5. 🍽 Кормление и вода',
    summary: `${servedCount}/4 выдано • Вода: ${waterLabel}`,
    dot: feedDot,
    isFilled: feedFilled,
    isCritical: true,
  };

  // ─── 6. 😴 СОН И ПОВЕДЕНИЕ ───
  let sleepDot: HealthDot = 'green';
  // Суммирование интервалов сна, если заданы
  let totalSleepMins = checklist.sleep_behavior.total_minutes;
  if (checklist.sleep_behavior.intervals && checklist.sleep_behavior.intervals.length > 0) {
    totalSleepMins = checklist.sleep_behavior.intervals.reduce((acc, it) => {
      const [sh, sm] = it.start.split(':').map(Number);
      const [eh, em] = it.end.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      return acc + mins;
    }, 0);
  }
  const sleepHours = Math.floor(totalSleepMins / 60);
  const sleepRemMins = totalSleepMins % 60;
  const totalSleepFormatted = `${sleepHours}ч ${sleepRemMins > 0 ? `${sleepRemMins}м` : ''}`.trim();

  if (totalSleepMins === 0) {
    sleepDot = 'red';
    criticalReasons.push('🔴 Слониха не ложилась спать за смену');
  } else if (totalSleepMins < 120) {
    sleepDot = 'yellow';
    warningReasons.push(`Сон меньше 2 часов (${totalSleepFormatted})`);
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
    summary: `Сон: ${totalSleepFormatted} • Поза: ${checklist.sleep_behavior.primary_posture === 'side' ? 'На боку' : 'Стоя'}`,
    dot: sleepDot,
    isFilled: true,
    isCritical: false,
  };

  // ─── 7. 🧴 УХОД ЗА ТЕЛОМ ───
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
    isCritical: false,
  };

  // ─── 8. 📷 ФОТОФИКСАЦИЯ И ЗАМЕТКИ ───
  let photoDot: HealthDot = 'green';
  const photoFilled = Boolean(checklist.photo_notes.overall_photo_url || checklist.photo_notes.vet_notes.trim().length > 0);
  summaries[8] = {
    title: '8. 📷 Фотофиксация и заметки',
    summary: checklist.photo_notes.overall_photo_url ? 'Силуэт снят ✓' : 'Фото кондиции не загружено',
    dot: photoDot,
    isFilled: photoFilled,
    isCritical: false,
  };

  // ─── 9. 🐘 СОЦИАЛЬНАЯ ДИНАМИКА ───
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
    isCritical: false,
  };

  // Calculate overall Dot
  let overallDot: HealthDot = 'green';
  if (criticalReasons.length > 0) {
    overallDot = 'red';
  } else if (warningReasons.length > 0) {
    overallDot = 'yellow';
  }

  const completedBlocksCount = Object.values(summaries).filter(s => s.isFilled).length;

  // 🚨 КРИТИЧЕСКИЕ БЛОКИ: 1 (Срочные признаки), 2 (Дефекация), 4 (Копыта/походка), 5 (Кормление/вода)
  const criticalBlockIds = [1, 2, 4, 5];
  const missingCriticalBlocks: string[] = [];
  criticalBlockIds.forEach(id => {
    if (!summaries[id]?.isFilled) {
      missingCriticalBlocks.push(summaries[id]?.title || `Блок ${id}`);
    }
  });

  const criticalBlocksCompleted = missingCriticalBlocks.length === 0;
  const isReadyToSubmit = completedBlocksCount >= 7 && criticalBlocksCompleted;

  return {
    dot: overallDot,
    dotColorClass: overallDot === 'red' ? 'bg-rose-500' : overallDot === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400',
    dotBgClass: overallDot === 'red' ? 'bg-rose-500/20' : overallDot === 'yellow' ? 'bg-amber-500/20' : 'bg-emerald-500/20',
    dotBorderClass: overallDot === 'red' ? 'border-rose-500/50' : overallDot === 'yellow' ? 'border-amber-500/50' : 'border-emerald-500/40',
    statusLabel: overallDot === 'red' ? 'Внимание врача 🔴' : overallDot === 'yellow' ? 'Отклонение 🟡' : 'Норма 🟢',
    completedBlocksCount,
    totalBlocks: 9,
    criticalBlocksCompleted,
    isReadyToSubmit,
    missingCriticalBlocks,
    criticalReasons,
    warningReasons,
    blockSummaries: summaries,
    poopTimeNotice,
    totalSleepFormatted,
  };
}
