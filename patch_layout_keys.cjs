const fs = require('fs');
const path = './src/components/Layout.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSpans = `{globalSaveStatus === 'saving' ? (
                <span className="text-[26px] leading-none animate-gta-save-header drop-shadow-md filter brightness-110">💾</span>
              ) : globalSaveStatus === 'saved' ? (
                <span className="text-[26px] leading-none animate-in zoom-in duration-300 drop-shadow-md filter brightness-110">✅</span>
              ) : globalSaveStatus === 'error' ? (
                <span className="text-[26px] leading-none" title="Офлайн">⚠️</span>
              ) : (
                <span className="text-[26px] leading-none transition-transform group-hover:scale-110">🐘</span>
              )}`;

const newSpans = `{globalSaveStatus === 'saving' ? (
                <span key="saving" className="text-[26px] leading-none animate-gta-save-header drop-shadow-md filter brightness-110">💾</span>
              ) : globalSaveStatus === 'saved' ? (
                <span key="saved" className="text-[26px] leading-none animate-in zoom-in duration-300 drop-shadow-md filter brightness-110">✅</span>
              ) : globalSaveStatus === 'error' ? (
                <span key="error" className="text-[26px] leading-none" title="Офлайн">⚠️</span>
              ) : (
                <span key="idle" className="text-[26px] leading-none transition-transform group-hover:scale-110">🐘</span>
              )}`;

if (content.includes(oldSpans)) {
  content = content.replace(oldSpans, newSpans);
  fs.writeFileSync(path, content);
  console.log("Successfully patched Layout.tsx with keys!");
} else {
  console.log("Could not find the spans block to patch.");
}
