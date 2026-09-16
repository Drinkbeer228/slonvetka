const fs = require('fs');
const file = 'src/components/Layout.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Identify isDailyShift
code = code.replace(
  /const isVetDashboard = currentScreen === 'vet_dashboard' \|\| currentScreen === 'vet_cabinet';/,
  `const isVetDashboard = currentScreen === 'vet_dashboard' || currentScreen === 'vet_cabinet';
  const isDailyShift = currentScreen === 'daily_shift';`
);

// 2. Adjust contentWidthClass
code = code.replace(
  /const contentWidthClass = isVetDashboard \n     \? 'max-w-7xl px-2 sm:px-6' \n     : 'max-w-3xl lg:max-w-4xl px-3 sm:px-6';/,
  `const contentWidthClass = isDailyShift 
     ? 'w-full max-w-none px-0'
     : isVetDashboard 
       ? 'max-w-7xl px-2 sm:px-6' 
       : 'max-w-3xl lg:max-w-4xl px-3 sm:px-6';`
);

// 3. Remove pt-14 for daily_shift and hide global Header
code = code.replace(
  /\{\/\* STICKY HEADER \*\/\}\n      <Header([\s\S]*?)\/>/,
  `{/* STICKY HEADER */}
      {!isDailyShift && <Header $1/>}`
);

code = code.replace(
  /<main className=\{\`flex-1 w-full mx-auto pt-14 transition-all \$\{contentWidthClass\}\`\}>/,
  `<main className={\`flex-1 w-full mx-auto transition-all \${isDailyShift ? 'pt-0' : 'pt-14'} \${contentWidthClass}\`}>`
);

fs.writeFileSync(file, code);
