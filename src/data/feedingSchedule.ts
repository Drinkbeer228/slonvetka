import type { FeedingSlot } from '../types/shift';

/**
 * Расписание кормлений слонов на день.
 * Каждый слот содержит время, название, описание и рецепт.
 */

export interface FeedingScheduleSlot {
  slot: FeedingSlot;
  time: string;        // HH:MM
  title: string;
  description: string;
}

export interface FeedingRecipe {
  elephantId: string;
  elephantName: string;
  slot: FeedingSlot;
  ingredients: { name: string; amount: string; note?: string }[];
  temperature: string;
  instructions: string;
}

/** 4 слота кормления в день */
export const FEEDING_SCHEDULE: FeedingScheduleSlot[] = [
  {
    slot: 'breakfast',
    time: '07:00',
    title: 'Утренняя каша (запарка)',
    description: 'Горячая запарка зерносмеси с добавками. Строго по тазам, t° подачи 38–42°C.',
  },
  {
    slot: 'lunch',
    time: '13:00',
    title: 'Обед (овощи + концентраты)',
    description: 'Морковь, свёкла, яблоки + концентраты по норме.',
  },
  {
    slot: 'snack',
    time: '17:00',
    title: 'Полдник (фрукты + лакомства)',
    description: 'Бананы, арбуз (сезонно), тыква. Добавки: Дьявольский коготь только с плотной пищей!',
  },
  {
    slot: 'dinner',
    time: '19:00',
    title: 'Ужин / Ночное сено',
    description: 'Сено тимофеевки или луговое, ветки ивы. Подвес на высоте 2.5м.',
  },
];

