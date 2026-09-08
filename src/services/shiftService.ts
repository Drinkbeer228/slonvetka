import { supabase } from '../lib/supabase';
import { DailyShift, ElephantDailyMetrics } from '../types/shift';
import { getOfflineDb } from './offlineDb';

export const shiftService = {
  async getHayStock(type: 'bales' | 'rolls' = 'bales'): Promise<number> {
    try {
      const val = localStorage.getItem(`slonovet_hay_stock_${type}`);
      if (val !== null) return Number(val);
    } catch {}
    return type === 'bales' ? 200 : 15;
  },

  async replenishHayStock(type: 'bales' | 'rolls', amount: number): Promise<number> {
    const current = await this.getHayStock(type);
    const updated = current + amount;
    try {
      localStorage.setItem(`slonovet_hay_stock_${type}`, String(updated));
    } catch {}
    return updated;
  },

  async setHayStock(type: 'bales' | 'rolls', total: number): Promise<number> {
    try {
      localStorage.setItem(`slonovet_hay_stock_${type}`, String(Math.max(0, total)));
    } catch {}
    return Math.max(0, total);
  },

  async getShiftData(date: string): Promise<{ shift: DailyShift; metrics: Record<string, ElephantDailyMetrics> }> {
    const db = await getOfflineDb();

    // 1. Try Supabase first
    try {
      const { data: shiftData, error: shiftError } = await supabase
        .from('daily_shifts')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (!shiftError && shiftData) {
        const shift: DailyShift = {
          ...shiftData,
          hay_bales_distributed: shiftData.hay_bales_distributed ?? shiftData.hay_bales_used ?? 0,
          hay_bags_distributed: shiftData.hay_bags_distributed ?? shiftData.hay_rolls_distributed ?? 0,
          reminders: shiftData.reminders || []
        };
        await db.put('daily_shifts', shift);

        const { data: metricsData, error: metricsError } = await supabase
          .from('elephant_daily_metrics')
          .select('*')
          .eq('shift_id', shift.id);

        const metricsMap: Record<string, ElephantDailyMetrics> = {};
        if (!metricsError && metricsData) {
          for (const m of metricsData) {
            metricsMap[m.elephant_id] = {
              ...m,
              feces_traits: m.feces_traits && m.feces_traits.length > 0 ? m.feces_traits : ['Сформирован (норма)'],
              urination_traits: m.urination_traits && m.urination_traits.length > 0 ? m.urination_traits : ['Светлая / Прозрачная'],
              behavior: m.behavior || (m.behavior_score === 1 ? 'Грустная / Вялая' : m.behavior_score === 3 ? 'Бодрая / Отличный аппетит' : 'Спокойная / В норме')
            };
            await db.put('elephant_daily_metrics', metricsMap[m.elephant_id]);
          }
        }
        return { shift, metrics: metricsMap };
      }
    } catch (err) {
      console.warn('Supabase fetch shift failed, falling back to IDB:', err);
    }

    // 2. Fallback to IDB
    try {
      const tx = db.transaction('daily_shifts', 'readonly');
      const index = tx.store.index('by-date');
      const cachedShift = await index.get(date);

      if (cachedShift) {
        const metricsList = await db.getAllFromIndex('elephant_daily_metrics', 'by-shiftId', cachedShift.id);
        const metricsMap: Record<string, ElephantDailyMetrics> = {};
        for (const m of metricsList) {
          metricsMap[m.elephant_id] = m;
        }
        return { shift: cachedShift, metrics: metricsMap };
      }
    } catch (idbErr) {
      console.error('IDB shift fetch error:', idbErr);
    }

    // 3. Return default template if not found anywhere
    const defaultShift: DailyShift = {
      id: `shift_${date}_${Math.random().toString(36).substring(2, 9)}`,
      date,
      duty_keeper_id: null,
      status: 'in_progress',
      hay_bales_distributed: 0,
      hay_bags_distributed: 0,
      reminders: [],
      feed_notes: '',
      handover_notes: ''
    };

    return { shift: defaultShift, metrics: {} };
  },

  async saveShiftData(shift: DailyShift, metricsMap: Record<string, ElephantDailyMetrics>): Promise<void> {
    const db = await getOfflineDb();

    // 1. Optimistic save to IDB
    await db.put('daily_shifts', shift);
    for (const elephantId of Object.keys(metricsMap)) {
      const metric = metricsMap[elephantId];
      if (!metric.id) {
        metric.id = `metric_${shift.id}_${elephantId}_${Math.random().toString(36).substring(2, 7)}`;
      }
      metric.shift_id = shift.id;
      metric.elephant_id = elephantId;
      await db.put('elephant_daily_metrics', metric);
    }

    // 2. Try pushing to Supabase
    try {
      const { error: shiftError } = await supabase
        .from('daily_shifts')
        .upsert(shift, { onConflict: 'date' });

      if (shiftError) throw shiftError;

      const metricsArray = Object.values(metricsMap);
      if (metricsArray.length > 0) {
        const { error: metricsError } = await supabase
          .from('elephant_daily_metrics')
          .upsert(metricsArray, { onConflict: 'shift_id,elephant_id' });

        if (metricsError) throw metricsError;
      }
    } catch (err) {
      console.warn('Network error saving shift to Supabase, saved locally in IDB:', err);
    }
  }
};
