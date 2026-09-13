import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vzimjtrcgcsllenaasmz.supabase.co',
  'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA'
);

async function run() {
  // Try to login as a test user if we don't have one? We don't have the user's password.
  // Wait, without the user's token we can't test RLS as that user.
  console.log("Cannot test without user token.");
}
run();
