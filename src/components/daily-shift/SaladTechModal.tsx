import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, Droplets, Sparkles, Layers, Apple, ShieldAlert } from 'lucide-react';

interface SaladTechModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaladTechModal({ isOpen, onClose }: SaladTechModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 sm:rounded-3xl rounded-t-[32px] shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] transform transition-transform duration-300 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS style drag handle for mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-black text-slate-950 text-lg sm:text-xl tracking-tight">Регламент вечернего салата</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">Технологическая карта и регламент кормокухни</p>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 hover:text-slate-950 transition-colors active:scale-95 shrink-0 cursor-pointer shadow-xs"
            aria-label="Закрыть регламент"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* 1. Базовая развесовка (1-й Акт — Основа) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Scale size={16} className="text-amber-600 stroke-[2.4]" />
                <span>Базовая развесовка (1-й Акт — Основа)</span>
              </h3>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-xs">
                Всего: 60 кг
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-2xl mb-1">🥔</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">Картофель</div>
                  <div className="text-sm sm:text-base font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-2xl mb-1">🥕</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">Морковь</div>
                  <div className="text-sm sm:text-base font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="text-2xl mb-1">🍠</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">Свёкла</div>
                  <div className="text-sm sm:text-base font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 font-semibold bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
                <span className="text-base shrink-0">ℹ️</span>
                <span>
                  <strong>Итого базового замеса: 60 кг.</strong> Распределяется поровну между слонами в индивидуальные тазы (~120 л).
                </span>
              </div>
            </div>
          </div>

          {/* 2. Технология мойки и очистки */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Droplets size={16} className="text-blue-600 stroke-[2.4]" />
              <span>Технология мойки и очистки</span>
            </h3>

            <div className="space-y-3">
              {/* Шаг 1 */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5 font-black text-sm text-slate-900 mb-1.5">
                  <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <span>🚿 Замачивание</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold pl-9">
                  Засыпать овощи в таз, залить тёплой водой и накрыть. Периодически подходить и <strong>перемешивать щёткой на длинном черенке</strong>, пока грязь полностью не откиснет.
                </p>
              </div>

              {/* Шаг 2 */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5 font-black text-sm text-slate-900 mb-1.5">
                  <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <span>🧺 Смыв и сетчатая корзина</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold pl-9">
                  Финальное перемешивание в тазу. Пересыпать в <strong>сетчатую корзину</strong>, растрясти и промыть чистой проточной водой <strong>до полного удаления песка и глины</strong>.
                </p>
              </div>

              {/* Шаг 3 */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5 font-black text-sm text-slate-900 mb-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <span>🔪 Сортировка и калибровка</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold pl-9 space-y-1.5">
                  <div>• <strong>Картофель:</strong> перебрать, вырезать гниль. Крупные клубни разрезать на части (<em>профилактика завала пищевода</em>). Мелкие оставлять целыми.</div>
                  <div>• <strong>Морковь:</strong> срезать кончики.</div>
                  <div>• <strong>Свёкла:</strong> срезать «голову» и хвостик.</div>
                  <div className="pt-1.5 text-rose-700 font-black flex items-center gap-1.5">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>Все обрезки и брак — строго в мусорку!</span>
                  </div>
                </div>
              </div>

              {/* Шаг 4 */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5 font-black text-sm text-slate-900 mb-1.5">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">4</span>
                  <span>⚖️ Раскладка</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold pl-9">
                  Чистую базу <strong>равномерно разложить</strong> по индивидуальным тазам слонов.
                </p>
              </div>
            </div>
          </div>

          {/* 3. 2-й Акт: Сезонная овощюга и фрукты */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Apple size={16} className="text-emerald-600 stroke-[2.4]" />
              <span>2-й Акт: Сезонные овощи и фрукты</span>
            </h3>
            
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900">
                <span className="text-xl">🍉🎃🍌</span>
                <span>Добавка сочного корма поверх базы</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                Поверх базовой подушки докинуть сочные корма по текущей ведомости склада:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Капуста 🥬', 'Перец 🫑', 'Сельдерей 🌿', 'Арбуз 🍉', 'Дыня 🍈', 'Бананы 🍌', 'Кукуруза 🌽', 'Яблоки 🍏', 'Тыква 🎃'].map((item) => (
                  <span key={item} className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-xs sm:text-sm font-black flex items-center shadow-xs">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-semibold italic pt-1">
                * С учетом сезонных поставок и индивидуальных диетических назначений ветеринара.
              </p>
            </div>
          </div>

          {/* 4. Минеральный замес (перед самой подачей) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-600 stroke-[2.4]" />
              <span>Минеральный замес (перед самой подачей)</span>
            </h3>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
              <span className="text-2xl shrink-0 mt-0.5">🧂⚪</span>
              <div className="space-y-1.5">
                <div className="font-black text-sm sm:text-base text-indigo-950">Кормовой мел и поваренная соль</div>
                <p className="text-xs sm:text-sm text-indigo-950/90 leading-relaxed font-semibold">
                  Посыпать замес кормовым мелом и солью <strong>непосредственно перед отправкой тазов в вольер</strong> для равномерного усвоения и предотвращения отмокания соли на дне.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
