import { supabase } from '../lib/supabase';
import { 
  Profile, Elephant, Assignment, TreatmentRecord, 
  TreatmentPhoto, TreatmentRecordWithPhotos 
} from '../types';

const urlCache = new Map<string, { url: string, expiresAt: number }>();

export const supabaseService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
    return data as Profile | null;
  },

  async getElephants(): Promise<Elephant[]> {
    const { data, error } = await supabase
      .from('elephants')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getActiveAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAssignmentsByElephant(elephantId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('elephant_id', elephantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getTodayRecords(): Promise<TreatmentRecordWithPhotos[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoString = today.toISOString();

    const { data, error } = await supabase
      .from('treatment_records')
      .select(`
        *,
        photos:treatment_photos(*)
      `)
      .gte('performed_at', isoString);

    if (error) throw error;
    return data as any;
  },

  async getTreatmentHistory(limit = 100): Promise<TreatmentRecordWithPhotos[]> {
    const { data, error } = await supabase
      .from('treatment_records')
      .select(`
        *,
        photos:treatment_photos(*)
      `)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as any;
  },

  async getElephantHistory(elephantId: string, limit = 100): Promise<TreatmentRecordWithPhotos[]> {
    const { data, error } = await supabase
      .from('treatment_records')
      .select(`
        *,
        photos:treatment_photos(*)
      `)
      .eq('elephant_id', elephantId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as any;
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
    const { data, error } = await supabase
      .from('treatment_records')
      .insert({ ...record, performed_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadTreatmentPhoto(file: Blob, recordId: string, elephantId: string, photoType: 'single' | 'before' | 'after'): Promise<TreatmentPhoto> {
    const timestamp = Date.now();
    const filePath = `${elephantId}/${recordId}_${timestamp}.jpg`;
    
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

    const { data, error } = await supabase.storage
      .from('elephant-treatments')
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (error) {
      console.error('Failed to create signed URL', error);
      return ''; // Fallback
    }

    urlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt: now + 3600 * 1000
    });

    return data.signedUrl;
  }
};
