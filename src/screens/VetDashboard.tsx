import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  Calendar,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  X,
  Stethoscope,
  Filter,
  Eye,
  Footprints,
  Scale
} from 'lucide-react';
import { useStore } from '../store';
import {
  bodyMonitoringService,
  BodyPhoto,
  VetReminderTask,
  ElephantHealthException
} from '../services/bodyMonitoringService';

interface VetDashboardProps {
  onNavigate?: (screen: string) => void;
}

export function VetDashboard({ onNavigate }: VetDashboardProps) {
  const { profile } = useStore();

  // Exceptions & Health status
  const [exceptions, setExceptions] = useState<Record<string, ElephantHealthException>>(() =>
    bodyMonitoringService.getExceptions()
  );

  // Photos & Reminders
  const [photos, setPhotos] = useState<BodyPhoto[]>(() => bodyMonitoringService.getPhotos());
  const [reminders, setReminders] = useState<VetReminderTask[]>(() => bodyMonitoringService.getReminders());

  // Gallery filters
  const [selectedElephantFilter, setSelectedElephantFilter] = useState<'all' | 'margo' | 'audrey' | 'pretty'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'foot' | 'silhouette'>('all');

  // New reminder input
  const [newReminderText, setNewReminderText] = useState('');
  const [reminderTargetElephant, setReminderTargetElephant] = useState<'all' | 'margo' | 'audrey' | 'pretty'>('all');

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<BodyPhoto | null>(null);

  // Upload photo from Vet
  const vetPhotoInputRef = useRef<HTMLInputElement>(null);
  const [uploadElephant, setUploadElephant] = useState<'margo' | 'audrey' | 'pretty'>('margo');
  const [uploadType, setUploadType] = useState<'foot' | 'silhouette'>('foot');
  const [uploadFoot, setUploadFoot] = useState<'ПП' | 'ЛП' | 'ПЗ' | 'ЛЗ'>('ПП');

  // Synchronize with external changes
  useEffect(() => {
    const handleExceptions = () => setExceptions(bodyMonitoringService.getExceptions());
    const handlePhotos = () => setPhotos(bodyMonitoringService.getPhotos());
    const handleReminders = () => setReminders(bodyMonitoringService.getReminders());

    window.addEventListener('elephant-exceptions-updated', handleExceptions);
    window.addEventListener('elephant-photos-updated', handlePhotos);
    window.addEventListener('elephant-reminders-updated', handleReminders);

    return () => {
      window.removeEventListener('elephant-exceptions-updated', handleExceptions);
      window.removeEventListener('elephant-photos-updated', handlePhotos);
      window.removeEventListener('elephant-reminders-updated', handleReminders);
    };
  }, []);

  // Compute overall status
  const hasExceptions = Object.values(exceptions).some(
    e => Boolean(e.didNotSleep) || Boolean(e.lameness) || (e.notes && e.notes.length > 0)
  );

  const activeExceptionsList: { eid: string; name: string; issues: string[] }[] = [];
  (['margo', 'audrey', 'pretty'] as const).forEach(eid => {
    const ex = exceptions[eid];
    const issues: string[] = [];
    const name = eid === 'margo' ? 'Марго' : eid === 'audrey' ? 'Одри' : 'Прэтти';
    if (ex?.didNotSleep) {
      issues.push('⚠️ Не ложилась ночью (дежурный кипер нажал ЧП)');
    }
    if (ex?.lameness) {
      issues.push(`🚨 Хромота ${ex.lameLeg ? `(${ex.lameLeg})` : ''}`);
    }
    if (ex?.notes) {
      issues.push(ex.notes);
    }
    if (issues.length > 0) {
      activeExceptionsList.push({ eid, name, issues });
    }
  });

  // Elephant cards data
  const elephantsData = [
    {
      id: 'margo',
      name: 'Марго',
      weight: '3 820 кг',
      color: 'bg-emerald-400',
      ringColor: 'ring-emerald-500/30',
      tag: 'Матриарх',
    },
    {
      id: 'audrey',
      name: 'Одри',
      weight: '3 510 кг',
      color: 'bg-amber-400',
      ringColor: 'ring-amber-500/30',
      tag: 'Спокойная',
    },
    {
      id: 'pretty',
      name: 'Прэтти',
      weight: '3 640 кг',
      color: 'bg-purple-400',
      ringColor: 'ring-purple-500/30',
      tag: 'Активная',
    },
  ];

  // Handler: Add Reminder from Doctor
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;

    bodyMonitoringService.addReminder(
      newReminderText.trim(),
      reminderTargetElephant
    );

    setNewReminderText('');
    setReminders(bodyMonitoringService.getReminders());
  };

  // Handler: Toggle Reminder
  const handleToggleReminder = (id: string) => {
    bodyMonitoringService.toggleReminder(id, profile?.name || 'Врач');
    setReminders(bodyMonitoringService.getReminders());
  };

  // Handler: Delete Reminder
  const handleDeleteReminder = (id: string) => {
    bodyMonitoringService.deleteReminder(id);
    setReminders(bodyMonitoringService.getReminders());
  };

  // Handler: Clear Exception by Doctor
  const handleClearException = (eid: string) => {
    bodyMonitoringService.setElephantException(eid, { didNotSleep: false, lameness: false, notes: '' });
    setExceptions(bodyMonitoringService.getExceptions());
  };

  // Handler: Upload Photo from Vet
  const handleVetPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      const eName = uploadElephant === 'margo' ? 'Марго' : uploadElephant === 'audrey' ? 'Одри' : 'Прэтти';
      const now = new Date();

      bodyMonitoringService.addPhoto({
        elephantId: uploadElephant,
        elephantName: eName,
        type: uploadType,
        foot: uploadType === 'foot' ? uploadFoot : undefined,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        dataUrl,
        note: uploadType === 'foot' ? `Клинический осмотр стопы ${uploadFoot}` : 'Клиническая оценка кондиции тела',
      });
      setPhotos(bodyMonitoringService.getPhotos());
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filtered photos
  const filteredPhotos = photos.filter(p => {
    if (selectedElephantFilter !== 'all' && p.elephantId !== selectedElephantFilter) return false;
    if (selectedTypeFilter !== 'all' && p.type !== selectedTypeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('daily_shift')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>К смене</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Stethoscope className="w-4 h-4" />
              </span>
              <h1 className="text-base font-black text-white">Веткабинет</h1>
            </div>
            <p className="text-[11px] text-slate-400">Reporting by Exception • Контроль 3 слоних</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
        {/* 1. STATUS HERO BANNER */}
        {!hasExceptions ? (
          <div className="rounded-3xl p-5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-600/40 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-300 flex items-center gap-2">
                🟢 Все показатели в норме
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Все 3 слонихи спали, двигаются без признаков хромоты, стул сформирован. Тревожных кнопок кипером не нажималось.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-950/70 to-rose-950/50 border border-amber-500/60 shadow-xl flex flex-col gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-amber-300">
                  ⚠️ Внимание врача: Зафиксированы отклонения
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Кипер отметил отклонения от нормального состояния:
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-1">
              {activeExceptionsList.map(item => (
                <div
                  key={item.eid}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-amber-500/30"
                >
                  <div className="text-xs">
                    <span className="font-black text-white mr-2">{item.name}:</span>
                    <span className="text-amber-200">{item.issues.join(', ')}</span>
                  </div>
                  <button
                    onClick={() => handleClearException(item.eid)}
                    className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 active:scale-95 border border-slate-700"
                  >
                    Снять тревогу
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. 3 ELEPHANT STATUS CARDS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🐘</span> Мониторинг слоних
            </h2>
            <span className="text-xs text-slate-400 font-medium">Нажмите на карточку для просмотра фото</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {elephantsData.map(e => {
              const ex = exceptions[e.id];
              const isNotSlept = Boolean(ex?.didNotSleep);
              const isLame = Boolean(ex?.lameness);
              const isAlert = isNotSlept || isLame;

              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedElephantFilter(e.id as any)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedElephantFilter === e.id
                      ? 'border-sky-500 bg-sky-950/20 ring-2 ring-sky-500/40 shadow-lg'
                      : isAlert
                      ? 'border-amber-500/60 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${e.color}`} />
                      <span className="text-base font-black text-white">{e.name}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                      {e.tag}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-500" /> Вес:
                      </span>
                      <span className="font-mono font-bold text-slate-200">{e.weight}</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400">Сон ночью:</span>
                      <span
                        className={`font-bold ${
                          isNotSlept ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isNotSlept ? '⚠️ Не ложилась' : '🟢 Норма'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Footprints className="w-3.5 h-3.5 text-slate-500" /> ОДА / походка:
                      </span>
                      <span className={`font-bold ${isLame ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isLame ? `🚨 Хромота ${ex?.lameLeg || ''}` : '🟢 Ровная'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Архив фото: {photos.filter(p => p.elephantId === e.id).length} шт</span>
                    <span className="text-sky-400 font-bold hover:underline">Смотреть ленту ›</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. DOCTOR-TO-KEEPER SIMPLE REMINDERS */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>📋</span> Напоминания и назначения киперу
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Задачи мгновенно отображаются у дежурного кипера на экране смены с кнопкой «✓ Сделано».
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-950 border border-sky-800 text-sky-300 px-2.5 py-1 rounded-xl">
              {reminders.filter(r => !r.completed).length} активных
            </span>
          </div>

          {/* New Task Input Form */}
          <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="Короткая задача: например, «В четверг дать витамины группы B в кашу»"
              value={newReminderText}
              onChange={e => setNewReminderText(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <div className="flex items-center gap-2">
              <select
                value={reminderTargetElephant}
                onChange={e => setReminderTargetElephant(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none"
              >
                <option value="all">Все слонихи</option>
                <option value="margo">Марго</option>
                <option value="audrey">Одри</option>
                <option value="pretty">Прэтти</option>
              </select>

              <button
                type="submit"
                disabled={!newReminderText.trim()}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Направить киперу
              </button>
            </div>
          </form>

          {/* Reminders List */}
          <div className="space-y-2">
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Назначений для киперов пока нет</p>
            ) : (
              reminders.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    task.completed
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => handleToggleReminder(task.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300">
                          {task.elephantName || 'Все слонихи'}
                        </span>
                        <span className="text-[10px] text-slate-500">{task.date}</span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 truncate font-medium ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </p>
                      {task.completed && task.completedAt && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                          ✓ Выполнено кипером {task.completedAt} ({task.completedBy || 'Кипер'})
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReminder(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 4. PHOTO GALLERY ("ОБОЛОЧКА": СТОПЫ И КОНДИЦИЯ ТЕЛА) */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>📷</span> Фотогалерея «Оболочки»
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Лента до/после еженедельных чеков стоп и оценки упитанности по датам.
              </p>
            </div>

            {/* Quick Upload from Vet */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => vetPhotoInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 border border-slate-700 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Загрузить фото осмотра</span>
              </button>
              <input
                ref={vetPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleVetPhotoUpload}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            {/* Elephant filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {[
                { id: 'all', label: 'Все слонихи' },
                { id: 'margo', label: 'Марго' },
                { id: 'audrey', label: 'Одри' },
                { id: 'pretty', label: 'Прэтти' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedElephantFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedElephantFilter === tab.id
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {[
                { id: 'all', label: 'Все типы' },
                { id: 'foot', label: '🦶 Стопы' },
                { id: 'silhouette', label: '🐘 Силуэт / бок' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTypeFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTypeFilter === tab.id
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Фотографий по выбранным фильтрам пока нет. Кипер может сделать снимок во время смены.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className="group relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-pointer hover:border-sky-500/50 transition-all flex flex-col"
                >
                  <div className="w-full aspect-square overflow-hidden bg-slate-900 relative">
                    <img
                      src={photo.dataUrl}
                      alt={photo.note}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-slate-200 border border-slate-800">
                      {photo.date}
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{photo.elephantName}</span>
                      <span className="text-[10px] text-sky-400 font-medium">
                        {photo.type === 'foot' ? `Стопа ${photo.foot}` : 'Силуэт'}
                      </span>
                    </div>
                    {photo.note && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{photo.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full shadow-2xl relative flex flex-col gap-4 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-100 text-base flex items-center gap-2">
                  <span>{lightboxPhoto.elephantName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                    {lightboxPhoto.type === 'foot'
                      ? `Стопа ${lightboxPhoto.foot}`
                      : 'Оценка кондиции тела / силуэт'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Дата фиксации: {lightboxPhoto.date} {lightboxPhoto.time}
                </p>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={lightboxPhoto.dataUrl}
                alt={lightboxPhoto.note}
                className="w-full h-full object-contain"
              />
            </div>

            {lightboxPhoto.note && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-400 block mb-0.5">Клинический комментарий:</span>
                {lightboxPhoto.note}
              </div>
            )}

            <button
              onClick={() => setLightboxPhoto(null)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95"
            >
              Закрыть просмотр
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
