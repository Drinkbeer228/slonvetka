const fs = require('fs');
let code = fs.readFileSync('src/types/shift.ts', 'utf8');
const sleepState = `export interface ElephantSleepState {
  duration: '<1ч' | '1-2ч' | '3-4ч (норма)' | '>4ч' | 'Не ложилась ⚠️' | null;
  posture: 'left' | 'right' | 'standing' | null;
}

`;
code = code.replace(/export interface ShiftPhoto/, sleepState + 'export interface ShiftPhoto');
code = code.replace(/\/\*\* Общее время сна в минутах[^\n]*\n\s*sleep_minutes\?\: number;/g, '/** Состояние сна */\n  sleep_state?: ElephantSleepState;');
code = code.replace(/sleep_minutes: 0,/g, 'sleep_state: { duration: null, posture: null },');

fs.writeFileSync('src/types/shift.ts', code);
