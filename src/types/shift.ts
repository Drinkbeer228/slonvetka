export interface HandoverComplaint {
  id: string;
  author_name: string;
  tags: string[];
  comment: string;
  photo_url?: string;
  created_at: string;
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
  behavior?: string; // e.g. 'Спокойная / В норме'
  notes?: string;
}
