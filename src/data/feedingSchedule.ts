import type { FeedingSlot } from '../types/shift';

/**
 * feedingSchedule — расписание кормлений и техкарты рационов.
 * Единый источник истины для FeedingSection и TimelineBar (экран «Слоны»).
 * Времена соответствуют регламенту кормокухни (7:00 / 13:00 / 17:00 / 19:00).
 */

export interface FeedingScheduleSlot {
  slot: FeedingSlot;
  time: string; // HH:MM
  title: string;
  description: string;
}

export const FEEDING_SCHEDULE: FeedingScheduleSlot[] = [
  {
    slot: 'breakfast',
    time: '07:00',
    title: 'Завтрак — утренние крупы',
    description: 'Запарка 100°C: геркулес, отруби, овёс. Строго горячая вода, сухие отруби запрещены.',
  },
  {
    slot: 'lunch',
    time: '13:00',
    title: 'Обед — спец-миксы',
    description: 'Коммерческие каши по техкарте слонихи. Дьявольский коготь — только здесь, со слизистым мэшем.',
  },
  {
    slot: 'snack',
    time: '17:00',
    title: 'Полдник — псиллиум и миксы',
    description: 'Псиллиум засыпать строго за 1 минуту до скармливания. Разведённый заранее — выбросить.',
  },
  {
    slot: 'dinner',
    time: '19:00',
    title: 'Ужин — сочные корма',
    description: 'Морковь, свёкла, тыква, кабачки. Контроль остатков сена к вечеру.',
  },
];

export interface RecipeIngredient {
  name: string;
  amount: string;
  note?: string;
}

export interface FeedingRecipe {
  elephantId: string;
  slot: FeedingSlot;
  temperature: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
}

/**
 * Нормы выдач по слонихам и слотам кормления.
 * Соответствуют техкартам RecipeBottomSheet (Прэтти — увеличенные нормы,
 * Одри — без кукурузы по вет-карте).
 */
const RECIPES: Record<string, Partial<Record<FeedingSlot, FeedingRecipe>>> = {
  margo: {
    breakfast: {
      elephantId: 'margo',
      slot: 'breakfast',
      temperature: '100°C',
      ingredients: [
        { name: 'Геркулес', amount: '1.0 кг' },
        { name: 'Отруби', amount: '1.0 кг' },
        { name: 'Овёс', amount: '0.5 кг' },
        { name: 'Кукуруза', amount: '300 г' },
        { name: 'Семечки', amount: '200 г' },
      ],
      instructions: 'Запарка кипятком 100°C, настоять. Добавить кальций кормовой.',
    },
    lunch: {
      elephantId: 'margo',
      slot: 'lunch',
      temperature: '—',
      ingredients: [{ name: 'ОптиФорм Микс Юниор', amount: '1.5 кг' }],
      instructions: 'Соль кормовая в водопой.',
    },
    snack: {
      elephantId: 'margo',
      slot: 'snack',
      temperature: '—',
      ingredients: [{ name: 'Псиллиум', amount: '1 уп.' }],
      instructions: 'Засыпать за 1 минуту до подачи.',
    },
    dinner: {
      elephantId: 'margo',
      slot: 'dinner',
      temperature: '—',
      ingredients: [
        { name: 'Морковь', amount: '5 кг' },
        { name: 'Свёкла', amount: '3.5 кг' },
      ],
    },
  },
  audrey: {
    breakfast: {
      elephantId: 'audrey',
      slot: 'breakfast',
      temperature: '100°C',
      ingredients: [
        { name: 'Геркулес', amount: '1.0 кг' },
        { name: 'Отруби', amount: '1.0 кг' },
        { name: 'Овёс', amount: '0.5 кг' },
        { name: 'Кукуруза', amount: 'ИСКЛЮЧЕНА ⚠️' },
        { name: 'Семечки', amount: '200 г' },
      ],
      instructions: 'Низкокрахмальный рацион ЖКТ. Кукуруза полностью исключена.',
    },
    lunch: {
      elephantId: 'audrey',
      slot: 'lunch',
      temperature: '—',
      ingredients: [{ name: 'Mono Grass', amount: '1.5 кг' }],
    },
    snack: {
      elephantId: 'audrey',
      slot: 'snack',
      temperature: '—',
      ingredients: [{ name: 'Псиллиум', amount: '1 уп.' }],
    },
    dinner: {
      elephantId: 'audrey',
      slot: 'dinner',
      temperature: '—',
      ingredients: [
        { name: 'Морковь', amount: '5 кг' },
        { name: 'Яблоки', amount: '1.5 кг' },
      ],
    },
  },
  pretty: {
    breakfast: {
      elephantId: 'pretty',
      slot: 'breakfast',
      temperature: '100°C',
      ingredients: [
        { name: 'Геркулес', amount: '2.0 кг' },
        { name: 'Отруби', amount: '2.0 кг' },
        { name: 'Овёс', amount: '1.0 кг' },
        { name: 'Кукуруза', amount: '300 г' },
        { name: 'Семечки', amount: '300 г' },
      ],
      instructions: 'Хондро + МСМ — протекция суставов задних конечностей.',
    },
    lunch: {
      elephantId: 'pretty',
      slot: 'lunch',
      temperature: '—',
      ingredients: [{ name: 'ФормаМакс Каша', amount: '2 кг' }],
      instructions: 'Дьявольский коготь — только в обед со слизистым мэшем.',
    },
    snack: {
      elephantId: 'pretty',
      slot: 'snack',
      temperature: '—',
      ingredients: [{ name: 'ФормаМакс Каша', amount: '2 кг' }],
    },
    dinner: {
      elephantId: 'pretty',
      slot: 'dinner',
      temperature: '—',
      ingredients: [
        { name: 'Морковь', amount: '5 кг' },
        { name: 'Тыква', amount: '2 кг' },
      ],
    },
  },
};

/** Вернуть техкарту-рецепт для слона и слота кормления (или null). */
export function getRecipeForElephant(elephantId: string, slot: FeedingSlot): FeedingRecipe | null {
  return RECIPES[elephantId]?.[slot] ?? null;
}
