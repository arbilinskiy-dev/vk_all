// Тесты типов EmojiData и EmojiCategory (compile-time проверки)
import { describe, it, expect } from 'vitest';
import type { EmojiData, EmojiCategory } from '../../features/emoji/data/types';

describe('Типы эмодзи (compile-time)', () => {
  it('объект, удовлетворяющий EmojiData, содержит char, name, keywords', () => {
    const emoji: EmojiData = {
      char: '🧪',
      name: 'Тестовая пробирка',
      keywords: ['тестовая', 'пробирка', 'test', 'tube'],
    };

    expect(typeof emoji.char).toBe('string');
    expect(typeof emoji.name).toBe('string');
    expect(Array.isArray(emoji.keywords)).toBe(true);
    expect(emoji.keywords.every((k) => typeof k === 'string')).toBe(true);
  });

  it('объект, удовлетворяющий EmojiCategory, содержит name, icon, emojis', () => {
    const category: EmojiCategory = {
      name: 'Тестовая категория',
      icon: '🧪',
      emojis: [
        { char: '⚗️', name: 'Алхимия', keywords: ['алхимия', 'alembic'] },
        { char: '🔬', name: 'Микроскоп', keywords: ['микроскоп', 'microscope'] },
      ],
    };

    expect(typeof category.name).toBe('string');
    expect(typeof category.icon).toBe('string');
    expect(Array.isArray(category.emojis)).toBe(true);
    expect(category.emojis).toHaveLength(2);
  });

  it('EmojiData.keywords — массив строк string[]', () => {
    const emoji: EmojiData = { char: '✅', name: 'Галочка', keywords: ['галочка', 'check'] };
    // Проверяем, что каждый элемент keywords — строка
    for (const kw of emoji.keywords) {
      expect(typeof kw).toBe('string');
    }
  });

  it('EmojiCategory.emojis — массив EmojiData[]', () => {
    const emoji1: EmojiData = { char: '🔴', name: 'Красный круг', keywords: ['красный'] };
    const emoji2: EmojiData = { char: '🔵', name: 'Синий круг', keywords: ['синий'] };
    const category: EmojiCategory = { name: 'Круги', icon: '⭕', emojis: [emoji1, emoji2] };

    for (const e of category.emojis) {
      expect(e).toHaveProperty('char');
      expect(e).toHaveProperty('name');
      expect(e).toHaveProperty('keywords');
    }
  });

  it('EmojiData можно создать с пустым массивом keywords', () => {
    const emoji: EmojiData = { char: '🆕', name: 'Новый', keywords: [] };
    expect(emoji.keywords).toHaveLength(0);
  });

  it('EmojiCategory можно создать с пустым массивом emojis', () => {
    const category: EmojiCategory = { name: 'Пустая', icon: '🫙', emojis: [] };
    expect(category.emojis).toHaveLength(0);
  });
});
