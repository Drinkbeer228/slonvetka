const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vzimjtrcgcsllenaasmz.supabase.co', 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA');
supabase.rpc('register_device_session', {}).then(console.log).catch(console.error);
