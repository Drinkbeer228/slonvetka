import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { getTodayStr } from '../utils/dates';

interface HeaderProps {
  currentScreen: string;
  onOpenMenu: () => void;
}

const SCREEN_TITLES: Record<string, string> = {
  daily_shift: 'Слоновник',
  vet_dashboard: 'ВетПанель',
  elephants: 'Слоны',
  elephant_details: 'Слоны',
  today: 'Сегодня',
  journal: 'Журнал',
  assignments: 'Назначения',
  staff: 'Сотрудники',
  settings: 'Настройки',
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfWeek = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

export function Header({ currentScreen, onOpenMenu }: HeaderProps) {
  const { selectedDate, setSelectedDate } = useStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const todayStr = getTodayStr();

  // Parsing year/month for calendar view
  const [viewYear, setViewYear] = useState<number>(() => {
    const parts = (selectedDate || todayStr).split('-').map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const parts = (selectedDate || todayStr).split('-').map(Number);
    return parts[1] || (new Date().getMonth() + 1);
  });

  const [monthActivity, setMonthActivity] = useState<Record<string, number>>({});

  // Sync calendar view month/year when calendar opens or date changes
  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isCalendarOpen) {
      shiftService.getMonthActivity(viewYear, viewMonth)
        .then(setMonthActivity)
        .catch(() => setMonthActivity({}));
    }
  }, [isCalendarOpen, viewYear, viewMonth]);

  // Format date compact: "13 сент."
  const formatCompactDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        const dateObj = new Date(y, m - 1, d);
        const day = dateObj.getDate();
        const monthShort = dateObj.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
        return `${day} ${monthShort}.`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const title = SCREEN_TITLES[currentScreen] || 'Слоновник';

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const days: (number | null)[] = [];

    // Fill empty slots for first week (Monday = 1, Sunday = 0)
    const emptyCount = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < emptyCount; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // GitHub Heatmap style resolver
  const getDayHeatmapClass = (dateStr: string, score: number): string => {
    if (dateStr > todayStr) {
      return 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300';
    }
    if (score === 0) {
      return 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/80';
    }
    if (score <= 2) {
      return 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100/80';
    }
    if (score <= 4) {
      return 'bg-emerald-100/80 border border-emerald-200 text-emerald-800 hover:bg-emerald-200/80';
    }
    if (score <= 6) {
      return 'bg-emerald-300/90 border border-emerald-400 text-emerald-950 font-bold hover:bg-emerald-300';
    }
    return 'bg-emerald-600 border border-emerald-700 text-white font-black shadow-xs hover:bg-emerald-700';
  };

  return (
    <>
      <header className="h-14 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 flex items-center justify-between">
        {/* СЛЕВА: Название активного раздела */}
        <h1 className="text-lg font-black text-slate-900 tracking-tight">
          {title}
        </h1>

        {/* ПО ЦЕНТРУ: Компактный выбор даты в виде аккуратного чипса */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer select-none"
          title="Выбрать дату дежурства"
        >
          <Calendar size={13} className="text-slate-500" />
          <span>{formatCompactDate(selectedDate || todayStr)}</span>
          <ChevronDown size={13} className="text-slate-400" />
        </button>

        {/* СПРАВА: Единственная кнопка вызова навигации (меню) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-2xl bg-slate-100/90 hover:bg-slate-200 border border-slate-200/70 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-xs cursor-pointer"
          aria-label="Меню навигации"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* МОДАЛЬНЫЙ КАЛЕНДАРЬ ВЫБОРА ДАТЫ С GITHUB HEATMAP */}
      {isCalendarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Выбор даты</h2>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  let m = viewMonth - 1;
                  let y = viewYear;
                  if (m < 1) {
                    m = 12;
                    y--;
                  }
                  setViewMonth(m);
                  setViewYear(y);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="font-bold text-slate-800 capitalize text-sm">
                {new Date(viewYear, viewMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
              </div>

              <button
                type="button"
                onClick={() => {
                  let m = viewMonth + 1;
                  let y = viewYear;
                  if (m > 12) {
                    m = 1;
                    y++;
                  }
                  setViewMonth(m);
                  setViewYear(y);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-slate-400">
              <div>Пн</div>
              <div>Вт</div>
              <div>Ср</div>
              <div>Чт</div>
              <div>Пт</div>
              <div>Сб</div>
              <div>Вс</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {generateCalendarDays().map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="h-9" />;

                const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const score = monthActivity[dateStr] ?? 0;
                const heatmapClass = getDayHeatmapClass(dateStr, score);

                const selectionRing = isSelected
                  ? 'ring-2 ring-slate-900 ring-offset-2 scale-105 z-10'
                  : isToday
                  ? 'ring-1 ring-blue-500'
                  : '';

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setIsCalendarOpen(false);
                    }}
                    title={
                      dateStr > todayStr
                        ? `${d} число: план`
                        : `${d} число: заполнено ${score}/7 зон`
                    }
                    className={`h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all active:scale-90 cursor-pointer relative ${heatmapClass} ${selectionRing}`}
                  >
                    <span className="leading-none">{d}</span>
                    {isToday && (
                      <span
                        className={`w-1 h-1 rounded-full absolute bottom-1 ${
                          score === 7 ? 'bg-white' : 'bg-blue-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* GITHUB-STYLE HEATMAP ЛЕГЕНДА */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-600 select-none">
                {/* Слева: Пропуск */}
                <div className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-3 h-3 rounded-xs bg-rose-50 border border-rose-200 shrink-0" />
                  <span>Пропуск</span>
                </div>

                {/* По центру: 4 градации зелени */}
                <div className="flex items-center gap-1" title="Градации: 1-2, 3-4, 5-6, 7/7">
                  <span className="w-3 h-3 rounded-xs bg-amber-50 border border-amber-200" title="1–2 зоны" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-100/80 border border-emerald-200" title="3–4 зоны" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-300/90 border border-emerald-400" title="5–6 зон" />
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-700" title="7 зон" />
                </div>

                {/* Справа: Идеально (7/7) */}
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <span>Идеально (7/7)</span>
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-700 shrink-0" />
                </div>
              </div>

              {selectedDate !== todayStr && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setIsCalendarOpen(false);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    К сегодня
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
