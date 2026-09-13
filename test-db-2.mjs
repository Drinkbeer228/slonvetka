import fetch from 'node-fetch';

const url = 'https://vzimjtrcgcsllenaasmz.supabase.co/rest/v1/treatment_records';
const key = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';

async function testInsert() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      elephant_id: 'a983b0fc-1b70-4f51-b0e6-993d0de38fc0',
      keeper_id: 'a983b0fc-1b70-4f51-b0e6-993d0de38fc0',
      performed_at: new Date().toISOString(),
      assessment: 'test'
    })
  });
  console.log(res.status, await res.text());
}
testInsert();
