const fs = require('fs');

const content = `import React, { useState } from 'react';
import { Camera, AlertTriangle, Play, Sparkles } from 'lucide-react';

export interface CircusElephantMonitoringProps {
  elephant: any;
  metrics: any;
  isLocked?: boolean;
  onMetricChange: (field: string, value: any) => void;
  onAddMediaLog?: (logText: string, photoDataUrl: string) => void;
}

export function CircusElephantMonitoring({ elephant, metrics, isLocked, onMetricChange, onAddMediaLog }: CircusElephantMonitoringProps) {
  const [activeStereotypy, setActiveStereotypy] = useState<string | null>(null);
  const [showHoofPhoto, setShowHoofPhoto] = useState(false);

  const stereotypies = [
    { id: 'weaving', label: '🔄 Качание (weaving)' },
    { id: 'nodding', label: '🐘 Кивание головой' },
    { id: 'shifting', label: '👣 Переступание' },
    { id: 'trunk', label: '🪵 Игра хоботом' },
  ];

  const handleStereotypyTap = (id: string) => {
    if (isLocked) return;
    setActiveStereotypy(id);
  };

  const saveStereotypy = (duration: string) => {
    if (isLocked || !activeStereotypy) return;
    // Real logic to append event log
    setActiveStereotypy(null);
  };

  const legs = [
    { id: 'ПП', label: 'ПП' },
    { id: 'ЛП', label: 'ЛП' },
    { id: 'ПЗ', label: 'ПЗ' },
    { id: 'ЛЗ', label: 'ЛЗ' },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Stereotypies */}
      <div className="bg-purple-50/50 rounded-[24px] p-4 border border-purple-200/60 shadow-sm">
        <h3 className="font-black text-purple-900 text-sm mb-3">Стереотипии</h3>
        <div className="grid grid-cols-2 gap-2">
          {stereotypies.map(s => (
            <button
              key={s.id}
              onClick={() => handleStereotypyTap(s.id)}
              disabled={isLocked}
              className="min-h-[56px] rounded-xl bg-white border border-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center p-2 text-center active:scale-95 transition-transform shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stereotypy Bottom Sheet */}
      {activeStereotypy && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveStereotypy(null)}></div>
          <div className="bg-white rounded-t-[32px] p-6 pb-safe relative z-10 animate-fade-in-up">
            <h3 className="font-black text-slate-900 mb-4 text-center text-lg">{stereotypies.find(s => s.id === activeStereotypy)?.label}</h3>
            
            <p className="font-bold text-sm text-slate-600 mb-2">Длительность:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => saveStereotypy('<5 мин')} className="py-3 bg-slate-100 rounded-xl font-bold text-sm active:scale-95">&lt;5 мин</button>
              <button onClick={() => saveStereotypy('5-15 мин')} className="py-3 bg-slate-100 rounded-xl font-bold text-sm active:scale-95">5–15 мин</button>
              <button onClick={() => saveStereotypy('>15 мин')} className="py-3 bg-slate-100 rounded-xl font-bold text-sm active:scale-95">&gt;15 мин</button>
            </div>
            
            <p className="font-bold text-sm text-slate-600 mb-2">Триггер (опционально):</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button className="py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600">Перед пайкой</button>
              <button className="py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600">Перед выходом</button>
              <button className="py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600">Шум/стресс</button>
              <button className="py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600">Без причины</button>
            </div>
          </div>
        </div>
      )}

      {/* Anxiety Markers */}
      <div className="bg-rose-50/50 rounded-[24px] p-4 border border-rose-200/60 shadow-sm space-y-3">
        <h3 className="font-black text-rose-900 text-sm flex items-center gap-2"><AlertTriangle size={16} /> Тревожные маркеры (Отклонения)</h3>
        
        {/* Lameness */}
        <div className="space-y-2">
          <div className="font-bold text-xs text-rose-800">Хромота</div>
          <div className="flex gap-2">
            {legs.map(leg => (
              <button 
                key={leg.id}
                onClick={() => onMetricChange('favored_leg', leg.id)}
                disabled={isLocked}
                className={\`flex-1 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 \${metrics.favored_leg === leg.id ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-700'}\`}
              >
                {leg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Breathing / Trunk */}
        <div className="space-y-2 pt-2 border-t border-rose-200/50">
           <div className="font-bold text-xs text-rose-800">Дыхание и хобот</div>
           <div className="grid grid-cols-1 gap-2">
              <button disabled={isLocked} onClick={() => onMetricChange('trunk_tone', 'Вялый / Висит плетью')} className={\`py-3 rounded-xl font-black text-xs flex items-center justify-center transition-all active:scale-95 \${metrics.trunk_tone === 'Вялый / Висит плетью' ? 'bg-rose-500 text-white' : 'bg-white border border-rose-200 text-rose-700'}\`}>
                ⚠️ Хобот плетью
              </button>
              <button disabled={isLocked} onClick={() => onMetricChange('breathing', 'Сопение / Хрип')} className={\`py-3 rounded-xl font-black text-xs flex items-center justify-center transition-all active:scale-95 \${metrics.breathing === 'Сопение / Хрип' ? 'bg-rose-500 text-white' : 'bg-white border border-rose-200 text-rose-700'}\`}>
                ⚠️ Сопение / Хрип
              </button>
              <button disabled={isLocked} className="py-3 rounded-xl font-black text-xs flex items-center justify-center bg-white border border-rose-200 text-rose-700 active:scale-95">
                ⚠️ Выделения из хобота (+фото)
              </button>
           </div>
        </div>
      </div>

      {/* Hoof Day */}
      <div className="bg-sky-50 rounded-[24px] p-4 border border-sky-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-black text-sky-900 text-sm">День копыт</h3>
          <p className="text-[10px] font-bold text-sky-700/80">Осмотр подошвы и ногтей</p>
        </div>
        <button disabled={isLocked} className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
          <Camera size={20} />
        </button>
      </div>

    </div>
  );
}
`;
fs.writeFileSync('src/components/daily-shift/CircusElephantMonitoring.tsx', content);
