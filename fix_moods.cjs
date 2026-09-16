const fs = require('fs');
let code = fs.readFileSync('src/components/ElephantPhysiology.tsx', 'utf8');
code = code.replace(/import \{ ELEPHANT_MOODS \} from '\.\.\/screens\/DailyShiftPage';/g, '');
code = code.replace(/ELEPHANT_MOODS\.map/g, "['Бодрое', 'Вялое', 'Агрессивное', 'Спокойное', 'Игривое'].map");
fs.writeFileSync('src/components/ElephantPhysiology.tsx', code);
