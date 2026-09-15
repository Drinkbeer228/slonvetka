const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

if (!code.includes('CircusElephantMonitoring')) {
  code = code.replace(/import \{ SocialDynamicsSection \} from '\.\.\/components\/daily-shift\/SocialDynamicsSection';/, 
  `import { SocialDynamicsSection } from '../components/daily-shift/SocialDynamicsSection';
import { CircusElephantMonitoring } from '../components/daily-shift/CircusElephantMonitoring';`);
  fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
}
