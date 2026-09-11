const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '} from \'lucide-react\';',
  ', LogOut } from \'lucide-react\';'
);

fs.writeFileSync(path, content);
