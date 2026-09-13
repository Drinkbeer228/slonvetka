import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SlonVet] Отсутствуют переменные окружения VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY. ' +
    'Создайте файл .env на основе .env.example и заполните значения.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
