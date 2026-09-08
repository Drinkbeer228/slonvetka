const STORAGE_KEY = 'slonovet_medicines_v1';

const DEFAULT_MEDICINES = [
  'Тобрекс',
  'Ципровет',
  'Флоксал',
  'Офтальмоферон',
  'Хлоргексидин',
  'Левомиколь',
  'АСД-3',
  'Йод',
  'Перекись водорода 3%',
  'Цинковая мазь'
];

export function getLocalMedicines(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEDICINES));
      return DEFAULT_MEDICINES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local medicines', err);
    return DEFAULT_MEDICINES;
  }
}

export function addLocalMedicine(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return getLocalMedicines();
  const current = getLocalMedicines();
  if (!current.includes(trimmed)) {
    const updated = [trimmed, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save medicine', err);
    }
    return updated;
  }
  return current;
}
