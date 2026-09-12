import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ChevronDown } from 'lucide-react';

interface RecipeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABOOS = [
  {
    id: 1,
    title: 'Холодная или теплая вода (<90°C)',
    desc: 'Крахмал овса и отрубей не клейстеризуется. Сырой крахмал вызывает взрывное брожение в слепой кишке и острые колики.'
  },
  {
    id: 2,
    title: 'Сухие отруби без запарки',
    desc: 'Моментально вдыхается хоботом. Приводит к аспирационной пневмонии или глухому завалу пищевода.'
  },
  {
    id: 3,
    title: 'Бобовые (горох, фасоль, бобы)',
    desc: 'Вызывают лавинообразное газообразование. Смертельный метеоризм и заворот кишок (слоны не могут отрыгивать газы).'
  },
  {
    id: 4,
    title: 'Хлеб, вареный картофель, рис',
    desc: 'Быстрые углеводы закисляют кашу за 30 минут. Приводит к гибели микрофлоры и острому ламиниту.'
  }
];

export function RecipeBottomSheet({ isOpen, onClose }: RecipeBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedTaboo, setExpandedTaboo] = useState<number | null>(null);

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
        className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 sm:rounded-3xl rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[85vh] transform transition-transform duration-300 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS style drag handle for mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:pt-6 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl tracking-tight">Технологическая карта</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors active:scale-95 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Recipe List */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Строгая рецептура (на 1 слона)</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <ol className="space-y-3 font-medium text-sm text-slate-700">
                <li className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="flex items-center gap-2"><span className="text-slate-400 font-bold">1.</span> Овес плющеный</span>
                  <span className="font-black text-slate-900">2.5 кг</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="flex items-center gap-2"><span className="text-slate-400 font-bold">2.</span> Отруби пшеничные</span>
                  <span className="font-black text-slate-900">1.2 кг</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="flex items-center gap-2"><span className="text-slate-400 font-bold">3.</span> Ячмень дробленый</span>
                  <span className="font-black text-slate-900">0.5 кг</span>
                </li>
                <li className="flex justify-between items-start pb-2 border-b border-slate-200/60">
                  <span className="flex items-start gap-2"><span className="text-slate-400 font-bold">4.</span> 
                    <span>Кипяток (100°C)<br/><span className="text-xs text-slate-400">Выдержка строго 2.5–3 ч.</span></span>
                  </span>
                  <span className="font-black text-slate-900">8–10 л</span>
                </li>
                <li className="flex justify-between items-center pt-1">
                  <span className="flex items-center gap-2"><span className="text-slate-400 font-bold">5.</span> Соль + Мел <span className="text-xs text-slate-400">(в остывшую)</span></span>
                  <span className="font-black text-slate-900">по 50 г</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Taboos Accordion */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-rose-500/80 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Важные запреты кормокухни
            </h3>
            
            <div className="space-y-2">
              {TABOOS.map(taboo => {
                const isExpanded = expandedTaboo === taboo.id;
                return (
                  <div 
                    key={taboo.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200 hover:border-rose-100'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedTaboo(isExpanded ? null : taboo.id)}
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-slate-50/50"
                    >
                      <span className="font-bold text-sm text-slate-800 leading-tight">
                        {taboo.title}
                      </span>
                      <ChevronDown 
                        size={18} 
                        className={`shrink-0 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-rose-400' : ''}`}
                      />
                    </button>
                    <div 
                      className={`grid transition-all duration-300 ease-in-out ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {taboo.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
