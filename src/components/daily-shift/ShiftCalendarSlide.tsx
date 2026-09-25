import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, Clock, CheckCircle2, ArrowRightLeft, X, Check } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

interface ShiftCalendarSlideProps {
  slideWrapperClass: string;
  addEvent: (title: string) => void;
}

interface DayShiftInfo {
  day: number;
  type: 'day' | 'night' | 'off'; // [Д], [Н], [В]
  keepers: string[];
  vet: string;
  hours: number;
  note?: string;
}

export const ShiftCalendarSlide: React.FC<ShiftCalendarSlideProps> = ({ slideWrapperClass, addEvent }) => {
  const { isChief } = useRole();
  // Current month: September 2026 (0-indexed month: 8)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September
  const [selectedDay, setSelectedDay] = useState(18); // Default to today (18 Sept 2026)

  // Swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetKeeper, setSwapTargetKeeper] = useState('Васильева Е.');
  const [swapTargetDate, setSwapTargetDate] = useState('2026-09-22');
  const [swapReason, setSwapReason] = useState('Личные обстоятельства');
  const [swapSuccessToast, setSwapSuccessToast] = useState(false);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // First day of week (Monday = 0, Sunday = 6 in Russian locale)
  const rawFirstDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfWeek = (rawFirstDay + 6) % 7; // Convert Sunday=0 to Monday=0

  // Generate shift roster for the month
  const getShiftData = (day: number): DayShiftInfo => {
    // 2/2 or rotating schedule
    const shiftPattern: Record<number, 'day' | 'night' | 'off'> = {
      1: 'day', 2: 'day', 3: 'off', 4: 'off',
      5: 'day', 6: 'day', 7: 'off', 8: 'off',
      9: 'night', 10: 'night', 11: 'off', 12: 'off',
      13: 'day', 14: 'day', 15: 'off', 16: 'off',
      17: 'day', 18: 'day', 19: 'off', 20: 'off',
      21: 'night', 22: 'night', 23: 'off', 24: 'off',
      25: 'day', 26: 'day', 27: 'off', 28: 'off',
      29: 'night', 30: 'night'
    };

    const type = shiftPattern[day] || (day % 3 === 0 ? 'night' : day % 2 === 0 ? 'day' : 'off');
    
    // Duty rosters
    let keepers = ['Мартынов С.', 'Васильева Е.'];
    let vet = 'Д-р Смирнова А. В.';
    if (type === 'night') {
      keepers = ['Ковалёв Д. (Ночной кипер)', 'Петров М.'];
      vet = 'Д-р Федоров В. М. (Дежурный вет)';
    } else if (type === 'off') {
      keepers = ['Ильин В. (Подменный)', 'Васильева Е.'];
      vet = 'Д-р Смирнова А. В.';
    }

    return {
      day,
      type,
      keepers,
      vet,
      hours: type === 'day' ? 12 : type === 'night' ? 12 : 0,
      note: day === 18 ? 'Сегодня: повышенный контроль водопоя' : undefined
    };
  };

  const selectedShiftInfo = getShiftData(selectedDay);

  const handleRequestSwap = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent(`Запрос подмены на ${swapTargetDate} направлен сотруднику ${swapTargetKeeper} (${swapReason})`);
    if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
    setSwapModalOpen(false);
    setSwapSuccessToast(true);
    setTimeout(() => setSwapSuccessToast(false), 4000);
  };

  return (
    <div className={slideWrapperClass}>
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full pb-6">
        
        {/* Header Slide */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Календарь смен</span>
            </h2>
            {isChief && (
              <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-1.5 py-0.5 rounded-full">
                👁️ Только чтение
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            График 2/2
          </span>
        </div>

        {/* Month Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100 tracking-wide">
              {monthNames[currentMonth]} {currentYear}
            </span>
            {currentMonth === 8 && currentYear === 2026 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Текущий
              </span>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold flex items-center justify-center text-[9px]">Д</span>
            <span>Дневная (8-20)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-indigo-950 border border-indigo-500/60 text-indigo-300 font-bold flex items-center justify-center text-[9px]">Н</span>
            <span>Ночная (20-8)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 text-slate-500 font-bold flex items-center justify-center text-[9px]">В</span>
            <span>Выходной</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-sm">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-slate-400">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
              <div key={d} className={i >= 5 ? 'text-rose-400/80' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Month days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 rounded-lg opacity-10" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const shift = getShiftData(day);
              const isToday = currentYear === 2026 && currentMonth === 8 && day === 18;
              const isSelected = selectedDay === day;

              let badgeColor = 'bg-slate-950 text-slate-500 border-slate-800';
              let badgeText = 'В';
              if (shift.type === 'day') {
                badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-500/60';
                badgeText = 'Д';
              } else if (shift.type === 'night') {
                badgeColor = 'bg-indigo-950 text-indigo-300 border-indigo-500/60';
                badgeText = 'Н';
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-between p-1 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-400 bg-slate-800 shadow-[0_0_10px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                      : isToday
                        ? 'border-amber-400/80 bg-amber-950/20'
                        : 'border-slate-800/80 bg-slate-950 hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`text-[11px] font-bold leading-none ${isToday ? 'text-amber-300 font-black' : isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {day}
                  </span>
                  <span className={`text-[8.5px] font-black px-1 rounded border leading-tight ${badgeColor}`}>
                    {badgeText}
                  </span>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">
                {selectedDay} {monthNames[currentMonth]} {currentYear}
              </span>
              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border ${
                selectedShiftInfo.type === 'day'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                  : selectedShiftInfo.type === 'night'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/60'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
              }`}>
                {selectedShiftInfo.type === 'day' ? '☀️ Дневная смена (08:00 - 20:00)' : selectedShiftInfo.type === 'night' ? '🌙 Ночная смена (20:00 - 08:00)' : '☕ Выходной день'}
              </span>
            </div>
            {selectedDay === 18 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
                Сегодня
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px]">Сменщики на объекте: </span>
                <span className="text-slate-200 font-medium">{selectedShiftInfo.keepers.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[11px]">Дежурный ветврач: </span>
                <span className="text-slate-200 font-medium">{selectedShiftInfo.vet}</span>
              </div>
            </div>

            {selectedShiftInfo.note && (
              <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 font-medium">
                ⚠️ {selectedShiftInfo.note}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Card: Мой график */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Мой график (Сентябрь 2026)
              </span>
              <span className="text-[11px] text-slate-400">Норма месяца: 16 смен (192 ч)</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-emerald-400">14</span>
              <span className="text-xs text-slate-400"> / 16 смен</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${(14 / 16) * 100}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-1">
              <div className="text-slate-400">Отработано</div>
              <div className="font-bold text-slate-200">14 смен (168 ч)</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-1">
              <div className="text-slate-400">Осталось</div>
              <div className="font-bold text-emerald-400">2 смены</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-1">
              <div className="text-slate-400">Переработка</div>
              <div className="font-bold text-amber-300">+8 часов</div>
            </div>
          </div>

          {/* Swap shift request button */}
          <button
            type="button"
            onClick={isChief ? undefined : () => setSwapModalOpen(true)}
            disabled={isChief}
            className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              isChief
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-slate-800 hover:bg-slate-700 active:scale-98 text-emerald-400 border border-emerald-500/40 cursor-pointer'
            }`}
            title={isChief ? 'Режим наблюдателя: запрос подмены заблокирован' : 'Запросить подмену'}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isChief ? 'Запрос подмены (только чтение)' : 'Запросить подмену / Обмен сменами'}</span>
          </button>
        </div>

        {/* Success Toast */}
        {swapSuccessToast && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Заявка на обмен отправлена и зафиксирована в журнале смен!</span>
          </div>
        )}

        {/* Swap Request Modal */}
        {swapModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-sm w-full shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                  Запрос обмена сменами
                </h3>
                <button
                  type="button"
                  onClick={() => setSwapModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestSwap} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Моя смена для передачи:</label>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-medium text-slate-200">
                    {selectedDay} сентября 2026 ({selectedShiftInfo.type === 'day' ? 'Дневная смена' : selectedShiftInfo.type === 'night' ? 'Ночная смена' : 'Выходной'})
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Коллега для подмены:</label>
                  <select
                    value={swapTargetKeeper}
                    onChange={(e) => setSwapTargetKeeper(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium outline-none focus:border-emerald-500"
                  >
                    <option value="Васильева Е.">Васильева Е. (Зоотехник по кормлению)</option>
                    <option value="Ковалёв Д.">Ковалёв Д. (Ночной кипер)</option>
                    <option value="Ильин В.">Ильин В. (Подменный кипер)</option>
                    <option value="Петров М.">Петров М. (Кипер)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Желаемая дата отработки:</label>
                  <input
                    type="date"
                    value={swapTargetDate}
                    onChange={(e) => setSwapTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Причина запроса:</label>
                  <input
                    type="text"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="Например: Плановый визит к врачу"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSwapModalOpen(false)}
                    className="flex-1 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition-colors cursor-pointer shadow-sm"
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
