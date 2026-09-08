import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const startMarker = '<div className="pb-24 space-y-6 mt-4">';
const endMarker = '{/* REPLENISH MODAL */}'; // Let's check if it exists

const idx = code.indexOf('<!-- REPLENISH MODAL -->');
console.log('REPLENISH MODAL html comment:', idx);

const idx2 = code.indexOf('{/* REPLENISH MODAL */}');
console.log('REPLENISH MODAL jsx comment:', idx2);

const idx3 = code.indexOf('{/* ADHOC MODAL */}');
console.log('ADHOC MODAL:', idx3);

const idx4 = code.indexOf('{/* EXECUTION MODAL FOR VET ASSIGNMENTS */}');
console.log('EXECUTION MODAL:', idx4);
