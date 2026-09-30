import { ElephantDailyMetrics } from '../types/shift';

export type HealthSeverity = 'ok' | 'warning' | 'alert';

export interface ElephantHealthStatusResult {
  severity: HealthSeverity;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  indicatorIcon: string;
  reasons: string[];
}

export function evaluateElephantHealth(
  metrics?: ElephantDailyMetrics | null,
  extraContext?: {
    saladAppetite?: string;
  }
): ElephantHealthStatusResult {
  const reasons: string[] = [];
  let severity: HealthSeverity = 'ok';

  if (!metrics) {
    return {
      severity: 'ok',
      label: 'Норма',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-300/80',
      dotColor: 'bg-emerald-500',
      indicatorIcon: '🟢',
      reasons: [],
    };
  }

  // 1. Check for Critical Alerts (Red)
  // Gait / Lameness
  if (
    metrics.favored_leg ||
    (metrics.gait_assessment &&
      (metrics.gait_assessment.toLowerCase().includes('хром') ||
        metrics.gait_assessment.toLowerCase().includes('бережет') ||
        metrics.gait_assessment.toLowerCase().includes('скован')))
  ) {
    severity = 'alert';
    reasons.push(metrics.favored_leg ? `Бережет ногу (${metrics.favored_leg})` : 'Хромота / скованность');
  }

  // Foreign object
  if (metrics.foreign_object_suspected) {
    severity = 'alert';
    reasons.push('Подозрение на инородное тело');
  }

  // Refusal to eat
  if (
    metrics.feed_consumption === 'Отказ' ||
    metrics.feed_consumption === 'refused' ||
    extraContext?.saladAppetite === 'refused'
  ) {
    severity = 'alert';
    reasons.push('Отказ от корма');
  }

  // Diarrhea / Liquid stool
  const feces = metrics.feces_traits || [];
  if (
    feces.some(
      (t) =>
        t.toLowerCase().includes('жидк') ||
        t.toLowerCase().includes('понос') ||
        t.toLowerCase().includes('слизь') ||
        t.toLowerCase().includes('кровь')
    )
  ) {
    severity = 'alert';
    reasons.push('Жидкий стул / ЖКТ');
  }

  // Urine blood / straining
  const urine = metrics.urination_traits || [];
  if (urine.some((t) => t.toLowerCase().includes('кровь') || t.toLowerCase().includes('натуж'))) {
    severity = 'alert';
    reasons.push('Кровь / спазм мочеиспускания');
  }

  // 2. If not alert, check for Warnings (Amber)
  if (severity !== 'alert') {
    if (feces.some((t) => t.toLowerCase().includes('сух') || t.toLowerCase().includes('рассыпч'))) {
      severity = 'warning';
      reasons.push('Сухой стул');
    }

    if (
      urine.some(
        (t) =>
          t.toLowerCase().includes('темн') ||
          t.toLowerCase().includes('мутн') ||
          t.toLowerCase().includes('осадок') ||
          t.toLowerCase().includes('бура')
      )
    ) {
      severity = 'warning';
      reasons.push('Мутная/темная моча');
    }

    if (
      metrics.feed_consumption === 'Вяло' ||
      metrics.feed_consumption === 'partial' ||
      metrics.selective_eating ||
      extraContext?.saladAppetite === 'partial'
    ) {
      severity = 'warning';
      reasons.push('Снижен аппетит');
    }

    if (
      metrics.breathing_observation &&
      (metrics.breathing_observation.toLowerCase().includes('сопен') ||
        metrics.breathing_observation.toLowerCase().includes('храп'))
    ) {
      severity = 'warning';
      reasons.push('Сопение / дыхание');
    }

    if (
      metrics.eye_observations &&
      metrics.eye_observations.some(
        (e) => e.toLowerCase().includes('отек') || e.toLowerCase().includes('слезо') || e.toLowerCase().includes('прищур')
      )
    ) {
      severity = 'warning';
      reasons.push('Симптомы глаз');
    }

    if (
      metrics.nasal_discharge &&
      !metrics.nasal_discharge.toLowerCase().includes('нет') &&
      metrics.nasal_discharge.trim().length > 0
    ) {
      severity = 'warning';
      reasons.push(`Выделения: ${metrics.nasal_discharge}`);
    }

  }

  if (severity === 'alert') {
    return {
      severity: 'alert',
      label: reasons[0] ? `Тревога: ${reasons[0]}` : 'Тревога',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-400',
      dotColor: 'bg-rose-600',
      indicatorIcon: '🔴',
      reasons,
    };
  }

  if (severity === 'warning') {
    return {
      severity: 'warning',
      label: reasons[0] ? `Внимание: ${reasons[0]}` : 'Внимание',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-950',
      badgeBorder: 'border-amber-400',
      dotColor: 'bg-amber-500',
      indicatorIcon: '🟠',
      reasons,
    };
  }

  return {
    severity: 'ok',
    label: 'Норма',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    indicatorIcon: '🟢',
    reasons: [],
  };
}
