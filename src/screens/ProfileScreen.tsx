import React from 'react';
import { 
  User, 
  Shield, 
  LogOut, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { useStore } from '../store';
import { useRole } from '../context/RoleContext';
import { AppUserRole, APP_ROLE_CONFIGS } from '../types/rbac';
import { INITIAL_DAILY_TASKS, INITIAL_FEED_ENTRIES, INITIAL_HANDBOOK_ARTICLES } from '../types/engine';

export function ProfileScreen() {
  const { profile, logout } = useStore();
  const { userRole, setUserRole, roleConfig } = useRole();

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handleSelectRole = (newRole: AppUserRole) => {
    setUserRole(newRole);
    triggerHaptic([20, 30]);
  };

  const handleResetData = () => {
    if (confirm('Сбросить задачи, ленту и статьи к исходному тестовому состоянию?')) {
      localStorage.setItem('slonovet_daily_tasks_v2', JSON.stringify(INITIAL_DAILY_TASKS));
      localStorage.setItem('slonovet_feed_entries_v2', JSON.stringify(INITIAL_FEED_ENTRIES));
      localStorage.setItem('slonovet_handbook_articles_v2', JSON.stringify(INITIAL_HANDBOOK_ARTICLES));
      window.location.reload();
    }
  };

  const rolesList: { id: AppUserRole; title: string; badge: string; desc: string; icon: string; borderActive: string }[] = [
    {
      id: 'keeper',
      title: 'Кипер (Исполнитель)',
      badge: '🐘 Рабочая смена',
      desc: 'Отметка выполнения ежедневных задач, публикация фотоотчетов тазов/вольера, чтение регламентов',
      icon: '🐘',
      borderActive: 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
    },
    {
      id: 'vet',
      title: 'Ветеринарный врач',
      badge: '🩺 Мед-контроль',
      desc: 'Постановка вет-назначений, мониторинг состояния животных в ленте, редактирование регламентов',
      icon: '🩺',
      borderActive: 'border-sky-500 bg-sky-950/20 text-sky-300'
    },
    {
      id: 'admin',
      title: 'Шеф / Дрессировщик / Админ',
      badge: '👑 Полный доступ',
      desc: 'Создание любых задач (ТБ, рационы), полный контроль ленты смены, управление базой знаний',
      icon: '👑',
      borderActive: 'border-amber-500 bg-amber-950/20 text-amber-300'
    }
  ];

  return (
    <div className="flex flex-col gap-3 max-w-lg mx-auto w-full pb-20 pt-1">
      
      {/* HEADER */}
      <div className="flex flex-col">
        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          <span>⚙️</span>
          <span>Профиль и роль</span>
        </h1>
        <span className="text-xs text-zinc-400 font-medium">
          Управление учетной записью, правами доступа и тестовым окружением
        </span>
      </div>

      {/* КАРТОЧКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {roleConfig.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white break-words">
              {profile?.name || 'Дежурный кипер'}
            </span>
            <span className="text-xs text-zinc-400 break-words">
              ID: {profile?.id ? profile.id.slice(0, 16) + '...' : 'keeper-offline-session'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
              Подключение: Supabase Auth Active
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="p-2.5 rounded-xl bg-zinc-950 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer shrink-0"
          title="Выйти из аккаунта"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* РОЛЕВАЯ МОДЕЛЬ (RBAC) — СЕЛЕКТОР БЫСТРОЙ СМЕНЫ РОЛИ ДЛЯ ТЕСТИРОВАНИЯ */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
        
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black text-white">
              Ролевая модель (RBAC)
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold">
            Тестирование интерфейса
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {rolesList.map(r => {
            const isSelected = userRole === r.id;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? `${r.borderActive} shadow-md`
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{r.icon}</span>

                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-white">
                      {r.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${
                      isSelected ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                    }`}>
                      {r.badge}
                    </span>
                  </div>

                  <p className="text-[11px] font-normal leading-relaxed text-zinc-400 break-words mt-0.5">
                    {r.desc}
                  </p>
                </div>

                <div className="shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-emerald-400 bg-emerald-500 text-zinc-950 font-bold' : 'border-zinc-700 bg-zinc-900 text-transparent'
                  }`}>
                    ✓
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* ТЕСТОВЫЕ ДАННЫЕ И СБРОС */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-black text-white">
            Управление данными
          </h2>
        </div>

        <p className="text-xs text-zinc-400 font-normal leading-relaxed">
          Все ваши созданные задачи, записи ленты и статьи справочника сохраняются локально. При необходимости вы можете вернуть демонстрационные данные зоопарка.
        </p>

        <button
          type="button"
          onClick={handleResetData}
          className="mt-1 py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Сбросить данные к исходным</span>
        </button>
      </div>

    </div>
  );
}
