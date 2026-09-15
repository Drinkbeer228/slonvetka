const fs = require('fs');
const content = `import React, { useState, useEffect } from 'react';
import { Clock, Coffee, CalendarRange, Check, AlertTriangle } from 'lucide-react';
import { DailyRationData } from './FeedControl'; // Or export this type separately

export interface FeedControlProps {
  ration: DailyRationData;
  isLocked?: boolean;
  onPorridgeFieldChange: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
}

export function FeedControl({ ration, isLocked, onPorridgeFieldChange }: FeedControlProps) {
  const [isSteaming, setIsSteaming] = useState(false);
  const [steamTimeLeft, setSteamTimeLeft] = useState(0);

  const handleSteamClick = () => {
    if (isLocked) return;
    setIsSteaming(true);
    setSteamTimeLeft(60);
    // Real implementation would save the timestamp to ration and calculate elapsed time
    onPorridgeFieldChange('morning_mash_time', new Date().toISOString());
  };

  useEffect(() => {
    let interval;
    if (isSteaming && steamTimeLeft > 0) {
      interval = setInterval(() => {
        setSteamTimeLeft((prev) => prev - 1);
      }, 60000);
    } else if (steamTimeLeft === 0 && isSteaming) {
      setIsSteaming(false);
      onPorridgeFieldChange('morning_mash_fed', true);
    }
    return () => clearInterval(interval);
  }, [isSteaming, steamTimeLeft, onPorridgeFieldChange]);

  const setFeederStatus = (time: 'morning' | 'noon' | 'evening', status: 'all' | 'partial' | 'refused') => {
    if (isLocked) return;
    if (time === 'morning') onPorridgeFieldChange('morning_porridge', status);
    if (time === 'noon') onPorridgeFieldChange('noon_mash_appetite', status);
    if (time === 'evening') onPorridgeFieldChange('salad_appetite', status);
  };

  const getFeederStatus = (time: 'morning' | 'noon' | 'evening') => {
    if (time === 'morning') return ration.morning_porridge;
    if (time === 'noon') return ration.noon_mash_appetite;
    if (time === 'evening') return ration.salad_appetite;
    return null;
  };

  const renderFeederControls = (time: 'morning' | 'noon' | 'evening') => {
    const status = getFeederStatus(time);
    return (
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button
          disabled={isLocked}
          onClick={() => setFeederStatus(time, 'all')}
          className={\`min-h-[64px] rounded-[20px] font-black text-[13px] flex flex-col items-center justify-center transition-all shadow-sm active:scale-95 \${status === 'all' ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300' : 'bg-white text-slate-700 border border-slate-200'}\`}
        >
          <span className="text-xl mb-1">🟢</span>
          Съедено чисто
        </button>
        <button
          disabled={isLocked}
          onClick={() => setFeederStatus(time, 'partial')}
          className={\`min-h-[64px] rounded-[20px] font-black text-[13px] flex flex-col items-center justify-center transition-all shadow-sm active:scale-95 \${status === 'partial' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300' : 'bg-white text-slate-700 border border-slate-200'}\`}
        >
          <span className="text-xl mb-1">🟡</span>
          Есть остаток
        </button>
        <button
          disabled={isLocked}
          onClick={() => setFeederStatus(time, 'refused')}
          className={\`min-h-[64px] rounded-[20px] font-black text-[13px] flex flex-col items-center justify-center transition-all shadow-sm active:scale-95 \${status === 'refused' ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300' : 'bg-white text-slate-700 border border-slate-200'}\`}
        >
          <span className="text-xl mb-1">🔴</span>
          Отказ от корма
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Horizontal timeline */}
      <div className="flex justify-between items-center text-xs font-black text-slate-500 px-2 py-3 bg-slate-100 rounded-[20px]">
        <div className="flex flex-col items-center text-emerald-700">
          <span className="text-[10px] uppercase">07:00 Утро</span>
          <span>Запарка</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-300 mx-2 rounded-full"></div>
        <div className="flex flex-col items-center text-amber-700">
          <span className="text-[10px] uppercase">13:00 Обед</span>
          <span>Каша</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-300 mx-2 rounded-full"></div>
        <div className="flex flex-col items-center text-sky-700">
          <span className="text-[10px] uppercase">19:00 Ужин</span>
          <span>Сочные/Салат</span>
        </div>
      </div>

      {/* Steam Mash Section */}
      <div className="bg-amber-50 rounded-[24px] p-4 border border-amber-200/60 shadow-sm">
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
          <Coffee className="text-amber-600" size={20} /> Запарка каши
        </h3>
        
        {!ration.morning_mash_fed && !isSteaming ? (
          <button
            onClick={handleSteamClick}
            disabled={isLocked}
            className="w-full min-h-[56px] rounded-2xl bg-amber-500 text-white font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-sm"
          >
            Запарить кашу (кипяток)
          </button>
        ) : isSteaming ? (
          <div className="bg-amber-100 text-amber-900 p-4 rounded-2xl flex items-center justify-between font-bold shadow-inner">
            <span className="flex items-center gap-2 animate-pulse"><Clock size={18} /> Настаивается...</span>
            <span className="text-lg">{steamTimeLeft} мин</span>
          </div>
        ) : (
          <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm">
            <Check size={18} /> Готова к раздаче (теплая)
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-amber-200/60">
          <label className="flex items-center justify-between p-3 bg-white/60 rounded-xl cursor-pointer">
            <div className="flex items-center gap-2">
              <CalendarRange className="text-amber-700" size={18} />
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-[13px]">Слоны после манежа</span>
                <span className="text-[10px] text-slate-500 font-medium">Дать отстояться 45 мин, вода и сено перед кашей</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-500 border-amber-300"
              checked={ration.is_show_day}
              disabled={isLocked}
              onChange={(e) => onPorridgeFieldChange('is_show_day', e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
        <h3 className="font-black text-slate-900 text-sm mb-2">Контроль кормушки (Утро)</h3>
        {renderFeederControls('morning')}
      </div>

      <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
        <h3 className="font-black text-slate-900 text-sm mb-2">Контроль кормушки (Обед)</h3>
        {renderFeederControls('noon')}
      </div>

      <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
        <h3 className="font-black text-slate-900 text-sm mb-2">Контроль кормушки (Ужин)</h3>
        {renderFeederControls('evening')}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/daily-shift/FeedControl.tsx', content);
