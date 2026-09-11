
export interface ShiftPhoto {
  id: string;
  timestamp: string;
  section: 'stool' | 'urine' | 'sleep' | 'general';
  dataUrl: string;
}
export interface HandoverComplaint {
  id: string;
  author_name: string;
  tags: string[];
  comment: string;
  photo_url?: string;
  created_at: string;
}

export interface SleepInterval {
  id: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface DailyShift {
  id: string;
  date: string; // YYYY-MM-DD
  duty_keeper_id: string | null;
  status: 'in_progress' | 'completed';
  hay_bales_distributed: number;
  hay_bags_distributed: number;
  reminders: string[];
  feed_notes: string;
  handover_notes: string;
  handover_complaints?: HandoverComplaint[];
  created_at?: string;
  updated_at?: string;
}

export interface ElephantDailyMetrics {
  id?: string;
  shift_id: string;
  elephant_id: string;
  poop_count: number;
  feces_traits: string[];
  urination_count: number;
  urination_traits: string[];
  behavior_score?: number; // legacy
  behavior?: string;
  sleep_minutes?: number; 
  sleep_intervals?: SleepInterval[];
  notes?: string;
  photos?: ShiftPhoto[];
}
