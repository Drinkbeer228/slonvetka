const fs = require('fs');
const path = './src/services/offlineDb.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export async function getCachedElephants\(\): Promise<Elephant\[\]> \{\s*const db = await getOfflineDb\(\);\s*return db\.getAll\('cached_elephants'\);\s*\}/;

if (regex.test(content)) {
  const replacement = `export async function getCachedElephants(): Promise<Elephant[]> {
  const db = await getOfflineDb();
  const els = await db.getAll('cached_elephants');
  return els.sort((a, b) => a.name.localeCompare(b.name));
}`;
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
  console.log("Successfully patched getCachedElephants!");
} else {
  console.log("Regex didn't match.");
}
