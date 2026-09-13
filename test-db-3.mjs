import fetch from 'node-fetch';

const url = 'https://vzimjtrcgcsllenaasmz.supabase.co/rest/v1/treatment_records';
const key = 'sb_publishable_VcTrvZcyjnT7i8AEaSGEIA_WqF-N6OA';
const token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ijg5MzgzOTUxLTg0ZGUtNGIxZC1iNWE2LWFmYWMyYzNiZTJkOSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Z6aW1qdHJjZ2NzbGxlbmFhc216LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2OTBkMDcxMy00MTFhLTQ3ZjktODAyMi0zMzE5MGRmM2NiYmIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg5MjQ4MTcwLCJpYXQiOjE3ODkyNDQ1NzAsImVtYWlsIjoidGVzdF9ybHNAZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdF9ybHNAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiNjkwZDA3MTMtNDExYS00N2Y5LTgwMjItMzMxOTBkZjNjYmJiIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODkyNDQ1NzB9XSwic2Vzc2lvbl9pZCI6ImE5NzMxMTE0LTQ1NDItNDg3Yy04ZjZkLTYyODQ2NzE5N2E5OSIsImlzX2Fub255bW91cyI6ZmFsc2V9.7bjYmuW0wC_bBwa1PYl6lE0Qt5Cfft0HsB46Y2drQNs9QvnzmZob8Fhb4BojUDzH2pBYOAkvu2ofQR1IBMkUEA';
const uid = '690d0713-411a-47f9-8022-33190df3cbbb';

async function testInsert() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      elephant_id: 'a983b0fc-1b70-4f51-b0e6-993d0de38fc0', // Random UUID
      keeper_id: uid, // Use my valid auth user ID
      performed_at: new Date().toISOString(),
      assessment: 'test auth insert'
    })
  });
  console.log(res.status, await res.text());
}
testInsert();
