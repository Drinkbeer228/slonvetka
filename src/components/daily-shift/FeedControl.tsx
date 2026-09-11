import React, { useState } from 'react';
import { CounterButton } from '../common/CounterButton';
import { BookOpen, Check, ChevronDown, ChevronUp, Sparkles, Utensils, Wheat } from 'lucide-react';

export interface DailyRationData {
  morning_porridge: 'none' | 'all' | 'partial';
  lunch_porridge: 'none' | 'all' | 'partial';
  evening_salad_chips: string[];
  salad_notes: string;
  coarse_branches?: number;
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

const PORRIDGE_OPTIONS = [
  { id: 'none', label: 'Не выдано', shortLabel: 'Не выдано', icon: '⏳' },
  { id: 'all', label: 'Съели всё', shortLabel: 'Съели всё', icon: '✓' },
  { id: 'partial', label: 'Частично / Оставили', shortLabel: 'Частично', icon: '⚠️' },
] as const;

const PORRIDGE_RECIPE = {
  title: 'Базовый рецепт каши для слонов (замес на одного слона)',
  description: 'Питательная основа утреннего и дневного кормления. Запаривается горячей водой в кормовом чане.',
  ingredients: [
    { name: 'Овсяные хлопья (Геркулес)', amount: '10 – 15 кг', desc: 'Легкоусвояемые углеводы' },
    { name: 'Пшеничные / ржаные отруби', amount: '5 – 8 кг', desc: 'Клетчатка и микроэлементы' },
    { name: 'Семена льна (распаренные)', amount: '500 – 700 г', desc: 'Слизи для пищеварения и шерсти/кожи' },
    { name: 'Соль поваренная (йодированная)', amount: '150 – 200 г', desc: 'Водно-солевой баланс' },
    { name: 'Витаминно-минеральные подкормки / мел', amount: 'По назначению', desc: 'По указанию ветврача' }
  ],
  cookingInstructions: 'Залить горячей водой (65–70°C), тщательно вымешать кормовым веслом, закрыть крышкой и настаивать 35–45 минут до полного набухания и комфортной температуры перед раздачей.'
};

interface FeedControlProps {
  hayBalesDistributed: number;
  hayBagsDistributed: number;
  ration: DailyRationData;
  isLocked?: boolean;
  onBalesChange: (val: number) => void;
  onBagsChange: (val: number) => void;
  onPorridgeChange: (meal: 'morning' | 'lunch', status: 'none' | 'all' | 'partial') => void;
  onVegetableToggle: (chip: string) => void;
  onSaladNotesChange: (notes: string) => void;
  onBranchesChange: (val: number) => void;
}

export function FeedControl({
  hayBalesDistributed,
  hayBagsDistributed,
  ration,
  isLocked = false,
  onBalesChange,
  onBagsChange,
  onPorridgeChange,
  onVegetableToggle,
  onSaladNotesChange,
  onBranchesChange
}: FeedControlProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);

