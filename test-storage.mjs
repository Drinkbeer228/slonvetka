import fetch from 'node-fetch';

const url = 'https://vzimjtrcgcsllenaasmz.supabase.co/storage/v1/object/elephant-treatments/test.jpg';
const key = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';

async function testStorage() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'image/jpeg'
    },
    body: 'test'
  });
  console.log(res.status, await res.text());
}
testStorage();
