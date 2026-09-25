import { supabase } from '../lib/supabase';
import { 
  Profile, Elephant, Assignment, TreatmentRecord, 
  TreatmentPhoto, TreatmentRecordWithPhotos 
} from '../types';

const urlCache = new Map<string, { url: string, expiresAt: number }>();

export const supabaseService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('Supabase getProfile notice:', error.message || error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getProfile):', err);
      return null;
    }
  },

  async getElephants(): Promise<Elephant[]> {
    try {
      const { data, error } = await supabase
        .from('elephants')
        .select('*')
        .order('name');
      if (error) {
        console.warn('Supabase getElephants notice:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getElephants):', err);
      return [];
    }
  },

  async getActiveAssignments(): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase getActiveAssignments notice:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getActiveAssignments):', err);
      return [];
    }
  },

  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase getAllAssignments notice:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getAllAssignments):', err);
      return [];
    }
  },

  async getAssignmentsByElephant(elephantId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('elephant_id', elephantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase getAssignmentsByElephant notice:', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getAssignmentsByElephant):', err);
      return [];
    }
  },

  async getTodayRecords(): Promise<TreatmentRecordWithPhotos[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoString = today.toISOString();

      const { data, error } = await supabase
        .from('treatment_records')
        .select(`
          *,
          photos:treatment_photos(*),
          keeper:profiles(id, name)
        `)
        .gte('performed_at', isoString);

      if (error) {
        console.warn('Supabase getTodayRecords notice:', error.message || error);
        return [];
      }
      return (data as any) || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getTodayRecords):', err);
      return [];
    }
  },

  async getRecordsByDate(dateStr: string): Promise<TreatmentRecordWithPhotos[]> {
    try {
      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('treatment_records')
        .select(`
          *,
          photos:treatment_photos(*),
          keeper:profiles(id, name)
        `)
        .gte('performed_at', startOfDay)
        .lte('performed_at', endOfDay);

      if (error) {
        console.warn('Supabase getRecordsByDate notice:', error.message || error);
        return [];
      }
      return (data as any) || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getRecordsByDate):', err);
      return [];
    }
  },

  async getTreatmentHistory(limit = 100): Promise<TreatmentRecordWithPhotos[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_records')
        .select(`
          *,
          photos:treatment_photos(*),
          keeper:profiles(id, name)
        `)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Supabase getTreatmentHistory notice:', error.message || error);
        return [];
      }
      return (data as any) || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getTreatmentHistory):', err);
      return [];
    }
  },

  async getElephantHistory(elephantId: string, limit = 100): Promise<TreatmentRecordWithPhotos[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_records')
        .select(`
          *,
          photos:treatment_photos(*),
          keeper:profiles(id, name)
        `)
        .eq('elephant_id', elephantId)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Supabase getElephantHistory notice:', error.message || error);
        return [];
      }
      return (data as any) || [];
    } catch (err) {
      console.warn('Network offline or Supabase unreachable (getElephantHistory):', err);
      return [];
    }
  },

  async createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async archiveAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async createTreatmentRecord(
    record: Omit<TreatmentRecord, 'id' | 'created_at' | 'performed_at'>
  ): Promise<TreatmentRecord> {
    const { data: sessionData } = await supabase.auth.getSession();
    const keeper_id = sessionData?.session?.user?.id || record.keeper_id;

    const { data, error } = await supabase
      .from('treatment_records')
      .insert({ ...record, keeper_id, performed_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTreatmentRecord(
    id: string,
    updates: Partial<Pick<TreatmentRecord, 'assessment' | 'medicine_used' | 'comment'>>
  ): Promise<TreatmentRecord> {
    const { data, error } = await supabase
      .from('treatment_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTreatmentRecord(id: string): Promise<void> {
    // Delete related photos in storage or db if needed
    const { error: photoErr } = await supabase
      .from('treatment_photos')
      .delete()
      .eq('treatment_record_id', id);
    if (photoErr) {
      console.warn('Non-fatal error deleting treatment photos reference:', photoErr);
    }

    const { error } = await supabase
      .from('treatment_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadTreatmentPhoto(file: Blob, recordId: string, elephantId: string, photoType: 'single' | 'before' | 'after'): Promise<TreatmentPhoto> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || 'unknown';
    const timestamp = Date.now();
    const filePath = `${userId}/${elephantId}/${recordId}_${timestamp}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('elephant-treatments')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
      });
      
    if (uploadError) throw uploadError;

    const { data: photoData, error: photoError } = await supabase
      .from('treatment_photos')
      .insert({
        treatment_record_id: recordId,
        storage_path: filePath,
        photo_type: photoType,
      })
      .select()
      .single();

    if (photoError) throw photoError;
    return photoData;
  },

  async uploadShiftMedia(file: Blob, shiftDate: string, section: string): Promise<string> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || 'unknown';
    const timestamp = Date.now();
    const filePath = `shifts/${shiftDate}/${section}_${timestamp}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('elephant-treatments')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
      });
      
    if (uploadError) throw uploadError;
    return filePath;
  },

  getPublicUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from('elephant-treatments')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    const now = Date.now();
    const cached = urlCache.get(storagePath);
    // Use cache if it exists and expires in more than 5 minutes
    if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
      return cached.url;
    }

    try {
      const { data, error } = await supabase.storage
        .from('elephant-treatments')
        .createSignedUrl(storagePath, 3600); // 1 hour

      if (error) {
        console.warn('Notice creating signed URL:', error.message || error);
        return ''; // Fallback
      }

      urlCache.set(storagePath, {
        url: data.signedUrl,
        expiresAt: now + 3600 * 1000
      });

      return data.signedUrl;
    } catch (err) {
      console.warn('Notice creating signed URL (offline):', err);
      return '';
    }
  }
};
