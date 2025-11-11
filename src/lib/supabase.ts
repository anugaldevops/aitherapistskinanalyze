import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  skin_type: string | null;
  skincare_routine: string | null;
  profile_completed: boolean;
  notify_analysis_reminders: boolean;
  notify_routine_reminders: boolean;
  notify_progress_updates: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  analysis_date: string;
  actual_age: number;
  skin_age: number;
  clinical_score: number;
  max_clinical_score: number;
  composite_index: number;
  top_problem_zones: Array<{ zone: string; score: number }>;
  raw_data: any;
  created_at: string;
}
