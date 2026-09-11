const fs = require('fs');
const path = './src/components/daily-shift/FeedControl.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update interface
content = content.replace(
  'coarse_branches?: boolean;',
  'coarse_branches?: number;'
);

content = content.replace(
  'onBranchesToggle: (val: boolean) => void;',
  'onBranchesChange: (val: number) => void;'
);

content = content.replace(
  'onBranchesToggle\n}: FeedControlProps',
  'onBranchesChange\n}: FeedControlProps'
);

// Update grid and buttons
const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Тюки сена</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Основная раздача</div>
            </div>
            <div className="scale-110">
              <CounterButton
                value={hayBalesDistributed}
                onChange={onBalesChange}
              />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Рулоны / Мешки</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Доп. фураж / сетки</div>
            </div>
            <div className="scale-110">
              <CounterButton
                value={hayBagsDistributed}
                onChange={onBagsChange}
              />
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => onBranchesToggle(!ration.coarse_branches)}
            className={\`w-full min-h-[56px] rounded-[20px] font-bold text-sm sm:text-base transition-all flex flex-wrap items-center justify-center gap-2 px-4 py-3 border \${
              ration.coarse_branches
                ? 'bg-lime-500 text-white border-lime-500 shadow-lg shadow-lime-500/30 scale-[1.02]'
                : 'bg-white/60 text-slate-600 border-white/40 hover:bg-white/90 active:scale-95'
            }\`}
          >
            <span className="text-xl">🌿</span>
            Ветки, веники, деревья, бамбук
          </button>
        </div>`;

const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Тюки сена</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Основная раздача</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={hayBalesDistributed}
                onChange={onBalesChange}
              />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Рулоны / Мешки</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Доп. фураж</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={hayBagsDistributed}
                onChange={onBagsChange}
              />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Ветки, веники...</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Деревья / Бамбук</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={ration.coarse_branches || 0}
                onChange={onBranchesChange}
              />
            </div>
          </div>
        </div>`;

content = content.replace(oldGrid, newGrid);
fs.writeFileSync(path, content);
