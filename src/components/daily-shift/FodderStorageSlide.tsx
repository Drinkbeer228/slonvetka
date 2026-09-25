import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  Edit2, Trash2, Plus, Minus, X, Check, Package, 
  Sparkles, ClipboardList, AlertTriangle, FileText, CheckCircle2 
} from 'lucide-react';
import { FodderItem } from '../../types';
import { useRole } from '../../context/RoleContext';

interface FodderStorageSlideProps {
  slideWrapperClass?: string;
}

export const FodderStorageSlide: React.FC<FodderStorageSlideProps> = () => {
  const { fodderInventory, updateFodderAmount, addFodderItem, deleteFodderItem, editFodderItem } = useStore();
  const { isChief, roleConfig } = useRole();
  const [editingItem, setEditingItem] = useState<Partial<FodderItem> | null>(null);

  // REELS STATE: 0: Сено, 1: Сочные, 2: Концентраты, 3: Ветки, 4: Сводка
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const lastReportedReelRef = useRef(0);

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
  };

  const scrollToReel = (index: number) => {
    setActiveReelIndex(index);
    lastReportedReelRef.current = index;
    if (reelContainerRef.current) {
      const targetX = index * reelContainerRef.current.clientWidth;
      reelContainerRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
      triggerHaptic();
    }
  };

  const handleReelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (lastReportedReelRef.current !== index) {
      lastReportedReelRef.current = index;
      setActiveReelIndex(index);
      triggerHaptic();
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const unit = formData.get('unit') as any;
    
    const fullBags = formData.get('fullBagsCount') !== null && formData.get('fullBagsCount') !== '' 
      ? Number(formData.get('fullBagsCount')) 
      : undefined;
    const currentKg = formData.get('currentBagKg') !== null && formData.get('currentBagKg') !== '' 
      ? Number(formData.get('currentBagKg')) 
      : undefined;
    const capacityKg = formData.get('bagCapacityKg') !== null && formData.get('bagCapacityKg') !== '' 
      ? Number(formData.get('bagCapacityKg')) 
      : (editingItem?.bagCapacityKg || 30);
    const rawAmount = Number(formData.get('amount')) || 0;

    const itemData: FodderItem = {
      id: editingItem?.id || `fodder_${Date.now()}`,
      parentId: (formData.get('parentId') as any) || 'bales',
      name: formData.get('name') as string,
      scoreTag: formData.get('scoreTag') as string,
      category: formData.get('category') as any,
      amount: fullBags !== undefined ? fullBags + ((currentKg && currentKg > 0) ? 1 : 0) : rawAmount,
      unit: unit,
      isDefault: editingItem?.isDefault,
      fullBagsCount: fullBags,
      currentBagKg: currentKg,
      bagCapacityKg: capacityKg,
    };
    
    if (editingItem?.id) {
      editFodderItem(itemData.id, itemData);
    } else {
      addFodderItem(itemData);
    }
    setEditingItem(null);
  };

  // Grouped items
  const hayItems = (() => {
    const raw = fodderInventory.filter(i => i.parentId === 'bales' || i.parentId === 'rolls' || i.parentId === 'hay');
    // Deduplicate by name if duplicated
    const merged = new Map<string, FodderItem>();
    for (const it of raw) {
      if (merged.has(it.name)) {
        const ex = merged.get(it.name)!;
        ex.amount += it.amount;
      } else {
        merged.set(it.name, { ...it, parentId: 'bales', unit: 'шт' });
      }
    }
    return Array.from(merged.values());
  })();

  const juicyItems = fodderInventory.filter(i => i.parentId === 'juicy' || i.category === 'juicy');
  const concentrateItems = fodderInventory.filter(i => i.parentId === 'concentrate' || i.category === 'concentrate');
  const browseItems = fodderInventory.filter(i => i.parentId === 'browse');

  const totalHay = Math.round(hayItems.reduce((acc, i) => acc + i.amount, 0) * 10) / 10;
  const totalJuicy = Math.round(juicyItems.reduce((acc, i) => acc + i.amount, 0) * 10) / 10;
  const totalConcentrateBags = concentrateItems.reduce((acc, i) => acc + (i.fullBagsCount !== undefined ? i.fullBagsCount : Math.floor(i.amount)), 0);
  const totalBrowse = browseItems.reduce((acc, i) => acc + i.amount, 0);

  const lowStockItems = fodderInventory.filter(i => {
    if (i.fullBagsCount !== undefined) {
      return i.fullBagsCount <= 2;
    }
    return i.amount <= 10;
  });

  const REEL_TABS = [
    { id: 0, label: 'Сено', icon: '🌾', count: `${totalHay} шт`, color: 'text-amber-400 border-amber-500/50 bg-amber-950/70' },
    { id: 1, label: 'Сочные', icon: '🥕', count: `${totalJuicy} кг`, color: 'text-orange-400 border-orange-500/50 bg-orange-950/70' },
    { id: 2, label: 'Концентраты', icon: '🌾', count: `${totalConcentrateBags} меш`, color: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/70' },
    { id: 3, label: 'Ветки', icon: '🌿', count: `${totalBrowse} шт`, color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/70' },
    { id: 4, label: 'Сводка', icon: '📊', count: 'Баланс', color: 'text-sky-400 border-sky-500/50 bg-sky-950/70' },
  ];

  const reelSlideClass = "w-screen min-w-full h-full flex flex-col snap-center snap-always overflow-y-auto overscroll-y-contain px-3.5 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-[calc(env(safe-area-inset-bottom)+4.75rem)] text-slate-100 select-none";

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 select-none overflow-hidden flex flex-col">
      
      {/* FIXED TOP REELS BAR FOR WAREHOUSE */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 pt-[calc(env(safe-area-inset-top)+0.4rem)] pb-2 pointer-events-auto">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">📦</span>
              <h1 className="text-sm font-black text-slate-100 tracking-tight">Склад фуража (Рилсы)</h1>
            </div>
            {isChief ? (
              <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-full">
                👁️ Шеф: только чтение
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>{roleConfig.badge}</span>
              </span>
            )}
          </div>

          {/* 5 CATEGORY REEL SWITCHER PILLS */}
          <div className="grid grid-cols-5 gap-1">
            {REEL_TABS.map(tab => {
              const isActive = activeReelIndex === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToReel(tab.id)}
                  className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl border transition-all text-center cursor-pointer ${
                    isActive 
                      ? `${tab.color} font-black shadow-md scale-[1.02]` 
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs leading-none mb-0.5">{tab.icon}</span>
                  <span className="text-[10px] font-bold leading-tight truncate w-full">{tab.label}</span>
                  <span className="text-[8px] font-mono opacity-80 truncate w-full">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* HORIZONTAL REELS CONTAINER */}
      <div
        ref={reelContainerRef}
        onScroll={handleReelScroll}
        className="w-full flex-1 flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth touch-pan-x"
      >
        
        {/* ======================================================== */}
        {/* REEL 0: 🌾 СЕНО (ВСЕ СОРТА) */}
        {/* ======================================================== */}
        <div className={`${reelSlideClass} bg-gradient-to-b from-[#2a1705] via-slate-950 to-slate-950`}>
          <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
            
            {/* Reel Header Card */}
            <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/40 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Рилс 1 • Грубые корма</span>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>🌾</span>
                  <span>Сено (все сорта)</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  В наличии: <span className="text-amber-300 font-black">{totalHay}</span> шт • {hayItems.length} сортов
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-mono">{totalHay}</span>
                <span className="text-xs text-amber-300 block font-semibold">шт</span>
              </div>
            </div>

            {/* Quality Standard Note */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Норматив рациона: сено без ограничений (ad libitum). Влажность 12-14%.</span>
            </div>

            {/* List of Hay Varieties */}
            <div className="space-y-2.5 pb-6">
              {hayItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {item.scoreTag && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                            {item.scoreTag}
                          </span>
                        )}
                        {item.amount <= 5 && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                            Заканчивается
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-100">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400 font-mono">
                          {Number(item.amount.toFixed(1))}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">{item.unit}</span>
                      </div>

                      {!isChief && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!item.isDefault && (
                            <button
                              type="button"
                              onClick={() => deleteFodderItem(item.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick +/- buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -10)}
                      disabled={isChief}
                      className={`h-8 border rounded-lg font-bold text-xs transition-colors ${
                        isChief ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed' : 'bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer'
                      }`}
                    >-10</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -1)}
                      disabled={isChief}
                      className={`h-8 border rounded-lg font-bold text-xs transition-colors ${
                        isChief ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed' : 'bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer'
                      }`}
                    >-1</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 1)}
                      disabled={isChief}
                      className={`h-8 border rounded-lg font-bold text-xs transition-colors ${
                        isChief ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer'
                      }`}
                    >+1</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 10)}
                      disabled={isChief}
                      className={`h-8 border rounded-lg font-bold text-xs transition-colors ${
                        isChief ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer'
                      }`}
                    >+10</button>
                  </div>
                </div>
              ))}

              {!isChief && (
                <button
                  type="button"
                  onClick={() => setEditingItem({ parentId: 'bales', name: '', scoreTag: '🌾 1 сорт', category: 'rough', amount: 0, unit: 'шт' })}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-800/40 border-dashed rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить сорт сена</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REEL 1: 🥕 СОЧНЫЕ КОРМА (ОВОЩИ И ФРУКТЫ) */}
        {/* ======================================================== */}
        <div className={`${reelSlideClass} bg-gradient-to-b from-[#2d1205] via-slate-950 to-slate-950`}>
          <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
            
            {/* Reel Header Card */}
            <div className="bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-800/40 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Рилс 2 • Сочные корма</span>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>🥕</span>
                  <span>Сочные и овощи</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Запас: <span className="text-orange-300 font-black">{totalJuicy}</span> кг • Температура +4°C
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-orange-400 font-mono">{totalJuicy}</span>
                <span className="text-xs text-orange-300 block font-semibold">кг</span>
              </div>
            </div>

            {/* List of Juicy Feeds */}
            <div className="space-y-2.5 pb-6">
              {juicyItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.amount <= 20 && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                            Мало
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">Овощехранилище</span>
                      </div>
                      <span className="text-sm font-bold text-slate-100">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xl font-black text-orange-400 font-mono">
                          {Number(item.amount.toFixed(1))}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">{item.unit}</span>
                      </div>

                      {!isChief && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick +/- buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -10)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                    >-10 кг</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -2)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                    >-2 кг</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 2)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                    >+2 кг</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 10)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                    >+10 кг</button>
                  </div>
                </div>
              ))}

              {!isChief && (
                <button
                  type="button"
                  onClick={() => setEditingItem({ parentId: 'juicy', name: '', scoreTag: '', category: 'juicy', amount: 0, unit: 'кг' })}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-orange-400 border border-orange-800/40 border-dashed rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить сочный корм</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REEL 2: 🌾 КОНЦЕНТРАТЫ И МЕШКИ */}
        {/* ======================================================== */}
        <div className={`${reelSlideClass} bg-gradient-to-b from-[#1b1c06] via-slate-950 to-slate-950`}>
          <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
            
            {/* Reel Header Card */}
            <div className="bg-gradient-to-br from-yellow-950/60 to-slate-900 border border-yellow-800/40 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Рилс 3 • Концентраты и добавки</span>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>🌾</span>
                  <span>Концентраты и мешки</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Целых мешков: <span className="text-yellow-300 font-black">{totalConcentrateBags}</span> шт
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-yellow-400 font-mono">{totalConcentrateBags}</span>
                <span className="text-xs text-yellow-300 block font-semibold">меш</span>
              </div>
            </div>

            {/* List of Concentrate Items with Bag Tracking */}
            <div className="space-y-2.5 pb-6">
              {concentrateItems.map(item => {
                const isBagItem = item.unit === 'меш' || item.fullBagsCount !== undefined;
                return (
                  <div 
                    key={item.id} 
                    className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-semibold text-slate-400">Зернохранилище</span>
                          {isBagItem && item.fullBagsCount !== undefined && item.fullBagsCount <= 2 && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              Мало
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-100">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          {isBagItem && item.fullBagsCount !== undefined ? (
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-black text-yellow-400 font-mono">
                                {item.fullBagsCount} <span className="text-xs font-semibold text-slate-400">меш</span>
                              </div>
                              <div className="text-[10px] text-slate-300">
                                вскрыт: <span className="text-emerald-400 font-bold">{item.currentBagKg ?? 0} кг</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xl font-black text-yellow-400 font-mono">
                                {Number(item.amount.toFixed(1))}
                              </span>
                              <span className="text-xs font-semibold text-slate-400 ml-1">{item.unit}</span>
                            </div>
                          )}
                        </div>

                        {!isChief && (
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors ml-1"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick +/- buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={isChief ? undefined : () => updateFodderAmount(item.id, -5)}
                        disabled={isChief}
                        className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                      >-5</button>
                      <button
                        type="button"
                        onClick={isChief ? undefined : () => updateFodderAmount(item.id, -1)}
                        disabled={isChief}
                        className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                      >-1</button>
                      <button
                        type="button"
                        onClick={isChief ? undefined : () => updateFodderAmount(item.id, 1)}
                        disabled={isChief}
                        className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                      >+1</button>
                      <button
                        type="button"
                        onClick={isChief ? undefined : () => updateFodderAmount(item.id, 5)}
                        disabled={isChief}
                        className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                      >+5</button>
                    </div>
                  </div>
                );
              })}

              {!isChief && (
                <button
                  type="button"
                  onClick={() => setEditingItem({ parentId: 'concentrate', name: '', scoreTag: '', category: 'concentrate', amount: 0, unit: 'меш', fullBagsCount: 10, currentBagKg: 20, bagCapacityKg: 25 })}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-yellow-800/40 border-dashed rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить концентрат</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REEL 3: 🌿 ВЕТОЧНЫЙ КОРМ (СВЕЖИЕ ВЕТВИ И ВЕНИКИ) */}
        {/* ======================================================== */}
        <div className={`${reelSlideClass} bg-gradient-to-b from-[#062414] via-slate-950 to-slate-950`}>
          <div className="max-w-lg mx-auto w-full flex flex-col gap-3">
            
            {/* Reel Header Card */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Рилс 4 • Веточный корм</span>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>🌿</span>
                  <span>Ветки и веники</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Связок в наличии: <span className="text-emerald-300 font-black">{totalBrowse}</span> шт • Полив активен
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">{totalBrowse}</span>
                <span className="text-xs text-emerald-300 block font-semibold">шт</span>
              </div>
            </div>

            {/* List of Browse Feeds */}
            <div className="space-y-2.5 pb-6">
              {browseItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.scoreTag && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                            {item.scoreTag}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-100">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          {Number(item.amount.toFixed(1))}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">{item.unit}</span>
                      </div>

                      {!isChief && (
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors ml-1"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick +/- buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -5)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                    >-5</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, -1)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-rose-950/20 text-rose-400 border-rose-900/30 active:bg-rose-900/40 cursor-pointer"
                    >-1</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 1)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                    >+1</button>
                    <button
                      type="button"
                      onClick={isChief ? undefined : () => updateFodderAmount(item.id, 5)}
                      disabled={isChief}
                      className="h-8 border rounded-lg font-bold text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 active:bg-emerald-900/50 cursor-pointer"
                    >+5</button>
                  </div>
                </div>
              ))}

              {!isChief && (
                <button
                  type="button"
                  onClick={() => setEditingItem({ parentId: 'browse', name: '', scoreTag: '🍃 10/10', category: 'rough', amount: 0, unit: 'шт' })}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-800/40 border-dashed rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить веточный корм</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REEL 4: 📊 СВОДКА СКЛАДА И ПРИЁМКА */}
        {/* ======================================================== */}
        <div className={`${reelSlideClass} bg-gradient-to-b from-[#0a182e] via-slate-950 to-slate-950`}>
          <div className="max-w-lg mx-auto w-full flex flex-col gap-3 pb-8">
            
            {/* Header Card */}
            <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-800/40 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Рилс 5 • Инвентаризация</span>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                <span>📊</span>
                <span>Сводный баланс склада</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Аудит кормовой базы • Синхронизировано с рационом EAZA
              </p>
            </div>

            {/* 4 Categories Summary Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => scrollToReel(0)}
                className="bg-slate-900/90 border border-amber-800/40 p-3 rounded-2xl cursor-pointer hover:border-amber-600 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>🌾 Сено</span>
                  <span className="text-[10px] text-amber-400">Рилс 1</span>
                </div>
                <div className="text-xl font-black text-amber-400 font-mono mt-2">
                  {totalHay} <span className="text-xs text-slate-400 font-sans">шт</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{hayItems.length} сортов</div>
              </div>

              <div 
                onClick={() => scrollToReel(1)}
                className="bg-slate-900/90 border border-orange-800/40 p-3 rounded-2xl cursor-pointer hover:border-orange-600 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>🥕 Сочные</span>
                  <span className="text-[10px] text-orange-400">Рилс 2</span>
                </div>
                <div className="text-xl font-black text-orange-400 font-mono mt-2">
                  {totalJuicy} <span className="text-xs text-slate-400 font-sans">кг</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{juicyItems.length} позиций</div>
              </div>

              <div 
                onClick={() => scrollToReel(2)}
                className="bg-slate-900/90 border border-yellow-800/40 p-3 rounded-2xl cursor-pointer hover:border-yellow-600 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>🌾 Концентраты</span>
                  <span className="text-[10px] text-yellow-400">Рилс 3</span>
                </div>
                <div className="text-xl font-black text-yellow-400 font-mono mt-2">
                  {totalConcentrateBags} <span className="text-xs text-slate-400 font-sans">меш</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{concentrateItems.length} позиций</div>
              </div>

              <div 
                onClick={() => scrollToReel(3)}
                className="bg-slate-900/90 border border-emerald-800/40 p-3 rounded-2xl cursor-pointer hover:border-emerald-600 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>🌿 Ветки</span>
                  <span className="text-[10px] text-emerald-400">Рилс 4</span>
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-2">
                  {totalBrowse} <span className="text-xs text-slate-400 font-sans">шт</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{browseItems.length} видов</div>
              </div>
            </div>

            {/* Low stock warning */}
            {lowStockItems.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Требуется заказ у поставщика ({lowStockItems.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowStockItems.slice(0, 6).map(it => (
                    <span key={it.id} className="text-[11px] bg-slate-900 text-rose-200 border border-rose-900/40 px-2 py-0.5 rounded-lg font-medium">
                      {it.name}: {it.amount} {it.unit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions for inventory */}
            <div className="flex flex-col gap-2 mt-1">
              {!isChief && (
                <button
                  type="button"
                  onClick={() => setEditingItem({ parentId: 'bales', name: '', scoreTag: '', category: 'rough', amount: 0, unit: 'шт' })}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Принять новую партию (Добавить позицию)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  alert(`✓ Сформирована инвентаризационная опись склада:\nСено: ${totalHay} шт\nСочные: ${totalJuicy} кг\nКонцентраты: ${totalConcentrateBags} мешков\nВеточный корм: ${totalBrowse} шт`);
                }}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Сформировать акт инвентаризации склада</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* EDIT / ADD MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-3 pb-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 animate-in slide-in-from-bottom shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>{editingItem.id ? 'Редактировать позицию' : 'Новая партия корма'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-3.5">
              <input type="hidden" name="parentId" value={editingItem.parentId || 'bales'} />
              <input type="hidden" name="category" value={editingItem.category || 'rough'} />
              
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Название позиции</label>
                <input 
                  required 
                  type="text" 
                  name="name" 
                  defaultValue={editingItem.name} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500/50 text-sm font-semibold" 
                  placeholder="Например: Люцерна 1 сорт" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Смайл / Оценка</label>
                  <input 
                    type="text" 
                    name="scoreTag" 
                    defaultValue={editingItem.scoreTag} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 text-xs font-semibold" 
                    placeholder="👑 10/10" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Единица</label>
                  <select 
                    name="unit" 
                    defaultValue={editingItem.unit || 'шт'} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 appearance-none text-xs font-semibold"
                  >
                    <option value="шт">шт</option>
                    <option value="кг">кг</option>
                    <option value="меш">меш</option>
                    <option value="рул">рул</option>
                    <option value="уп">уп</option>
                  </select>
                </div>
              </div>
              
              {editingItem.parentId === 'concentrate' || editingItem.unit === 'меш' || editingItem.fullBagsCount !== undefined ? (
                <div className="grid grid-cols-2 gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Целых мешков</label>
                    <input 
                      required 
                      type="number" 
                      step="1" 
                      name="fullBagsCount" 
                      defaultValue={editingItem.fullBagsCount ?? Math.floor(editingItem.amount || 0)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 font-bold text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Вскрытый (кг)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.1" 
                      name="currentBagKg" 
                      defaultValue={editingItem.currentBagKg ?? 0} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 outline-none focus:border-emerald-500/50 font-bold text-sm" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Вес целого мешка (кг)</label>
                    <input 
                      type="number" 
                      step="1" 
                      name="bagCapacityKg" 
                      defaultValue={editingItem.bagCapacityKg ?? 25} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-emerald-500/50 text-xs" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Текущий остаток</label>
                  <input 
                    required 
                    type="number" 
                    step="any" 
                    name="amount" 
                    defaultValue={editingItem.amount || 0} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500/50 font-bold text-base font-mono" 
                  />
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить в базу</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
