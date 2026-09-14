const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  
  if (!signUpData.user) return;
  
  const { data: beforeData } = await supabase.from('feed_inventory').select('*');
  console.log('Before:', beforeData);

  const dbPayload = [{
    item_type: 'hay_bales',
    quantity_in_stock: 190,
    unit: 'тюков'
  }];
  const { error } = await supabase
    .from('feed_inventory')
    .upsert(dbPayload, { onConflict: 'item_type' });
  console.log('Upsert 1 (new stock) Error:', error);

  const dbPayload2 = [{
    id: beforeData.find(x => x.item_type === 'hay_bales').id,
    item_type: 'hay_bales',
    quantity_in_stock: 185,
    unit: 'тюков'
  }];
  const { error: err2 } = await supabase
    .from('feed_inventory')
    .upsert(dbPayload2, { onConflict: 'item_type' });
  console.log('Upsert 2 (with ID) Error:', err2);
}
run();
