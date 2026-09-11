const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add NightSleepSection import
if (!content.includes('NightSleepSection')) {
  content = content.replace(
    'import { SectionPhotoTrigger } from \'./SectionPhotoTrigger\';',
    'import { SectionPhotoTrigger } from \'./SectionPhotoTrigger\';\nimport { NightSleepSection } from \'./NightSleepSection\';'
  );
}

// Remove the calculateDuration function as it's now in NightSleepSection (though we might keep it if used elsewhere, let's just leave it for now)

// Find the sleep block starting at "{/* SLEEP CYCLES */}" or something similar. Looking at the output, we see:
// 234-      {/* SLEEP CYCLES */}
// 235-      <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4 relative">
// up to
// 388-
// 389-      {/* NOTES SECTION */}

const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('      {/* SLEEP CYCLES */}')) {
    startIdx = i;
  }
  if (lines[i].includes('      {/* NOTES SECTION */}')) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const newSleepBlock = `      <NightSleepSection 
        metrics={metrics} 
        isLocked={isLocked} 
        onMetricChange={onMetricChange} 
        photos={photos} 
        onAddPhoto={handleAddPhoto} 
        onRemovePhoto={handleRemovePhoto} 
      />\n`;
  lines.splice(startIdx, endIdx - startIdx, newSleepBlock);
  content = lines.join('\n');
} else {
  console.log("Could not find sleep block boundaries. Start:", startIdx, "End:", endIdx);
}

fs.writeFileSync(path, content);
