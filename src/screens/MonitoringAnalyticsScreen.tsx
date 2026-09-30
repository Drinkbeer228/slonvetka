import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Calendar, Filter, ChevronLeft, ChevronRight, 
  AlertTriangle, Check, Info, TrendingUp, Clock, Bookmark, 
  RotateCcw, Sparkles, Droplets, Moon, Sun, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { bodyMonitoringService, DailyPhysioRecord, SleepPhaseItem } from '../services/bodyMonitoringService';

interface MonitoringAnalyticsScreenProps {
  onNavigate?: (screen: string) => void;
}

type ElephantFilterType = 'all' | 'margo' | 'audrey' | 'pretty';
type DateFilterType = 'all_time' | 'today' | 'week' | 'month' | 'custom';
type MetricViewType = 'poop' | 'urine' | 'sleep';

export function MonitoringAnalyticsScreen({ onNavigate }: MonitoringAnalyticsScreenProps) {
  const [records, setRecords] = useState<DailyPhysioRecord[]>(() => bodyMonitoringService.getPhysioRecords());
  const [selectedElephant, setSelectedElephant] = useState<ElephantFilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all_time');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeMetric, setActiveMetric] = useState<MetricViewType>('poop');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sync records on custom event
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(bodyMonitoringService.getPhysioRecords());
    };
    window.addEventListener('elephant-physio-updated', handleUpdate);
    return () => window.removeEventListener('elephant-physio-updated', handleUpdate);
  }, []);

  // Filter records based on selected date filter
  const filteredRecords = useMemo(() => {
    let list = [...records];

    // Filter by Elephant if not 'all'
    if (selectedElephant !== 'all') {
      list = list.filter(r => r.elephantId === selectedElephant);
    }

    // Filter by Date
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      list = list.filter(r => r.date === todayStr);
    } else if (dateFilter === 'week') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const d7Str = d7.toISOString().split('T')[0];
      list = list.filter(r => r.date >= d7Str);
    } else if (dateFilter === 'month') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const d30Str = d30.toISOString().split('T')[0];
      list = list.filter(r => r.date >= d30Str);
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      list = list.filter(r => r.date >= customStartDate && r.date <= customEndDate);
    }

    // Sort by date ascending for charts
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedElephant, dateFilter, customStartDate, customEndDate]);

  // Aggregate stats: Totals and Averages
  const aggregatedStats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalPoop: 0,
        avgPoop: 0,
        totalUrine: 0,
        avgUrine: 0,
        totalSleep: 0,
        avgSleep: 0,
        totalPhases: 0,
        denseStoolPct: 100,
        clearUrinePct: 100,
        dayCount: 0,
      };
    }

    // Distinct dates count
    const uniqueDates = new Set(filteredRecords.map(r => r.date));
    const dayCount = Math.max(1, uniqueDates.size);

    let totalPoop = 0;
    let totalUrine = 0;
    let totalSleep = 0;
    let totalPhases = 0;
    let denseStoolCount = 0;
    let clearUrineCount = 0;

    filteredRecords.forEach(r => {
      totalPoop += r.poopCount;
      totalUrine += r.urineCount;
      totalSleep += r.sleepHours;
      totalPhases += (r.sleepPhases ? r.sleepPhases.length : 0);
      if (r.stoolTrait === 'dense') denseStoolCount++;
      if (r.urineTrait === 'clear') clearUrineCount++;
    });

    return {
      totalPoop,
      avgPoop: Math.round((totalPoop / dayCount) * 10) / 10,
      totalUrine,
      avgUrine: Math.round((totalUrine / dayCount) * 10) / 10,
      totalSleep: Math.round(totalSleep * 10) / 10,
      avgSleep: Math.round((totalSleep / dayCount) * 10) / 10,
      totalPhases,
      denseStoolPct: Math.round((denseStoolCount / filteredRecords.length) * 100),
      clearUrinePct: Math.round((clearUrineCount / filteredRecords.length) * 100),
      dayCount,
    };
  }, [filteredRecords]);

  // Group records by Date for the chart
  const chartData = useMemo(() => {
    const datesMap = new Map<string, {
      date: string;
      label: string;
      poop: number;
      urine: number;
      sleep: number;
      recordsCount: number;
      details: DailyPhysioRecord[];
    }>();

    filteredRecords.forEach(r => {
      const existing = datesMap.get(r.date);
      const dateParts = r.date.split('-');
      const label = `${parseInt(dateParts[2])} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][parseInt(dateParts[1]) - 1]}`;

      if (!existing) {
        datesMap.set(r.date, {
          date: r.date,
          label,
          poop: r.poopCount,
          urine: r.urineCount,
          sleep: r.sleepHours,
          recordsCount: 1,
          details: [r],
        });
      } else {
        existing.poop += r.poopCount;
        existing.urine += r.urineCount;
        existing.sleep = Math.round((existing.sleep + r.sleepHours) * 10) / 10;
        existing.recordsCount += 1;
        existing.details.push(r);
      }
    });

    return Array.from(datesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // Norm corridor thresholds based on filter (All vs Individual)
  const isAll = selectedElephant === 'all';
  const corridorConfig = useMemo(() => {
    switch (activeMetric) {
      case 'poop':
        return {
          title: 'Кал (куч в день)',
          unit: 'куч',
          minNorm: isAll ? 36 : 12,
          maxNorm: isAll ? 54 : 18,
          optimal: isAll ? 45 : 15,
          color: '#10b981', // emerald
          colorBand: 'rgba(16, 185, 129, 0.12)',
          colorStroke: '#059669',
          colorPoint: '#34d399',
        };
      case 'urine':
        return {
          title: 'Мочеиспускание (раз в день)',
          unit: 'раз',
          minNorm: isAll ? 24 : 8,
          maxNorm: isAll ? 36 : 12,
          optimal: isAll ? 30 : 10,
          color: '#38bdf8', // sky
          colorBand: 'rgba(56, 189, 248, 0.12)',
          colorStroke: '#0284c7',
          colorPoint: '#7dd3fc',
        };
      case 'sleep':
        return {
          title: 'Сон (часов в сутки)',
          unit: 'ч',
          minNorm: isAll ? 10.5 : 3.5,
          maxNorm: isAll ? 16.5 : 5.5,
          optimal: isAll ? 13.5 : 4.5,
          color: '#818cf8', // indigo
          colorBand: 'rgba(129, 140, 248, 0.14)',
          colorStroke: '#6366f1',
          colorPoint: '#a5b4fc',
        };
    }
  }, [activeMetric, isAll]);

  // SVG Chart calculation parameters
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 46;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const yMax = useMemo(() => {
    let maxVal = corridorConfig.maxNorm * 1.25;
    chartData.forEach(d => {
      const val = activeMetric === 'poop' ? d.poop : activeMetric === 'urine' ? d.urine : d.sleep;
      if (val > maxVal) maxVal = val * 1.15;
    });
    return Math.ceil(maxVal);
  }, [chartData, activeMetric, corridorConfig]);

  const yMin = 0;

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return paddingTop + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * plotWidth;
  };

  // Generate SVG Path for Actual values
  const points = chartData.map((d, i) => {
    const val = activeMetric === 'poop' ? d.poop : activeMetric === 'urine' ? d.urine : d.sleep;
    return {
      x: getX(i),
      y: getY(val),
      val,
      data: d,
    };
  });

  const pathD = points.length > 0 
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  // Calculate status of current average vs norm corridor
  const currentAvg = activeMetric === 'poop' ? aggregatedStats.avgPoop : activeMetric === 'urine' ? aggregatedStats.avgUrine : aggregatedStats.avgSleep;
  const isInCorridor = currentAvg >= corridorConfig.minNorm && currentAvg <= corridorConfig.maxNorm;
  const isBelowCorridor = currentAvg < corridorConfig.minNorm;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-28 text-slate-100 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('daily_shift')}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Назад в слоновник"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>📊 Мониторинг физиологии</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                Коридоры нормы
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Фиксация и ретроспектива: кал, моча, фазы сна (по слонам и в сумме)
            </p>
          </div>
        </div>

        {/* Quick Reset to Sample Data if needed */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Сбросить данные к эталонным 14 дням?')) {
                bodyMonitoringService.resetPhysioRecords();
              }
            }}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс / Эталон</span>
          </button>
        </div>
      </div>

      {/* 1. ELEPHANT FILTER (Всего / Марго / Одри / Прэтти) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          Фильтр по слонам:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'all', label: '🐘 Всего (Все слонихи)', badge: 'Суммарно' },
            { id: 'margo', label: '🟢 Марго', badge: 'Альфа' },
            { id: 'audrey', label: '🟡 Одри', badge: 'Средняя' },
            { id: 'pretty', label: '🟣 Прэтти', badge: 'Младшая' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedElephant(tab.id as ElephantFilterType);
                if (navigator.vibrate) navigator.vibrate(25);
              }}
              className={`p-2.5 rounded-2xl text-xs font-bold border transition-all flex flex-col items-start justify-between gap-1 text-left active:scale-[0.98] ${
                selectedElephant === tab.id
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-black text-sm">{tab.label}</span>
                {selectedElephant === tab.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
              </div>
              <span className="text-[10px] text-slate-400 font-normal">{tab.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. DATE HORIZON FILTER (За всё время [DEFAULT], Сегодня, Неделя, Месяц, Кастомный) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Временной диапазон (по дефолту — за всё время):
          </span>
          <span className="text-[11px] text-slate-400">
            Дней в выборке: <strong className="text-emerald-400 font-mono">{aggregatedStats.dayCount}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
          {[
            { id: 'all_time', label: 'За всё время (общая сумма)' },
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: 'Неделя (7 дней)' },
            { id: 'month', label: 'Месяц (30 дней)' },
            { id: 'custom', label: 'Выбор даты 📅' },
          ].map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDateFilter(d.id as DateFilterType);
                if (navigator.vibrate) navigator.vibrate(25);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                dateFilter === d.id
                  ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl animate-in fade-in">
            <span className="text-xs text-slate-400">От:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-xl font-mono focus:border-sky-500 outline-none"
            />
            <span className="text-xs text-slate-400">До:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-xl font-mono focus:border-sky-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* 3. TRIPLE FRAME KEY METRICS (Кал / Моча / Сон) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* POOP CARD */}
        <div 
          onClick={() => setActiveMetric('poop')}
          className={`cursor-pointer p-4 rounded-3xl border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.99] ${
            activeMetric === 'poop' 
              ? 'bg-emerald-950/30 border-emerald-500 shadow-emerald-950/40 ring-1 ring-emerald-500/30' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>💩 Кал (дефекация)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                Норма: {isAll ? '36–54' : '12–18'}/д
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-white">
                {aggregatedStats.totalPoop}
              </span>
              <span className="text-xs font-bold text-slate-400">куч всего</span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <span>В среднем в день:</span>
              <span className="font-mono font-black text-emerald-300">
                {aggregatedStats.avgPoop} куч/д
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">Плотный стул:</span>
            <span className="font-bold text-emerald-400">{aggregatedStats.denseStoolPct}%</span>
          </div>
        </div>

        {/* URINE CARD */}
        <div 
          onClick={() => setActiveMetric('urine')}
          className={`cursor-pointer p-4 rounded-3xl border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.99] ${
            activeMetric === 'urine' 
              ? 'bg-sky-950/30 border-sky-500 shadow-sky-950/40 ring-1 ring-sky-500/30' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span>💧 Моча (диурез)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                Норма: {isAll ? '24–36' : '8–12'}/д
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-white">
                {aggregatedStats.totalUrine}
              </span>
              <span className="text-xs font-bold text-slate-400">раз всего</span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <span>В среднем в день:</span>
              <span className="font-mono font-black text-sky-300">
                {aggregatedStats.avgUrine} раз/д
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">Прозрачность (светлая):</span>
            <span className="font-bold text-sky-400">{aggregatedStats.clearUrinePct}%</span>
          </div>
        </div>

        {/* SLEEP CARD */}
        <div 
          onClick={() => setActiveMetric('sleep')}
          className={`cursor-pointer p-4 rounded-3xl border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.99] ${
            activeMetric === 'sleep' 
              ? 'bg-indigo-950/30 border-indigo-500 shadow-indigo-950/40 ring-1 ring-indigo-500/30' 
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span>💤 Сон и фазы</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                Норма: {isAll ? '10.5–16.5' : '3.5–5.5'} ч/д
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-white">
                {aggregatedStats.totalSleep}
              </span>
              <span className="text-xs font-bold text-slate-400">часов всего</span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <span>В среднем в день:</span>
              <span className="font-mono font-black text-indigo-300">
                {aggregatedStats.avgSleep} ч/д
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">Фазы сна за период:</span>
            <span className="font-bold text-indigo-300 font-mono">
              🔖 {aggregatedStats.totalPhases} фаз
            </span>
          </div>
        </div>
      </div>

      {/* 4. FINANCIAL-STYLE "NORM CORRIDOR" CHART */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl flex flex-col gap-4 shadow-sm">
        {/* Chart Header & Metric Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                📈 Финансовый «Коридор нормы»: {corridorConfig.title}
              </h2>
              {isInCorridor ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  В коридоре нормы
                </span>
              ) : isBelowCorridor ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Ниже нормы
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Выше нормы
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Зелёный диапазон — физиологическая норма ({corridorConfig.minNorm}–{corridorConfig.maxNorm} {corridorConfig.unit}). Отклонения подсвечиваются.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveMetric('poop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'poop' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💩 Кал
            </button>
            <button
              onClick={() => setActiveMetric('urine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'urine' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💧 Моча
            </button>
            <button
              onClick={() => setActiveMetric('sleep')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMetric === 'sleep' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💤 Сон
            </button>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="w-full overflow-x-auto bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[600px] select-none"
          >
            <defs>
              {/* Corridor Gradient */}
              <linearGradient id="corridorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={corridorConfig.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={corridorConfig.color} stopOpacity="0.08" />
              </linearGradient>

              {/* Line Glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={corridorConfig.color} floodOpacity="0.5" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const val = Math.round(yMin + ratio * (yMax - yMin));
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    strokeOpacity="0.4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Norm Corridor Band (Rect) */}
            <rect
              x={paddingLeft}
              y={getY(corridorConfig.maxNorm)}
              width={plotWidth}
              height={Math.max(2, getY(corridorConfig.minNorm) - getY(corridorConfig.maxNorm))}
              fill="url(#corridorGrad)"
              stroke={corridorConfig.color}
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />

            {/* Optimal Value Dashed Center Line */}
            <line
              x1={paddingLeft}
              y1={getY(corridorConfig.optimal)}
              x2={svgWidth - paddingRight}
              y2={getY(corridorConfig.optimal)}
              stroke={corridorConfig.color}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              strokeOpacity="0.8"
            />
            <text
              x={svgWidth - paddingRight - 6}
              y={getY(corridorConfig.optimal) - 5}
              fill={corridorConfig.color}
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
            >
              Оптимум ({corridorConfig.optimal})
            </text>

            {/* Actual Values Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={corridorConfig.colorStroke}
                strokeWidth="2.5"
                filter="url(#glow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {points.map((p, idx) => {
              const inNorm = p.val >= corridorConfig.minNorm && p.val <= corridorConfig.maxNorm;
              const isHovered = hoveredPoint?.data?.date === p.data.date;

              return (
                <g 
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onClick={() => setHoveredPoint(p)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 7 : 4.5}
                    fill={inNorm ? corridorConfig.colorPoint : '#f43f5e'}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {/* Date label on X-axis */}
                  {(chartData.length <= 14 || idx % 2 === 0 || idx === chartData.length - 1) && (
                    <text
                      x={p.x}
                      y={svgHeight - paddingBottom + 16}
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.data.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-3 right-3 bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-xl flex flex-col gap-1 max-w-xs animate-in fade-in z-20">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-white">{hoveredPoint.data.date}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  hoveredPoint.val >= corridorConfig.minNorm && hoveredPoint.val <= corridorConfig.maxNorm
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {hoveredPoint.val >= corridorConfig.minNorm && hoveredPoint.val <= corridorConfig.maxNorm ? 'Норма' : 'Отклонение'}
                </span>
              </div>
              <div className="text-sm font-mono font-black text-white flex items-center gap-1 mt-0.5">
                <span>{hoveredPoint.val} {corridorConfig.unit}</span>
                <span className="text-xs text-slate-400 font-normal">
                  (норма {corridorConfig.minNorm}–{corridorConfig.maxNorm})
                </span>
              </div>

              {/* Details for each elephant on that day */}
              <div className="mt-1 pt-1 border-t border-slate-800 flex flex-col gap-1 text-[11px] text-slate-300">
                {hoveredPoint.data.details.map((det: DailyPhysioRecord) => (
                  <div key={det.id} className="flex items-center justify-between">
                    <span className="font-medium text-slate-400">{det.elephantName}:</span>
                    <span className="font-mono font-bold">
                      {activeMetric === 'poop' ? `${det.poopCount} куч (${det.stoolTrait})` : 
                       activeMetric === 'urine' ? `${det.urineCount} раз (${det.urineTrait})` : 
                       `${det.sleepHours} ч (${det.sleepPhases.length} фаз)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500/20 border border-emerald-500/50" />
              <span>Коридор физиологической нормы</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-400" />
              <span>Оптимальное значение</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
              <span>Факт в норме</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900" />
              <span>Отклонение (ЧП)</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Нажмите на точку графика для просмотра</span>
        </div>
      </div>

      {/* 5. DETAILED CHRONICLE TABLE BY DAYS */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <span>📋 Детальная хроника записей</span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredRecords.length} записей
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-2.5 px-3">Дата</th>
                <th className="py-2.5 px-3">Слониха</th>
                <th className="py-2.5 px-3">💩 Кал (куч)</th>
                <th className="py-2.5 px-3">Стул</th>
                <th className="py-2.5 px-3">💧 Моча</th>
                <th className="py-2.5 px-3">Цвет</th>
                <th className="py-2.5 px-3">💤 Сон (ч)</th>
                <th className="py-2.5 px-3">Фазы сна</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.slice().reverse().map(rec => {
                const isExpanded = expandedRowId === rec.id;
                return (
                  <React.Fragment key={rec.id}>
                    <tr 
                      onClick={() => setExpandedRowId(isExpanded ? null : rec.id)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-300 whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {rec.elephantName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-400">
                        {rec.poopCount}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          rec.stoolTrait === 'dense' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' :
                          rec.stoolTrait === 'dry' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' :
                          'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        }`}>
                          {rec.stoolTrait === 'dense' ? 'Плотный ✓' : rec.stoolTrait === 'dry' ? 'Сухой' : 'Жидкий ⚠️'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-sky-400">
                        {rec.urineCount}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          rec.urineTrait === 'clear' ? 'bg-sky-950/60 text-sky-300 border border-sky-800/60' :
                          rec.urineTrait === 'turbid' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' :
                          'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        }`}>
                          {rec.urineTrait === 'clear' ? 'Светлая ✓' : rec.urineTrait === 'turbid' ? 'Мутная' : 'Тёмная ⚠️'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-indigo-400">
                        {rec.sleepHours} ч
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                          {rec.sleepPhases ? `${rec.sleepPhases.length} фазы` : '—'}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable row for sleep phases */}
                    {isExpanded && rec.sleepPhases && rec.sleepPhases.length > 0 && (
                      <tr className="bg-slate-950/60">
                        <td colSpan={8} className="p-3 pl-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Bookmark className="w-3 h-3 text-indigo-400 fill-current" />
                              Зафиксированные фазы сна ({rec.elephantName} • {rec.date}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rec.sleepPhases.map((phase, pIdx) => (
                                <div key={phase.id} className="bg-slate-900 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-sm">
                                  <span className="font-mono text-indigo-300 font-bold">Фаза {pIdx + 1}:</span>
                                  <span className="text-white font-bold">{phase.hours} ч</span>
                                  <span className="text-[10px] text-slate-400">({phase.timestamp})</span>
                                </div>
                              ))}
                              <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-slate-300">
                                <span>Сумма:</span>
                                <strong className="text-indigo-300 font-mono">{rec.sleepHours} ч</strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
