import React, { useState } from 'react';
import { CounterButton } from '../common/CounterButton';
import { BookOpen, Check, ChevronDown, ChevronUp, Sparkles, Utensils, Wheat } from 'lucide-react';
import { EveningSaladSection, EveningSaladState } from './EveningSaladSection';
import { MorningPorridgeSection } from './MorningPorridgeSection';

export interface DailyRationData {
  morning_porridge?: 'none' | 'all' | 'partial' | 'refused';
  evening_salad_chips: string[];
  salad_notes: string;
  coarse_branches?: number;
  salad_base_included?: boolean;
  salad_photo_url?: string;
  salad_appetite?: 'all' | 'partial' | 'refused' | null;
  salad_base_time?: string | null;
}

const VEGETABLE_CHIPS = [
  { id: 'Морковь', label: 'Морковь', emoji: '🥕' },
  { id: 'Яблоки', label: 'Яблоки', emoji: '🍎' },
  { id: 'Капуста', label: 'Капуста', emoji: '🥬' },
  { id: 'Тыква', label: 'Тыква', emoji: '🎃' },
  { id: 'Бананы', label: 'Бананы', emoji: '🍌' },
  { id: 'Свекла', label: 'Свекла', emoji: '🥔' },
  { id: 'Кабачки', label: 'Кабачки', emoji: '🥒' },

];

interface FeedControlProps {
  hayBalesDistributed: number;
  hayBagsDistributed: number;
  ration: DailyRationData;
  isLocked?: boolean;
  onBalesChange: (val: number) => void;
  onBagsChange: (val: number) => void;
  onPorridgeFieldChange: (field: keyof DailyRationData, value: any) => void;
  onVegetableToggle: (chip: string) => void;
  onSaladNotesChange: (notes: string) => void;
  onBranchesChange: (val: number) => void;
  onSaladBaseToggle?: (included: boolean) => void;
  onSaladPhotoChange?: (photoUrl?: string) => void;
}

export function FeedControl({
  hayBalesDistributed,
  hayBagsDistributed,
  ration,
  isLocked = false,
  onBalesChange,
  onBagsChange,
  onPorridgeFieldChange,
  onVegetableToggle, // kept for signature compatibility but handled generically via onPorridgeFieldChange
  onSaladNotesChange,
  onBranchesChange,
  onSaladBaseToggle,
  onSaladPhotoChange
}: FeedControlProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);

  const eveningChips = ration.evening_salad_chips || [];

  const saladState: EveningSaladState = {
    isBaseIssued: ration.salad_base_included !== false,
    baseIssuedTime: ration.salad_base_time || (ration.salad_base_included !== false ? '18:30' : null),
    selectedAdditives: eveningChips,
    appetite: ration.salad_appetite || null,
    photoUrl: ration.salad_photo_url || null
  };

  const handleSaladChange = (newState: EveningSaladState) => {
    if (newState.isBaseIssued !== saladState.isBaseIssued) {
      onPorridgeFieldChange('salad_base_included', newState.isBaseIssued);
      onPorridgeFieldChange('salad_base_time', newState.baseIssuedTime);
    }
    if (newState.selectedAdditives !== saladState.selectedAdditives) {
      onPorridgeFieldChange('evening_salad_chips', newState.selectedAdditives);
    }
    if (newState.appetite !== saladState.appetite) {
      onPorridgeFieldChange('salad_appetite', newState.appetite);
    }
    if (newState.photoUrl !== saladState.photoUrl) {
      onPorridgeFieldChange('salad_photo_url', newState.photoUrl || '');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 p-5 sm:p-6 rounded-[28px] shadow-lg space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-sm">🍽️</span>
          <div>
            <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Рацион</h3>
            <p className="text-[12px] font-medium text-slate-500">Запарка каши, вечерний салат и грубые корма</p>
          </div>
        </div>
      </div>

      {/* 1. MORNING PORRIDGE (Запарка) */}
      <MorningPorridgeSection ration={ration} isLocked={isLocked} onChange={onPorridgeFieldChange} />

      {/* 2. EVENING VEGETABLE SALAD */}
      <EveningSaladSection
        state={saladState}
        isLocked={isLocked}
        onChange={handleSaladChange}
      />

      {/* 3. COARSE FEED (HAY STEPPERS) */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-500/10 flex items-center justify-center text-xl shadow-inner">
            🌾
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm tracking-wide">Грубые корма</div>
            <div className="text-[11px] text-slate-500 font-medium">Раздача сена</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Тюки сена</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Основная раздача</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={hayBalesDistributed}
                onChange={onBalesChange}
              />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Рулоны / Мешки</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Доп. фураж</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={hayBagsDistributed}
                onChange={onBagsChange}
              />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md border border-white/50 p-5 rounded-[24px] flex flex-col items-center justify-between shadow-sm gap-4">
            <div className="text-center w-full">
              <div className="text-sm font-bold text-slate-800">Ветки, веники...</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Деревья / Бамбук</div>
            </div>
            <div className="scale-100">
              <CounterButton
                value={ration.coarse_branches || 0}
                onChange={onBranchesChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}