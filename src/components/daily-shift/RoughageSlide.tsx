import React from 'react';
import { Plus, Minus, Camera, AlertTriangle, Droplets } from 'lucide-react';
import { FodderItem } from '../../types';

interface RoughageSlideProps {
  slideWrapperClass: string;
  fodderInventory: FodderItem[];
  distributed: { bales: number; rolls: number; branches: number };
  incDist: (key: 'bales' | 'rolls' | 'branches', delta: number) => void;
  selectedBaleId: string;
  setSelectedBaleId: (id: string) => void;
  selectedRollId: string;
  setSelectedRollId: (id: string) => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  activeFodderDropdown: 'bales' | 'rolls' | 'branches' | null;
  setActiveFodderDropdown: (v: 'bales' | 'rolls' | 'branches' | null) => void;
  hayQuality: 'normal' | 'dusty' | 'moldy';
  setHayQuality: React.Dispatch<React.SetStateAction<'normal' | 'dusty' | 'moldy'>>;
  hayWatered: boolean;
  setHayWatered: React.Dispatch<React.SetStateAction<boolean>>;
  triggerCamera: (source: string) => void;
  getFodderTotal: (parentId: string) => number;
  isChief?: boolean;
}

export const RoughageSlide: React.FC<RoughageSlideProps> = ({
  slideWrapperClass,
  fodderInventory,
  distributed,
  incDist,
  selectedBaleId,
  setSelectedBaleId,
  selectedRollId,
  setSelectedRollId,
  selectedBranchId,
  setSelectedBranchId,
  activeFodderDropdown,
  setActiveFodderDropdown,
  hayQuality,
  setHayQuality,
  hayWatered,
  setHayWatered,
  triggerCamera,
  getFodderTotal,
  isChief
}) => {
  return (
    <div className={slideWrapperClass || "w-screen min-w-full max-w-full h-[100dvh] flex-shrink-0 snap-center snap-always flex flex-col overflow-y-auto sm:overflow-y-hidden overscroll-y-contain px-3 pt-[calc(env(safe-area-inset-top)+2.4rem)] pb-[calc(env(safe-area-inset-bottom)+4.25rem)] text-slate-100"}>
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full h-full flex-1">
        
        {/* 0. HEADER */}
        <div className="flex items-center justify-between shrink-0 mb-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
              <span>🌾</span>
              <span>Фураж и Грубые корма</span>
            </h1>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full shrink-0">
            24/7 EAZA Норма
          </span>
        </div>

        {/* 1. FODDER WAREHOUSE STOCK STATUS */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">📦</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">На складе фуража:</span>
              <span className="text-xs font-bold text-slate-200 truncate">
                Сено (все сорта): <strong className="text-amber-400 font-mono">{getFodderTotal('bales') + getFodderTotal('rolls')} шт</strong> | Ветки: <strong className="text-sky-400 font-mono">{getFodderTotal('browse')} шт</strong>
              </span>
            </div>
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-tight px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shrink-0">
            В течение смены
          </span>
        </div>

        {/* 2. TWO DISTRIBUTION CARDS: СЕНО И ВЕТОЧНЫЙ КОРМ */}
        <div className="grid grid-cols-2 gap-2 w-full shrink-0">
          {[
            { id: 'bales' as const, parentId: 'bales', label: '🌾 Сено', selectedId: selectedBaleId, state: distributed.bales, color: 'amber' },
            { id: 'branches' as const, parentId: 'browse', label: '🌿 Ветки', selectedId: selectedBranchId, state: distributed.branches, color: 'sky' }
          ].map(item => {
            const selectedItem = fodderInventory.find(i => i.id === item.selectedId);
            const options = item.id === 'bales'
              ? fodderInventory.filter(i => i.parentId === 'bales' || i.parentId === 'rolls')
              : fodderInventory.filter(i => i.parentId === item.parentId);
            const isDropdownOpen = activeFodderDropdown === item.id;
            
            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center relative shadow-sm">
                <button 
                  type="button"
                  onClick={() => setActiveFodderDropdown(isDropdownOpen ? null : item.id)}
                  disabled={isChief}
                  className="w-full mb-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 flex flex-col items-center active:bg-slate-800 transition-colors cursor-pointer"
                  title="Выбрать сорт из инвентаря"
                >
                  <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                  <span className="text-[11px] font-bold text-amber-300 text-center leading-tight truncate w-full">
                    {selectedItem?.name || 'Выбрать сорт'} ▾
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-14 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 w-[120%] -ml-[10%] max-h-56 overflow-y-auto animate-in fade-in duration-100">
                    <span className="text-[9px] font-black uppercase text-slate-400 px-2 py-0.5 border-b border-slate-700/60">
                      {item.id === 'bales' ? 'Сорта сена на складе:' : 'Виды веточного корма:'}
                    </span>
                    {options.map(opt => (
                      <button 
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (item.id === 'bales') setSelectedBaleId(opt.id);
                          if (item.id === 'branches') setSelectedBranchId(opt.id);
                          setActiveFodderDropdown(null);
                        }}
                        className={`text-left flex flex-col px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                          opt.id === item.selectedId ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300' : 'bg-slate-900 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] font-bold leading-tight">{opt.name}</span>
                        <span className="text-[9.5px] text-slate-400">Остаток: {opt.amount} {opt.unit}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col w-full rounded-xl overflow-hidden border border-slate-800">
                  <button 
                    type="button"
                    onClick={() => incDist(item.id, 1)} 
                    disabled={isChief}
                    className={`flex items-center justify-center py-2.5 w-full bg-${item.color}-900/40 text-${item.color}-400 active:brightness-125 transition-all cursor-pointer ${
                      isChief ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={`Выдать +1 ${item.label.toLowerCase()}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="bg-slate-950/90 py-1.5 flex items-center justify-center text-xl font-black font-mono text-white">
                    {item.state}
                  </div>
                  <button 
                    type="button"
                    onClick={() => incDist(item.id, -1)} 
                    disabled={isChief || item.state <= 0}
                    className={`flex items-center justify-center py-1.5 w-full bg-rose-950/20 text-rose-400 active:bg-rose-900/40 transition-all cursor-pointer ${
                      isChief || item.state <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    title={`Списать возврат -1 ${item.label.toLowerCase()}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. QUALITY CONTROL & TB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2 shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Контроль качества фуража:
            </span>
            <span className="text-[9.5px] font-bold text-slate-400">
              {hayQuality === 'normal' ? '🟢 Без замечаний' : hayQuality === 'dusty' ? '🟡 Требует пролива' : '🔴 Брак / Списание'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button 
              type="button"
              onClick={() => setHayQuality(p => p === 'dusty' ? 'normal' : 'dusty')} 
              disabled={isChief}
              className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hayQuality === 'dusty' 
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/60 shadow-sm' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              } ${isChief ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>⚠️</span>
              <span>Пыльное / Сухое</span>
            </button>
            <button 
              type="button"
              onClick={() => { 
                setHayQuality('moldy'); 
                triggerCamera('moldy_hay'); 
              }} 
              disabled={isChief}
              className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hayQuality === 'moldy' 
                  ? 'bg-rose-950/70 text-rose-300 border-rose-500/60 shadow-sm' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              } ${isChief ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>🍄</span>
              <span>Плесень (+ 📷)</span>
              <Camera className="w-3 h-3 text-rose-400 ml-0.5" />
            </button>
          </div>

          {hayQuality === 'dusty' && (
            <button 
              type="button"
              onClick={() => setHayWatered(!hayWatered)} 
              disabled={isChief}
              className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hayWatered 
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/60 shadow-sm' 
                  : 'bg-slate-950 border-slate-800 text-sky-400 hover:bg-sky-950/40'
              } ${isChief ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>{hayWatered ? '💧 Сено тщательно пролито водой (Готово)' : '💧 Пролить сено водой из шланга?'}</span>
            </button>
          )}
        </div>

        {/* 4. GUIDELINE MEMO */}
        <div className="shrink-0 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 leading-tight">
          <span className="text-base shrink-0">ℹ️</span>
          <span className="text-slate-400 text-[11px] leading-tight">
            <strong className="text-slate-200">Регламент EAZA:</strong> Свежее сено и веники должны находиться в подвесных сетках непрерывно 24/7. Пыльное сено обязательно замачивать/проливать.
          </span>
        </div>

      </div>
    </div>
  );
};
