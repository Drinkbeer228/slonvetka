const fs = require('fs');
let code = fs.readFileSync('src/screens/StaffScreen.tsx', 'utf8');

code = code.replace(
  /const email = `\$\{normalizedLogin\}@mail\.ru`;/,
  "const email = `${normalizedLogin}@slonovet.local`;"
);

fs.writeFileSync('src/screens/StaffScreen.tsx', code);
