const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const stateCode = `
  const [activeDays, setActiveDays] = useState<string[]>([]);
  useEffect(() => {
    if (isDatePickerOpen) {
      shiftService.getActiveDaysForMonth(viewYear, viewMonth).then(setActiveDays);
    }
  }, [isDatePickerOpen, viewYear, viewMonth]);
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days = [];
    
    // Fill empty slots for first week
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };
`;

content = content.replace(
  '  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);',
  '  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);\n' + stateCode
);

const modalCode = `
      {/* CALENDAR MODAL */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsDatePickerOpen(false)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Выбор даты</h2>
              <button onClick={() => setIsDatePickerOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => {
                let m = viewMonth - 1;
                let y = viewYear;
                if (m < 1) { m = 12; y--; }
                setViewMonth(m); setViewYear(y);
              }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">←</button>
              
              <div className="font-bold text-slate-700 capitalize">
                {new Date(viewYear, viewMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
              </div>
              
              <button onClick={() => {
                let m = viewMonth + 1;
                let y = viewYear;
                if (m > 12) { m = 1; y++; }
                setViewMonth(m); setViewYear(y);
              }} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">→</button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
              <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((d, i) => {
                if (!d) return <div key={\`empty-\${i}\`} className="h-10" />;
                
                const dateStr = \`\${viewYear}-\${String(viewMonth).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const isFilled = activeDays.includes(dateStr);
                
                let bgClass = 'bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-700';
                
                if (isSelected) {
                  bgClass = 'bg-slate-800 border-2 border-slate-800 text-white shadow-md';
                } else if (isFilled) {
                  bgClass = 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
                } else if (dateStr < todayStr) {
                  bgClass = 'bg-rose-50 border-2 border-rose-100 text-rose-700 hover:bg-rose-100';
                }
                
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setIsDatePickerOpen(false);
                    }}
                    className={\`h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-90 \${bgClass} \${isToday && !isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}\`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Заполнено</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-50 border border-rose-100"></div> Пусто</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-800"></div> Текущий</div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  '{/* MODALS */}',
  '{/* MODALS */}\n' + modalCode
);

fs.writeFileSync(path, content);
