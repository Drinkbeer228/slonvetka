const fs = require('fs');
let code = fs.readFileSync('src/utils/elephantHealthStatus.ts', 'utf8');
code = code.replace(/    if \(\n  \}/g, '  }');
fs.writeFileSync('src/utils/elephantHealthStatus.ts', code);
