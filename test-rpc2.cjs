const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vzimjtrcgcsllenaasmz.supabase.co', 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA');
supabase.rpc('register_device_session', { user_id: 'a983b0fc-1b70-4f51-b0e6-993d0de38fc0', session_token: '123' }).then(console.log).catch(console.error);
