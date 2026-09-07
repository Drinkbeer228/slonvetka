import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Elephant, Assignment } from '../types';

export interface TreatmentRecordQueueItem {
  temp_id: string; // UUID/nanoid
  payload: {
    assignment_id: string | null;
    elephant_id: string;
    keeper_id: string;
    performed_at: string; // ISO timestamp
    assessment: string | null;
    medicine_used: string | null;
    comment: string | null;
  };
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  created_at: string; // ISO timestamp
}

export interface PhotoQueueItem {
  temp_photo_id: string;
  temp_record_id: string;
  file_blob: Blob;
  elephant_id: string;
  photo_type: 'single' | 'before' | 'after';
  created_at: string; // ISO timestamp
}

interface SlonovetDB extends DBSchema {
  records_queue: {
    key: string;
    value: TreatmentRecordQueueItem;
  };
  photos_queue: {
    key: string;
    value: PhotoQueueItem;
    indexes: { 'by-recordId': string };
  };
  cached_elephants: {
    key: string;
    value: Elephant;
  };
  cached_assignments: {
    key: string;
    value: Assignment;
  };
}

let dbPromise: Promise<IDBPDatabase<SlonovetDB>> | null = null;

export function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB<SlonovetDB>('slonvet_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('records_queue')) {
          db.createObjectStore('records_queue', { keyPath: 'temp_id' });
        }
        if (!db.objectStoreNames.contains('photos_queue')) {
          const photoStore = db.createObjectStore('photos_queue', { keyPath: 'temp_photo_id' });
          photoStore.createIndex('by-recordId', 'temp_record_id');
        }
        if (!db.objectStoreNames.contains('cached_elephants')) {
          db.createObjectStore('cached_elephants', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached_assignments')) {
          db.createObjectStore('cached_assignments', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheElephants(elephants: Elephant[]) {
  const db = await getOfflineDb();
  const tx = db.transaction('cached_elephants', 'readwrite');
  await tx.objectStore('cached_elephants').clear();
  for (const elephant of elephants) {
    await tx.objectStore('cached_elephants').put(elephant);
  }
  await tx.done;
}

export async function getCachedElephants(): Promise<Elephant[]> {
  const db = await getOfflineDb();
  return db.getAll('cached_elephants');
}

export async function cacheAssignments(assignments: Assignment[]) {
  const db = await getOfflineDb();
  const tx = db.transaction('cached_assignments', 'readwrite');
  await tx.objectStore('cached_assignments').clear();
  for (const asg of assignments) {
    await tx.objectStore('cached_assignments').put(asg);
  }
  await tx.done;
}

export async function getCachedAssignments(): Promise<Assignment[]> {
  const db = await getOfflineDb();
  return db.getAll('cached_assignments');
}
