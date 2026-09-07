import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vzimjtrcgcsllenaasmz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
