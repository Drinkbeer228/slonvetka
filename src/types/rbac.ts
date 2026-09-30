export const APP_USER_ROLES = ['keeper', 'vet', 'admin', 'warehouse', 'chief'] as const;

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
  keeper: {
    id: 'keeper',
    label: 'Кипер (Исполнитель)',
    badge: '🐘 Кипер',
    shortLabel: 'Кипер',
    description: 'Выполнение ежедневных задач, фотоотчеты в ленту, чтение справочника',
    color: 'emerald',
    icon: '🐘',
  },
  vet: {
    id: 'vet',
    label: 'Ветеринарный врач',
    badge: '🩺 Врач',
    shortLabel: 'Врач',
    description: 'Назначение вет-задач, мониторинг отчетов кипера, редактирование справочника',
    color: 'sky',
    icon: '🩺',
  },
  admin: {
    id: 'admin',
    label: 'Шеф / Дрессировщик / Админ',
    badge: '👑 Шеф',
    shortLabel: 'Шеф/Админ',
    description: 'Полный доступ: постановка любых задач, лента, редактирование базы знаний и смена ролей',
    color: 'amber',
    icon: '👑',
  },
  warehouse: {
    id: 'warehouse',
    label: 'Администратор склада',
    badge: '📦 Склад',
    shortLabel: 'Склад',
    description: 'Учёт кормов и фуража на складе',
    color: 'amber',
    icon: '📦',
  },
  chief: {
    id: 'chief',
    label: 'Шеф (Наблюдатель)',
    badge: '👁️ Наблюдатель',
    shortLabel: 'Наблюдатель',
    description: 'Режим просмотра всех экранов и отчетов',
    color: 'purple',
    icon: '👁️',
  },
};
