const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  
  const dbPayload = [{
    item_type: 'unknown_feed',
    quantity_in_stock: 10,
    unit: 'кг'
  }];
  const { error } = await supabase
    .from('feed_inventory')
    .upsert(dbPayload, { onConflict: 'item_type' });
  console.log('Insert Error:', error);
}
run();
