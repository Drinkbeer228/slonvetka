const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vzimjtrcgcsllenaasmz.supabase.co', 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA');
supabase.from('nonexistent_table').select('*').then(console.log).catch(console.error);
