const fs = require('fs');
const path = './src/services/shiftService.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/}\s*};\s*$/, `
  async getActiveDaysForMonth(year: number, month: number): Promise<string[]> {
    const startDate = \`\${year}-\${String(month).padStart(2, '0')}-01\`;
    const endDate = \`\${year}-\${String(month).padStart(2, '0')}-31\`;
    
    const activeDays = new Set<string>();

    try {
      const { data, error } = await supabase
        .from('daily_shifts')
        .select('date, duty_keeper_id')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (!error && data) {
        data.forEach(r => activeDays.add(r.date));
      }
    } catch (e) {
      console.warn('Failed to fetch active days from Supabase', e);
    }
    
    try {
      const db = await getOfflineDb();
      const tx = db.transaction('daily_shifts', 'readonly');
      const index = tx.store.index('by-date');
      const keys = await index.getAllKeys();
      keys.forEach(k => {
        if (typeof k === 'string' && k >= startDate && k <= endDate) {
          activeDays.add(k);
        }
      });
    } catch (e) {
      console.warn('Failed to fetch active days from IDB', e);
    }
    
    return Array.from(activeDays);
  }
};
`);
fs.writeFileSync(path, content);
