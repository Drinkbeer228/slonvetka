const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartPulse, Activity, Utensils, Moon, 
  Calendar as CalendarIcon, Camera, FileText, CheckCircle2, ChevronLeft, 
  ChevronRight, Sparkles, Stethoscope, Clock, User, Check, X,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { supabaseService } from '../services/supabaseService';
import { DailyShift, ElephantDailyMetrics } from '../types/shift';
import { Assignment, TreatmentRecordWithPhotos } from '../types';
import { DailyRationData } from '../components/daily-shift/FeedControl';
import { formatDuration } from '../components/daily-shift/ExcretionControl';

export function VetDashboard() {
  const { elephants: storeElephants, profile } = useStore();
  const elephants = storeElephants && storeElephants.length > 0 ? storeElephants : [];
  
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterElephantId, setFilterElephantId] = useState<string>('all');
  
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [records, setRecords] = useState<TreatmentRecordWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Format date display
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    Promise.all([
      shiftService.getShiftData(selectedDate),
      supabaseService.getActiveAssignments(),
      supabaseService.getRecordsByDate(selectedDate)
    ]).then(([shiftData, activeAssignments, dayRecords]) => {
      if (!isMounted) return;
      setShift(shiftData.shift);
      setMetrics(shiftData.metrics || {});
      setAssignments(activeAssignments);
      setRecords(dayRecords);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (isMounted) setLoading(false);
    });
    
    return () => { isMounted = false; };
  }, [selectedDate]);

  const rationData: DailyRationData = useMemo(() => {
    if (!shift?.feed_notes) return {} as DailyRationData;
    try { return JSON.parse(shift.feed_notes); } catch { return {} as DailyRationData; }
  }, [shift]);

  // Filter data by selected elephant
  const targetElephants = useMemo(() => {
    if (filterElephantId === 'all') return elephants;
    return elephants.filter(e => e.id === filterElephantId);
  }, [elephants, filterElephantId]);
  
  const displayMetrics = useMemo(() => {
    let totalPoop = 0;
    let totalSleepMins = 0;
    let totalLaydowns = 0;
    let hasDiarrhea = false;
    let hasDry = false;
    
    targetElephants.forEach(e => {
      const m = metrics[e.id];
      if (m) {
        totalPoop += (m.poop_count || 0);
        totalSleepMins += (m.sleep_minutes || 0);
        totalLaydowns += (m.sleep_intervals?.length || 0);
        const traits = m.feces_traits || [];
        if (traits.some(t => t.toLowerCase().includes('жидк') || t.toLowerCase().includes('понос'))) hasDiarrhea = true;
        if (traits.some(t => t.toLowerCase().includes('сух') || t.toLowerCase().includes('твёрд'))) hasDry = true;
      }
    });
    
    return {
      poopCount: totalPoop,
      stoolStatus: hasDiarrhea ? 'Понос/Жидкий' : (hasDry ? 'Сухой' : 'Норма'),
      sleepTime: formatDuration(totalSleepMins),
      laydowns: totalLaydowns,
      appetite: rationData.salad_appetite === 'refused' ? 'Отказ' : (rationData.salad_appetite === 'partial' ? 'Частично' : '100% съедено')
    };
  }, [targetElephants, metrics, rationData]);
  
  const elephantAssignments = useMemo(() => {
    return assignments.filter(a => filterElephantId === 'all' || a.elephant_id === filterElephantId);
  }, [assignments, filterElephantId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 sm:px-6 pt-6 antialiased">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">ВетПанель</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <CalendarIcon size={16} />
            <span className="capitalize">{formattedDate}</span>
          </p>
        </div>
        
        {/* Date Navigator */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            Сегодня
          </button>
          <button 
            onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ELEPHANT TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterElephantId('all')}
          className={\`shrink-0 px-5 py-2 rounded-2xl text-sm font-bold transition-all \${
            filterElephantId === 'all' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
          }\`}
        >
          Все слоны
        </button>
        {elephants.map(e => (
          <button
            key={e.id}
            onClick={() => setFilterElephantId(e.id)}
            className={\`shrink-0 px-5 py-2 rounded-2xl text-sm font-bold transition-all \${
              filterElephantId === e.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }\`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* COMPACT METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ЖКТ */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity size={18} />
                  <span className="font-semibold text-sm">ЖКТ / Стул</span>
                </div>
                <div className={\`px-2.5 py-1 rounded-full text-xs font-bold \${
                  displayMetrics.stoolStatus === 'Норма' ? 'bg-emerald-100 text-emerald-700' :
                  displayMetrics.stoolStatus === 'Сухой' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }\`}>
                  {displayMetrics.stoolStatus}
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{displayMetrics.poopCount} <span className="text-lg text-slate-500 font-bold">куч</span></div>
            </div>

            {/* Сон */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Moon size={18} />
                  <span className="font-semibold text-sm">Сон</span>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{displayMetrics.sleepTime}</div>
              <div className="text-sm font-semibold text-slate-500 mt-1">{displayMetrics.laydowns} укладок</div>
            </div>

            {/* Аппетит */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Utensils size={18} />
                  <span className="font-semibold text-sm">Аппетит</span>
                </div>
                <div className={\`px-2.5 py-1 rounded-full text-xs font-bold \${
                  displayMetrics.appetite === '100% съедено' ? 'bg-emerald-100 text-emerald-700' :
                  displayMetrics.appetite === 'Отказ' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }\`}>
                  {displayMetrics.appetite}
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{rationData.morning_porridge === 'all' ? 'Каша съедена' : 'Каша частично'}</div>
            </div>
          </div>

          {/* ВЕТЕРИНАРНЫЕ НАЗНАЧЕНИЯ */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[28px] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={20} className="text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900">Медицинские процедуры</h2>
            </div>
            
            {elephantAssignments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-medium text-sm bg-slate-50 rounded-2xl">
                Нет активных назначений
              </div>
            ) : (
              <div className="space-y-3">
                {elephantAssignments.map(a => {
                  const record = records.find(r => r.assignment_id === a.id);
                  const isDone = !!record;
                  const eName = elephants.find(e => e.id === a.elephant_id)?.name;
                  
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={\`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 \${
                          isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-400'
                        }\`}>
                          {isDone ? <Check size={20} strokeWidth={3} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{a.title}</div>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">{eName} {a.medicine ? \`• \${a.medicine}\` : ''}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isDone && record.photos && record.photos.length > 0 && (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden relative">
                            {record.photos[0].storage_path ? (
                                <img src={supabaseService.getPublicUrl(record.photos[0].storage_path)} className="w-full h-full object-cover" />
                            ) : (
                                <img src={record.photos[0].dataUrl} className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        {!isDone && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hidden sm:inline-block">Ожидает</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ЗАМЕТКИ ЖУРНАЛА & ГАЛЕРЕЯ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Журнал */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[28px] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-slate-700" />
                <h2 className="text-lg font-black text-slate-900">Журнал наблюдений</h2>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {targetElephants.map(e => {
                  const m = metrics[e.id];
                  if (!m?.notes) return null;
                  return (
                    <div key={e.id} className="p-3 bg-slate-50 rounded-2xl">
                      <div className="text-xs font-bold text-slate-500 mb-1">{e.name}</div>
                      <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{m.notes}</div>
                    </div>
                  );
                })}
                {shift?.handover_notes && filterElephantId === 'all' && (
                  <div className="p-3 bg-indigo-50 rounded-2xl">
                     <div className="text-xs font-bold text-indigo-500 mb-1">Пересменка</div>
                     <div className="text-sm font-medium text-indigo-900 leading-relaxed whitespace-pre-wrap">{shift.handover_notes}</div>
                  </div>
                )}
                {targetElephants.every(e => !metrics[e.id]?.notes) && (!shift?.handover_notes || filterElephantId !== 'all') && (
                  <div className="text-center py-4 text-slate-400 font-medium text-sm">Заметок нет</div>
                )}
              </div>
            </div>

            {/* Галерея */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[28px] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Camera size={20} className="text-slate-700" />
                <h2 className="text-lg font-black text-slate-900">Фотографии смены</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 {(() => {
                   const photos = [];
                   targetElephants.forEach(e => {
                     const m = metrics[e.id];
                     if (m?.photos) {
                       m.photos.forEach(p => photos.push(p));
                     }
                   });
                   if (photos.length === 0) {
                     return <div className="col-span-3 text-center py-6 text-slate-400 font-medium text-sm">Нет фото</div>;
                   }
                   return photos.map((p, idx) => (
                     <div key={p.id || idx} className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative group cursor-pointer">
                       <img src={p.dataUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                     </div>
                   ));
                 })()}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/screens/VetDashboard.tsx', code);
