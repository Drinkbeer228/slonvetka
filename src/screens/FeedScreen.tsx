import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Send, 
  X, 
  MessageSquare, 
  Sparkles, 
  Image as ImageIcon,
  Clock,
  User,
  Shield,
  Stethoscope
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRole } from '../context/RoleContext';
import { FeedEntry, INITIAL_FEED_ENTRIES } from '../types/engine';

interface FeedScreenProps {
  onAddEventExternal?: (text: string, badge?: string) => void;
}

export function FeedScreen({ onAddEventExternal }: FeedScreenProps) {
  const { userRole, roleConfig } = useRole();

  const [feedEntries, setFeedEntries] = useLocalStorage<FeedEntry[]>(
    'slonovet_feed_entries_v2',
    INITIAL_FEED_ENTRIES
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState('📷 Фотоотчёт');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result as string);
      triggerHaptic(15);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedPhoto) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry: FeedEntry = {
      id: `feed-${Date.now()}`,
      time: timeStr,
      author: roleConfig.label,
      role: userRole as any,
      text: text.trim(),
      photoUrl: selectedPhoto || undefined,
      badge: selectedBadge,
      createdAt: now.toISOString()
    };

    setFeedEntries(prev => [newEntry, ...prev]);
    triggerHaptic([25, 40]);

    if (onAddEventExternal) {
      onAddEventExternal(text.trim() || 'Фотоотчёт смены', selectedBadge);
    }

    setText('');
    setSelectedPhoto(null);
    setComposerOpen(false);
  };

  const handleQuickTemplate = (templateText: string, badge: string) => {
    setText(templateText);
    setSelectedBadge(badge);
    setComposerOpen(true);
  };

  const getRoleBadge = (role: 'keeper' | 'vet' | 'admin') => {
    switch (role) {
      case 'vet':
        return { label: 'Врач', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: '🩺' };
      case 'admin':
        return { label: 'Шеф/Админ', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: '👑' };
      case 'keeper':
      default:
        return { label: 'Кипер', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: '🐘' };
    }
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full pb-20">
      
      {/* HEADER С КНОПКОЙ ДОБАВЛЕНИЯ ЗАПИСИ */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>📸</span>
            <span>Лента и отчёты</span>
          </h1>
          <span className="text-xs text-zinc-400 font-medium">
            Общий журнал смены, наблюдения киперов и назначения врача
          </span>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="px-3 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span>Добавить запись</span>
        </button>
      </div>

      {/* БЫСТРЫЕ ШАБЛОНЫ В ОДИН КЛИК ДЛЯ ДЕЖУРНОГО */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-zinc-500 px-1 shrink-0">
          Быстро:
        </span>
        {[
          { label: '💩 Жидкий стул у Марго', text: 'Замечен жидкий стул у Марго при утренней дефекации. Цвет соломенно-желтый, слониха пьет нормально.', badge: '⚠️ Вет-контроль' },
          { label: '🥣 Запарка роздана', text: 'Утренний рацион полностью роздан по тазам. Все три слонихи поели чисто.', badge: '🥣 Кормление' },
          { label: '🌾 Сено обновлено', text: 'Фураж и сено пролиты водой от пыли, разложены по вольерам.', badge: '🌾 Фураж' },
          { label: '🚿 Проливка выгула', text: 'Грязевая ванна и проливка уличного бассейна проведены.', badge: '🚿 Уход' }
        ].map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickTemplate(tmpl.text, tmpl.badge)}
            className="py-1 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* ЛЕНТА КАРТОЧЕК — ТЕКСТ ПОЛНОСТЬЮ ПЕРЕНОСИТСЯ, БЕЗ ОБРЕЗКИ */}
      <div className="flex flex-col gap-2">
        {feedEntries.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 text-center text-zinc-500 text-xs font-bold">
            Лента пока пуста. Нажмите «Добавить запись», чтобы зафиксировать событие.
          </div>
        ) : (
          feedEntries.map(entry => {
            const roleInfo = getRoleBadge(entry.role);

            return (
              <div
                key={entry.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
              >
                {/* Шапка карточки сообщения */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${roleInfo.color}`}>
                      <span>{roleInfo.icon}</span>
                      <span>{roleInfo.label}</span>
                    </span>
                    <span className="text-xs font-bold text-white">
                      {entry.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{entry.time}</span>
                  </div>
                </div>

                {/* Бейдж темы если есть */}
                {entry.badge && (
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      {entry.badge}
                    </span>
                  </div>
                )}

                {/* Текст сообщения — ПЕРЕНОС СТРОК, БЕЗ УСЕЧЕНИЯ */}
                {entry.text && (
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium break-words">
                    {entry.text}
                  </p>
                )}

                {/* Фотография если прикреплена */}
                {entry.photoUrl && (
                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 mt-1 max-h-80">
                    <img 
                      src={entry.photoUrl} 
                      alt="Фотоотчет" 
                      className="w-full h-auto object-cover max-h-80"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ЗАПИСИ / ФОТООТЧЕТА */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setComposerOpen(false)} />

          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <h2 className="text-sm font-black text-white leading-tight">
                  Запись в ленту смены
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostEntry} className="flex flex-col gap-3 py-3 overflow-y-auto pr-1">
              
              {/* Тема / Бейдж */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Категория события</label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="📷 Фотоотчёт">📷 Фотоотчёт тазов / вольера</option>
                  <option value="⚠️ Вет-контроль">⚠️ Наблюдение / Вет-контроль</option>
                  <option value="🥣 Кормление">🥣 Кормление и рацион</option>
                  <option value="🌾 Фураж">🌾 Фураж и сено</option>
                  <option value="🔒 Безопасность">🔒 Безопасность и замки</option>
                  <option value="📝 Общее">📝 Общая заметка</option>
                </select>
              </div>

              {/* Текст заметки */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Сообщение <span className="text-zinc-500 font-normal">(опишите ситуацию)</span>
                </label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Опишите состояние животных, поведение или выполненные работы..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Прикрепление фото */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Фотография</label>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {selectedPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 max-h-48 bg-zinc-950">
                    <img src={selectedPhoto} alt="Выбранное фото" className="w-full h-auto object-cover max-h-48" />
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-16 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500 bg-zinc-950/60 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-xs font-bold">Сделать снимок камеры или выбрать фото</span>
                  </button>
                )}
              </div>

              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={!text.trim() && !selectedPhoto}
                className={`w-full mt-2 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  !text.trim() && !selectedPhoto
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 shadow-emerald-500/20'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Опубликовать в ленту</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
