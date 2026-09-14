const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const bannerContainerRegex = /\{\/\* HANDOVER ACCEPT BANNER \*\/\}[\s\S]*?\{\/\* TOP NOTIFICATION BANNERS \*\/\}/;

if (bannerContainerRegex.test(code)) {
  code = code.replace(bannerContainerRegex, '{/* TOP NOTIFICATION BANNERS */}');
  fs.writeFileSync(file, code);
  console.log('Removed duplicate HandoverAcceptBanner');
} else {
  console.log('Duplicate not found');
}
