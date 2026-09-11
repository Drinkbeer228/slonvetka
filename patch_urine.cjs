const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<CounterButton\n            label="💧 Мочеиспускание (раз)"\n            value={metrics.urination_count}\n            onChange={(val) => onMetricChange(\'urination_count\', val)}\n          />',
  `<div className="flex items-end justify-between gap-4">
            <CounterButton
              label="💧 Мочеиспускание (раз)"
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

fs.writeFileSync(path, content);
