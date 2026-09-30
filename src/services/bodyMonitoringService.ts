export interface BodyPhoto {
  id: string;
  elephantId: 'margo' | 'audrey' | 'pretty';
  elephantName: string;
  type: 'foot' | 'silhouette';
  foot?: 'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dataUrl: string;
  note?: string;
}

export interface VetReminderTask {
  id: string;
  elephantId?: 'margo' | 'audrey' | 'pretty' | 'all';
  elephantName?: string;
  text: string;
  date: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface ElephantHealthExceptions {
  didNotSleep: boolean;
  lameness: boolean;
  lameLeg?: 'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ';
  notes?: string;
}

export interface SleepPhaseItem {
  id: string;
  hours: number;
  timestamp?: string;
}

export interface DailyPhysioRecord {
  id: string;
  date: string; // YYYY-MM-DD
  elephantId: 'margo' | 'audrey' | 'pretty';
  elephantName: string;
  poopCount: number; // piles
  stoolTrait: 'dense' | 'dry' | 'liquid';
  urineCount: number; // times
  urineTrait: 'clear' | 'light' | 'turbid' | 'dark' | 'sediment';
  sleepHours: number; // total hours
  sleepPhases: SleepPhaseItem[];
}

export interface VetRecommendation {
  id: string;
  elephantId: 'margo' | 'audrey' | 'pretty';
  elephantName: string;
  photoId?: string;
  photoUrl?: string;
  diagnosis: string;
  treatmentCourse: string;
  date: string;
  time: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export type ElephantHealthException = ElephantHealthExceptions;

const BODY_PHOTOS_KEY = 'elephant_body_monitoring_photos';
const VET_REMINDERS_KEY = 'elephant_vet_reminders';
const HEALTH_EXCEPTIONS_KEY = 'elephant_health_exceptions';
const VET_RECOMMENDATIONS_KEY = 'elephant_vet_recommendations';
const PHYSIO_RECORDS_KEY = 'elephant_physio_records_v1';

function generateInitialPhysioRecords(): DailyPhysioRecord[] {
  const records: DailyPhysioRecord[] = [];
  const elephants: Array<{ id: 'margo' | 'audrey' | 'pretty'; name: string; basePoop: number; baseUrine: number; baseSleep: number }> = [
    { id: 'margo', name: 'Марго', basePoop: 15, baseUrine: 10, baseSleep: 4.5 },
    { id: 'audrey', name: 'Одри', basePoop: 14, baseUrine: 9, baseSleep: 4.0 },
    { id: 'pretty', name: 'Прэтти', basePoop: 16, baseUrine: 11, baseSleep: 4.8 },
  ];

  const today = new Date();
  for (let d = 13; d >= 0; d--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];

    elephants.forEach(el => {
      // Deterministic variations based on date & elephant
      const seed = (d * 7 + (el.id === 'margo' ? 1 : el.id === 'audrey' ? 2 : 3)) % 5;
      const poopDelta = (seed % 3) - 1; // -1, 0, 1
      const urineDelta = (seed % 2) === 0 ? 0 : (seed > 2 ? 1 : -1);
      const sleepVariation = (seed === 0 ? 0.5 : seed === 1 ? -0.4 : seed === 2 ? 0.2 : -0.2);

      const poopCount = Math.max(10, el.basePoop + poopDelta + (d === 3 && el.id === 'margo' ? -2 : 0));
      const urineCount = Math.max(6, el.baseUrine + urineDelta);
      const sleepHours = Math.round((el.baseSleep + sleepVariation) * 10) / 10;

      const stoolTrait: 'dense' | 'dry' | 'liquid' = (d === 4 && el.id === 'audrey') ? 'dry' : (d === 8 && el.id === 'pretty') ? 'dry' : 'dense';
      const urineTrait: 'clear' | 'turbid' | 'dark' = (d === 2 && el.id === 'margo') ? 'turbid' : 'clear';

      const p1 = Math.round((sleepHours * 0.45) * 10) / 10;
      const p2 = Math.round((sleepHours - p1) * 10) / 10;
      const sleepPhases: SleepPhaseItem[] = [
        { id: `phase-1-${dateStr}-${el.id}`, hours: p1, timestamp: '01:30' },
        { id: `phase-2-${dateStr}-${el.id}`, hours: p2, timestamp: '04:15' },
      ];

      records.push({
        id: `physio-${dateStr}-${el.id}`,
        date: dateStr,
        elephantId: el.id,
        elephantName: el.name,
        poopCount,
        stoolTrait,
        urineCount,
        urineTrait,
        sleepHours,
        sleepPhases,
      });
    });
  }

