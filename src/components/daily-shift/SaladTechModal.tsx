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
            <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl tracking-tight">Регламент вечернего салата</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Технологическая карта и регламент кормокухни</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors active:scale-95 shrink-0"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* 1. Базовая развесовка (1-й Акт — Основа) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Scale size={14} className="text-amber-500" />
                Базовая развесовка (1-й Акт — Основа)
              </h3>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/60">
                Всего: 60 кг
              </span>
            </div>

            <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-xl mb-1">🥔</div>
                  <div className="text-xs font-bold text-slate-800">Картофель</div>
                  <div className="text-sm font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-xl mb-1">🥕</div>
                  <div className="text-xs font-bold text-slate-800">Морковь</div>
                  <div className="text-sm font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-xl mb-1">🍠</div>
                  <div className="text-xs font-bold text-slate-800">Свёкла</div>
                  <div className="text-sm font-black text-amber-600 mt-0.5">20 кг</div>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium bg-amber-50/60 border border-amber-100/80 rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-sm">ℹ️</span>
                <span>
                  <strong>Итого базового замеса: 60 кг.</strong> Распределяется поровну между слонами в индивидуальные тазы (~120 л).
                </span>
              </div>
            </div>
          </div>

          {/* 2. Технология мойки и очистки */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Droplets size={14} className="text-blue-500" />
              Технология мойки и очистки
            </h3>

            <div className="space-y-2.5">
              {/* Шаг 1 */}
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</span>
                  <span>🚿 Замачивание</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium pl-8">
                  Засыпать овощи в таз, залить тёплой водой и накрыть. Периодически подходить и <strong>перемешивать щёткой на длинном черенке</strong>, пока грязь полностью не откиснет.
                </p>
              </div>

              {/* Шаг 2 */}
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">2</span>
                  <span>🧺 Смыв и сетчатая корзина</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium pl-8">
                  Финальное перемешивание в тазу. Пересыпать в <strong>сетчатую корзину</strong>, растрясти и промыть чистой проточной водой <strong>до полного удаления песка и глины</strong>.
                </p>
              </div>

              {/* Шаг 3 */}
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">3</span>
                  <span>🔪 Сортировка и калибровка</span>
                </div>
                <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium pl-8 space-y-1">
                  <div>• <strong>Картофель:</strong> перебрать, вырезать гниль. Крупные клубни разрезать на части (<em>профилактика завала пищевода</em>). Мелкие оставлять целыми.</div>
                  <div>• <strong>Морковь:</strong> срезать кончики.</div>
                  <div>• <strong>Свёкла:</strong> срезать «голову» и хвостик.</div>
                  <div className="pt-1 text-rose-600 font-bold flex items-center gap-1">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>Все обрезки и брак — строго в мусорку!</span>
                  </div>
                </div>
              </div>

              {/* Шаг 4 */}
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">4</span>
                  <span>⚖️ Раскладка</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium pl-8">
                  Чистую базу <strong>равномерно разложить</strong> по индивидуальным тазам слонов.
                </p>
              </div>
            </div>
          </div>

          {/* 3. 2-й Акт: Сезонная овощюга и фрукты */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Apple size={14} className="text-emerald-500" />
              2-й Акт: Сезонная овощюга и фрукты
            </h3>
            
            <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="text-lg">🍉🎃🍌</span>
                <span>Добавка сочного корма поверх базы</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium">
                Поверх базовой подушки докинуть сочные корма по текущей ведомости склада:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Капуста 🥬', 'Перец 🫑', 'Сельдерей 🌿', 'Арбуз 🍉', 'Дыня 🍈', 'Бананы 🍌', 'Кукуруза 🌽', 'Яблоки 🍏', 'Тыква 🎃'].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-700 text-xs font-semibold">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-medium italic pt-1">
                * С учетом сезонных поставок и индивидуальных диетических назначений ветеринара.
              </p>
            </div>
          </div>

          {/* 4. Минеральный замес (перед самой подачей) */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              Минеральный замес (перед самой подачей)
            </h3>

            <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">🧂⚪</span>
              <div className="space-y-1">
                <div className="font-bold text-sm text-indigo-950">Кормовой мел и поваренная соль</div>
                <p className="text-xs sm:text-[13px] text-indigo-900/80 leading-relaxed font-medium">
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
