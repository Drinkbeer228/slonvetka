const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/ArchiveBanner, ShieldAlert/g, 'ArchiveBanner');
code = code.replace(/import \{ ArchiveBanner \} from '\.\.\/components\/daily-shift\/ArchiveBanner';/, "import { ArchiveBanner } from '../components/daily-shift/ArchiveBanner';");
code = code.replace(/AlertTriangle, Edit2,/, 'AlertTriangle, Edit2, ShieldAlert,');

fs.writeFileSync(file, code);
