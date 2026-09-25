import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  BookOpen, Package, BarChart3, Bell, Settings, 
  User, CheckCircle2, ShieldCheck, ChevronRight, X, 
  Volume2, Smartphone, Moon, Sun, Download, FileText,
  AlertTriangle, HeartPulse, Sparkles, ExternalLink, Shield
} from 'lucide-react';
import { RecipeBottomSheet } from './RecipeBottomSheet';
import { useRole } from '../../context/RoleContext';
import { APP_USER_ROLES, APP_ROLE_CONFIGS, AppUserRole } from '../../types/rbac';

interface MenuServiceSlideProps {
  slideWrapperClass: string;
  onNavigate: (screen: string) => void;
  addEvent: (title: string) => void;
  scrollToSlide: (index: number) => void;
}

export const MenuServiceSlide: React.FC<MenuServiceSlideProps> = ({
  slideWrapperClass,
  onNavigate,
  addEvent,
  scrollToSlide
}) => {
  const { profile } = useStore();
  const { userRole, setUserRole, roleConfig } = useRole();

  // Modals for each menu tile
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Notifications settings state
  const [notifications, setNotifications] = useState({
    porridgeTimer: true,
    waterCheck: true,
    poopAlert: true,
    hayNight: true,
    soundEnabled: true,
    vibrationEnabled: true
  });

  // Settings state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('slonovet_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('slonovet_theme', next);
    window.dispatchEvent(new Event('slonovet-theme-change'));
    addEvent(`Тема оформления переключена: ${next === 'dark' ? 'Тёмная' : 'Светлая'}`);
  };

  const handleExportReport = () => {
    addEvent('Сформирован и отправлен на печать месячный отчёт за Сентябрь 2026');
    if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
    alert('✓ Отчёт за Сентябрь 2026 сформирован: 14 смен, 4 200 кг сена, 84 замеса. Файл готов к отправке старшему зоотехнику.');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };
      addEvent(`Настройка уведомления изменена: ${key} = ${nextVal ? 'ВКЛ' : 'ВЫКЛ'}`);
      if (navigator.vibrate) navigator.vibrate(15);
      return updated;
    });
  };

  return (
    <div className={slideWrapperClass}>
      <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full pb-8">
        
        {/* Header Slide */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Меню и Сервис</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
            Версия 2.4 (EAZA)
          </span>
        </div>

        {/* 1. KEEPER PROFILE CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 text-white font-black text-xl shrink-0">
              SL
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-bold text-slate-100 truncate">
                  {profile?.name || 'Сергей Лазарев'}
                </span>
                <span className="text-[9px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  На смене
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium">Старший кипер • Секция слоновника</span>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-teal-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> EAZA Level 3
                </span>
                <span>•</span>
                <span className="text-amber-300 font-bold">Роль: {roleConfig.shortLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1.1 ROLE SWITCHER (RBAC СЕЛЕКТОР РОЛИ ДЛЯ ТЕСТИРОВАНИЯ) */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-black text-slate-200">Тестирование ролевой модели (RBAC)</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-1.5 py-0.5 rounded">
              {roleConfig.badge}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Выберите роль для проверки Conditional Rendering и блокировки интерфейса:
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {APP_USER_ROLES.map(role => {
              const cfg = APP_ROLE_CONFIGS[role];
              const isCurrent = userRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setUserRole(role);
                    addEvent(`Переключена роль пользователя: ${cfg.label}`);
                    if (navigator.vibrate) navigator.vibrate(20);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                    isCurrent
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>{cfg.badge}</span>
                      <span className={isCurrent ? 'text-indigo-200' : 'text-slate-300'}>{cfg.shortLabel}</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] bg-indigo-500 text-slate-950 font-black px-1 rounded">
                        АКТИВНА
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 leading-tight line-clamp-2">
                    {cfg.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. GRID OF SECTION TILES */}
        <div className="grid grid-cols-1 gap-2">
          
          {/* Tile 0: Технологическая карта рациона (НОВЫЙ РЕГЛАМЕНТ) */}
          <button
            type="button"
            onClick={() => setIsRecipeModalOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0 text-xl group-hover:scale-105 transition-transform shadow-sm">
                📋
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Техкарта рациона (Регламент)</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-mono font-bold">Рацион</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  Суточная норма: Геркулес, отруби, овес, кукуруза, спец-каши, овощи
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0 ml-2" />
          </button>

          {/* Tile 1: Вет-справочник */}
          <button
            type="button"
            onClick={() => setActiveModal('vet_manual')}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 text-xl group-hover:scale-105 transition-transform">
                📚
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Вет-справочник</span>
                  <span className="text-[9px] bg-teal-950 text-teal-400 border border-teal-800/60 px-1 rounded font-mono font-bold">EAZA</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  Протоколы EAZA, нормы ЖКТ, первая помощь при коликах
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
          </button>

          {/* Tile 2: Архив списаний кормов */}
          <button
            type="button"
            onClick={() => setActiveModal('fodder_archive')}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 text-xl group-hover:scale-105 transition-transform">
                📦
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Архив списаний кормов</span>
                  <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1 rounded font-mono font-bold">Склад</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  История расхода каш, концентратов и фуража со склада
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
          </button>

          {/* Tile 3: Отчёты за месяц */}
          <button
            type="button"
            onClick={() => setActiveModal('monthly_reports')}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 text-xl group-hover:scale-105 transition-transform">
                📊
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Отчёты за месяц</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-mono font-bold">Сводка</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  Выгрузка журнала смен, рационов и ветеринарной статистики
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
          </button>

          {/* Tile 4: Уведомления и алерты */}
          <button
            type="button"
            onClick={() => setActiveModal('alerts_config')}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 text-xl group-hover:scale-105 transition-transform">
                🔔
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Уведомления и алерты</span>
                  <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-1 rounded font-mono font-bold">Таймеры</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  Таймеры запарки каш, напоминания по воде и дефекации
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
          </button>

          {/* Tile 5: Настройки приложения */}
          <button
            type="button"
            onClick={() => setActiveModal('app_settings')}
            className="w-full bg-slate-900 hover:bg-slate-850 active:scale-[0.99] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer text-left shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 text-xl group-hover:scale-105 transition-transform">
                🛠️
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Настройки приложения</span>
                  <span className="text-[9px] bg-purple-950 text-purple-400 border border-purple-800/60 px-1 rounded font-mono font-bold">Система</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  Тема оформления, вибрация кнопок, звуки и оффлайн-режим
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
          </button>
        </div>

        {/* Quick jump back to shift slides */}
        <div className="pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => scrollToSlide(0)}
            className="py-2 px-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-bold transition-all text-center cursor-pointer text-[11px]"
          >
            📋 Рутина
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(1)}
            className="py-2 px-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold transition-all text-center cursor-pointer text-[11px]"
          >
            🥣 Кухня
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(2)}
            className="py-2 px-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 font-bold transition-all text-center cursor-pointer text-[11px]"
          >
            🧹 Хозяйство
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ВЕТ-СПРАВОЧНИК */}
      {/* ======================================================== */}
      {activeModal === 'vet_manual' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Вет-справочник и протоколы EAZA</h3>
                  <span className="text-[10px] text-teal-400 font-mono">Стандарты содержания азиатских слонов 2024</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  Нормы транзита ЖКТ слона
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Полный транзит грубых кормов через слепую и ободочную кишку слона составляет <b className="text-slate-200">24–48 часов</b>. Дефекация должна происходить каждые 1.5–3 часа (в среднем 10–15 дефекаций в сутки, 80–120 кг навоза).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                <span className="font-bold text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Симптомы колик и тимпании (Опасно!)
                </span>
                <ul className="text-[11px] text-amber-100/90 list-disc list-inside space-y-0.5">
                  <li>Беспокойство, раскачивание, задирание хобота вверх.</li>
                  <li>Присаживание на запястья, попытки лечь и быстро встать.</li>
                  <li>Отсутствие дефекации более 5–6 часов.</li>
                  <li>Асимметричное вздутие правой или левой голодной ямки.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-300">
                  Первая помощь до прибытия врача:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. Немедленно вызвать дежурного ветврача через рацию / приложение.<br/>
                  2. Шаговая проводка слона по манежу 20–30 минут (стимуляция моторики).<br/>
                  3. Отменить все концентраты и зерновые каши!<br/>
                  4. Приготовить тёплый гидрофильный отвар фенхеля/аниса со льняной слизью.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-300">
                  Нормы водопоя и соли:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Суточная потребность взрослой слонихи: <b className="text-slate-200">120–200 л чистой воды</b>. Температура воды не ниже +16°C. Обязательна кормовая соль 80–120 г/сутки для поддержания электролитного баланса.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Закрыть справочник
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: АРХИВ СПИСАНИЙ КОРМОВ */}
      {/* ======================================================== */}
      {activeModal === 'fodder_archive' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Архив списаний со склада</h3>
                  <span className="text-[10px] text-amber-400 font-mono">Текущая смена (18 сентября 2026)</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { time: '08:15', item: 'Геркулес экстра', amount: '12.0 кг', elephant: 'Марго, Одри, Прэтти (Завтрак)', status: 'Списано' },
                { time: '08:20', item: 'Жмых льняной гидрофильный', amount: '4.5 кг', elephant: 'Одри, Марго', status: 'Списано' },
                { time: '09:00', item: 'Сено тимофеевка (1 сорт)', amount: '3 тюка (~60 кг)', elephant: 'Утренний выгул', status: 'Списано' },
                { time: '13:00', item: 'Морковь мытая сочная', amount: '15.0 кг', elephant: 'Обед (все слоны)', status: 'Списано' },
                { time: '13:10', item: 'Ветви ивы и осины', amount: '6 веников', elephant: 'Обогащение среды', status: 'Списано' },
              ].map((rec, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-200">{rec.item}</span>
                    <span className="text-[11px] text-slate-400">{rec.elephant} • {rec.time}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-300 font-mono">{rec.amount}</span>
                    <div className="text-[9px] text-emerald-400 font-semibold">{rec.status}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveModal(null); scrollToSlide(3); }}
                className="flex-1 h-10 rounded-xl bg-amber-950/60 border border-amber-500/50 hover:bg-amber-900/60 text-amber-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Перейти на склад фуража
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ОТЧЁТЫ ЗА МЕСЯЦ */}
      {/* ======================================================== */}
      {activeModal === 'monthly_reports' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Сводка и отчёты за месяц</h3>
                  <span className="text-[10px] text-emerald-400 font-mono">Период: 01.09.2026 — 18.09.2026</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Отработано смен:</span>
                <div className="text-lg font-black text-emerald-400 mt-0.5">14 из 16</div>
                <span className="text-[10px] text-slate-500">Выполнено 87.5% плана</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Сено и грубые:</span>
                <div className="text-lg font-black text-amber-400 mt-0.5">4 200 кг</div>
                <span className="text-[10px] text-slate-500">Тюки + рулоны</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Каши и мэши:</span>
                <div className="text-lg font-black text-sky-400 mt-0.5">84 замеса</div>
                <span className="text-[10px] text-slate-500">Без срывов техкарты</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Вет-инциденты:</span>
                <div className="text-lg font-black text-teal-400 mt-0.5">0 критич.</div>
                <span className="text-[10px] text-slate-500">Норма ЖКТ 100%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportReport}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Выгрузить журнал смен (.xlsx / PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: УВЕДОМЛЕНИЯ И АЛЕРТЫ */}
      {/* ======================================================== */}
      {activeModal === 'alerts_config' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Уведомления и алерты</h3>
                  <span className="text-[10px] text-indigo-400 font-mono">Автоматические напоминания киперу</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'porridgeTimer', label: 'Таймер запарки каш (100°C, 3 часа)', desc: 'Напомнить за 30 мин до остывания и раздачи' },
                { key: 'waterCheck', label: 'Контроль чистоты поилок', desc: 'Проверка клапанов и температуры воды каждые 4 часа' },
                { key: 'poopAlert', label: 'Алерт задержки дефекации', desc: 'Уведомить врача, если у слона нет навоза >6 часов' },
                { key: 'hayNight', label: 'Напоминание ночной пайки сена', desc: 'Контроль подвеса сеток с сеном в 21:00' },
                { key: 'soundEnabled', label: 'Звуковые сигналы в слоновнике', desc: 'Громкий зуммер при завершении таймеров' },
                { key: 'vibrationEnabled', label: 'Виброотклик смартфона кипера', desc: 'Тактильная обратная связь при тапах' },
              ].map(item => {
                const isEnabled = notifications[item.key as keyof typeof notifications];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleNotification(item.key as any)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col pr-3">
                      <span className="font-bold text-slate-200">{item.label}</span>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                      isEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Сохранить и закрыть
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: НАСТРОЙКИ ПРИЛОЖЕНИЯ */}
      {/* ======================================================== */}
      {activeModal === 'app_settings' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛠️</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Настройки приложения</h3>
                  <span className="text-[10px] text-purple-400 font-mono">Системные параметры кипера</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Theme */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Тема оформления</div>
                  <div className="text-[11px] text-slate-400">Тёмная контрастная (для слоновника) / Светлая</div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {themeMode === 'dark' ? <Moon className="w-3.5 h-3.5 text-emerald-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{themeMode === 'dark' ? 'Тёмная' : 'Светлая'}</span>
                </button>
              </div>

              {/* Sync status */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Оффлайн-синхронизация
                  </div>
                  <div className="text-[11px] text-slate-400">Автономное сохранение замесов и дефекаций без интернета</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                  Активно
                </span>
              </div>

              {/* Modules navigation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Быстрый переход к другим разделам:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setActiveModal(null); onNavigate('vet_cabinet'); }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>🩺 Веткабинет</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                  <button
                    onClick={() => { setActiveModal(null); onNavigate('monitoring'); }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 font-bold text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>📈 Мониторинг</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Закрыть настройки
            </button>
          </div>
        </div>
      )}

      {/* Tech Card & Full Diet Specification Modal */}
      <RecipeBottomSheet
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
      />

    </div>
  );
};
