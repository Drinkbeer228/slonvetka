import React, { useState } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { getLocalMedicines, addLocalMedicine } from '../data/medicines';

interface MedicineSelectModalProps {
  selected: string;
  onSelect: (med: string) => void;
  onClose: () => void;
}

export function MedicineSelectModal({ selected, onSelect, onClose }: MedicineSelectModalProps) {
  const [medicines, setMedicines] = useState<string[]>(getLocalMedicines());
  const [search, setSearch] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  const filtered = medicines.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    const updated = addLocalMedicine(newMedName);
    setMedicines(updated);
    onSelect(newMedName.trim());
    setNewMedName('');
    setAddingNew(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg">Выбрать препарат</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-zinc-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск препарата..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-zinc-900 transition"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {!addingNew ? (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full py-3 px-4 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-zinc-900 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 transition mb-3"
            >
              <Plus size={18} />
              <span>+ Добавить препарат</span>
            </button>
          ) : (
            <form onSubmit={handleAdd} className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-3 mb-3">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Название нового препарата"
                autoFocus
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg font-bold focus:outline-none focus:border-zinc-900"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAddingNew(false)}
                  className="px-3 py-1.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-bold text-white bg-zinc-900 rounded-lg"
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {filtered.map(med => {
            const isSelected = selected === med;
            return (
              <button
                key={med}
                onClick={() => { onSelect(med); onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between ${isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900'}`}
              >
                <span>{med}</span>
                {isSelected && <Check size={18} />}
              </button>
            );
          })}

          {filtered.length === 0 && !addingNew && (
            <p className="text-center py-6 text-zinc-400 font-medium">Препараты не найдены</p>
          )}

          <button
            onClick={() => { onSelect('Другое'); onClose(); }}
            className="w-full text-center py-3 text-zinc-500 font-bold hover:text-zinc-900 transition"
          >
            Другое / Написать вручную
          </button>
        </div>
      </div>
    </div>
  );
}
