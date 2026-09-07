import { supabase } from '../lib/supabase';
import { getOfflineDb, TreatmentRecordQueueItem, PhotoQueueItem } from './offlineDb';

class SyncManagerClass {
  private isSyncing = false;
  private backoffTimer: NodeJS.Timeout | null = null;
  private backoffMs = 2000;

  async saveRecordLocally(
    payload: TreatmentRecordQueueItem['payload'],
    photoBlob: Blob | null,
    photoType: 'single' | 'before' | 'after' = 'single'
  ): Promise<string> {
    const temp_id = crypto.randomUUID();
    const db = await getOfflineDb();
    
    const record: TreatmentRecordQueueItem = {
      temp_id,
      payload,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const tx = db.transaction(['records_queue', 'photos_queue'], 'readwrite');
    await tx.objectStore('records_queue').put(record);

    if (photoBlob) {
      const temp_photo_id = crypto.randomUUID();
      const photo: PhotoQueueItem = {
        temp_photo_id,
        temp_record_id: temp_id,
        file_blob: photoBlob,
        elephant_id: payload.elephant_id,
        photo_type: photoType,
        created_at: new Date().toISOString(),
      };
      await tx.objectStore('photos_queue').put(photo);
    }
    await tx.done;

    // Trigger sync asynchronously without awaiting
    setTimeout(() => this.triggerSync(), 100);

    return temp_id;
  }

  async triggerSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      const db = await getOfflineDb();
      const records = await db.getAll('records_queue');
      const pendingRecords = records.filter(r => r.status === 'pending' || r.status === 'error');

      if (pendingRecords.length === 0) {
        this.isSyncing = false;
        this.resetBackoff();
        return; // Nothing to sync
      }

      // Check auth status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        this.isSyncing = false;
        return; // Stop if not authenticated
      }

      for (const record of pendingRecords) {
        // Mark as syncing
        await this.updateRecordStatus(record.temp_id, 'syncing');

        try {
          // Check for photos
          const photos = await db.getAllFromIndex('photos_queue', 'by-recordId', record.temp_id);
          
          let uploadedPhotoPath: string | null = null;

          if (photos.length > 0) {
            const photo = photos[0]; // Assuming one photo for simplicity based on our schema
            const filePath = `${record.payload.elephant_id}/${record.temp_id}_${photo.photo_type}.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from('elephant-treatments')
              .upload(filePath, photo.file_blob, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) throw uploadError;
            uploadedPhotoPath = filePath;
          }

          // 3. Send record
          const { data: recordData, error: recordError } = await supabase
            .from('treatment_records')
            .insert({
              ...record.payload
            })
            .select('id')
            .single();

          if (recordError) throw recordError;

          if (uploadedPhotoPath && photos.length > 0) {
            // Send photo meta
            const { error: photoMetaError } = await supabase
              .from('treatment_photos')
              .insert({
                treatment_record_id: recordData.id,
                storage_path: uploadedPhotoPath,
                photo_type: photos[0].photo_type
              });
              
            if (photoMetaError) throw photoMetaError;
          }

          // 4. Success, delete from DB
          const tx = db.transaction(['records_queue', 'photos_queue'], 'readwrite');
          await tx.objectStore('records_queue').delete(record.temp_id);
          for (const photo of photos) {
            await tx.objectStore('photos_queue').delete(photo.temp_photo_id);
          }
          await tx.done;

          window.dispatchEvent(new CustomEvent('syncComplete', { detail: { tempId: record.temp_id } }));

        } catch (err: any) {
          console.error('Network or sync error for record', record.temp_id, err);
          await this.updateRecordStatus(record.temp_id, 'error', err.message);
          
          // Schedule backoff
          this.scheduleBackoff();
          break; // Stop syncing loop on first network error
        }
      }
      
      this.resetBackoff();

    } finally {
      this.isSyncing = false;
    }
  }

  private async updateRecordStatus(tempId: string, status: TreatmentRecordQueueItem['status'], errorMessage?: string) {
    const db = await getOfflineDb();
    const record = await db.get('records_queue', tempId);
    if (record) {
      record.status = status;
      if (errorMessage) record.errorMessage = errorMessage;
      await db.put('records_queue', record);
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('syncStatusChange', { detail: { tempId, status } }));
    }
  }

  private scheduleBackoff() {
    if (this.backoffTimer) return; // Already scheduled
    this.backoffTimer = setTimeout(() => {
      this.backoffTimer = null;
      this.backoffMs = Math.min(this.backoffMs * 2, 60000); // Max 1 minute backoff
      this.triggerSync();
    }, this.backoffMs);
  }

  private resetBackoff() {
    this.backoffMs = 2000;
  }
}

export const SyncManager = new SyncManagerClass();

// Auto setup
export function initSyncManager() {
  window.addEventListener('online', () => {
    SyncManager.triggerSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      SyncManager.triggerSync();
    }
  });
  
  // Try on load
  SyncManager.triggerSync();
}
