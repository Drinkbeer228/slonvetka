import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { MEDICAL_CATEGORIES, MEDICAL_ACTIONS, MedicalActionDefinition } from '../data/medicalActions';

interface ActionSelectModalProps {
  onSelect: (action: MedicalActionDefinition) => void;
  onClose: () => void;
}

export function ActionSelectModal({ onSelect, onClose }: ActionSelectModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('treatment');

  const categoryActions = MEDICAL_ACTIONS.filter(a => a.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-lg">Что сделать?</h2>
            <p className="text-xs text-zinc-400 font-medium">Выберите категорию и действие</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories bar */}
        <div className="flex gap-1.5 p-3 overflow-x-auto bg-zinc-50 border-b border-zinc-200 shrink-0 scrollbar-hide">
          {MEDICAL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap border ${isActive ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Actions list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {categoryActions.map(action => (
            <button
              key={action.id}
              onClick={() => { onSelect(action); onClose(); }}
              className="w-full text-left p-4 bg-white rounded-2xl border-2 border-zinc-100 hover:border-zinc-900 transition flex items-center justify-between group shadow-sm active:scale-[0.99]"
            >
              <div>
                <div className="font-bold text-base text-zinc-900 group-hover:text-black">{action.title}</div>
                {action.defaultMedicine && (
                  <div className="text-xs font-medium text-zinc-500 mt-0.5">По умолчанию: {action.defaultMedicine}</div>
                )}
              </div>
              <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition">
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
