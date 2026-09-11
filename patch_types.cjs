const fs = require('fs');
const path = './src/types/shift.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('ShiftPhoto')) {
  content = `
export interface ShiftPhoto {
  id: string;
  timestamp: string;
  section: 'stool' | 'urine' | 'sleep' | 'general';
  dataUrl: string;
}
` + content;
  content = content.replace('notes?: string;', 'notes?: string;\n  photos?: ShiftPhoto[];');
  fs.writeFileSync(path, content);
}
