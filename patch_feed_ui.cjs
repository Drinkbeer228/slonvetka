const fs = require('fs');
const path = './src/components/daily-shift/FeedControl.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `        </div>
      </div>
    </div>
  );
}`;

const newCode = `        </div>
        
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
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
