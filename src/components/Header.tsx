import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, Menu, X, ChevronLeft, ChevronRight, 
  Home, Stethoscope, HeartPulse, BookOpen 
} from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { getTodayStr } from '../utils/dates';

interface HeaderProps {
  currentScreen: string;
  onOpenMenu: () => void;
  onNavigate?: (screen: string) => void;
}

const SCREEN_TITLES: Record<string, string> = {
  daily_shift: 'Слоновник',
  vet_dashboard: 'ВетПанель',
  elephants: 'Слоны',
  elephant_details: 'Карточка слона',
  today: 'Задачи на сегодня',
  journal: 'Журнал дежурств',
  assignments: 'Вет-назначения',
  staff: 'Сотрудники',
  settings: 'Настройки',
};

const DESKTOP_NAV = [
  { id: 'daily_shift',   label: 'Слоновник', icon: Home },
  { id: 'vet_dashboard', label: 'ВетПанель', icon: Stethoscope },
  { id: 'elephants',     label: 'Слоны',     icon: HeartPulse },
  { id: 'journal',       label: 'Журнал',    icon: BookOpen },
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfWeek = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

export function Header({ currentScreen, onOpenMenu, onNavigate }: HeaderProps) {
  const { selectedDate, setSelectedDate, profile } = useStore();
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

  // Format date: "13 сентября" (полное название месяца, не сокращать)
  const formatCompactDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const stepDate = (deltaDays: number) => {
    try {
      const [y, m, d] = (selectedDate || todayStr).split('-').map(Number);
      const dateObj = new Date(y, m - 1, d + deltaDays);
      const ny = dateObj.getFullYear();
      const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const nd = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${ny}-${nm}-${nd}`);
    } catch {
      // fallback
    }
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
      <header
        className="h-16 sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
          {/* СЛЕВА: Бренд СлоноВет + Название текущего раздела */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('daily_shift') : undefined}
              className="flex items-center gap-2 group cursor-pointer text-left"
              title="На главную"
            >
              <span className="text-2xl leading-none select-none transition-transform group-hover:scale-110">🐘</span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  СлоноВет
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700 tracking-wider uppercase leading-none">
                  вет-контроль
                </span>
              </div>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs font-bold text-slate-700">
              <span>{title}</span>
            </div>
          </div>

          {/* ПО ЦЕНТРУ: Десктопные табы навигации + Выбор даты со стрелками */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Быстрые вкладки для ПК (lg+) */}
            {onNavigate && (
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
                {DESKTOP_NAV.map(item => {
                  const isActive = currentScreen === item.id || 
                    (currentScreen === 'elephant_details' && item.id === 'elephants');
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Быстрый выбор даты: < ДЕНЬ > */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => stepDate(-1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-all active:scale-90 cursor-pointer"
                title="Предыдущий день"
              >
                <ChevronLeft size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white text-xs font-bold text-slate-800 shadow-xs border border-slate-200/70 hover:bg-slate-50 transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Выбрать дату дежурства"
              >
                <Calendar size={13} className="text-slate-500 shrink-0" />
                <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">
                  {formatCompactDate(selectedDate || todayStr)}
                </span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => stepDate(1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-all active:scale-90 cursor-pointer"
                title="Следующий день"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                title="Вернуться к сегодняшнему дню"
              >
                К сегодня
              </button>
            )}
          </div>

          {/* СПРАВА: Инфо о сотруднике + Заметная кнопка «Меню» */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {profile && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                <span className="font-bold text-slate-800 max-w-[120px] truncate">{profile.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {profile.role === 'vet' ? 'Вет' : profile.role === 'admin' ? 'Админ' : 'Кипер'}
                </span>
              </div>
            )}

            {/* Кнопка МЕНЮ — четкая, заметная и на ПК, и на мобильных */}
            <button
              type="button"
              onClick={onOpenMenu}
              className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-2xl flex items-center gap-2 text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs active:scale-95 transition-all cursor-pointer tap-target font-black text-xs"
              aria-label="Меню навигации"
            >
              <Menu size={18} className="text-slate-700 stroke-[2.3]" />
              <span className="inline font-bold text-xs tracking-tight">Меню</span>
            </button>
          </div>
        </div>
      </header>

      {/* МОДАЛЬНЫЙ КАЛЕНДАРЬ ВЫБОРА ДАТЫ С GITHUB HEATMAP */}
      {isCalendarOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsCalendarOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              boxShadow: '0 32px 80px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,1)',
            }}
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

