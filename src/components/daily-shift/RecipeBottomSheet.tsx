import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ChevronDown, Clock, Scale, ShieldAlert, Droplets, Check, Info, Flame } from 'lucide-react';

interface RecipeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeal?: 'all' | 'roughage' | 'm' | 'n' | 's' | 'e';
}

type MealTabKey = 'all' | 'roughage' | 'm' | 'n' | 's' | 'e' | 'taboos';

interface ElephantDietSpec {
  name: string;
  focus: string;
  badge: string;
  badgeColor: string;
  items: { name: string; amount: string; detail?: string; isSpecial?: boolean }[];
  additives: { name: string; purpose: string }[];
  notes?: string;
}

const TABOOS = [
  {
    id: 1,
    title: 'Холодная или теплая вода (<90°C) для утренней каши',
    desc: 'Крахмал овса и геркулеса не клейстеризуется. Сырой крахмал вызывает лавинообразное брожение в слепой кишке, тимпанию и опаснейшие колики.'
  },
  {
    id: 2,
    title: 'Сухие отруби без запарки',
    desc: 'Моментально вдыхаются хоботом в дыхательные пути. Приводит к аспирационной пневмонии или глухому завалу пищевода.'
  },
  {
    id: 3,
    title: 'Кукуруза для Одри (Строго запрещено!)',
    desc: 'У Одри специальный низкокрахмальный рацион ЖКТ. Кукуруза полностью исключена во избежание резких скачков глюкозы и брожения.'
  },
  {
    id: 4,
    title: 'Скармливание горячей каши (>45°C)',
    desc: 'Опасность ожога чувствительных рецепторов хобота и слизистой пищевода. Температура готовой смеси перед подачей не должна превышать 35–40°C.'
  },
  {
    id: 5,
    title: 'Задержка скармливания запаренной каши (>40 минут)',
    desc: 'Запаренная теплая смесь быстро скисает и начинает вторичное брожение. Скармливать строго в течение 20–40 минут после запаривания!'
  },
  {
    id: 6,
    title: 'Пыльное или заплесневелое сено',
    desc: 'Споры плесени смертельно опасны для легких слона. Пыльное сено обязательно проливать водой из шланга; плесневелое — немедленно браковать.'
  }
];

