const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLogoutBlock = `            <div className="w-[1px] h-6 bg-slate-200"></div>
            <button 
              onClick={() => { if(confirm('Выйти из аккаунта?')) logout(); }}
              className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all"
              title="Выйти"
            >
              <LogOut size={14} strokeWidth={2.5} />
            </button>`;

content = content.replace(oldLogoutBlock, '');

// Also adjust the pr-3 in the wrapper
content = content.replace(
  'px-2 py-1.5 rounded-2xl shadow-sm pr-3 transition-all',
  'px-3 py-1.5 rounded-2xl shadow-sm transition-all'
);

fs.writeFileSync(path, content);
