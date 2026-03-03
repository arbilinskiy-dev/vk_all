// Хаб-файл: реэкспортирует типы и собирает все категории эмодзи
export type { EmojiData, EmojiCategory } from './types';

import type { EmojiCategory } from './types';
import { emotionsCategory } from './emotionsEmojis';
import { peopleCategory } from './peopleEmojis';
import { animalsCategory } from './animalsEmojis';
import { foodCategory } from './foodEmojis';
import { travelCategory } from './travelEmojis';
import { activitiesCategory } from './activitiesEmojis';
import { objectsCategory } from './objectsEmojis';
import { symbolsCategory } from './symbolsEmojis';
import { flagsCategory } from './flagsEmojis';

// Полный массив категорий (порядок соответствует оригиналу)
export const emojiCategories: EmojiCategory[] = [
  emotionsCategory,
  peopleCategory,
  animalsCategory,
  foodCategory,
  travelCategory,
  activitiesCategory,
  objectsCategory,
  symbolsCategory,
  flagsCategory,
];