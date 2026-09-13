import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface ArchiveBannerProps {
  isAdmin: boolean;
  onReturnToToday: () => void;
  onUnlockAdmin?: () => void;
}

export function ArchiveBanner({
  isAdmin,
  onReturnToToday,
  onUnlockAdmin,
}: ArchiveBannerProps) {
  return (
    <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 backdrop-blur-md shadow-xs flex flex-col gap-3">
      {/* Шапка плашки: иконка замка, заголовок и краткий статус */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-800 flex items-center justify-center shrink-0">
            <Lock size={17} className="stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-amber-950 tracking-tight">
                Архив смены
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-md">
                Только чтение
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-900/80 font-medium leading-tight mt-0.5">
              Архив дежурства зафиксирован. Внесение изменений закрыто.
            </p>
          </div>
        </div>

        {/* Десктоп-кнопка для администратора */}
        {isAdmin && onUnlockAdmin && (
          <button
            type="button"
            onClick={onUnlockAdmin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer touch-manipulation"
          >
            <Lock size={13} />
            <span>Разблокировать для правок (Админ)</span>
          </button>
        )}
      </div>

      {/* Панель действий */}
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-amber-200/60">
          {/* Мобильная кнопка разблокировки для админа */}
          <button
            type="button"
            onClick={onUnlockAdmin}
            className="sm:hidden w-full h-11 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Lock size={14} />
            <span>Разблокировать для правок (Админ)</span>
          </button>

          <button
            type="button"
            onClick={onReturnToToday}
            className="w-full sm:w-auto sm:ml-auto px-4 h-11 sm:h-9 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl sm:rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <span>Вернуться к сегодня</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        /* ДЛЯ ОБЫЧНОГО КИПЕРА (!isAdmin): полностью скрыта кнопка редактирования, только 1 крупная кнопка возврата к сегодня */
        <button
          type="button"
          onClick={onReturnToToday}
          className="bg-slate-900 text-white w-full h-11 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer touch-manipulation"
        >
          <span>Вернуться к сегодня</span>
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
