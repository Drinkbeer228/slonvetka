import React from 'react';
import { ElephantDailyMetrics } from '../types/shift';
import { Elephant } from '../types';
import { Check } from 'lucide-react';
import { CounterButton } from './common/CounterButton';
import { ELEPHANT_MOODS } from '../screens/DailyShiftPage';

const FECES_OPTIONS = [
  'Сформирован (норма)',
  'Рассыпчатый / Сухой',
  'Жидкий / Понос ⚠️',
  'Со слизью ⚠️',
  'Плохо переварен / цельные куски ⚠️'
];

const URINATION_OPTIONS = [
  'Светлая / Прозрачная',
  'Темная / Концентрированная',
  'Мутная / С осадком ⚠️',
  'Бурая / Красноватая ⚠️',
  'Натуживание / Малыми порциями ⚠️'
];

export function ElephantPhysiology({
  elephant,
  metrics,
  isLocked,
  onMetricChange,
  onTraitToggle,
  onNotesBlur
}: {
  elephant: Elephant;
  metrics: ElephantDailyMetrics;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  onTraitToggle: (field: 'feces_traits' | 'urination_traits', trait: string) => void;
  onNotesBlur: () => void;
}) {
  const fecesTraits = metrics.feces_traits || [];
  const urinationTraits = metrics.urination_traits || [];
  const currentBehavior = metrics.behavior || 'Спокойная / В норме';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CONTAINER 1: DEFECATION */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <CounterButton
            label="Дефекация"
            value={metrics.poop_count}
            onChange={(val) => onMetricChange('poop_count', val)}
          />
          <div className="pt-3 border-t border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Характер стула</span>
            <div className="space-y-1.5">
              {FECES_OPTIONS.map(trait => {
                const isSelected = fecesTraits.includes(trait);
                const isWarning = trait.includes('⚠️');
                const isNormal = trait.includes('норма');
                let btnStyle = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
                if (isSelected) {
                  if (isWarning) btnStyle = 'bg-red-700 text-white border-red-700 shadow-sm';
                  else if (isNormal) btnStyle = 'bg-emerald-700 text-white border-emerald-700 shadow-sm';
                  else btnStyle = 'bg-slate-800 text-white border-slate-800 shadow-sm';
                }
                return (
                  <button
                    key={trait}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onTraitToggle('feces_traits', trait)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left transition border flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{trait}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTAINER 2: URINATION */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <CounterButton
            label="Мочеиспускание"
            value={metrics.urination_count}
            onChange={(val) => onMetricChange('urination_count', val)}
          />
          <div className="pt-3 border-t border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Характеристики мочи</span>
            <div className="space-y-1.5">
              {URINATION_OPTIONS.map(trait => {
                const isSelected = urinationTraits.includes(trait);
                const isWarning = trait.includes('⚠️') || trait.includes('Темная') || trait.includes('Мутная') || trait.includes('Бурая');
                const isNormal = trait.includes('Светлая / Прозрачная');
                let btnStyle = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
                if (isSelected) {
                  if (isNormal) btnStyle = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                  else if (isWarning) btnStyle = 'bg-amber-600 text-white border-amber-600 shadow-sm';
                  else btnStyle = 'bg-slate-800 text-white border-slate-800 shadow-sm';
                }
                return (
                  <button
                    key={trait}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onTraitToggle('urination_traits', trait)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left transition border flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{trait}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER 3: MOOD & NOTES */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div>
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Эмоции и состояние</span>
          <div className="grid grid-cols-5 gap-2 w-full">
            {ELEPHANT_MOODS.map(mood => {
              const isSelected = currentBehavior === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onMetricChange('behavior', mood.id)}
                  className={`min-h-[72px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected 
                      ? mood.activeClass 
                      : 'bg-white border border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100 text-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1 shrink-0">
                    {mood.emoji}
                  </span>
                  <span className="text-[10px] font-bold leading-tight text-center">
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-200">
          <input
            type="text"
            disabled={isLocked}
            value={metrics.notes || ''}
            onChange={(e) => onMetricChange('notes', e.target.value)}
            onBlur={onNotesBlur}
            placeholder="Краткие заметки по слону..."
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 transition"
          />
        </div>
      </div>
    </div>
  );
}
