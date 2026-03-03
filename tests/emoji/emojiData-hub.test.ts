// Тесты хаба emojiData.ts — реэкспорт типов и сборка массива категорий
import { describe, it, expect } from 'vitest';
import { emojiCategories } from '../../features/emoji/data/emojiData';
import type { EmojiData, EmojiCategory } from '../../features/emoji/data/emojiData';

// Ожидаемые имена категорий в правильном порядке
const EXPECTED_CATEGORY_NAMES = [
  'Эмоции',
  'Люди и тело',
  'Животные и природа',
  'Еда и напитки',
  'Путешествия и места',
  'Активности',
  'Предметы',
  'Символы',
  'Флаги',
];

describe('emojiData хаб', () => {
  it('emojiCategories — массив из 9 категорий', () => {
    expect(Array.isArray(emojiCategories)).toBe(true);
    expect(emojiCategories).toHaveLength(9);
  });

  it('каждая категория имеет поля name, icon, emojis', () => {
    for (const category of emojiCategories) {
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('emojis');
    }
  });

  it('каждая категория содержит непустой массив emojis', () => {
    for (const category of emojiCategories) {
      expect(Array.isArray(category.emojis)).toBe(true);
      expect(category.emojis.length).toBeGreaterThan(0);
    }
  });

  it('каждый эмодзи имеет поля char, name, keywords', () => {
    for (const category of emojiCategories) {
      for (const emoji of category.emojis) {
        expect(emoji).toHaveProperty('char');
        expect(emoji).toHaveProperty('name');
        expect(emoji).toHaveProperty('keywords');
      }
    }
  });

  it('char — непустая строка для каждого эмодзи', () => {
    for (const category of emojiCategories) {
      for (const emoji of category.emojis) {
        expect(typeof emoji.char).toBe('string');
        expect(emoji.char.length).toBeGreaterThan(0);
      }
    }
  });

  it('name — непустая строка для каждого эмодзи', () => {
    for (const category of emojiCategories) {
      for (const emoji of category.emojis) {
        expect(typeof emoji.name).toBe('string');
        expect(emoji.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('keywords — массив строк для каждого эмодзи', () => {
    for (const category of emojiCategories) {
      for (const emoji of category.emojis) {
        expect(Array.isArray(emoji.keywords)).toBe(true);
        for (const kw of emoji.keywords) {
          expect(typeof kw).toBe('string');
        }
      }
    }
  });

  it('имена категорий совпадают с ожидаемыми', () => {
    const names = emojiCategories.map((c) => c.name);
    expect(names).toEqual(EXPECTED_CATEGORY_NAMES);
  });

  it('icon — непустая строка у каждой категории', () => {
    for (const category of emojiCategories) {
      expect(typeof category.icon).toBe('string');
      expect(category.icon.length).toBeGreaterThan(0);
    }
  });

  it('общее количество эмодзи > 1500', () => {
    const total = emojiCategories.reduce((sum, c) => sum + c.emojis.length, 0);
    expect(total).toBeGreaterThan(1500);
  });

  it('нет дубликатов char внутри одной категории', () => {
    for (const category of emojiCategories) {
      const chars = category.emojis.map((e) => e.char);
      const unique = new Set(chars);
      expect(unique.size).toBe(chars.length);
    }
  });

  it('нет дубликатов char между всеми категориями', () => {
    const allChars = emojiCategories.flatMap((c) => c.emojis.map((e) => e.char));
    const unique = new Set(allChars);
    expect(unique.size).toBe(allChars.length);
  });

  it('типы EmojiData и EmojiCategory реэкспортируются (compile-time проверка)', () => {
    // Если типы не реэкспортируются, этот файл не скомпилируется
    const testEmoji: EmojiData = { char: '🧪', name: 'Тест', keywords: ['тест'] };
    const testCategory: EmojiCategory = { name: 'Тестовая', icon: '🧪', emojis: [testEmoji] };
    expect(testEmoji.char).toBe('🧪');
    expect(testCategory.name).toBe('Тестовая');
  });
});
