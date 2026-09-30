import { Elephant } from '../types';

/**
 * Universal Elephant identifier (supports canonical slugs, UUIDs, or custom elephant IDs)
 */
export type ElephantSlug = string;

export interface ElephantMeta {
  id: string;
  name: string;
  focus?: string;
  icon?: string;
}

export const ELEPHANTS_META: readonly ElephantMeta[] = [
  { id: 'margo', name: 'Марго', focus: 'Контроль массы', icon: '🐘' },
  { id: 'audrey', name: 'Одри', focus: 'Подросток / Рост', icon: '🐘' },
  { id: 'pretty', name: 'Прэтти', focus: 'Возрастная / Суставы', icon: '🐘' },
];

/**
 * Normalizes any elephant identifier (slug, Russian name, or Supabase UUID)
 * Supports dynamic elephants beyond the initial 3.
 */
export function normalizeElephantSlug(
  idOrSlugOrName: string | undefined | null,
  storeElephants?: Elephant[]
): string {
  if (!idOrSlugOrName) return storeElephants?.[0]?.id || 'margo';

  const raw = String(idOrSlugOrName).trim();
  const lower = raw.toLowerCase();

  // 1. Direct match by store elephants (by ID or Name)
  if (storeElephants && storeElephants.length > 0) {
    const matched = storeElephants.find(
      e => e.id.toLowerCase() === lower || e.name.toLowerCase() === lower
    );
    if (matched) return matched.id;
  }

  // 2. Canonical slug matching
  if (lower === 'margo' || lower.includes('марго') || lower.includes('марг')) return 'margo';
  if (lower === 'audrey' || lower === 'odri' || lower.includes('одри') || lower.includes('одр')) return 'audrey';
  if (lower === 'pretty' || lower.includes('прэтти') || lower.includes('претти') || lower.includes('прэт') || lower.includes('прет')) return 'pretty';

  // 3. Fallback: return raw ID for dynamically added elephants
  return raw;
}

/**
 * Returns the proper display name for any given elephant identifier (slug, UUID, or name).
 * Dynamically resolves from storeElephants if available.
 */
export function getElephantName(
  idOrSlugOrName: string | undefined | null,
  storeElephants?: Elephant[]
): string {
  if (!idOrSlugOrName) return storeElephants?.[0]?.name || 'Марго';

  const raw = String(idOrSlugOrName).trim();

  // 1. Check store elephants (by ID or name)
  if (storeElephants && storeElephants.length > 0) {
    const matched = storeElephants.find(
      e => e.id === raw || e.name.toLowerCase() === raw.toLowerCase()
    );
    if (matched && matched.name) return matched.name;
  }

  // 2. Check canonical names
  const lower = raw.toLowerCase();
  if (lower === 'margo' || lower.includes('марг')) return 'Марго';
  if (lower === 'audrey' || lower.includes('одр')) return 'Одри';
  if (lower === 'pretty' || lower.includes('прет') || lower.includes('прэт')) return 'Прэтти';

  // 3. Dynamic fallback
  return raw;
}
