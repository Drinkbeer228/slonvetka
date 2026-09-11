const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

// Imports
if (!content.includes('SectionPhotoTrigger')) {
  content = content.replace(
    "import { CounterButton } from '../common/CounterButton';",
    "import { CounterButton } from '../common/CounterButton';\nimport { SectionPhotoTrigger } from './SectionPhotoTrigger';\nimport { ShiftPhoto } from '../../types/shift';"
  );
}

// Handlers
const handlerCode = `
  const photos = metrics.photos || [];
  
  const handleAddPhoto = (photo: ShiftPhoto) => {
    onMetricChange('photos', [...photos, photo]);
  };

  const handleRemovePhoto = (id: string) => {
    onMetricChange('photos', photos.filter(p => p.id !== id));
  };
`;
if (!content.includes('const photos = metrics.photos || [];')) {
  content = content.replace(
    "const sleepMinutes = metrics.sleep_minutes ?? 420; // Default to 7 hours if not set",
    "const sleepMinutes = metrics.sleep_minutes ?? 420; // Default to 7 hours if not set\n" + handlerCode
  );
}

// Stool
content = content.replace(
  '<CounterButton\n            label="💩 Дефекация (раз)"\n            value={metrics.poop_count}\n            onChange={(val) => onMetricChange(\'poop_count\', val)}\n          />',
  `<div className="flex items-end justify-between gap-4">
            <CounterButton
              label="💩 Дефекация (раз)"
              value={metrics.poop_count}
              onChange={(val) => onMetricChange('poop_count', val)}
            />
            <div className="pb-1 shrink-0">
              <SectionPhotoTrigger 
                section="stool" 
                photos={photos} 
                onAddPhoto={handleAddPhoto} 
                onRemovePhoto={handleRemovePhoto} 
                totalElephantPhotos={photos.length} 
              />
            </div>
          </div>`
);

// Urine
content = content.replace(
  '<CounterButton\n            label="💦 Мочеиспускание (раз)"\n            value={metrics.urination_count}\n            onChange={(val) => onMetricChange(\'urination_count\', val)}\n          />',
  `<div className="flex items-end justify-between gap-4">
            <CounterButton
              label="💦 Мочеиспускание (раз)"
              value={metrics.urination_count}
              onChange={(val) => onMetricChange('urination_count', val)}
            />
            <div className="pb-1 shrink-0">
              <SectionPhotoTrigger 
                section="urine" 
                photos={photos} 
                onAddPhoto={handleAddPhoto} 
                onRemovePhoto={handleRemovePhoto} 
                totalElephantPhotos={photos.length} 
              />
            </div>
          </div>`
);

// Sleep
content = content.replace(
  '<div className="text-sm font-bold text-slate-800 tracking-wide">Фазы сна / залегания</div>',
  `<div className="flex items-center justify-between w-full">
              <div className="text-sm font-bold text-slate-800 tracking-wide">Фазы сна / залегания</div>
              <SectionPhotoTrigger 
                section="sleep" 
                photos={photos} 
                onAddPhoto={handleAddPhoto} 
                onRemovePhoto={handleRemovePhoto} 
                totalElephantPhotos={photos.length} 
              />
            </div>`
);

// Notes
content = content.replace(
  '<div className="font-bold text-slate-800 text-sm tracking-wide">Журнал наблюдений</div>\n            <div className="text-[11px] text-slate-500 font-medium">Подробные заметки за смену</div>\n          </div>\n        </div>',
  `<div className="font-bold text-slate-800 text-sm tracking-wide">Журнал наблюдений</div>
            <div className="text-[11px] text-slate-500 font-medium">Подробные заметки за смену</div>
          </div>
        </div>
        <div className="absolute top-5 right-5">
          <SectionPhotoTrigger 
            section="general" 
            photos={photos} 
            onAddPhoto={handleAddPhoto} 
            onRemovePhoto={handleRemovePhoto} 
            totalElephantPhotos={photos.length} 
          />
        </div>`
);
content = content.replace('<div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4">', '<div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4 relative">');

fs.writeFileSync(path, content);
