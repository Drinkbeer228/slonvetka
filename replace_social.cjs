const fs = require('fs');

const content = `import React, { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';

export interface SocialDynamicsSectionProps {
  elephantId: string;
  onAddEvent: (logText: string, icon: string) => void;
  isLocked?: boolean;
}

export function SocialDynamicsSection({ elephantId, onAddEvent, isLocked }: SocialDynamicsSectionProps) {
  const [targetElephant, setTargetElephant] = useState<string>('Одри');

  const chips = [
    { label: '💥 Стычка / Удар', icon: '💥' },
    { label: '🤗 Груминг', icon: '🤗' },
    { label: '🥐 Отобрала пайку', icon: '🥐' },
    { label: '👀 Ревность к киперу', icon: '👀' },
    { label: '💤 Спят рядом', icon: '💤' },
  ];

  const handleChipTap = (chip: any) => {
    if (isLocked) return;
    onAddEvent(\`\${chip.label}: \${elephantId} ➔ \${targetElephant}\`, chip.icon);
  };

  return (
    <div className="bg-fuchsia-50/50 rounded-[24px] p-4 border border-fuchsia-200/60 shadow-sm mt-4">
      <div className="flex flex-col mb-4">
        <h3 className="font-black text-fuchsia-900 text-sm flex items-center gap-2 mb-2">
          <Users size={16} /> Социальная динамика
        </h3>
        
        <div className="flex items-center gap-2 bg-white/60 p-2 rounded-xl self-start border border-fuchsia-100">
          <span className="font-bold text-xs capitalize text-slate-800">{elephantId === 'margo' ? 'Марго' : elephantId === 'odri' ? 'Одри' : 'Прэтти'}</span>
          <ArrowRight size={14} className="text-slate-400" />
          <select 
            value={targetElephant}
            onChange={(e) => setTargetElephant(e.target.value)}
            disabled={isLocked}
            className="bg-transparent font-bold text-xs outline-none text-fuchsia-700"
          >
            <option value="Марго">Марго</option>
            <option value="Одри">Одри</option>
            <option value="Прэтти">Прэтти</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map(chip => (
          <button
            key={chip.label}
            onClick={() => handleChipTap(chip)}
            disabled={isLocked}
            className="px-3 py-2 bg-white border border-fuchsia-200 rounded-xl text-[11px] font-bold text-fuchsia-900 active:scale-95 shadow-sm"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/daily-shift/SocialDynamicsSection.tsx', content);