  const eveningChips = ration.evening_salad_chips || [];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/40 p-5 sm:p-6 rounded-[28px] shadow-lg space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-sm">🍽️</span>
          <div>
            <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Рацион</h3>
            <p className="text-[12px] font-medium text-slate-500">Утро, обед, вечерний салат и грубые корма</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRecipeOpen(!recipeOpen)}
          className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 active:scale-95 ${
            recipeOpen
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-inner'
              : 'bg-white/50 text-slate-600 border border-white/40 hover:bg-white/80'
          }`}
          title="Открыть базовый состав каши"
        >
          <BookOpen size={16} className={recipeOpen ? "text-amber-500" : "text-slate-400"} />
          <span>Рецепт каши</span>
          {recipeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* RECIPE ACCORDION */}
      {recipeOpen && (
        <div className="bg-amber-500/5 backdrop-blur-md border border-amber-500/20 rounded-[22px] p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <span className="text-xl">🥣</span> {PORRIDGE_RECIPE.title}
              </div>
              <p className="text-xs text-amber-900/70 mt-1 font-medium leading-relaxed">{PORRIDGE_RECIPE.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setRecipeOpen(false)}
              className="text-amber-900/60 hover:text-amber-900 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded-lg"
            >
              Свернуть
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {PORRIDGE_RECIPE.ingredients.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-3 flex items-center justify-between shadow-sm"
              >
                <div>
                  <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </div>
                <span className="font-black text-amber-600 shrink-0 ml-3 bg-amber-500/10 px-2.5 py-1 rounded-xl text-xs">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-[12px] text-amber-900/90 leading-relaxed font-medium">
            <span className="font-bold text-amber-600 block mb-1">♨️ Приготовление:</span>
            {PORRIDGE_RECIPE.cookingInstructions}
          </div>
        </div>
      )}

      {/* 1. MORNING & LUNCH PORRIDGE */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl shadow-inner">
            🌅
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm tracking-wide">Утро и Обед — Каша</div>
            <div className="text-[11px] text-slate-500 font-medium">Контроль поедаемости</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* MORNING PORRIDGE */}
          <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-[24px] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="bg-white shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-[10px]">🥣</span>
                Утренняя
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                ration.morning_porridge === 'all'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : ration.morning_porridge === 'partial'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
              }`}>
                {ration.morning_porridge === 'all' ? 'Съели всё' : ration.morning_porridge === 'partial' ? 'Частично' : 'Не выдано'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PORRIDGE_OPTIONS.map((opt) => {
                const isSelected = ration.morning_porridge === opt.id;
                let activeStyle = '';
                if (isSelected) {
                  if (opt.id === 'all') {
                    activeStyle = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]';
                  } else if (opt.id === 'partial') {
                    activeStyle = 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]';
                  } else {
                    activeStyle = 'bg-slate-700 text-white shadow-lg shadow-slate-900/20 scale-[1.02]';
                  }
                } else {
                  activeStyle = 'bg-white/60 text-slate-600 hover:bg-white/90 active:scale-95';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onPorridgeChange('morning', opt.id)}
                    className={`h-12 rounded-[16px] text-[11px] font-bold transition-all flex flex-col items-center justify-center border border-white/40 ${activeStyle}`}
                  >
                    <span className="leading-tight text-center">{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LUNCH PORRIDGE */}
          <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-[24px] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span className="bg-white shadow-sm w-6 h-6 rounded-full flex items-center justify-center text-[10px]">🥣</span>
                Дневная
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                ration.lunch_porridge === 'all'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : ration.lunch_porridge === 'partial'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
              }`}>
                {ration.lunch_porridge === 'all' ? 'Съели всё' : ration.lunch_porridge === 'partial' ? 'Частично' : 'Не выдано'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PORRIDGE_OPTIONS.map((opt) => {
                const isSelected = ration.lunch_porridge === opt.id;
                let activeStyle = '';
                if (isSelected) {
                  if (opt.id === 'all') {
                    activeStyle = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]';
                  } else if (opt.id === 'partial') {
                    activeStyle = 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]';
                  } else {
                    activeStyle = 'bg-slate-700 text-white shadow-lg shadow-slate-900/20 scale-[1.02]';
                  }
                } else {
                  activeStyle = 'bg-white/60 text-slate-600 hover:bg-white/90 active:scale-95';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onPorridgeChange('lunch', opt.id)}
                    className={`h-12 rounded-[16px] text-[11px] font-bold transition-all flex flex-col items-center justify-center border border-white/40 ${activeStyle}`}
                  >
                    <span className="leading-tight text-center">{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. EVENING VEGETABLE SALAD */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/40 rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-xl shadow-inner">
            🌆
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm tracking-wide">Вечерний салат</div>
            <div className="text-[11px] text-slate-500 font-medium">Ингредиенты замеса</div>
          </div>
        </div>

        {/* CHIPS MULTI-SELECT */}
        <div className="flex flex-wrap gap-2 pt-2">
          {VEGETABLE_CHIPS.map((veg) => {
            const isSelected = eveningChips.includes(veg.id);
            return (
              <button
                key={veg.id}
                type="button"
                disabled={isLocked}
                onClick={() => onVegetableToggle(veg.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full border border-white/40 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/60 text-slate-600 hover:bg-white/90'
                }`}
              >
                <span className="text-lg leading-none drop-shadow-sm">{veg.emoji}</span>
                <span>{veg.label}</span>
              </button>
            );
          })}
        </div>

        {/* APPETITE NOTES */}
        <div className="pt-2">
          <input
            type="text"
            disabled={isLocked}
            value={ration.salad_notes || ''}
            onChange={(e) => onSaladNotesChange(e.target.value)}
            placeholder="Заметка по аппетиту (напр. «тыкву не доели»)..."
            className="w-full px-5 py-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

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