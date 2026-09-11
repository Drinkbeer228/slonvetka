const fs = require('fs');
const path = './src/components/daily-shift/ObservationEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="font-bold text-slate-800 text-sm tracking-wide">Сон ночью</div>\n              <div className="text-[11px] text-slate-500 font-medium">\n                {Math.floor(sleepMinutes / 60)} ч {sleepMinutes % 60 > 0 ? `${sleepMinutes % 60} м` : \'\'} всего\n              </div>\n            </div>\n          </div>\n          {!isLocked && (',
  `<div className="font-bold text-slate-800 text-sm tracking-wide">Сон ночью</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {Math.floor(sleepMinutes / 60)} ч {sleepMinutes % 60 > 0 ? \`\${sleepMinutes % 60} м\` : ''} всего
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <SectionPhotoTrigger 
              section="sleep" 
              photos={photos} 
              onAddPhoto={handleAddPhoto} 
              onRemovePhoto={handleRemovePhoto} 
              totalElephantPhotos={photos.length} 
            />
            {!isLocked && (`
);

content = content.replace(
  '              + Фаза сна\n            </button>\n          )}',
  '              + Фаза сна\n            </button>\n          )}\n          </div>'
);

fs.writeFileSync(path, content);
