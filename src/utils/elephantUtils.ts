import { Elephant } from '../types';

export type ElephantSlug = 'margo' | 'audrey' | 'pretty';

export interface ElephantMeta {
  id: ElephantSlug;
  name: string;
  focus: string;
  icon: string;
}

export const ELEPHANTS_META: readonly ElephantMeta[] = [
  { id: 'margo', name: 'Марго', focus: 'Контроль массы', icon: '🐘' },
  { id: 'audrey', name: 'Одри', focus: 'Подросток / Рост', icon: '🐘' },
  { id: 'pretty', name: 'Прэтти', focus: 'Возрастная / Суставы', icon: '🐘' }
] as const;

/**
 * Normalizes any elephant identifier (slug, Russian name, or Supabase UUID)
 * to one of the strict 3 canonical slugs: 'margo' | 'audrey' | 'pretty'.
 */
export function normalizeElephantSlug(
  idOrSlugOrName: string | undefined | null,
  storeElephants?: Elephant[]
): ElephantSlug {
  if (!idOrSlugOrName) return 'margo';

  const raw = String(idOrSlugOrName).trim();
  const lower = raw.toLowerCase();

  // 1. Direct slug or name checks
  if (lower === 'margo' || lower.includes('марго') || lower.includes('марг')) {
    return 'margo';
  }
  if (lower === 'audrey' || lower === 'odri' || lower.includes('одри') || lower.includes('одр')) {
    return 'audrey';
  }
  if (lower === 'pretty' || lower.includes('прэтти') || lower.includes('претти') || lower.includes('прэт') || lower.includes('прет')) {
    return 'pretty';
  }

  // 2. Check store elephants (matching by UUID)
  if (storeElephants && storeElephants.length > 0) {
    const matched = storeElephants.find(e => e.id === raw);
    if (matched && matched.name) {
      const matchLower = matched.name.toLowerCase();
      if (matchLower.includes('марг')) return 'margo';
      if (matchLower.includes('одр')) return 'audrey';
      if (matchLower.includes('прэт') || matchLower.includes('прет')) return 'pretty';
    }

    // Fallback: match by index if array of 3 elephants
    const idx = storeElephants.findIndex(e => e.id === raw);
    if (idx === 0) return 'margo';
    if (idx === 1) return 'audrey';
    if (idx === 2) return 'pretty';
  }

  return 'margo';
}

/**
 * Returns the proper Russian display name ('Марго', 'Одри', 'Прэтти')
 * for any given elephant identifier (slug, UUID, or name).
 * Never returns a raw UUID.
 */
export function getElephantName(
  idOrSlugOrName: string | undefined | null,
  storeElephants?: Elephant[]
): string {
  if (!idOrSlugOrName) return 'Марго';

  const raw = String(idOrSlugOrName).trim();

  // If already a recognized Russian name
  if (raw === 'Марго' || raw === 'Одри' || raw === 'Прэтти') {
    return raw;
  }

  // Check store elephants if it's a UUID
  if (storeElephants && storeElephants.length > 0) {
    const matched = storeElephants.find(e => e.id === raw);
    if (matched && matched.name && !matched.name.includes('-')) {
      return matched.name;
    }
  }

  // Resolve via normalized slug
  const slug = normalizeElephantSlug(raw, storeElephants);
  switch (slug) {
    case 'margo':
      return 'Марго';
    case 'audrey':
      return 'Одри';
    case 'pretty':
      return 'Прэтти';
    default:
      return 'Марго';
  }
}
