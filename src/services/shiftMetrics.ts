import { ElephantDailyMetrics, clampCount, clampSleepMinutes, createDefaultElephantMetrics } from '../types/shift';
import { FAVORED_GAIT_LABEL } from '../constants/elephantObservations';

export function normalizeMetric(
  rawMetric: Partial<ElephantDailyMetrics> & Pick<ElephantDailyMetrics, 'shift_id' | 'elephant_id'>
): ElephantDailyMetrics {
  const baseMetric = createDefaultElephantMetrics(rawMetric.shift_id, rawMetric.elephant_id);
  const gaitAssessment = rawMetric.gait_assessment ?? baseMetric.gait_assessment;

  return {
    ...baseMetric,
    ...rawMetric,
    poop_count: clampCount(rawMetric.poop_count ?? 0),
    feces_traits: Array.isArray(rawMetric.feces_traits) && rawMetric.feces_traits.length > 0
      ? rawMetric.feces_traits
      : baseMetric.feces_traits,
    urination_count: clampCount(rawMetric.urination_count ?? 0),
    urination_traits: Array.isArray(rawMetric.urination_traits) && rawMetric.urination_traits.length > 0
      ? rawMetric.urination_traits
      : baseMetric.urination_traits,
    behavior: rawMetric.behavior || baseMetric.behavior,
    sleep_minutes: clampSleepMinutes(rawMetric.sleep_minutes ?? 0),
    sleep_intervals: Array.isArray(rawMetric.sleep_intervals) ? rawMetric.sleep_intervals : [],
    notes: rawMetric.notes ?? '',
    photos: Array.isArray(rawMetric.photos) ? rawMetric.photos : [],
    eye_observations: Array.isArray(rawMetric.eye_observations) ? rawMetric.eye_observations : [],
    selective_eating: rawMetric.selective_eating ?? '',
    dust_bathing: Boolean(rawMetric.dust_bathing),
    foreign_object_suspected: Boolean(rawMetric.foreign_object_suspected),
    foreign_object_note: rawMetric.foreign_object_note ?? '',
    gait_assessment: gaitAssessment,
    favored_leg: gaitAssessment === FAVORED_GAIT_LABEL ? (rawMetric.favored_leg ?? null) : null,
  };
}
