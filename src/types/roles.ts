export const USER_ROLES = ['keeper', 'vet', 'director', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  keeper: 'Кипер',
  vet: 'Ветврач',
  director: 'Дрессировщик',
  admin: 'Администратор',
};

export const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  keeper: 'Кипер',
  vet: 'Вет',
  director: 'Дресс.',
  admin: 'Админ',
};
