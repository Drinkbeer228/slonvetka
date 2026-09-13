import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vzimjtrcgcsllenaasmz.supabase.co',
  'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA'
);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_rls@example.com',
    password: 'password123'
  });
  console.log(data, error);
}
run();