export function RecipeBottomSheet({ isOpen, onClose, initialMeal = 'all' }: RecipeBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<MealTabKey>(initialMeal);
  const [expandedTaboo, setExpandedTaboo] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && initialMeal) {
      setActiveTab(initialMeal);
    }
  }, [isOpen, initialMeal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // 1. Утренний завтрак (07:00)
  const BREAKFAST_ELEPHANTS: ElephantDietSpec[] = [
    {
      name: 'Прэтти',
      focus: 'Возрастная слониха • Базовый утренний замес',
      badge: 'Увеличенная порция',
      badgeColor: 'bg-purple-950/70 border-purple-500/50 text-purple-300',
      items: [
        { name: 'Геркулес экстра', amount: '2 гарнца (2.0 кг)', detail: 'Запарка 100°C' },
        { name: 'Отруби пшеничные', amount: '2 гарнца (2.0 кг)', detail: 'Клетчатка ЖКТ' },
        { name: 'Овёс плющеный', amount: '1 гарнец (1.0 кг)', detail: 'Базовая энергия' },
        { name: 'Кукуруза дроблёная', amount: '0.5 гарнца (300 г)', detail: 'Калории' },
        { name: 'Семечки подсолнечника', amount: '300 г', detail: 'Омега-6 жиры' },
        { name: 'Mono Grass', amount: '0.3 кг', detail: 'Вводить постепенно' }
      ],
      additives: [],
      notes: 'Общий вес: 5.9 кг. Заливать кипятком 100°C в соотношении 1:2.5.'
    },
    {
      name: 'Марго',
      focus: 'Молодая слониха • Активный рост',
      badge: 'Юниор-стандарт',
      badgeColor: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
      items: [
        { name: 'Геркулес экстра', amount: '1 гарнец (1.0 кг)', detail: 'Запарка 100°C' },
        { name: 'Отруби пшеничные', amount: '1 гарнец (1.0 кг)', detail: 'Клетчатка ЖКТ' },
        { name: 'Овёс плющеный', amount: '0.5 гарнца (0.5 кг)', detail: 'Базовая энергия' },
        { name: 'Кукуруза дроблёная', amount: '300 г (0.5 гарнца)', detail: 'Калории' },
        { name: 'Семечки подсолнечника', amount: '200 г', detail: 'Омега-6 жиры' },
        { name: 'Mono Grass', amount: '0.3 кг', detail: 'Монотравы' }
      ],
      additives: [],
      notes: 'Общий вес: 3.3 кг. Заливать кипятком 100°C 1:2.5.'
    },
    {
      name: 'Одри',
      focus: 'Чувствительный ЖКТ • Низкокрахмальная норма',
      badge: 'Без кукурузы',
      badgeColor: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
      items: [
        { name: 'Геркулес экстра', amount: '1 гарнец (1.0 кг)', detail: 'Запарка 100°C' },
        { name: 'Отруби пшеничные', amount: '1 гарнец (1.0 кг)', detail: 'Клетчатка ЖКТ' },
        { name: 'Овёс плющеный', amount: '0.5 гарнца (0.5 кг)', detail: 'Базовая энергия' },
        { name: 'Кукуруза', amount: '0 г (ИСКЛЮЧЕНА)', isSpecial: true, detail: '⚠️ Запрет по вет-карте' },
        { name: 'Семечки подсолнечника', amount: '200 г', detail: 'Омега-6 жиры' },
        { name: 'Mono Grass', amount: '0.2 кг', detail: 'Монотравы' }
      ],
      additives: [],
      notes: 'Общий вес: 2.9 кг. Кукуруза строго запрещена!'
    }
  ];

  // 2. Дневные спец-каши (13:00 Обед и 17:00 Полдник)
  const DAY_MASH_ELEPHANTS = [
    {
      name: 'Прэтти',
      mixName: 'ФормаМакс Каша',
      weight: '2.0 кг (сухой)',
      icon: '🥣',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-200',
      lunchAdditives: [],
      afternoonAdditives: [],
      desc: 'Готовый спец-микс для Прэтти (2.0 кг). Запаривать водой 35–40°C за 20 минут до скармливания.'
    },
    {
      name: 'Марго',
      mixName: 'ОптиФорм + Структокаша + Мэш',
      weight: '1.5 кг (сухой)',
      icon: '🥣',
      color: 'border-sky-500/40 bg-sky-950/20 text-sky-200',
      lunchAdditives: [],
      afternoonAdditives: [],
      desc: 'Сбалансированный питательный микс для Марго (1.5 кг). Запаривать водой 35–40°C за 20 минут.'
    },
    {
      name: 'Одри',
      mixName: 'ОптиФорм + Структокаша + Мэш',
      weight: '0.5 кг (сухой)',
      icon: '🥣',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200',
      lunchAdditives: [],
      afternoonAdditives: [],
      desc: 'Диетическая порция сбалансированного микса для Одри (0.5 кг). Запаривать водой 35–40°C за 20 минут.'
    }
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 sm:rounded-3xl rounded-t-[28px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh] overflow-hidden text-slate-100 animate-in slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-base shrink-0">
              📋
            </span>
            <div>
              <h2 className="font-black text-slate-100 text-base sm:text-lg leading-tight flex items-center gap-1.5">
                <span>Инструкция по рациону</span>
                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  Регламент EAZA
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Нормативы кормления, запарка и запреты: Прэтти, Марго, Одри
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors active:scale-95 shrink-0 cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 sm:px-6 pt-2 pb-1 border-b border-slate-800 bg-slate-950/60 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max pb-1">
            {[
              { id: 'all' as MealTabKey, label: 'Сводка дня' },
              { id: 'roughage' as MealTabKey, label: '🌾 В течение дня' },
              { id: 'm' as MealTabKey, label: '🌅 07:00 Завтрак' },
              { id: 'n' as MealTabKey, label: '☀️ 13:00 Обед' },
              { id: 's' as MealTabKey, label: '🌇 17:00 Полдник' },
              { id: 'e' as MealTabKey, label: '🌙 19:00 Сочные' },
              { id: 'taboos' as MealTabKey, label: '⚠️ Запреты ТБ' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* TAB 1: ВСЯ СВОДКА ДНЯ (ALL) */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">Суточный режим кормления:</span>
                  Рацион разбит на 5 ключевых приёмов для равномерной ферментации в толстом кишечнике (профилактика застоев и колик).
                </div>
              </div>

              {/* Master Schedule Overview Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <div className="p-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    График раздачи и основы кормов
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">3 слонихи</span>
                </div>

                <div className="divide-y divide-slate-800/80 text-xs">
                  {/* Row 0: All Day */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        🌾
                      </span>
                      <div>
                        <span className="font-bold text-slate-100">В течение дня: Грубые корма</span>
                        <div className="text-[11px] text-slate-400">Сено высшего качества вволю (тюки/рулоны) + ветки (береза, ива)</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg shrink-0 sm:self-center self-start">
                      Постоянный доступ
                    </span>
                  </div>

                  {/* Row 1: 07:00 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                        🌅
                      </span>
                      <div>
                        <span className="font-bold text-slate-100">07:00 Завтрак: Зерновая запарка</span>
                        <div className="text-[11px] text-slate-400">
                          Геркулес (1–2г), Отруби (1–2г), Овёс (0.5–1г), Кукуруза (Одри — 0!), Семечки
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-lg shrink-0 sm:self-center self-start">
                      Кипяток 100°C (30 мин)
                    </span>
                  </div>

                  {/* Row 2: 13:00 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                        ☀️
                      </span>
                      <div>
                        <span className="font-bold text-slate-100">13:00 Обед: Спец-каши и суставы</span>
                        <div className="text-[11px] text-slate-400">
                          ФормаМакс (Прэтти 2кг), ОптиФорм (Марго 1.5кг), Mono Grass (Одри 1.5кг) + Соль, Дьявольский коготь
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-lg shrink-0 sm:self-center self-start">
                      Вода 35–40°C (20 мин)
                    </span>
                  </div>

                  {/* Row 3: 17:00 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                        🌇
                      </span>
                      <div>
                        <span className="font-bold text-slate-100">17:00 Полдник: Спец-каши и фитотерапия</span>
                        <div className="text-[11px] text-slate-400">
                          Те же коммерческие миксы + Псиллиум (Прэтти, за 1 мин!), Фенхель/Анис (Марго)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-lg shrink-0 sm:self-center self-start">
                      ЖКТ защита
                    </span>
                  </div>

                  {/* Row 4: 19:00 */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                        🌙
                      </span>
                      <div>
                        <span className="font-bold text-slate-100">19:00 Ужин: Сочные корма</span>
                        <div className="text-[11px] text-slate-400">
                          Морковь 5кг, Свёкла 3.5кг, Яблоки 1.5кг, Бахчевые/Тыква 2-3кг (крупная нарезка)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-lg shrink-0 sm:self-center self-start">
                      Мойка без песка
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: В ТЕЧЕНИЕ ВСЕГО ДНЯ (ГРУБЫЕ КОРМА) */}
          {activeTab === 'roughage' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌾</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-100">Грубые корма (В течение всего дня)</h3>
                      <p className="text-[11px] text-slate-400">Основа физиологического здоровья и моторики ЖКТ слона</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300">
                    EAZA Mandate
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <span>📦</span> Тюки сена
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Тимофеевка / разнотравье первого укоса. Развешиваются в кормушки и сетки для медленного поедания (slow feeding).
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <span>🔘</span> Рулоны сена
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Подаются в центральные зоны вольера для группового фуражирования и имитации естественного выпаса.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <span>🌿</span> Веточный корм
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Ива, осина, береза с корой. Критически важен для естественного стачивания коренных зубов и дубильных веществ.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <span>⚠️</span> Проверка качества перед дачей:
                  </span>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    1. <b>Пыльность:</b> при наличии сухости и пыли — обильно пролить тюк водой из шланга перед подвешиванием.<br/>
                    2. <b>Запах и плесень:</b> тёмные пятна, затхлый грибковый запах — повод для мгновенной браковки всей партии с фиксацией на фото.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: 07:00 ЗАВТРАК */}
          {activeTab === 'm' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-black text-amber-300 text-sm">Инструкция по запарке каши (07:00)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-emerald-400 block mb-0.5">💧 Как запаривать:</span>
                    <span className="text-slate-200">Крупы засыпать в индивидуальные баки. Залить крутым кипятком (100°C) в пропорции <b>1:2.5</b>. Плотно закрыть крышкой.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-sky-400 block mb-0.5">⏳ Сколько ждать:</span>
                    <span className="text-slate-200">Настаивать <b>30 минут</b> (клейстеризация овса). Скармливать теплым (35–40°C) строго за <b>40 минут</b>.</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-amber-300/90 bg-amber-950/60 border border-amber-500/30 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <span className="shrink-0">⚠️</span>
                  <span>Сырой овёс без запарки вызывает брожение и колики. Каша горячее 45°C запрещена во избежание ожога хобота!</span>
                </div>
              </div>

              {/* 3 Elephants Cards */}
              <div className="grid grid-cols-1 gap-3">
                {BREAKFAST_ELEPHANTS.map(el => (
                  <div key={el.name} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🐘</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-100">{el.name}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${el.badgeColor}`}>
                              {el.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{el.focus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Состав крупы:
                        </span>
                        <div className="space-y-1">
                          {el.items.map((it, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                                it.isSpecial ? 'bg-amber-950/40 border border-amber-600/40' : 'bg-slate-900 border border-slate-800/60'
                              }`}
                            >
                              <span className="text-slate-300 font-medium">{it.name}</span>
                              <span className={`font-mono font-bold ${it.isSpecial ? 'text-amber-300 font-black' : 'text-slate-100'}`}>
                                {it.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Обязательные добавки:
                          </span>
                          <div className="space-y-1">
                            {el.additives.map((ad, idx) => (
                              <div key={idx} className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/50 text-[11px]">
                                <span className="font-bold text-purple-300 block">{ad.name}</span>
                                <span className="text-slate-400">{ad.purpose}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {el.notes && (
                          <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            ℹ️ {el.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: 13:00 ОБЕД & 17:00 ПОЛДНИК (СПЕЦ-КАШИ) */}
          {(activeTab === 'n' || activeTab === 's') && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-600/40 text-xs text-sky-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-black text-sky-300 text-sm">
                    {activeTab === 'n' ? 'Инструкция по обеду (13:00)' : 'Инструкция по полднику (17:00)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-emerald-400 block mb-0.5">💧 Как запаривать:</span>
                    <span className="text-slate-200">Вода 35–40°C (тёплая, не кипяток) в пропорции <b>1:2</b> для сохранения витаминов и энзимов.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-sky-400 block mb-0.5">⏳ Сколько ждать:</span>
                    <span className="text-slate-200">Запарить ровно за <b>20 минут</b> до подачи в вольер. Температура не выше 42°C.</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-sky-300/90 bg-sky-950/60 border border-sky-500/30 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <span className="shrink-0">{activeTab === 'n' ? 'ℹ️' : '⚠️'}</span>
                  <span>
                    {activeTab === 'n'
                      ? 'Вет-добавка «Дьявольский коготь» (для суставов) даётся именно в обед со слизистой кашей для защиты желудка.'
                      : 'Для Прэтти псиллиум замешивать СТРОГО за 1 минуту до подачи в вольер (иначе превратится в густой несъедобный студень)!'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {DAY_MASH_ELEPHANTS.map(el => (
                  <div key={el.name} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{el.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-100">{el.name}</span>
                            <span className="text-xs font-bold text-emerald-400">
                              {el.mixName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{el.desc}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300">
                        {el.weight}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {activeTab === 'n' ? 'Добавки на обед (13:00):' : 'Добавки на полдник (17:00):'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(activeTab === 'n' ? el.lunchAdditives : el.afternoonAdditives).map((ad, i) => (
                          <span 
                            key={i} 
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{ad}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: 19:00 СОЧНЫЕ КОРМА (УЖИН) */}
          {activeTab === 'e' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-600/40 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-black text-rose-300 text-sm">Инструкция по сочным кормам (19:00)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-emerald-400 block mb-0.5">💧 Как подготовить:</span>
                    <span className="text-slate-200">Корнеплоды замачивать в баках, мыть со щёткой до полного удаления песка и земли.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                    <span className="font-black text-sky-400 block mb-0.5">🔪 Нарезка и подача:</span>
                    <span className="text-slate-200">Крупные куски <b>10–15 см</b>. Скармливать сразу после нарезки. Подгнившее отбраковывать.</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-rose-300/90 bg-rose-950/60 border border-rose-500/30 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <span className="shrink-0">ℹ️</span>
                  <span>Крупная нарезка стимулирует работу коренных зубов, выработку слюны и предотвращает аспирацию хоботом.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Морковь мытая', icon: '🥕', weight: '5.0 кг', desc: 'Бета-каротин, зрение' },
                  { name: 'Свёкла столовая', icon: '🟣', weight: '3.5 кг', desc: 'Бетаин, печень и кровь' },
                  { name: 'Яблоки сладкие', icon: '🍎', weight: '1.5 кг', desc: 'Пектины, витамин С' },
                  { name: 'Тыква / Бахчевые', icon: '🎃', weight: '2.0–3.0 кг', desc: 'Цинк, каротиноиды' },
                  { name: 'Арбуз (сезонный)', icon: '🍉', weight: '3.0 кг (Прэтти)', desc: 'Гидратация почек' },
                  { name: 'Кабачки свежие', icon: '🥒', weight: '2.0 кг (Одри)', desc: 'Диетический баланс' }
                ].map(veg => (
                  <div key={veg.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{veg.icon}</span>
                      <span className="font-bold text-xs text-slate-200">{veg.name}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {veg.weight}
                    </div>
                    <span className="text-[9.5px] text-slate-500 leading-tight">{veg.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ЗАПРЕТЫ ТБ (TABOOS) */}
          {activeTab === 'taboos' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-bold">Критические правила безопасности кормокухни (нарушение грозит гибелью слона)</span>
              </div>

              <div className="space-y-2">
                {TABOOS.map(taboo => {
                  const isExpanded = expandedTaboo === taboo.id;
                  return (
                    <div 
                      key={taboo.id}
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isExpanded ? 'bg-red-950/30 border-red-500/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedTaboo(isExpanded ? null : taboo.id)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 active:bg-slate-900 cursor-pointer"
                      >
                        <span className="font-bold text-xs sm:text-sm text-slate-200 leading-tight">
                          {taboo.title}
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-rose-400' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-0 border-t border-red-900/30">
                          <p className="text-xs text-slate-300 leading-relaxed font-medium mt-2">
                            {taboo.desc}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            Документ утвержден главным ветврачом зоопарка
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 transition-all cursor-pointer"
          >
            Закрыть техкарту
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
