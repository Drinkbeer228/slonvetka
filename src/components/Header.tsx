import React, { useState, useEffect } from 'react';
import {
  Calendar, Menu, X, ChevronLeft, ChevronRight, Wifi, WifiOff,
  BookOpen
} from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { getTodayStr } from '../utils/dates';
import { VetKeeperViewToggle } from './VetCabinetDashboard';

interface HeaderProps {
  currentScreen: string;
  onOpenMenu: () => void;
  onNavigate?: (screen: string) => void;
}

const JOURNAL_NAV = { id: 'journal', label: 'Журнал', icon: BookOpen };

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfWeek = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

export function Header({ currentScreen, onOpenMenu, onNavigate }: HeaderProps) {
  const { selectedDate, setSelectedDate, profile } = useStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const updateNetwork = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

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

  const showViewToggle = currentScreen === 'daily_shift' || currentScreen === 'vet_cabinet' || currentScreen === 'vet_dashboard';
  const toggleValue = currentScreen === 'daily_shift' ? 'daily_shift' : 'vet_cabinet';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:flex-nowrap sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate?.('daily_shift')}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl px-1 text-left active:scale-[0.98]"
            title="На главную"
          >
            <span className="text-xl leading-none" aria-hidden="true">🐘</span>
            <span className="text-base font-black tracking-tight text-slate-950">СлоноВет</span>
          </button>

          {onNavigate && (
            <nav className="order-3 flex w-full items-center gap-2 sm:order-2 sm:mx-auto sm:w-auto" aria-label="Основная навигация">
              {showViewToggle && (
                <VetKeeperViewToggle
                  value={toggleValue}
                  onChange={onNavigate}
                  className="flex-1 sm:flex-none"
                />
              )}
              {(() => {
                const isActive = currentScreen === JOURNAL_NAV.id;
                const Icon = JOURNAL_NAV.icon;
                return (
                  <button
                    type="button"
                    onClick={() => onNavigate(JOURNAL_NAV.id)}
                    className={`min-h-[44px] rounded-2xl border border-white/60 bg-white/70 px-3 text-xs font-extrabold shadow-sm backdrop-blur-xl transition-all active:scale-[0.98] ${
                      isActive
                        ? 'text-slate-950 ring-1 ring-slate-200'
                        : 'text-slate-700 hover:bg-white hover:text-slate-950'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <Icon size={15} className={isActive ? 'text-emerald-700' : 'text-slate-500'} />
                      <span>{JOURNAL_NAV.label}</span>
                    </span>
                  </button>
                );
              })()}
            </nav>
          )}

          <div className="order-2 ml-auto flex items-center gap-1.5 sm:order-3 sm:ml-0">
            <span className={`flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 py-1.5 text-[10px] font-black ${isOnline ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`} title={isOnline ? 'Онлайн — синхронизировано' : 'Оффлайн — данные сохранены локально'}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span className="hidden sm:inline">{isOnline ? 'Онлайн' : 'Оффлайн'}</span>
            </span>
            {profile && (
              <span className="hidden items-center gap-1.5 rounded-xl bg-emerald-50 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-800 sm:inline-flex" title={profile.name}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {profile.role === 'vet' ? 'Вет' : profile.role === 'admin' ? 'Админ' : 'Кипер'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
              title="Выбрать дату дежурства"
            >
              <Calendar size={16} className="text-slate-600" />
              <span className="hidden sm:inline">{formatCompactDate(selectedDate || todayStr)}</span>
            </button>
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-label="Открыть меню"
            >
              <Menu size={19} className="stroke-[2.5]" />
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

