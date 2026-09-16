const babel = require('@babel/core');
const fs = require('fs');
const code = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');

try {
  babel.transformSync(code, {
    filename: 'VetDashboard.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react']
  });
  console.log("Success");
} catch(e) {
  console.error(e.message);
}
