const fs = require('fs');
const path = './src/store/index.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/}, \[profile\]\);/g, '}, [profile?.id]);');

fs.writeFileSync(path, content);
console.log("Patched store profile dependencies!");
