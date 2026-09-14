const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: profiles, error } = await supabase.from('profiles').select('email, role, name');
  console.log('Profiles:', profiles, error);
}
run();
