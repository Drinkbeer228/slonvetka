const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

const sectionClass = 'snap-start h-[calc(100dvh-3.5rem)] w-full flex flex-col p-4 box-border shrink-0 overflow-y-auto';

code = code.replace(
  /<div>\s*{\/\* 7\. НИЖНЯЯ ПАНЕЛЬ: КНОПКА \[ ЗАВЕРШИТЬ СМЕНУ \] \*\//,
  `<div className="${sectionClass} justify-center">\n      {/* 7. НИЖНЯЯ ПАНЕЛЬ: КНОПКА [ ЗАВЕРШИТЬ СМЕНУ ] */`
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
