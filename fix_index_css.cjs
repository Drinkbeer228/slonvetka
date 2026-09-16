const fs = require('fs');
const file = 'src/index.css';

let code = fs.readFileSync(file, 'utf8');

// The `body` element in `index.css` has `background-color: #f1f5f9;`.
// The page has a white background bouncing on iOS Safari when scrolling.
// We can set `background-color: #020617;` globally when dark theme is on, or dynamically via a class on body.
// Instead, let's just make the `body` background black if we're inside the shift.
// A simpler way is to just let the Layout `div` fill the viewport entirely.
code = code.replace(
  /body \{\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  background-color: #f1f5f9; \/\* slate-100 \*\/\n\}/,
  `body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #020617; /* Default to dark so rubber-banding is dark */
}`
);

fs.writeFileSync(file, code);