  return records;
}

const INITIAL_VET_RECOMMENDATIONS: VetRecommendation[] = [
  {
    id: 'rec-1',
    elephantId: 'margo',
    elephantName: 'Марго',
    photoId: 'photo-seed-1',
    photoUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=400&q=80',
    diagnosis: 'Сухость подошвенного рога стопы ПП, микротрещина венчика',
    treatmentCourse: 'Обрабатывать дегтярно-ихтиоловой мазью 2 раза в день 5 дней. Не допускать забивания песком.',
    date: '2026-09-16',
    time: '10:30',
    acknowledged: false,
  },
];

// Sample pre-seeded photos so the vet and keeper immediately see realistic history
const INITIAL_BODY_PHOTOS: BodyPhoto[] = [
  {
    id: 'photo-seed-1',
    elephantId: 'margo',
    elephantName: 'Марго',
    type: 'foot',
    foot: 'ПП',
    date: '2026-09-10',
    time: '11:20',
    dataUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=400&q=80',
    note: 'Еженедельный чек стопы ПП: подошвенный рог гладкий, венчик без трещин.',
  },
  {
    id: 'photo-seed-2',
    elephantId: 'margo',
    elephantName: 'Марго',
    type: 'silhouette',
    date: '2026-09-01',
    time: '14:45',
    dataUrl: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=400&q=80',
    note: 'Кондиция 3/5 (оптимальная упитанность), ямки височные не запавшие.',
  },
  {
    id: 'photo-seed-3',
    elephantId: 'audrey',
    elephantName: 'Одри',
    type: 'foot',
    foot: 'ЛП',
    date: '2026-09-12',
    time: '10:15',
    dataUrl: 'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=400&q=80',
    note: 'Контроль ногтя ЛП. Без воспалений.',
  },
  {
    id: 'photo-seed-4',
    elephantId: 'pretty',
    elephantName: 'Прэтти',
    type: 'silhouette',
    date: '2026-09-05',
    time: '16:00',
    dataUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=400&q=80',
    note: 'Боковой профиль: форма брюха и тазовой зоны в пределах нормы.',
  },
];

const INITIAL_VET_REMINDERS: VetReminderTask[] = [
  {
    id: 'rem-1',
    elephantId: 'all',
    elephantName: 'Все слонихи',
    text: 'В четверг дать витамины группы B в вечернюю кашу',
    date: new Date().toISOString().split('T')[0],
    completed: false,
  },
  {
    id: 'rem-2',
    elephantId: 'margo',
    elephantName: 'Марго',
    text: 'Осмотреть подошву ПП после прогулки (плановый осмотр)',
    date: new Date().toISOString().split('T')[0],
    completed: true,
    completedAt: '12:30',
    completedBy: 'Кипер дежурный',
  },
];

const INITIAL_EXCEPTIONS: Record<string, ElephantHealthExceptions> = {
  margo: { didNotSleep: false, lameness: false },
  audrey: { didNotSleep: false, lameness: false },
  pretty: { didNotSleep: false, lameness: false },
};

export const bodyMonitoringService = {
  // Photos
  getPhotos(): BodyPhoto[] {
    try {
      const stored = localStorage.getItem(BODY_PHOTOS_KEY);
      if (!stored) {
        localStorage.setItem(BODY_PHOTOS_KEY, JSON.stringify(INITIAL_BODY_PHOTOS));
        return INITIAL_BODY_PHOTOS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_BODY_PHOTOS;
    }
  },

  addPhoto(photo: Omit<BodyPhoto, 'id'>): BodyPhoto {
    const all = this.getPhotos();
    const newPhoto: BodyPhoto = {
      ...photo,
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    const updated = [newPhoto, ...all];
    try {
      localStorage.setItem(BODY_PHOTOS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save photo to localStorage', e);
    }
    window.dispatchEvent(new CustomEvent('elephant-photos-updated', { detail: newPhoto }));
    return newPhoto;
  },

  deletePhoto(id: string): void {
    const all = this.getPhotos();
    const updated = all.filter(p => p.id !== id);
    localStorage.setItem(BODY_PHOTOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-photos-updated'));
  },

  // Reminders / Tasks from Vet to Keeper
  getReminders(): VetReminderTask[] {
    try {
      const stored = localStorage.getItem(VET_REMINDERS_KEY);
      if (!stored) {
        localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(INITIAL_VET_REMINDERS));
        return INITIAL_VET_REMINDERS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_VET_REMINDERS;
    }
  },

  addReminder(text: string, elephantId: 'all' | 'margo' | 'audrey' | 'pretty' = 'all'): VetReminderTask {
    const all = this.getReminders();
    const names = {
      all: 'Все слонихи',
      margo: 'Марго',
      audrey: 'Одри',
      pretty: 'Прэтти',
    };
    const newTask: VetReminderTask = {
      id: `rem-${Date.now()}`,
      elephantId,
      elephantName: names[elephantId],
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
      completed: false,
    };
    const updated = [newTask, ...all];
    localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-reminders-updated', { detail: newTask }));
    return newTask;
  },

  toggleReminder(id: string, keeperName: string = 'Кипер'): VetReminderTask | null {
    const all = this.getReminders();
    let updatedTask: VetReminderTask | null = null;
    const updated = all.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        updatedTask = {
          ...t,
          completed: nextState,
          completedAt: nextState ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : undefined,
          completedBy: nextState ? keeperName : undefined,
        };
        return updatedTask;
      }
      return t;
    });
    localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-reminders-updated', { detail: updatedTask }));
    return updatedTask;
  },

  deleteReminder(id: string): void {
    const all = this.getReminders();
    const updated = all.filter(t => t.id !== id);
    localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-reminders-updated'));
  },

  // Health Exceptions (Reporting by Exception)
  getExceptions(): Record<string, ElephantHealthExceptions> {
    try {
      const stored = localStorage.getItem(HEALTH_EXCEPTIONS_KEY);
      if (!stored) {
        localStorage.setItem(HEALTH_EXCEPTIONS_KEY, JSON.stringify(INITIAL_EXCEPTIONS));
        return INITIAL_EXCEPTIONS;
      }
      return { ...INITIAL_EXCEPTIONS, ...JSON.parse(stored) };
    } catch {
      return INITIAL_EXCEPTIONS;
    }
  },

  setElephantException(elephantId: string, updates: Partial<ElephantHealthExceptions>): void {
    const all = this.getExceptions();
    const current = all[elephantId] || { didNotSleep: false, lameness: false };
    const updated = {
      ...all,
      [elephantId]: {
        ...current,
        ...updates,
      },
    };
    localStorage.setItem(HEALTH_EXCEPTIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-exceptions-updated', { detail: { elephantId, updates } }));
  },

  // Vet Recommendations linked to photos
  getRecommendations(): VetRecommendation[] {
    try {
      const stored = localStorage.getItem(VET_RECOMMENDATIONS_KEY);
      if (!stored) {
        localStorage.setItem(VET_RECOMMENDATIONS_KEY, JSON.stringify(INITIAL_VET_RECOMMENDATIONS));
        return INITIAL_VET_RECOMMENDATIONS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_VET_RECOMMENDATIONS;
    }
  },

  addRecommendation(rec: {
    elephantId: 'margo' | 'audrey' | 'pretty';
    elephantName: string;
    photoId?: string;
    photoUrl?: string;
    diagnosis: string;
    treatmentCourse: string;
  }): VetRecommendation {
    const all = this.getRecommendations();
    const newRec: VetRecommendation = {
      ...rec,
      id: `rec-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      acknowledged: false,
    };
    const updated = [newRec, ...all];
    localStorage.setItem(VET_RECOMMENDATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-recommendations-updated', { detail: newRec }));
    return newRec;
  },

  acknowledgeRecommendation(id: string, keeperName: string = 'Кипер'): VetRecommendation | null {
    const all = this.getRecommendations();
    let updatedRec: VetRecommendation | null = null;
    const updated = all.map(r => {
      if (r.id === id) {
        updatedRec = {
          ...r,
          acknowledged: true,
          acknowledgedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          acknowledgedBy: keeperName,
        };
        return updatedRec;
      }
      return r;
    });
    localStorage.setItem(VET_RECOMMENDATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-recommendations-updated', { detail: updatedRec }));
    return updatedRec;
  },

  // Daily Physiology Records (Poop / Urine / Sleep & Phases)
  getPhysioRecords(): DailyPhysioRecord[] {
    try {
      const stored = localStorage.getItem(PHYSIO_RECORDS_KEY);
      if (!stored) {
        const initial = generateInitialPhysioRecords();
        localStorage.setItem(PHYSIO_RECORDS_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored);
    } catch {
      return generateInitialPhysioRecords();
    }
  },

  saveDailyPhysio(record: Omit<DailyPhysioRecord, 'id'> & { id?: string }): DailyPhysioRecord {
    const all = this.getPhysioRecords();
    const id = record.id || `physio-${record.date}-${record.elephantId}`;
    const existingIndex = all.findIndex(r => r.id === id || (r.date === record.date && r.elephantId === record.elephantId));

    const finalRecord: DailyPhysioRecord = {
      ...record,
      id,
    };

    let updated: DailyPhysioRecord[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = finalRecord;
    } else {
      updated = [finalRecord, ...all];
    }

    try {
      localStorage.setItem(PHYSIO_RECORDS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save physio record', e);
    }
    window.dispatchEvent(new CustomEvent('elephant-physio-updated', { detail: finalRecord }));
    return finalRecord;
  },

  deletePhysioRecord(id: string): void {
    const all = this.getPhysioRecords();
    const updated = all.filter(r => r.id !== id);
    localStorage.setItem(PHYSIO_RECORDS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elephant-physio-updated'));
  },

  resetPhysioRecords(): DailyPhysioRecord[] {
    const initial = generateInitialPhysioRecords();
    localStorage.setItem(PHYSIO_RECORDS_KEY, JSON.stringify(initial));
    window.dispatchEvent(new CustomEvent('elephant-physio-updated'));
    return initial;
  },
};
