const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vzimjtrcgcsllenaasmz.supabase.co', 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA');
supabase.rpc('login_by_invite_code', { code: 'KEEPER-IVAN-24' }).then(console.log).catch(console.error);
