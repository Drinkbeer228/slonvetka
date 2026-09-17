import React, { useState } from 'react';
import { useStore } from '../../store';
import { Edit2, Trash2, Plus, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FodderItem } from '../../types';

interface FodderStorageSlideProps {
  slideWrapperClass: string;
}

export const FodderStorageSlide: React.FC<FodderStorageSlideProps> = ({ slideWrapperClass }) => {
  const { fodderInventory, updateFodderAmount, addFodderItem, deleteFodderItem, editFodderItem } = useStore();
  const [editingItem, setEditingItem] = useState<Partial<FodderItem> | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    rolls: true,
    browse: true,
    juicy: true,
    concentrate: true
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData: FodderItem = {
      id: editingItem?.id || Date.now().toString(),
      parentId: (formData.get('parentId') as any) || 'bales',
      name: formData.get('name') as string,
      scoreTag: formData.get('scoreTag') as string,
      category: formData.get('category') as any,
      amount: Number(formData.get('amount')) || 0,
      unit: formData.get('unit') as any,
      isDefault: editingItem?.isDefault,
    };
    
    if (editingItem?.id) {
      editFodderItem(itemData.id, itemData);
    } else {
      addFodderItem(itemData);
    }
    setEditingItem(null);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(p => ({ ...p, [groupId]: !p[groupId] }));
  };

  const renderGroup = (parentId: string, title: string, defaultUnit: string, defaultCategory: string) => {
    const items = fodderInventory.filter(i => i.parentId === parentId);
    
    const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
    const isCollapsed = collapsedGroups[parentId];

    return (
      <div key={parentId} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden mb-4 shrink-0 h-auto">
        <button 
          onClick={() => toggleGroup(parentId)}
          className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              Всего: <span className="text-slate-200 font-bold">{totalAmount}</span> {defaultUnit}
            </p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 shrink-0">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </div>
        </button>

        <div className={`grid transition-all duration-300 overflow-hidden ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
          <div className="min-h-0 h-auto">
            <div className="p-3 pt-1 space-y-2.5 bg-slate-950/30 border-t border-slate-800/50 h-auto w-full">
              {items.map(item => (
                <div key={item.id} className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-sm relative shrink-0 min-h-[90px]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.scoreTag && <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">{item.scoreTag}</span>}
                        {item.amount < 0 && <span className="text-[10px] bg-rose-950/40 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-rose-900/50">В долг</span>}
                      </div>
                      <span className="text-sm font-bold text-slate-200">{item.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-200">{item.amount}</span>
                        <span className="text-xs font-semibold text-slate-500 ml-1">{item.unit}</span>
                      </div>
                      
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors ml-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!item.isDefault && (
                        <button 
                          onClick={() => deleteFodderItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-950/30 text-rose-500 hover:bg-rose-900/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mt-1 border-t border-slate-800/50 pt-2">
                    <button onClick={() => updateFodderAmount(item.id, -10)} className="h-8 bg-rose-950/20 text-rose-500 border border-rose-900/30 rounded-lg font-bold text-xs active:bg-rose-900/40">-10</button>
                    <button onClick={() => updateFodderAmount(item.id, -1)} className="h-8 bg-rose-950/20 text-rose-500 border border-rose-900/30 rounded-lg font-bold text-xs active:bg-rose-900/40">-1</button>
                    <button onClick={() => updateFodderAmount(item.id, 1)} className="h-8 bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 rounded-lg font-bold text-xs active:bg-emerald-900/50">+1</button>
                    <button onClick={() => updateFodderAmount(item.id, 10)} className="h-8 bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 rounded-lg font-bold text-xs active:bg-emerald-900/50">+10</button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setEditingItem({ parentId: parentId as any, name: '', scoreTag: '', category: defaultCategory as any, amount: 0, unit: defaultUnit })}
                className="w-full h-10 shrink-0 bg-slate-900 text-emerald-500 border border-emerald-900/30 border-dashed rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:bg-slate-800 transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                Добавить позицию
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={slideWrapperClass}>
      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 mb-4 mt-1 shrink-0">🌾 Фуражная</h2>
      
      {renderGroup('bales', 'Тюки сена', 'шт', 'rough')}
      {renderGroup('rolls', 'Рулоны сена', 'рул', 'rough')}
      {renderGroup('browse', 'Веточный корм', 'шт', 'rough')}
      {renderGroup('juicy', '🥕 Сочные корма / Овощи', 'кг', 'juicy')}
      {renderGroup('concentrate', '🌾 Концентраты', 'меш', 'concentrate')}

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-4 pb-8">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{editingItem.id ? 'Редактировать' : 'Новая позиция'}</h3>
              <button onClick={() => setEditingItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <input type="hidden" name="parentId" value={editingItem.parentId} />
              <input type="hidden" name="category" value={editingItem.category} />
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Название</label>
                <input required type="text" name="name" defaultValue={editingItem.name} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50" placeholder="Например: Люцерна" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Оценка/Смайл</label>
                  <input type="text" name="scoreTag" defaultValue={editingItem.scoreTag} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50" placeholder="Например: 👑 10/10" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Единица</label>
                  <select name="unit" defaultValue={editingItem.unit} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 appearance-none">
                    <option value="шт">шт</option>
                    <option value="рул">рул</option>
                    <option value="кг">кг</option>
                    <option value="меш">меш</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Текущий остаток</label>
                <input required type="number" name="amount" defaultValue={editingItem.amount || 0} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 font-bold" />
              </div>
              
              <button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 transition-colors">
                <Check className="w-5 h-5" />
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
