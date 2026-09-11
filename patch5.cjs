const fs = require('fs');
const path = './src/services/shiftService.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/,\s*async getActiveDaysForMonth/, '},\n  async getActiveDaysForMonth');
fs.writeFileSync(path, content);
