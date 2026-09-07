import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface TreatmentDraft {
  id: string; // UUID/nanoid
  assignmentId: string | null;
  elephantId: string;
  keeperId: string;
  performedAt: string; // ISO timestamp
  assessment: string | null;
  medicineUsed: string | null;
  comment: string | null;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
  createdAt: string; // ISO timestamp
}

export interface DraftPhoto {
  id: string;
  draftId: string;
  blob: Blob;
  photoType: 'single' | 'before' | 'after';
}

interface SlonovetDB extends DBSchema {
  treatmentDrafts: {
    key: string;
    value: TreatmentDraft;
  };
  draftPhotos: {
    key: string;
    value: DraftPhoto;
    indexes: { 'by-draftId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<SlonovetDB>> | null = null;

export function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB<SlonovetDB>('slonovet_local_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('treatmentDrafts')) {
          db.createObjectStore('treatmentDrafts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('draftPhotos')) {
          const photoStore = db.createObjectStore('draftPhotos', { keyPath: 'id' });
          photoStore.createIndex('by-draftId', 'draftId');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDraft(draft: TreatmentDraft, photos: Omit<DraftPhoto, 'id' | 'draftId'>[]) {
  const db = await getOfflineDb();
  const tx = db.transaction(['treatmentDrafts', 'draftPhotos'], 'readwrite');
  
  await tx.objectStore('treatmentDrafts').put(draft);
  
  for (const photo of photos) {
    await tx.objectStore('draftPhotos').put({
      ...photo,
      draftId: draft.id,
      id: crypto.randomUUID(),
    });
  }
  
  await tx.done;
}

export async function getPendingDrafts(): Promise<TreatmentDraft[]> {
  const db = await getOfflineDb();
  const drafts = await db.getAll('treatmentDrafts');
  return drafts.filter(d => d.status === 'pending' || d.status === 'failed');
}

export async function getDraftPhotos(draftId: string): Promise<DraftPhoto[]> {
  const db = await getOfflineDb();
  return db.getAllFromIndex('draftPhotos', 'by-draftId', draftId);
}

export async function updateDraftStatus(draftId: string, status: TreatmentDraft['status'], errorMessage?: string) {
  const db = await getOfflineDb();
  const draft = await db.get('treatmentDrafts', draftId);
  if (draft) {
    draft.status = status;
    if (errorMessage !== undefined) draft.errorMessage = errorMessage;
    await db.put('treatmentDrafts', draft);
  }
}

export async function deleteDraft(draftId: string) {
  const db = await getOfflineDb();
  const tx = db.transaction(['treatmentDrafts', 'draftPhotos'], 'readwrite');
  
  await tx.objectStore('treatmentDrafts').delete(draftId);
  
  const photos = await tx.objectStore('draftPhotos').index('by-draftId').getAll(draftId);
  for (const photo of photos) {
    await tx.objectStore('draftPhotos').delete(photo.id);
  }
  
  await tx.done;
}
