const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const { data: signUpData } = await supabase.auth.signUp({ email, password });
  if (!signUpData.user) return;
  const { data: profiles, error } = await supabase.from('profiles').select('id, role, name');
  console.log('Profiles:', profiles, error);
}
run();
