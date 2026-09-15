import { supabase } from '../lib/supabase';
import { 
  DailyShift, 
  ElephantDailyMetrics, 
  FeedInventoryItem, 
  FeedInventoryType, 
  clampCount, 
  clampSleepMinutes 
} from '../types/shift';
import { 
  getOfflineDb, 
  cacheFeedInventory, 
  getCachedFeedInventory 
} from './offlineDb';

export const DEFAULT_FEED_INVENTORY: Record<FeedInventoryType, FeedInventoryItem> = {
  hay_bales: {
    feed_type: 'hay_bales',
    name: 'Тюки сена',
    quantity_in_stock: 200,
    unit: 'тюков',
  },
  hay_rolls: {
    feed_type: 'hay_rolls',
    name: 'Рулоны сена',
    quantity_in_stock: 15,
    unit: 'рулонов',
  },
  branches: {
    feed_type: 'branches',
    name: 'Ветки / веники',
    quantity_in_stock: 50,
    unit: 'веников',
  },
};

function parseBranchesFromNotes(feedNotes?: string | null): number {
  if (!feedNotes) return 0;
  try {
    const parsed = JSON.parse(feedNotes);
    return Math.max(0, Number(parsed.coarse_branches || 0));
  } catch {
    return 0;
  }
}

export const shiftService = {
  /**
   * Получение актуальных остатков кормов со склада (feed_inventory).
   * 1. Запрос в Supabase
   * 2. Если оффлайн — чтение из кэша IndexedDB
   * 3. Если кэш пуст — возврат дефолтных значений и инициализация кэша
   */
  async getFeedInventory(): Promise<Record<FeedInventoryType, FeedInventoryItem>> {
    await supabase.auth.getSession();
    
    // 1. Попытка чтения из Supabase
    try {
      const { data, error } = await supabase
        .from('feed_inventory')
        .select('*');

      if (!error && data && data.length > 0) {
        const result: Record<FeedInventoryType, FeedInventoryItem> = {
          ...DEFAULT_FEED_INVENTORY
        };
        for (const row of data) {
          const type = row.item_type as FeedInventoryType;
          if (type in result) {
            result[type] = {
              feed_type: type,
              name: DEFAULT_FEED_INVENTORY[type].name,
              quantity_in_stock: Math.max(0, Number(row.quantity_in_stock ?? 0)),
              unit: row.unit || DEFAULT_FEED_INVENTORY[type].unit,
              updated_at: row.updated_at
            };
          }
        }
        // Кэшируем в IndexedDB для оффлайн-доступа
        await cacheFeedInventory(Object.values(result));
        return result;
      }
    } catch (err) {
      console.warn('Network error reading feed_inventory from Supabase, falling back to IDB cache:', err);
    }

    // 2. Оффлайн-фоллбэк: чтение из IndexedDB
    try {
      const cached = await getCachedFeedInventory();
      if (cached && cached.length > 0) {
        const result: Record<FeedInventoryType, FeedInventoryItem> = {
          ...DEFAULT_FEED_INVENTORY
        };
        for (const item of cached) {
          if (item.feed_type in result) {
            result[item.feed_type] = {
              ...item,
              quantity_in_stock: Math.max(0, Number(item.quantity_in_stock ?? 0))
            };
          }
        }
        return result;
      }
    } catch (idbErr) {
      console.warn('IDB feed_inventory read error:', idbErr);
    }

    // 3. Если и база, и кэш пусты: сохраняем дефолтные остатки
    try {
      await cacheFeedInventory(Object.values(DEFAULT_FEED_INVENTORY));
      const dbPayload = Object.values(DEFAULT_FEED_INVENTORY).map(item => ({
        item_type: item.feed_type,
        quantity_in_stock: item.quantity_in_stock,
        unit: item.unit
      }));
      await supabase
        .from('feed_inventory')
        .upsert(dbPayload, { onConflict: 'item_type' });
    } catch {}

    return { ...DEFAULT_FEED_INVENTORY };
  },

  /**
   * Установка абсолютного количества остатка на складе feed_inventory.
   */
  async setFeedInventoryStock(feedType: FeedInventoryType, total: number): Promise<FeedInventoryItem> {
    const safeQty = Math.max(0, Math.round(total));
    const inv = await this.getFeedInventory();
    const current = inv[feedType] || DEFAULT_FEED_INVENTORY[feedType];

    const updatedItem: FeedInventoryItem = {
      ...current,
      quantity_in_stock: safeQty,
      updated_at: new Date().toISOString()
    };

    // 1. Оптимистичная запись в IndexedDB
    await cacheFeedInventory([updatedItem]);

    // 2. Запись в Supabase
    try {
      const payload = {
        item_type: updatedItem.feed_type,
        quantity_in_stock: updatedItem.quantity_in_stock,
        unit: updatedItem.unit,
        updated_at: updatedItem.updated_at
      };
      const { error } = await supabase
        .from('feed_inventory')
        .upsert(payload, { onConflict: 'item_type' });
      if (error) {
        console.warn('Could not update feed_inventory in Supabase:', error);
      }
    } catch (err) {
      console.warn('Network error updating feed_inventory in Supabase, saved in IDB:', err);
    }

    return updatedItem;
  },

  /**
   * Пополнение склада на заданное количество.
   */
  async replenishFeedInventory(feedType: FeedInventoryType, amount: number): Promise<FeedInventoryItem> {
    const inv = await this.getFeedInventory();
    const current = inv[feedType]?.quantity_in_stock ?? 0;
    const newQty = Math.max(0, current + Math.round(amount));
    return this.setFeedInventoryStock(feedType, newQty);
  },

  /**
   * Списание выданного корма из остатков на складе.
   */
  async deductShiftFeed(deltas: { bales?: number; rolls?: number; branches?: number }): Promise<void> {
    const inv = await this.getFeedInventory();
    const updates: FeedInventoryItem[] = [];

    if (deltas.bales && deltas.bales !== 0) {
      const item = inv.hay_bales;
      const updatedQty = Math.max(0, item.quantity_in_stock - deltas.bales);
      updates.push({
        ...item,
        quantity_in_stock: updatedQty,
        updated_at: new Date().toISOString()
      });
    }

    if (deltas.rolls && deltas.rolls !== 0) {
      const item = inv.hay_rolls;
      const updatedQty = Math.max(0, item.quantity_in_stock - deltas.rolls);
      updates.push({
        ...item,
        quantity_in_stock: updatedQty,
        updated_at: new Date().toISOString()
      });
    }

    if (deltas.branches && deltas.branches !== 0) {
      const item = inv.branches;
      const updatedQty = Math.max(0, item.quantity_in_stock - deltas.branches);
      updates.push({
        ...item,
        quantity_in_stock: updatedQty,
        updated_at: new Date().toISOString()
      });
    }

    if (updates.length === 0) return;

    // 1. Обновляем в IndexedDB
    await cacheFeedInventory(updates);

    // 2. Синхронизируем с Supabase
    try {
      const dbPayload = updates.map(item => ({
        item_type: item.feed_type,
        quantity_in_stock: item.quantity_in_stock,
        unit: item.unit,
        updated_at: item.updated_at
      }));
      const { error } = await supabase
        .from('feed_inventory')
        .upsert(dbPayload, { onConflict: 'item_type' });
      if (error) {
        console.error('Ошибка списания со склада:', error);
      }
    } catch (err) {
      console.error('Ошибка списания со склада (сеть):', err);
    }
  },

  /**
   * Обратная совместимость для существующих вызовов без localStorage.
   */
  async getHayStock(type: 'bales' | 'rolls' | 'branches' = 'bales'): Promise<number> {
    const feedType: FeedInventoryType = type === 'bales' ? 'hay_bales' : type === 'rolls' ? 'hay_rolls' : 'branches';
    const inv = await this.getFeedInventory();
    return inv[feedType]?.quantity_in_stock ?? (type === 'bales' ? 200 : type === 'rolls' ? 15 : 50);
  },

  async replenishHayStock(type: 'bales' | 'rolls' | 'branches', amount: number): Promise<number> {
    const feedType: FeedInventoryType = type === 'bales' ? 'hay_bales' : type === 'rolls' ? 'hay_rolls' : 'branches';
    const updated = await this.replenishFeedInventory(feedType, amount);
    return updated.quantity_in_stock;
  },

  async setHayStock(type: 'bales' | 'rolls' | 'branches', total: number): Promise<number> {
    const feedType: FeedInventoryType = type === 'bales' ? 'hay_bales' : type === 'rolls' ? 'hay_rolls' : 'branches';
    const updated = await this.setFeedInventoryStock(feedType, total);
    return updated.quantity_in_stock;
  },


  async checkPendingHandover(userId: string): Promise<DailyShift | null> {
    await supabase.auth.getSession();
    try {
      const { data, error } = await supabase
        .from('daily_shifts')
        .select('*')
        .eq('status', 'handover_pending')
        .eq('handover_to_keeper_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailyShift | null;
    } catch (err) {
      console.error('Error checking pending handover:', err);
      return null;
    }
  },

  async initiateHandover(shiftId: string, targetKeeperId: string, notes: string): Promise<void> {
    await supabase.auth.getSession();
    const { error } = await supabase
      .from('daily_shifts')
      .update({
        status: 'handover_pending',
        handover_to_keeper_id: targetKeeperId,
        handover_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', shiftId);
      
    if (error) throw error;
  },

  async acceptHandover(pendingShift: DailyShift, newDutyKeeperId: string): Promise<void> {
    await supabase.auth.getSession();
    const now = new Date().toISOString();

    // Закрываем старую смену
    const { error: closeError } = await supabase
      .from('daily_shifts')
      .update({
        status: 'completed',
        ended_at: now,
        updated_at: now,
        handover_to_keeper_id: null,
        handover_notes: pendingShift.handover_notes
      })
      .eq('id', pendingShift.id);

    if (closeError) throw closeError;

    // Пытаемся создать новую смену
    const newShiftId = `shift_${pendingShift.date}_${Math.random().toString(36).substring(2, 9)}`;
    const { error: createError } = await supabase
      .from('daily_shifts')
      .insert({
        id: newShiftId,
        date: pendingShift.date,
        duty_keeper_id: newDutyKeeperId,
        status: 'in_progress',
        started_at: now,
        updated_at: now
      });

    if (createError) {
      if (createError.code === '23505') {
        // Fallback: if UNIQUE(date) constraint exists in DB, we fallback to hijacking the current shift
        await supabase
          .from('daily_shifts')
          .update({
            status: 'in_progress',
            duty_keeper_id: newDutyKeeperId,
            ended_at: null
          })
          .eq('id', pendingShift.id);
      } else {
        throw createError;
      }
    }
  },
  async rejectHandover(pendingShiftId: string): Promise<void> {
    await supabase.auth.getSession();
    const { error } = await supabase
      .from('daily_shifts')
      .update({
        status: 'in_progress',
        handover_to_keeper_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingShiftId);
      
    if (error) throw error;
  },

  async getShiftData(date: string): Promise<{ shift: DailyShift; metrics: Record<string, ElephantDailyMetrics> }> {
    const db = await getOfflineDb();
    
    await supabase.auth.getSession();

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
            const sleepMinutes = m.sleep_minutes != null ? m.sleep_minutes : 0;

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
              sleep_minutes: clampSleepMinutes(sleepMinutes),
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

    // Ensure session is fresh before making any Supabase calls
    await supabase.auth.getSession();

    // 0. Списание расхода кормов из feed_inventory (по дельте от предыдущего сохраненного состояния)
    try {
      const existingShift = await db.get('daily_shifts', shift.id);
      const prevBales = existingShift?.hay_bales_distributed ?? 0;
      const prevBags = existingShift?.hay_bags_distributed ?? 0;
      const prevBranches = parseBranchesFromNotes(existingShift?.feed_notes);

      const currentBales = shift.hay_bales_distributed ?? 0;
      const currentBags = shift.hay_bags_distributed ?? 0;
      const currentBranches = parseBranchesFromNotes(shift.feed_notes);

      const deltaBales = currentBales - prevBales;
      const deltaBags = currentBags - prevBags;
      const deltaBranches = currentBranches - prevBranches;

      if (deltaBales !== 0 || deltaBags !== 0 || deltaBranches !== 0) {
        await this.deductShiftFeed({
          bales: deltaBales,
          rolls: deltaBags,
          branches: deltaBranches
        });
      }
    } catch (invErr) {
      console.warn('Feed inventory deduction error:', invErr);
    }

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
      // Если смена только создана и у нее нет дежурного - подставляем текущего
      if (realUserId && !payloadShift.duty_keeper_id) {
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

    await supabase.auth.getSession();

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
