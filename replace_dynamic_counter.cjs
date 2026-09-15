const fs = require('fs');

const content = `import React, { useState } from 'react';
import { Plus, Minus, Search, MousePointer2 } from 'lucide-react';

export interface CounterItem {
  id: string;
  label: string;
  emoji: string;
  count: number;
  type: 'merit' | 'damage';
  isLocked?: boolean;
}

export interface DynamicCounterSectionProps {
  counters: CounterItem[];
  onChange: (items: CounterItem[]) => void;
  isLocked?: boolean;
}

export function DynamicCounterSection({ counters, onChange, isLocked }: DynamicCounterSectionProps) {
  const [selectedIncident, setSelectedIncident] = useState('🧹 Метла съедена');
  const [customIncident, setCustomIncident] = useState('');
  const [washZone, setWashZone] = useState<string | null>(null);

  const incidents = [
    '🧹 Метла съедена',
    '🪣 Ведро / лопата',
    '⚡ Пастух порван',
    '🚿 Шланг откушен',
    '🪝 Багор сожран',
    '🚪 Засов / петля двери',
    '➕ Свой казус...'
  ];

  const updateCount = (id: string, delta: number) => {
    if (isLocked) return;
    const current = counters.find(c => c.id === id)?.count || 0;
    const next = Math.max(0, current + delta);
    
    let exists = false;
    const nextCounters = counters.map(c => {
      if (c.id === id) {
        exists = true;
        return { ...c, count: next };
      }
      return c;
    });

    if (!exists) {
      nextCounters.push({ id, label: id, emoji: '🔧', count: next, type: 'merit' });
    }
    
    onChange(nextCounters);
  };

  const getCount = (id: string) => counters.find(c => c.id === id)?.count || 0;

  const handleIncidentFix = () => {
    if (isLocked) return;
    const id = selectedIncident === '➕ Свой казус...' ? customIncident || 'Инное' : selectedIncident;
    updateCount(id, 1);
    if (selectedIncident === '➕ Свой казус...') setCustomIncident('');
  };

  const totalDamage = counters.filter(c => incidents.includes(c.id) || !['elephants_washed', 'carpets_cleaned', 'wheelbarrows_dumped', 'wash_legs', 'wash_croup', 'wash_side'].includes(c.id)).reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="space-y-4">
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800"><span className="text-xl">🐘</span> Помыты</div>
          <div className="flex items-center gap-2">
             <button disabled={isLocked || getCount('elephants_washed') <= 0} onClick={() => updateCount('elephants_washed', -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg active:scale-95 disabled:opacity-40"><Minus size={16}/></button>
             <span className="w-4 text-center font-bold text-lg">{getCount('elephants_washed')}</span>
             <button disabled={isLocked} onClick={() => updateCount('elephants_washed', 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-lg active:scale-95 disabled:opacity-40"><Plus size={16}/></button>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800"><span className="text-xl">🧼</span> Ковры</div>
          <div className="flex items-center gap-2">
             <button disabled={isLocked || getCount('carpets_cleaned') <= 0} onClick={() => updateCount('carpets_cleaned', -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg active:scale-95 disabled:opacity-40"><Minus size={16}/></button>
             <span className="w-4 text-center font-bold text-lg">{getCount('carpets_cleaned')}</span>
             <button disabled={isLocked} onClick={() => updateCount('carpets_cleaned', 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-lg active:scale-95 disabled:opacity-40"><Plus size={16}/></button>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800"><span className="text-xl">🚜</span> Тачки</div>
          <div className="flex items-center gap-2">
             <button disabled={isLocked || getCount('wheelbarrows_dumped') <= 0} onClick={() => updateCount('wheelbarrows_dumped', -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg active:scale-95 disabled:opacity-40"><Minus size={16}/></button>
             <span className="w-4 text-center font-bold text-lg">{getCount('wheelbarrows_dumped')}</span>
             <button disabled={isLocked} onClick={() => updateCount('wheelbarrows_dumped', 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-lg active:scale-95 disabled:opacity-40"><Plus size={16}/></button>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col justify-center gap-1 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1"><span className="text-xl">🚿</span> Замывка</div>
          <div className="flex gap-1">
            <button disabled={isLocked} onClick={() => { setWashZone('Ноги'); updateCount('wash_legs', 1); }} className="flex-1 bg-sky-50 text-sky-800 text-[10px] font-bold py-1.5 rounded-lg active:scale-95 border border-sky-200/50">Ноги</button>
            <button disabled={isLocked} onClick={() => { setWashZone('Круп'); updateCount('wash_croup', 1); }} className="flex-1 bg-sky-50 text-sky-800 text-[10px] font-bold py-1.5 rounded-lg active:scale-95 border border-sky-200/50">Круп</button>
            <button disabled={isLocked} onClick={() => { setWashZone('Бок'); updateCount('wash_side', 1); }} className="flex-1 bg-sky-50 text-sky-800 text-[10px] font-bold py-1.5 rounded-lg active:scale-95 border border-sky-200/50">Бок</button>
          </div>
          {washZone && <div className="absolute top-2 right-2 text-[10px] text-sky-600 font-bold animate-fade-in-up">+{washZone}</div>}
        </div>
      </div>

      {/* Incident Drum Picker */}
      <div className="bg-rose-50/50 rounded-[24px] p-4 border border-rose-200 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-rose-900 text-sm">Барабан поломок</h3>
          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Инциденты: {totalDamage}</span>
        </div>
        
        <div className="flex gap-3 h-[140px]">
          {/* Mock iOS Wheel Picker */}
          <div className="flex-1 bg-white rounded-[20px] shadow-inner overflow-y-auto snap-y snap-mandatory border border-slate-200 scrollbar-hide py-[50px] relative">
            <div className="absolute top-1/2 left-0 right-0 h-[40px] -mt-[20px] bg-rose-50/50 border-y border-rose-200 pointer-events-none"></div>
            {incidents.map((incident, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedIncident(incident)}
                className={\`h-[40px] snap-center flex items-center justify-center text-sm font-bold transition-all cursor-pointer \${selectedIncident === incident ? 'text-slate-900 scale-110' : 'text-slate-400 opacity-60'}\`}
              >
                {incident}
              </div>
            ))}
          </div>
          
          <button 
            disabled={isLocked || (selectedIncident === '➕ Свой казус...' && !customIncident)}
            onClick={handleIncidentFix}
            className="w-20 bg-rose-500 text-white rounded-[20px] flex flex-col items-center justify-center font-black active:scale-95 disabled:opacity-50 shadow-md"
          >
            <span className="text-2xl mb-1">+1</span>
            <span className="text-[10px] uppercase opacity-90 text-center leading-tight">Фиксация</span>
          </button>
        </div>

        {selectedIncident === '➕ Свой казус...' && (
          <input
            type="text"
            value={customIncident}
            onChange={(e) => setCustomIncident(e.target.value)}
            disabled={isLocked}
            placeholder="Что еще сломали?..."
            className="w-full mt-3 px-4 py-3 rounded-[16px] bg-white border border-rose-200 text-sm font-bold outline-none focus:ring-2 ring-rose-500"
          />
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/daily-shift/DynamicCounterSection.tsx', content);
