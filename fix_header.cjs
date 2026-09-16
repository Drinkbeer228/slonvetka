const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

// 1. Add dateInputRef state
const dateRefCode = `  const dateInputRef = useRef<HTMLInputElement>(null);`;
code = code.replace(/  const sliderRef = useRef<HTMLInputElement>\(null\);/, `  const sliderRef = useRef<HTMLInputElement>(null);\n${dateRefCode}`);

// 2. Fix Header Calendar button
const headerOld = /<button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200">\s*<Calendar className="w-5 h-5" \/>\s*<\/button>/;
const headerNew = `<div className="relative">
            <input 
              ref={dateInputRef} 
              type="date" 
              value={selectedDate} 
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }} 
              className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none" 
            />
            <button 
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in dateInputRef.current) {
                    try {
                      (dateInputRef.current as any).showPicker();
                    } catch (e) {
                      dateInputRef.current.click();
                    }
                  } else {
                    dateInputRef.current.click();
                  }
                }
              }} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 active:scale-95 text-slate-200"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>`;
code = code.replace(headerOld, headerNew);

// 3. Fix Menus
const menuOld = /<div className="fixed inset-0 z-50 flex">\s*<div className="absolute inset-0 bg-slate-950\/60 backdrop-blur-sm" onClick=\{[\s\S]*?<div className="relative w-3\/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2">[\s\S]*?<\/div>\s*<\/div>/;

const menuNew = `<div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-3/4 max-w-sm bg-slate-900 h-full p-4 flex flex-col gap-2 shadow-2xl border-r border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 mb-4 px-2">Меню</h2>
            
            <button 
              onClick={() => { setMenuOpen(false); onNavigate('vet'); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Stethoscope className="w-5 h-5 text-emerald-400"/> Веткабинет
            </button>
            
            <button 
              onClick={() => { setMenuOpen(false); setInvDraft(inventory); setInventoryOpen(true); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Package className="w-5 h-5 text-amber-400"/> Склад кормов
            </button>
            
            <button 
              onClick={() => { setMenuOpen(false); setWheelOpen(true); }} 
              className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl font-bold text-slate-200 active:scale-95 transition-all"
            >
              <Users className="w-5 h-5 text-purple-400"/> Жребий смены
            </button>
          </div>
        </div>`;
code = code.replace(menuOld, menuNew);

fs.writeFileSync(file, code);
