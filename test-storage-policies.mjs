import fetch from 'node-fetch';
const url = 'https://vzimjtrcgcsllenaasmz.supabase.co/rest/v1/storage.objects?select=*';
const key = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';
const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }});
console.log(res.status, await res.text());
