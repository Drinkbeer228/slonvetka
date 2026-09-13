import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('serviceWorker.getRegistrations')) {
  code = code.replace(
    `initSyncManager();`,
    `initSyncManager();\n\nif ('serviceWorker' in navigator) {\n  navigator.serviceWorker.getRegistrations().then((registrations) => {\n    for (const registration of registrations) {\n      registration.unregister();\n    }\n  });\n}\n`
  );
  fs.writeFileSync('src/main.tsx', code);
}
