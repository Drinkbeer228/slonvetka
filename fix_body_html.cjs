const fs = require('fs');
const file = 'index.html';

let code = fs.readFileSync(file, 'utf8');

// I also need to make sure html and body have 100% height and correct background colors.
if (!code.includes('<style>')) {
    code = code.replace(
      /<\/head>/,
      `  <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: #020617; /* Very dark slate */
      }
      #root {
        height: 100%;
      }
    </style>
  </head>`
    );
}

fs.writeFileSync(file, code);
