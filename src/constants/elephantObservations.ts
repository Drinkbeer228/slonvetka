export const FEET_LIST = [
  { id: 'ПП', label: 'ПП (Правая передняя)' },
  { id: 'ЛП', label: 'ЛП (Левая передняя)' },
  { id: 'ПЗ', label: 'ПЗ (Правая задняя)' },
  { id: 'ЛЗ', label: 'ЛЗ (Левая задняя)' },
] as const;

export const FAVORED_GAIT_LABEL = 'Бережет ногу';
export const FAVORED_LEG_OPTIONS = FEET_LIST.map((foot) => foot.id);

export const EYE_OPTIONS = ['Ясные', 'Прищур', 'Слезотечение', 'Отек век'] as const;
export const TRUNK_TONE_OPTIONS = ['Активный / поднятый', 'Пассивный ("плетью")'] as const;
export const BREATHING_OPTIONS = ['Чистое дыхание', 'Сопение / храп'] as const;
export const TRUNK_TIP_OPTIONS = ['Кончик в норме', 'Сухой кончик', 'Влажный кончик'] as const;
export const DISCHARGE_OPTIONS = ['Нет', 'Серозные', 'Гнойные', 'Пылевые пробки'] as const;
export const EAR_OPTIONS = ['Активный обмах', 'Уши прижаты'] as const;
export const TEMPORAL_OPTIONS = ['Сухие', 'Активная секреция'] as const;
export const FEED_CONSUMPTION_OPTIONS = ['Жадно', 'Норма', 'Вяло', 'Отказ'] as const;
export const GAIT_OPTIONS = ['Шаг уверенный', FAVORED_GAIT_LABEL, 'Шарканье'] as const;
export const HOOF_WARMTH_OPTIONS = ['Норма', 'Теплее обычного'] as const;
export const ARENA_REACTION_OPTIONS = ['Стабильная работа', 'Сопротивление', 'Возбудимость', 'Пугливость'] as const;
