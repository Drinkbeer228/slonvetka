import React, { useState } from 'react';
import { CounterButton } from '../common/CounterButton';
import { BookOpen, Check, ChevronDown, ChevronUp, Sparkles, Utensils, Wheat } from 'lucide-react';

export interface DailyRationData {
  morning_porridge: 'none' | 'all' | 'partial';
  lunch_porridge: 'none' | 'all' | 'partial';
  evening_salad_chips: string[];
  salad_notes: string;
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
  onSaladNotesChange
}: FeedControlProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);

  const eveningChips = ration.evening_salad_chips || [];

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 sm:p-6 rounded-[28px] shadow-[0_4px_28px_rgba(0,0,0,0.03)] space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">🍽️</span>
          <div>
            <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Рацион дня</h3>
            <p className="text-[11px] font-semibold text-slate-500">Утро, обед, вечерний салат и грубые корма</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRecipeOpen(!recipeOpen)}
          className={`px-3.5 py-2 rounded-full font-bold text-xs transition flex items-center gap-2 shadow-sm active:scale-95 border ${
            recipeOpen
              ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-inner'
              : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200/80'
          }`}
          title="Открыть базовый состав каши"
        >
          <BookOpen size={14} className="text-amber-700" />
          <span>Рецепт каши</span>
          {recipeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* RECIPE ACCORDION */}
      {recipeOpen && (
        <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-orange-50/50 border border-amber-200/80 rounded-[22px] p-4 sm:p-5 shadow-sm space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-black text-amber-950 text-sm sm:text-base flex items-center gap-1.5">
                <span>🥣</span> {PORRIDGE_RECIPE.title}
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">{PORRIDGE_RECIPE.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setRecipeOpen(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold underline px-1 py-0.5"
            >
              Свернуть
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {PORRIDGE_RECIPE.ingredients.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white/80 border border-amber-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
                <span className="font-black text-amber-900 shrink-0 ml-2 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-amber-100/50 border border-amber-200/50 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed font-medium">
            <span className="font-bold">♨️ Приготовление: </span>
            {PORRIDGE_RECIPE.cookingInstructions}
          </div>
        </div>
      )}

      {/* 1. MORNING & LUNCH PORRIDGE */}
      <div className="bg-white/50 border border-white/80 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌅</span>
          <div className="font-black text-slate-800 text-sm uppercase tracking-wider">
            Утро и Обед — Каша
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MORNING PORRIDGE */}
          <div className="bg-white/70 border border-slate-200/60 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🥣</span> Утренняя каша
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                ration.morning_porridge === 'all'
                  ? 'bg-emerald-100 text-emerald-800'
                  : ration.morning_porridge === 'partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {ration.morning_porridge === 'all' ? 'Съели всё' : ration.morning_porridge === 'partial' ? 'Частично' : 'Не выдано'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {PORRIDGE_OPTIONS.map((opt) => {
                const isSelected = ration.morning_porridge === opt.id;
                let activeStyle = '';
                if (isSelected) {
                  if (opt.id === 'all') {
                    activeStyle = 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-2 ring-emerald-200/70 shadow-sm font-black';
                  } else if (opt.id === 'partial') {
                    activeStyle = 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-200/70 shadow-sm font-black';
                  } else {
                    activeStyle = 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm font-bold';
                  }
                } else {
                  activeStyle = 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-white hover:border-slate-300 active:scale-95';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onPorridgeChange('morning', opt.id)}
                    className={`min-h-[44px] py-2 px-1.5 rounded-xl border text-[11px] font-bold transition flex flex-col items-center justify-center gap-0.5 ${activeStyle}`}
                  >
                    <span className="text-xs">{opt.icon}</span>
                    <span className="leading-tight text-center truncate w-full">{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LUNCH PORRIDGE */}
          <div className="bg-white/70 border border-slate-200/60 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🥣</span> Дневная каша (Обед)
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                ration.lunch_porridge === 'all'
                  ? 'bg-emerald-100 text-emerald-800'
                  : ration.lunch_porridge === 'partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {ration.lunch_porridge === 'all' ? 'Съели всё' : ration.lunch_porridge === 'partial' ? 'Частично' : 'Не выдано'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {PORRIDGE_OPTIONS.map((opt) => {
                const isSelected = ration.lunch_porridge === opt.id;
                let activeStyle = '';
                if (isSelected) {
                  if (opt.id === 'all') {
                    activeStyle = 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-2 ring-emerald-200/70 shadow-sm font-black';
                  } else if (opt.id === 'partial') {
                    activeStyle = 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-200/70 shadow-sm font-black';
                  } else {
                    activeStyle = 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm font-bold';
                  }
                } else {
                  activeStyle = 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-white hover:border-slate-300 active:scale-95';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onPorridgeChange('lunch', opt.id)}
                    className={`min-h-[44px] py-2 px-1.5 rounded-xl border text-[11px] font-bold transition flex flex-col items-center justify-center gap-0.5 ${activeStyle}`}
                  >
                    <span className="text-xs">{opt.icon}</span>
                    <span className="leading-tight text-center truncate w-full">{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. EVENING VEGETABLE SALAD */}
      <div className="bg-white/50 border border-white/80 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌆</span>
            <div className="font-black text-slate-800 text-sm uppercase tracking-wider">
              Вечерний овощной салат
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Быстрый выбор ингредиентов сегодняшнего замеса:
          </span>
        </div>

        {/* CHIPS MULTI-SELECT */}
        <div className="flex flex-wrap gap-2 pt-1">
          {VEGETABLE_CHIPS.map((veg) => {
            const isSelected = eveningChips.includes(veg.id);
            return (
              <button
                key={veg.id}
                type="button"
                disabled={isLocked}
                onClick={() => onVegetableToggle(veg.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-2 ring-emerald-200/70 shadow-xs font-black'
                    : 'bg-white/80 text-slate-600 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-base leading-none">{veg.emoji}</span>
                <span>{veg.label}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-emerald-200/60 text-emerald-800 flex items-center justify-center text-[10px]">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
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
            placeholder="Заметка по аппетиту к овощам (напр. «морковь сладкая, тыкву не доели»)..."
            className="w-full px-4 py-3 bg-white/90 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition shadow-2xs placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 3. COARSE FEED (HAY STEPPERS) */}
      <div className="bg-white/50 border border-white/80 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌾</span>
          <div className="font-black text-slate-800 text-sm uppercase tracking-wider">
            Грубые корма (Сено)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/70 border border-slate-200/60 p-4 rounded-2xl flex flex-col items-center justify-between shadow-2xs backdrop-blur-sm gap-3">
            <div className="text-center w-full">
              <div className="text-sm font-black text-slate-800">Тюки сена</div>
              <div className="text-[11px] text-slate-500 font-medium">Основная раздача на ночь и день</div>
            </div>
            <CounterButton
              value={hayBalesDistributed}
              onChange={onBalesChange}
            />
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-4 rounded-2xl flex flex-col items-center justify-between shadow-2xs backdrop-blur-sm gap-3">
            <div className="text-center w-full">
              <div className="text-sm font-black text-slate-800">Рулоны / Мешки</div>
              <div className="text-[11px] text-slate-500 font-medium">Дополнительный фураж / сетки</div>
            </div>
            <CounterButton
              value={hayBagsDistributed}
              onChange={onBagsChange}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

