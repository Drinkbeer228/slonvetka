const fs = require('fs');
let code = fs.readFileSync('src/store/index.tsx', 'utf-8');

const oldInventory = `    { id: '4', parentId: 'concentrate', name: 'Овёс (мешки)', amount: 20, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: '5', parentId: 'concentrate', name: 'Отруби (мешки)', amount: 12, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: '6', parentId: 'juicy', name: 'Морковь', amount: 150, category: 'juicy', unit: 'кг', isDefault: true },
    { id: '7', parentId: 'juicy', name: 'Свекла', amount: 30, category: 'juicy', unit: 'кг', isDefault: true }`;

const newInventory = `    { id: 'c1', parentId: 'concentrate', name: 'Овёс (мешки)', amount: 20, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'c2', parentId: 'concentrate', name: 'Отруби (мешки)', amount: 12, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'c3', parentId: 'concentrate', name: 'ВТМ (мешки)', amount: 10, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'c4', parentId: 'concentrate', name: 'Лён (мешки)', amount: 5, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'c5', parentId: 'concentrate', name: 'Ячмень (мешки)', amount: 8, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'c6', parentId: 'concentrate', name: 'Мэш готовый (мешки)', amount: 15, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: 'j1', parentId: 'juicy', name: 'Морковь', amount: 150, category: 'juicy', unit: 'кг', isDefault: true },
    { id: 'j2', parentId: 'juicy', name: 'Свёкла', amount: 30, category: 'juicy', unit: 'кг', isDefault: true },
    { id: 'j3', parentId: 'juicy', name: 'Яблоки', amount: 50, category: 'juicy', unit: 'кг', isDefault: true },
    { id: 'j4', parentId: 'juicy', name: 'Тыква', amount: 20, category: 'juicy', unit: 'кг', isDefault: true }`;

code = code.replace(oldInventory, newInventory);
fs.writeFileSync('src/store/index.tsx', code);
console.log('Store patched.');
