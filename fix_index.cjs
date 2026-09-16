const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<meta name="viewport" content="[^"]+" \/>/, '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />');
if (!html.includes('apple-mobile-web-app-capable')) {
    html = html.replace(/<title>/, '<meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n    <title>');
}
fs.writeFileSync('index.html', html);

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/body\s*\{[\s\S]*?\}/, `html, body, #root {\n  background-color: #020617 !important; /* bg-slate-950 */\n  margin: 0;\n  padding: 0;\n  width: 100%;\n  min-height: 100dvh;\n  overflow: hidden;\n}\n\nbody {\n  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}`);
fs.writeFileSync('src/index.css', css);

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(/style=\{\{ background: darkMode \? '#121212' : 'linear-gradient\(160deg, #f1f5f9 0%, #e9f0f8 60%, #eff6ff 100%\)' \}\}/, `style={{ background: isDailyShift ? 'transparent' : darkMode ? '#121212' : 'linear-gradient(160deg, #f1f5f9 0%, #e9f0f8 60%, #eff6ff 100%)' }}`);
fs.writeFileSync('src/components/Layout.tsx', layout);
