import { supabase } from '../lib/supabase';
import { DailyShift, ElephantDailyMetrics, clampCount, clampSleepMinutes } from '../types/shift';
import { getOfflineDb } from './offlineDb';

export const shiftService = {
  async getHayStock(type: 'bales' | 'rolls' = 'bales'): Promise<number> {
    try {
      const val = localStorage.getItem(`slonovet_hay_stock_${type}`);
      if (val !== null) return Math.max(0, Number(val));
    } catch {}
    return type === 'bales' ? 200 : 15;
  },

  async replenishHayStock(type: 'bales' | 'rolls', amount: number): Promise<number> {
    const current = await this.getHayStock(type);
    const updated = Math.max(0, current + amount);
    try {
      localStorage.setItem(`slonovet_hay_stock_${type}`, String(updated));
    } catch {}
    return updated;
  },

  async setHayStock(type: 'bales' | 'rolls', total: number): Promise<number> {
    const safe = Math.max(0, Math.round(total));
    try {
      localStorage.setItem(`slonovet_hay_stock_${type}`, String(safe));
    } catch {}
    return safe;
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
          hay_bales_distributed: Math.max(0, shiftData.hay_bales_distributed ?? 0),
          hay_bags_distributed: Math.max(0, shiftData.hay_bags_distributed ?? 0),
          reminders: Array.isArray(shiftData.reminders) ? shiftData.reminders : []
        };
        await db.put('daily_shifts', shift);

        const { data: metricsData, error: metricsError } = await supabase
          .from('elephant_daily_metrics')
          .select('*')
          .eq('shift_id', shift.id);

        const metricsMap: Record<string, ElephantDailyMetrics> = {};
        if (!metricsError && metricsData) {
          for (const m of metricsData) {
            // Безопасное чтение: behavior_score использовался для sleep_minutes в старых данных
            const legacySleepMinutes =
              m.sleep_minutes != null
                ? m.sleep_minutes
                : m.behavior_score != null && m.behavior_score > 10
                  ? m.behavior_score
                  : 0;

            metricsMap[m.elephant_id] = {
              id: m.id,
              shift_id: m.shift_id,
              elephant_id: m.elephant_id,
              poop_count: clampCount(m.poop_count ?? 0),
              feces_traits: Array.isArray(m.feces_traits) && m.feces_traits.length > 0
                ? m.feces_traits
                : ['Сформирован (норма)'],
              urination_count: clampCount(m.urination_count ?? 0),
              urination_traits: Array.isArray(m.urination_traits) && m.urination_traits.length > 0
                ? m.urination_traits
                : ['Прозрачная (норма)'],
              behavior: m.behavior || 'Спокойная / В норме',
              sleep_minutes: clampSleepMinutes(legacySleepMinutes),
              sleep_intervals: Array.isArray(m.sleep_intervals) ? m.sleep_intervals : [],
              notes: m.notes ?? '',
              photos: Array.isArray(m.photos) ? m.photos : [],
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
          metricsMap[m.elephant_id] = {
            ...m,
            poop_count: clampCount(m.poop_count ?? 0),
            urination_count: clampCount(m.urination_count ?? 0),
            sleep_minutes: clampSleepMinutes(m.sleep_minutes ?? 0),
            sleep_intervals: Array.isArray(m.sleep_intervals) ? m.sleep_intervals : [],
            photos: Array.isArray(m.photos) ? m.photos : [],
          };
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
      const metric = { ...metricsMap[elephantId] };
      if (!metric.id) {
        metric.id = `metric_${shift.id}_${elephantId}_${Math.random().toString(36).substring(2, 7)}`;
      }
      metric.shift_id = shift.id;
      metric.elephant_id = elephantId;
      // Валидация перед сохранением
      metric.poop_count = clampCount(metric.poop_count ?? 0);
      metric.urination_count = clampCount(metric.urination_count ?? 0);
      metric.sleep_minutes = clampSleepMinutes(metric.sleep_minutes ?? 0);
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

      // ИСПРАВЛЕНО: правильное маппирование полей
      // sleep_minutes сохраняется в sleep_minutes (не в behavior_score!)
      const metricsArray = Object.values(metricsMap).map(m => {
        // Убираем только локальные поля, которых нет в БД (нет таких здесь)
        const payload = {
          id: m.id,
          shift_id: m.shift_id,
          elephant_id: m.elephant_id,
          poop_count: clampCount(m.poop_count ?? 0),
          feces_traits: m.feces_traits,
          urination_count: clampCount(m.urination_count ?? 0),
          urination_traits: m.urination_traits,
          behavior: m.behavior,
          sleep_minutes: clampSleepMinutes(m.sleep_minutes ?? 0),
          sleep_intervals: m.sleep_intervals ?? [],
          notes: m.notes ?? '',
          photos: m.photos ?? [],
        };
        return payload;
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
    const mm = String(month).padStart(2, '0');
    const startDate = `${year}-${mm}-01`;
    const endDate = `${year}-${mm}-31`;
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
          .select('shift_id, poop_count, urination_count, sleep_minutes, notes, photos')
          .in('shift_id', shiftIds);

        const metricsByShift: Record<string, Array<{
          poop_count?: number;
          urination_count?: number;
          sleep_minutes?: number;
          notes?: string;
          photos?: unknown[];
        }>> = {};
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
    notes?: string;
    photos?: unknown[];
  }>
): number {
  let score = 0;

  // 1. 💩 Кучи
  const hasPoop = metrics.some(m => (m.poop_count ?? 0) > 0);
  if (hasPoop) score++;

  // 2. 💧 Лужи
  const hasUrine = metrics.some(m => (m.urination_count ?? 0) > 0);
  if (hasUrine) score++;

  // Парсинг feed_notes
  let parsedFeed: Record<string, unknown> | null = null;
  if (shift.feed_notes) {
    try {
      parsedFeed = JSON.parse(shift.feed_notes) as Record<string, unknown>;
    } catch {
      parsedFeed = null;
    }
  }

  // 3. 🥣 Завтрак
  const hasPorridge = Boolean(parsedFeed?.morning_porridge && parsedFeed.morning_porridge !== 'none');
  if (hasPorridge) score++;

  // 4. 🥗 Ужин
  const hasSalad = Boolean(
    parsedFeed && (
      parsedFeed.salad_base_included ||
      parsedFeed.salad_appetite ||
      (Array.isArray(parsedFeed.evening_salad_chips) && (parsedFeed.evening_salad_chips as unknown[]).length > 0)
    )
  );
  if (hasSalad) score++;

  // 5. 🌙 Сон (теперь читаем sleep_minutes)
  const hasSleep = metrics.some(m =>
    (m.sleep_minutes != null && m.sleep_minutes > 0)
  );
  if (hasSleep) score++;

  // 6. 📷 Фото
  const hasPhoto =
    metrics.some(m => Array.isArray(m.photos) && (m.photos as unknown[]).length > 0) ||
    Boolean(parsedFeed?.morning_porridge_photo) ||
    Boolean(parsedFeed?.salad_photo_url);
  if (hasPhoto) score++;

  // 7. 📝 Заметки или смена закрыта
  const hasNotesOrClosed =
    shift.status === 'completed' ||
    shift.status === 'submitted' ||
    Boolean(shift.handover_notes?.trim()) ||
    Boolean((parsedFeed?.salad_notes as string | undefined)?.trim()) ||
    metrics.some(m => Boolean(m.notes?.trim()));
  if (hasNotesOrClosed) score++;

  return Math.min(7, Math.max(0, score));
}
