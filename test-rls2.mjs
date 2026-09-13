import fetch from 'node-fetch';

const url = 'https://vzimjtrcgcsllenaasmz.supabase.co/rest/v1/';
const key = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';

async function query(table) {
  const res = await fetch(url + table, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log(table, res.status, await res.text());
}
query('elephants');
