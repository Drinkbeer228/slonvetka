import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMetric } from './shiftMetrics';
import { FAVORED_GAIT_LABEL } from '../constants/elephantObservations';

test('normalizeMetric defaults invalid eye observations and clears favored leg when gait is not protective', () => {
  const metric = normalizeMetric({
    shift_id: 'shift-uuid',
    elephant_id: 'margo',
    eye_observations: 'not-an-array' as unknown as string[],
    gait_assessment: 'Шаг уверенный',
    favored_leg: 'ПП',
  });

  assert.deepEqual(metric.eye_observations, []);
  assert.equal(metric.favored_leg, null);
  assert.deepEqual(metric.urination_traits, ['Прозрачная (норма)']);
});

test('normalizeMetric preserves eye observations and favored leg for guarded gait', () => {
  const metric = normalizeMetric({
    shift_id: 'shift-uuid',
    elephant_id: 'odri',
    eye_observations: ['Слезотечение'],
    gait_assessment: FAVORED_GAIT_LABEL,
    favored_leg: 'ЛЗ',
  });

  assert.deepEqual(metric.eye_observations, ['Слезотечение']);
  assert.equal(metric.favored_leg, 'ЛЗ');
});
