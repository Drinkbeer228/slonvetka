import React, { useState } from 'react';
import { Users2, Check, Sparkles, MessageSquare } from 'lucide-react';

interface SocialDynamicsSectionProps {
  isLocked?: boolean;
  onAppendSocialLog: (tagText: string) => void;
}

const SOCIAL_TAGS = [
  { id: 'stole_food', label: 'Отобрала пайку', emoji: '🥐', tone: 'amber' },
  { id: 'clash', label: 'Стычка / Удар хоботом', emoji: '💥', tone: 'rose' },
  { id: 'play_grooming', label: 'Игры / Груминг', emoji: '🤗', tone: 'emerald' },
  { id: 'jealousy', label: 'Ревность к киперу', emoji: '👀', tone: 'indigo' },
  { id: 'sleep_together', label: 'Спят рядом (вместе)', emoji: '💤', tone: 'sky' },
];

export function SocialDynamicsSection({
  isLocked = false,
  onAppendSocialLog,
}: SocialDynamicsSectionProps) {
  const [justLoggedTag, setJustLoggedTag] = useState<string | null>(null);

  const handleTagClick = (tagLabel: string) => {
    if (isLocked) return;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setJustLoggedTag(tagLabel);
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    onAppendSocialLog(`[${timeStr} Соц-динамика]: ${tagLabel}`);
    setTimeout(() => setJustLoggedTag(null), 1800);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            <Users2 size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-tight">
              Социальная динамика группы
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Быстрые теги взаимодействий в стаде
            </p>
          </div>
        </div>
      </div>

      {/* Быстрые чипсы-теги */}
      <div className="flex flex-wrap gap-2">
        {SOCIAL_TAGS.map((tag) => {
          const isSelected = justLoggedTag === tag.label;
          return (
            <button
              key={tag.id}
              type="button"
              disabled={isLocked}
              onClick={() => handleTagClick(tag.label)}
              className={`min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 cursor-pointer touch-manipulation shadow-2xs ${
                isSelected
                  ? 'bg-slate-900 text-white scale-[1.02]'
                  : 'bg-slate-50/90 text-slate-700 hover:bg-white border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
              {isSelected && <Check size={14} strokeWidth={3} className="text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
