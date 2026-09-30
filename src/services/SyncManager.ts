import { supabase } from '../lib/supabase';
import { getOfflineDb, TreatmentRecordQueueItem, PhotoQueueItem } from './offlineDb';

class SyncManagerClass {
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

  async triggerSync(): Promise<void> {
    // Используем Web Locks API для предотвращения одновременной синхронизации
    // из нескольких вкладок / вызовов
    if (!('locks' in navigator)) {
      // Fallback для браузеров без Web Locks — простой in-memory флаг
      await this._doSync();
      return;
    }

    try {
      await navigator.locks.request('slonvet_sync_lock', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          // Другая вкладка уже синхронизирует — пропускаем
          return;
        }
        await this._doSync();
      });
    } catch (err) {
      console.error('SyncManager lock error:', err);
    }
  }

  private async _doSync(): Promise<void> {
    try {
      const db = await getOfflineDb();
      const records = await db.getAll('records_queue');
      const pendingRecords = records.filter(r => r.status === 'pending' || r.status === 'error');

      if (pendingRecords.length === 0) {
        this.resetBackoff();
        return;
      }

      // Check auth status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return; // Stop if not authenticated
      }

      for (const record of pendingRecords) {
        // Mark as syncing
        await this.updateRecordStatus(record.temp_id, 'syncing');

        let uploadedPhotoPath: string | null = null;
        const photos = await db.getAllFromIndex('photos_queue', 'by-recordId', record.temp_id);

        try {
          // 1. Upload photo (if present)
          if (photos.length > 0) {
            const photo = photos[0];
            const filePath = `${sessionData.session.user.id}/${record.payload.elephant_id}/${record.temp_id}_${photo.photo_type}.jpg`;

            const { error: uploadError } = await supabase.storage
              .from('elephant-treatments')
              .upload(filePath, photo.file_blob, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              throw new Error('Storage Error: ' + uploadError.message);
            }
            uploadedPhotoPath = filePath;
          }

          // 2. Insert treatment record
          const { data: recordData, error: recordError } = await supabase
            .from('treatment_records')
            .insert({
              ...record.payload,
              keeper_id: sessionData.session.user.id
            })
            .select('id')
            .single();

          if (recordError) {
            // ROLLBACK: если запись не удалась, но фото уже загружено — удаляем фото
            if (uploadedPhotoPath) {
              await supabase.storage
                .from('elephant-treatments')
                .remove([uploadedPhotoPath])
                .catch(e => console.warn('Rollback photo delete failed:', e));
            }
            throw new Error('Record Error: ' + recordError.message);
          }

          // 3. Insert photo metadata (after successful record insert)
          if (uploadedPhotoPath && photos.length > 0 && recordData) {
            const { error: photoMetaError } = await supabase
              .from('treatment_photos')
              .insert({
                treatment_record_id: recordData.id,
                storage_path: uploadedPhotoPath,
                photo_type: photos[0].photo_type
              });

            if (photoMetaError) {
              console.warn('Photo metadata insert failed (non-fatal):', photoMetaError.message);
              // Не бросаем ошибку — запись создана, фото просто не прикреплено
            }
          }

          // 4. Success — delete from IDB
          const tx = db.transaction(['records_queue', 'photos_queue'], 'readwrite');
          await tx.objectStore('records_queue').delete(record.temp_id);
          for (const photo of photos) {
            await tx.objectStore('photos_queue').delete(photo.temp_photo_id);
          }
          await tx.done;

          window.dispatchEvent(new CustomEvent('syncComplete', { detail: { tempId: record.temp_id } }));

        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('Sync error for record', record.temp_id, message);
          await this.updateRecordStatus(record.temp_id, 'error', message);

          this.scheduleBackoff();
          break; // Stop syncing loop on first error
        }
      }

      this.resetBackoff();

    } catch (outerErr) {
      console.error('SyncManager outer error:', outerErr);
    }
  }

  private async updateRecordStatus(
    tempId: string,
    status: TreatmentRecordQueueItem['status'],
    errorMessage?: string
  ): Promise<void> {
    const db = await getOfflineDb();
    const record = await db.get('records_queue', tempId);
    if (record) {
      record.status = status;
      if (errorMessage) record.errorMessage = errorMessage;
      await db.put('records_queue', record);
      window.dispatchEvent(new CustomEvent('syncStatusChange', { detail: { tempId, status } }));
    }
  }

  private scheduleBackoff(): void {
    if (this.backoffTimer) return;
    this.backoffTimer = setTimeout(() => {
      this.backoffTimer = null;
      this.backoffMs = Math.min(this.backoffMs * 2, 60000);
      this.triggerSync();
    }, this.backoffMs);
  }

  private resetBackoff(): void {
    this.backoffMs = 2000;
  }
}

export const SyncManager = new SyncManagerClass();

export function initSyncManager(): void {
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
