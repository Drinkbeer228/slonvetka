const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(/import \{ ProfileSettingsModal \} from '\.\/ProfileSettingsModal';/, 
  `import { ProfileSettingsModal } from './ProfileSettingsModal';\nimport { ShiftWheelModal } from './daily-shift/ShiftWheelModal';`);

code = code.replace(/import \{ \n  X, LogOut, Home, Stethoscope, HeartPulse, Moon, Sun,/, 
  `import {\n  X, LogOut, Home, Stethoscope, HeartPulse, Moon, Sun, Trophy,`);

// also it might be one line:
code = code.replace(/import \{\s*X, LogOut, Home, Stethoscope, HeartPulse, Moon, Sun,/m, 
  `import { X, LogOut, Home, Stethoscope, HeartPulse, Moon, Sun, Trophy,`);


code = code.replace(/const \[profileSettingsOpen, setProfileSettingsOpen\] = useState\(false\);/, 
  `const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);\n  const [wheelOpen, setWheelOpen] = useState(false);`);

// insert button in navigation
code = code.replace(/<\/nav>/, 
  `  <div className="px-4 py-2 mt-2">
            <button
              onClick={() => { setWheelOpen(true); setDrawerOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[16px] font-black text-sm transition-all active:scale-95 shadow-md shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Trophy size={18} />
              Жребий смены (Колесо)
            </button>
          </div>
        </nav>`);

code = code.replace(/\{profileSettingsOpen && \([\s\S]*?\}\)/, 
  `{profileSettingsOpen && (
        <ProfileSettingsModal onClose={() => setProfileSettingsOpen(false)} />
      )}
      <ShiftWheelModal isOpen={wheelOpen} onClose={() => setWheelOpen(false)} />`);

fs.writeFileSync('src/components/Layout.tsx', code);
