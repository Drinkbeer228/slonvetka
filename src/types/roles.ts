export type UserRole = 'keeper' | 'vet' | 'director' | 'admin';

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
