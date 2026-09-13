import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { CounterItem } from './DynamicCounterSection';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCompleteShift: () => void;
  dutyKeeperName?: string;
  dateString?: string;
  porridgeIssued?: boolean;
  saladIssued?: boolean;
  hayBales?: number;
  washedCount?: number;
  poopCount?: number;
  damages?: CounterItem[];
}

export function ShiftSummaryModal({
  isOpen,
  onClose,
  onConfirmCompleteShift,
  dutyKeeperName,
  dateString,
  porridgeIssued = false,
  saladIssued = false,
  hayBales = 0,
  washedCount = 0,
  poopCount = 0,
  damages = []
}: ShiftSummaryModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const actualDamages = damages.filter(d => d.count > 0);
  
  // Base bonus calculation (just for show)
  const baseBonus = 150;
  const damagePenalty = actualDamages.reduce((sum, d) => sum + (d.count * 10), 0);
  const finalBonus = Math.max(0, baseBonus - damagePenalty);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Сводка за смену</h2>
            <div className="text-sm font-semibold text-slate-500 mt-1">
              Дежурный: <span className="text-slate-800">{dutyKeeperName || 'Неизвестен'}</span>
              {dateString && <span> • {dateString}</span>}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Секция «Выполнение регламента» */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Выполнение регламента
          </h3>
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Утренняя каша (08:30)</span>
              {porridgeIssued ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check size={14} /> Выдано
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Не выдано</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Ужин (19:00)</span>
              {saladIssued ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check size={14} /> Выдан
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Не выдан</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Раздача сена</span>
              <span className="text-sm font-bold text-slate-900">{hayBales} тюков</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Слонов помыто</span>
              <span className="text-sm font-bold text-slate-900">{washedCount} шт.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Навоз / уборка</span>
              <span className="text-sm font-bold text-slate-900">{poopCount} тачек</span>
            </div>
          </div>
        </div>

        {/* 3. Секция «Зафиксированный ущерб» */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Зафиксированный ущерб
          </h3>
          {actualDamages.length === 0 ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700">
              <ShieldCheck size={18} className="shrink-0" />
              <span className="text-sm font-bold">Без происшествий (0 поломок)</span>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2">
              {actualDamages.map(damage => (
                <div key={damage.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rose-800">
                    {damage.emoji} {damage.label}
                  </span>
                  <span className="text-sm font-black text-rose-700">
                    {damage.count} шт.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Подвал и действие */}
        <div className="pt-4 border-t border-slate-200/80 space-y-4">
          <div className="flex justify-center">
            <div className="text-sm font-bold text-slate-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
              Премия за смену: {finalBonus} ₽ десятками
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onConfirmCompleteShift();
                onClose();
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Подтвердить и закрыть день
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              Вернуться к заполнению
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
