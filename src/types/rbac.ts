export const APP_USER_ROLES = ['admin', 'keeper', 'warehouse', 'chief'] as const;

export type AppUserRole = (typeof APP_USER_ROLES)[number];

export interface RoleConfig {
  id: AppUserRole;
  label: string;
  badge: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
}

export const APP_ROLE_CONFIGS: Record<AppUserRole, RoleConfig> = {
  admin: {
    id: 'admin',
    label: 'Администратор / Разработчик',
    badge: '👑 Админ',
    shortLabel: 'Админ',
    description: 'Полный доступ ко всем экранам и функциям без ограничений',
    color: 'emerald',
    icon: '👑',
  },
  keeper: {
    id: 'keeper',
    label: 'Кипер (Дежурный)',
    badge: '🐘 Кипер',
    shortLabel: 'Кипер',
    description: 'Управление Слоновником (рутина, рационы, хозяйство), склад и календарь. Полное взаимодействие',
    color: 'sky',
    icon: '🐘',
  },
  warehouse: {
    id: 'warehouse',
    label: 'Администратор склада',
    badge: '📦 Склад',
    shortLabel: 'Склад',
    description: 'Доступ только к вкладкам «Склад» (рилсы фуража) и «Меню». «Слоновник» заблокирован',
    color: 'amber',
    icon: '📦',
  },
  chief: {
    id: 'chief',
    label: 'Шеф / Руководство (Read-Only)',
    badge: '👁️ Шеф (Наблюдатель)',
    shortLabel: 'Шеф',
    description: 'Режим наблюдателя: просмотр всех экранов, любые изменения и кнопки заблокированы',
    color: 'purple',
    icon: '👁️',
  },
};
