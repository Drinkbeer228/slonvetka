const fs = require('fs');
const file = 'index.html';

let code = fs.readFileSync(file, 'utf8');

// I will change the meta theme-color to dark so the safari notch area is dark too.
if (!code.includes('<meta name="theme-color"')) {
    code = code.replace(
      /<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" \/>/,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#020617" />`
    );
}

fs.writeFileSync(file, code);
