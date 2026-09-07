import { supabase } from './supabase';
import { getPendingDrafts, getDraftPhotos, updateDraftStatus, deleteDraft } from './offlineDb';

let isSyncing = false;

export async function flushSyncQueue() {
  if (isSyncing) return;
  isSyncing = true;
  
  try {
    const drafts = await getPendingDrafts();
    if (drafts.length === 0) {
      isSyncing = false;
      return;
    }
    
    // Attempt sync for each pending draft
    for (const draft of drafts) {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        // Stop syncing if auth is missing
        await updateDraftStatus(draft.id, 'failed', 'AUTH_REQUIRED: Необходима авторизация');
        break;
      }
      
      try {
        await updateDraftStatus(draft.id, 'syncing');
        
        // 1. Send record to public.treatment_records
        const { data: recordData, error: recordError } = await supabase
          .from('treatment_records')
          .insert({
            assignment_id: draft.assignmentId,
            elephant_id: draft.elephantId,
            keeper_id: draft.keeperId,
            performed_at: draft.performedAt,
            assessment: draft.assessment,
            medicine_used: draft.medicineUsed,
            comment: draft.comment
          })
          .select('id')
          .single();
          
        if (recordError) throw recordError;
        const recordId = recordData.id;
        
        // 2. Get associated photos
        const photos = await getDraftPhotos(draft.id);
        
        // 3. Upload photos to Storage
        for (const photo of photos) {
          const filePath = `${draft.elephantId}/${recordId}_${photo.photoType}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('elephant-treatments')
            .upload(filePath, photo.blob, {
              contentType: 'image/jpeg',
              upsert: true
            });
            
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabase.storage
            .from('elephant-treatments')
            .getPublicUrl(filePath);
            
          // 4. Create record in public.treatment_photos
          const { error: photoMetaError } = await supabase
            .from('treatment_photos')
            .insert({
              treatment_record_id: recordId,
              storage_path: filePath,
              photo_type: photo.photoType
            });
            
          if (photoMetaError) throw photoMetaError;
        }
        
        // Success! Remove from IndexedDB
        await deleteDraft(draft.id);
        
        // Dispatch custom event to notify UI
        window.dispatchEvent(new CustomEvent('syncComplete', { detail: { draftId: draft.id } }));
        
      } catch (err: any) {
        console.error('Failed to sync draft', draft.id, err);
        await updateDraftStatus(draft.id, 'failed', err.message || 'Ошибка синхронизации');
        window.dispatchEvent(new CustomEvent('syncFailed', { detail: { draftId: draft.id, error: err.message } }));
      }
    }
  } finally {
    isSyncing = false;
  }
}

// Setup listeners for auto-sync
export function initSyncManager() {
  window.addEventListener('online', flushSyncQueue);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushSyncQueue();
    }
  });
  
  // Try sync on startup
  flushSyncQueue();
}
