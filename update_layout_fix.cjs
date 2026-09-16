const fs = require('fs');
const file = 'src/components/Layout.tsx';

let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const contentWidthClass = [^;]+;/,
  `const contentWidthClass = isDailyShift 
     ? 'w-full max-w-none px-0'
     : isVetDashboard 
       ? 'max-w-7xl px-2 sm:px-6' 
       : 'max-w-3xl lg:max-w-4xl px-3 sm:px-6';`
);

fs.writeFileSync(file, code);
