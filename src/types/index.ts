export interface Profile {
  id: string;
  name: string;
  role: 'keeper' | 'vet' | 'director';
  active: boolean;
  created_at: string;
}

export interface Elephant {
  id: string;
  name: string;
  created_at: string;
}

export type ScheduleType = 'daily' | 'weekly' | 'as_needed';
export type AssessmentType = 'none' | 'normal_or_issue' | 'needs_cleaning' | 'result';

export interface Assignment {
  id: string;
  elephant_id: string;
  title: string;
  description: string | null;
  schedule_type: ScheduleType;
  requires_photo: boolean;
  requires_before_after: boolean;
  assessment_type: AssessmentType | null;
  medicine: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentRecord {
  id: string;
  assignment_id: string | null;
  elephant_id: string;
  keeper_id: string;
  performed_at: string;
  assessment: string | null;
  medicine_used: string | null;
  comment: string | null;
  created_at: string;
}

export interface TreatmentPhoto {
  id: string;
  treatment_record_id: string;
  storage_path: string;
  photo_type: 'single' | 'before' | 'after';
  created_at: string;
}

// Extends for UI convenience
export interface TreatmentRecordWithPhotos extends TreatmentRecord {
  photos: TreatmentPhoto[];
}