/** Рецепты-техкарты по слонихам */
export const FEEDING_RECIPES: FeedingRecipe[] = [
  // ═══ МАРГО ═══
  {
    elephantId: 'margo',
    elephantName: 'Марго',
    slot: 'breakfast',
    temperature: '38–42°C',
    instructions: 'Запарить 60–70°C водой, настоять 30–40 мин под крышкой. Добавки вносить в остывшую кашу (<40°C).',
    ingredients: [
      { name: 'Геркулес хлопья', amount: '2.5 кг' },
      { name: 'Отруби пшеничные', amount: '1.5 кг' },
      { name: 'Льняной жмых', amount: '0.5 кг' },
      { name: 'ФормаМакс Каша', amount: '1.0 кг', note: 'Готовый премикс' },
      { name: 'Кормовая соль', amount: '30 г', note: 'В остывшую кашу' },
      { name: 'Витаминный премикс', amount: '50 г', note: 'В остывшую кашу' },
    ],
  },
  {
    elephantId: 'margo',
    elephantName: 'Марго',
    slot: 'lunch',
    temperature: 'Комнатная',
    instructions: 'Нарезать морковь и свёклу крупными кусками. Яблоки целиком или половинками.',
    ingredients: [
      { name: 'Морковь', amount: '8 кг' },
      { name: 'Свёкла', amount: '3 кг' },
      { name: 'Яблоки', amount: '5 кг' },
      { name: 'Кабачки', amount: '3 кг', note: 'Сезонно' },
      { name: 'Овёс плющеный', amount: '1.5 кг' },
    ],
  },
  {
    elephantId: 'margo',
    elephantName: 'Марго',
    slot: 'snack',
    temperature: 'Комнатная',
    instructions: 'Фрукты и лакомства. Дьявольский коготь только с плотной порцией — не натощак!',
    ingredients: [
      { name: 'Бананы', amount: '3 кг' },
      { name: 'Арбуз', amount: '5 кг', note: 'Сезонно' },
      { name: 'Тыква', amount: '3 кг' },
    ],
  },
  {
    elephantId: 'margo',
    elephantName: 'Марго',
    slot: 'dinner',
    temperature: '—',
    instructions: 'Сено подвешивать на высоте от 2.5 м для стимуляции хобота. Ветки ивы свежие.',
    ingredients: [
      { name: 'Сено тимофеевки', amount: '1 тюк' },
      { name: 'Сено луговое', amount: '1 тюк' },
      { name: 'Ветки ивы', amount: '2 шт' },
    ],
  },

  // ═══ ОДРИ ═══
  {
    elephantId: 'audrey',
    elephantName: 'Одри',
    slot: 'breakfast',
    temperature: '38–42°C',
    instructions: 'Одри — контроль аппетита! Фиксировать поедаемость каши без остатка.',
    ingredients: [
      { name: 'Геркулес хлопья', amount: '2.0 кг' },
      { name: 'Отруби пшеничные', amount: '1.0 кг' },
      { name: 'Льняной жмых', amount: '0.5 кг' },
      { name: 'ОптиФорм Микс Юниор', amount: '0.8 кг' },
      { name: 'Кормовая соль', amount: '25 г', note: 'В остывшую кашу' },
      { name: 'Кальций / Связки', amount: '40 г', note: 'В остывшую кашу' },
    ],
  },
  {
    elephantId: 'audrey',
    elephantName: 'Одри',
    slot: 'lunch',
    temperature: 'Комнатная',
    instructions: 'Стандартная овощная раздача. Отслеживать, ест ли Одри всё или выбирает.',
    ingredients: [
      { name: 'Морковь', amount: '7 кг' },
      { name: 'Свёкла', amount: '2 кг' },
      { name: 'Яблоки', amount: '4 кг' },
      { name: 'Овёс плющеный', amount: '1.0 кг' },
    ],
  },
  {
    elephantId: 'audrey',
    elephantName: 'Одри',
    slot: 'snack',
    temperature: 'Комнатная',
    instructions: 'Фрукты. Тыква нравится — давать в первую очередь.',
    ingredients: [
      { name: 'Бананы', amount: '2 кг' },
      { name: 'Тыква', amount: '4 кг' },
      { name: 'Арбуз', amount: '3 кг', note: 'Сезонно' },
    ],
  },
  {
    elephantId: 'audrey',
    elephantName: 'Одри',
    slot: 'dinner',
    temperature: '—',
    instructions: 'Ночной фураж. Следить за поеданием — утром проверить остатки.',
    ingredients: [
      { name: 'Сено луговое', amount: '2 тюка' },
      { name: 'Ветки ивы', amount: '1 шт' },
      { name: 'Бамбук', amount: '1 шт', note: 'При наличии' },
    ],
  },

  // ═══ ПРЭТТИ ═══
  {
    elephantId: 'pretty',
    elephantName: 'Прэтти',
    slot: 'breakfast',
    temperature: '38–42°C',
    instructions: 'Прэтти ест охотно. Стандартная порция, добавки по протоколу.',
    ingredients: [
      { name: 'Геркулес хлопья', amount: '2.5 кг' },
      { name: 'Отруби пшеничные', amount: '1.5 кг' },
      { name: 'Mono Grass', amount: '1.0 кг' },
      { name: 'Свекловичный жом', amount: '0.5 кг' },
      { name: 'Кормовая соль', amount: '30 г', note: 'В остывшую кашу' },
      { name: 'Витаминный премикс', amount: '50 г', note: 'В остывшую кашу' },
    ],
  },
  {
    elephantId: 'pretty',
    elephantName: 'Прэтти',
    slot: 'lunch',
    temperature: 'Комнатная',
    instructions: 'Стандартная овощная раздача.',
    ingredients: [
      { name: 'Морковь', amount: '8 кг' },
      { name: 'Свёкла', amount: '3 кг' },
      { name: 'Яблоки', amount: '5 кг' },
      { name: 'Кабачки', amount: '2 кг' },
      { name: 'Ячмень плющеный', amount: '1.5 кг' },
    ],
  },
  {
    elephantId: 'pretty',
    elephantName: 'Прэтти',
    slot: 'snack',
    temperature: 'Комнатная',
    instructions: 'Любит бананы. Арбуз давать после основной порции.',
    ingredients: [
      { name: 'Бананы', amount: '3 кг' },
      { name: 'Арбуз', amount: '5 кг', note: 'Сезонно' },
      { name: 'Семечки подсолн.', amount: '0.3 кг', note: 'Лакомство' },
    ],
  },
  {
    elephantId: 'pretty',
    elephantName: 'Прэтти',
    slot: 'dinner',
    temperature: '—',
    instructions: 'Ночной фураж + ветки. Подвес на высоте для стимуляции.',
    ingredients: [
      { name: 'Сено тимофеевки', amount: '1 тюк' },
      { name: 'Сено луговое', amount: '1 тюк' },
      { name: 'Ветки ивы', amount: '2 шт' },
      { name: 'Хвоя / Лапник', amount: '1 шт', note: 'При наличии' },
    ],
  },
];

/**
 * Определяет текущий слот кормления по текущему времени.
 * Возвращает ближайший предстоящий или текущий слот.
 */
export function getCurrentFeedingSlot(): FeedingScheduleSlot {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Ищем первый слот, время которого >= текущего
  for (const slot of FEEDING_SCHEDULE) {
    const [h, m] = slot.time.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    if (slotMinutes >= currentMinutes) {
      return slot;
    }
  }

  // Если все слоты прошли — показываем последний (ужин)
  return FEEDING_SCHEDULE[FEEDING_SCHEDULE.length - 1];
}

/**
 * Получает рецепт для конкретной слонихи и слота кормления.
 */
export function getRecipeForElephant(elephantId: string, slot: FeedingSlot): FeedingRecipe | undefined {
  return FEEDING_RECIPES.find(r => r.elephantId === elephantId && r.slot === slot);
}
