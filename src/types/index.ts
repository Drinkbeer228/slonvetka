export interface Elephant {
  id: string;
  name: string;
  active: boolean;
}

export interface Keeper {
  id: string;
  name: string;
  active: boolean;
}

export type ScheduleType = 'daily' | 'multiple_daily' | 'weekly' | 'monthly' | 'specific_days' | 'as_needed';
export type AssessmentType = 'none' | 'normal_or_issue' | 'needs_cleaning' | 'result';

export interface Assignment {
  id: string;
  elephantId: string;
  title: string;
  description: string;
  schedule: ScheduleType;
  active: boolean;
  requiresPhoto: boolean;
  requiresBeforeAfter: boolean;
  assessmentType: AssessmentType;
  customFields: string[]; // e.g. "medicine", "tool"
}

export interface TreatmentRecord {
  id: string;
  assignmentId: string | null; // null if ad-hoc
  elephantId: string;
  keeperId: string;
  createdAt: number;
  assessment: string;
  comment: string;
  customFieldValues: Record<string, string>;
  photos: Photo[];
  
  // Ad-hoc fields
  title?: string; 
  description?: string;
}

export interface Photo {
  id: string;
  treatmentRecordId: string;
  type: 'general' | 'before' | 'after';
  dataUrl: string; // Base64 data URL for MVP
  createdAt: number;
}
