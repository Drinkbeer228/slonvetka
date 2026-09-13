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
              behavior: m.behavior || (m.behavior_score === 1 ? 'Грустная / Вялая' : m.behavior_score === 3 ? 'Бодрая / Отличный аппетит' : 'Спокойная / В норме'),
              sleep_minutes: m.behavior_score && m.behavior_score > 10 ? m.behavior_score : 420
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
          metricsMap[m.elephant_id] = { ...m, sleep_minutes: m.sleep_minutes ?? (m.behavior_score && m.behavior_score > 10 ? m.behavior_score : 420) };
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
      const { data: sessionData } = await supabase.auth.getSession();
      const realUserId = sessionData?.session?.user?.id;
      
      const payloadShift = { ...shift };
      if (realUserId && payloadShift.duty_keeper_id) {
        payloadShift.duty_keeper_id = realUserId;
      }

      const { error: shiftError } = await supabase
        .from('daily_shifts')
        .upsert(payloadShift, { onConflict: 'date' });

      if (shiftError) throw shiftError;

      const metricsArray = Object.values(metricsMap).map(m => {
        const { sleep_minutes, sleep_intervals, ...rest } = m;
        return {
          ...rest,
          behavior_score: sleep_minutes
        };
      });
      if (metricsArray.length > 0) {
        const { error: metricsError } = await supabase
          .from('elephant_daily_metrics')
          .upsert(metricsArray, { onConflict: 'shift_id,elephant_id' });

        if (metricsError) throw metricsError;
      }
    } catch (err) {
      console.warn('Network error saving shift to Supabase, saved locally in IDB:', err);
    }
  },

  async getMonthActivity(year: number, month: number): Promise<Record<string, number>> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const activityMap: Record<string, number> = {};

    // 1. Fetch from Supabase
    try {
      const { data: shifts, error: shiftsError } = await supabase
        .from('daily_shifts')
        .select('id, date, status, feed_notes, handover_notes')
        .gte('date', startDate)
        .lte('date', endDate);

      if (!shiftsError && shifts && shifts.length > 0) {
        const shiftIds = shifts.map(s => s.id);
        const { data: metricsData } = await supabase
          .from('elephant_daily_metrics')
          .select('shift_id, poop_count, urination_count, sleep_minutes, behavior_score, notes, photos')
          .in('shift_id', shiftIds);

        const metricsByShift: Record<string, any[]> = {};
        if (metricsData) {
          for (const m of metricsData) {
            if (!metricsByShift[m.shift_id]) metricsByShift[m.shift_id] = [];
            metricsByShift[m.shift_id].push(m);
          }
        }

        for (const shift of shifts) {
          const mList = metricsByShift[shift.id] || [];
          activityMap[shift.date] = calculateShiftScore(shift, mList);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch month activity from Supabase', e);
    }

    // 2. Fetch from IndexedDB and merge
    try {
      const db = await getOfflineDb();
      const tx = db.transaction(['daily_shifts', 'elephant_daily_metrics'], 'readonly');
      const shiftStore = tx.objectStore('daily_shifts');
      const index = shiftStore.index('by-date');
      const cachedShifts = await index.getAll(IDBKeyRange.bound(startDate, endDate));

      if (cachedShifts && cachedShifts.length > 0) {
        const metricsStore = tx.objectStore('elephant_daily_metrics');
        const metricsIndex = metricsStore.index('by-shiftId');

        for (const shift of cachedShifts) {
          const mList = await metricsIndex.getAll(shift.id);
          const localScore = calculateShiftScore(shift, mList || []);
          activityMap[shift.date] = Math.max(activityMap[shift.date] ?? 0, localScore);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch month activity from IDB', e);
    }

    return activityMap;
  },

  async getActiveDaysForMonth(year: number, month: number): Promise<string[]> {
    const activity = await this.getMonthActivity(year, month);
    return Object.keys(activity).filter(d => (activity[d] ?? 0) > 0);
  }
};

function calculateShiftScore(
  shift: { status?: string; feed_notes?: string; handover_notes?: string },
  metrics: Array<{
    poop_count?: number;
    urination_count?: number;
    sleep_minutes?: number;
    behavior_score?: number;
    sleep_intervals?: any[];
    notes?: string;
    photos?: any[];
  }>
): number {
  let score = 0;

  // 1. 💩 Кучи (дефекация заполнена > 0)
  const hasPoop = metrics.some(m => (m.poop_count ?? 0) > 0);
  if (hasPoop) score++;

  // 2. 💧 Лужи (мочеиспускание заполнено > 0)
  const hasUrine = metrics.some(m => (m.urination_count ?? 0) > 0);
  if (hasUrine) score++;

  // Парсинг feed_notes для каши и ужина
  let parsedFeed: any = null;
  if (shift.feed_notes) {
    try {
      parsedFeed = JSON.parse(shift.feed_notes);
    } catch {
      parsedFeed = null;
    }
  }

  // 3. 🥣 Завтрак (каша выдана)
  const hasPorridge = Boolean(parsedFeed && parsedFeed.morning_porridge && parsedFeed.morning_porridge !== 'none');
  if (hasPorridge) score++;

  // 4. 🥗 Ужин (салат выдан)
  const hasSalad = Boolean(
    parsedFeed && (
      parsedFeed.salad_base_included ||
      parsedFeed.salad_appetite ||
      (Array.isArray(parsedFeed.evening_salad_chips) && parsedFeed.evening_salad_chips.length > 0)
    )
  );
  if (hasSalad) score++;

  // 5. 🌙 Сон (укладки зафиксированы)
  const hasSleep = metrics.some(m =>
    Boolean((m.sleep_minutes && m.sleep_minutes > 0) ||
    (Array.isArray(m.sleep_intervals) && m.sleep_intervals.length > 0) ||
    (m.behavior_score && m.behavior_score > 0))
  );
  if (hasSleep) score++;

  // 6. 📷 Фотофиксации (хотя бы 1 фото)
  const hasPhoto = metrics.some(m => Array.isArray(m.photos) && m.photos.length > 0) ||
    Boolean(parsedFeed?.morning_porridge_photo) ||
    Boolean(parsedFeed?.salad_photo_url);
  if (hasPhoto) score++;

  // 7. 📝 Журнал заметок или смена закрыта
  const hasNotesOrClosed =
    shift.status === 'completed' ||
    Boolean(shift.handover_notes && shift.handover_notes.trim().length > 0) ||
    Boolean(parsedFeed?.salad_notes && parsedFeed.salad_notes.trim().length > 0) ||
    metrics.some(m => Boolean(m.notes && m.notes.trim().length > 0));
  if (hasNotesOrClosed) score++;

  return Math.min(7, Math.max(0, score));
}
