const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  console.log('SignUp:', signUpData.user ? signUpData.user.id : signUpError);
  
  if (!signUpData.user) return;

  const dbPayload = [{
    item_type: 'hay_bales',
    quantity_in_stock: 195,
    unit: 'тюков'
  }];
  const { error } = await supabase
    .from('feed_inventory')
    .upsert(dbPayload, { onConflict: 'item_type' });
  console.log('Upsert Error:', error);
}
run();
