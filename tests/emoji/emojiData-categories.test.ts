// Тесты каждой категории эмодзи по отдельности
import { describe, it, expect } from 'vitest';
import type { EmojiCategory } from '../../features/emoji/data/types';
import { emotionsCategory } from '../../features/emoji/data/emotionsEmojis';
import { peopleCategory } from '../../features/emoji/data/peopleEmojis';
import { animalsCategory } from '../../features/emoji/data/animalsEmojis';
import { foodCategory } from '../../features/emoji/data/foodEmojis';
import { travelCategory } from '../../features/emoji/data/travelEmojis';
import { activitiesCategory } from '../../features/emoji/data/activitiesEmojis';
import { objectsCategory } from '../../features/emoji/data/objectsEmojis';
import { symbolsCategory } from '../../features/emoji/data/symbolsEmojis';
import { flagsCategory } from '../../features/emoji/data/flagsEmojis';

// Описание каждой категории: экспортируемая константа, ожидаемое имя, ожидаемый icon
const categories: { constant: EmojiCategory; exportName: string; expectedName: string; expectedIcon: string }[] = [
  { constant: emotionsCategory, exportName: 'emotionsCategory', expectedName: 'Эмоции', expectedIcon: '😊' },
  { constant: peopleCategory, exportName: 'peopleCategory', expectedName: 'Люди и тело', expectedIcon: '🤚' },
  { constant: animalsCategory, exportName: 'animalsCategory', expectedName: 'Животные и природа', expectedIcon: '🐶' },
  { constant: foodCategory, exportName: 'foodCategory', expectedName: 'Еда и напитки', expectedIcon: '🍔' },
  { constant: travelCategory, exportName: 'travelCategory', expectedName: 'Путешествия и места', expectedIcon: '✈️' },
  { constant: activitiesCategory, exportName: 'activitiesCategory', expectedName: 'Активности', expectedIcon: '⚽' },
  { constant: objectsCategory, exportName: 'objectsCategory', expectedName: 'Предметы', expectedIcon: '💡' },
  { constant: symbolsCategory, exportName: 'symbolsCategory', expectedName: 'Символы', expectedIcon: '❤️' },
  { constant: flagsCategory, exportName: 'flagsCategory', expectedName: 'Флаги', expectedIcon: '🏳️' },
];

describe('Категории эмодзи — индивидуальные тесты', () => {
  for (const { constant, exportName, expectedName, expectedIcon } of categories) {
    describe(exportName, () => {
      it('экспортирует определённую константу', () => {
        expect(constant).toBeDefined();
      });

      it(`name = "${expectedName}"`, () => {
        expect(constant.name).toBe(expectedName);
      });

      it(`icon = "${expectedIcon}"`, () => {
        expect(constant.icon).toBe(expectedIcon);
      });

      it('emojis — непустой массив', () => {
        expect(Array.isArray(constant.emojis)).toBe(true);
        expect(constant.emojis.length).toBeGreaterThan(0);
      });

      it('каждый элемент emojis имеет char, name, keywords', () => {
        for (const emoji of constant.emojis) {
          expect(typeof emoji.char).toBe('string');
          expect(emoji.char.length).toBeGreaterThan(0);
          expect(typeof emoji.name).toBe('string');
          expect(emoji.name.length).toBeGreaterThan(0);
          expect(Array.isArray(emoji.keywords)).toBe(true);
        }
      });

      it('количество эмодзи > 0', () => {
        expect(constant.emojis.length).toBeGreaterThan(0);
      });
    });
  }
});
