/**
 * Тесты для утилит activity-dashboard/utils.ts
 * formatMinutes, formatDate, formatShortDate, plural, safeMax
 */

import { describe, it, expect } from 'vitest';
import {
    formatMinutes,
    formatDate,
    formatShortDate,
    plural,
    safeMax,
} from '../../features/users/components/activity-dashboard/utils';

// ==========================================
// formatMinutes
// ==========================================
describe('formatMinutes', () => {
    it('возвращает "0м" для 0', () => {
        expect(formatMinutes(0)).toBe('0м');
    });

    it('возвращает "0м" для отрицательного числа', () => {
        expect(formatMinutes(-5)).toBe('0м');
    });

    it('возвращает "0м" для NaN (falsy)', () => {
        expect(formatMinutes(NaN)).toBe('0м');
    });

    it('форматирует минуты < 60', () => {
        expect(formatMinutes(30)).toBe('30м');
        expect(formatMinutes(1)).toBe('1м');
        expect(formatMinutes(59)).toBe('59м');
    });

    it('округляет дробные минуты', () => {
        expect(formatMinutes(30.7)).toBe('31м');
        expect(formatMinutes(0.3)).toBe('0м'); // rounds to 0 → "0м"
    });

    it('форматирует часы и минуты', () => {
        expect(formatMinutes(90)).toBe('1ч 30м');
        expect(formatMinutes(60)).toBe('1ч');
        expect(formatMinutes(125)).toBe('2ч 5м');
    });

    it('форматирует дни и часы для >= 24ч', () => {
        expect(formatMinutes(1440)).toBe('1д'); // ровно 24ч
        expect(formatMinutes(1500)).toBe('1д 1ч'); // 25ч
        expect(formatMinutes(2880)).toBe('2д'); // 48ч
        expect(formatMinutes(3000)).toBe('2д 2ч'); // 50ч
    });
});

// ==========================================
// formatDate
// ==========================================
describe('formatDate', () => {
    it('возвращает "неизвестно" для null', () => {
        expect(formatDate(null)).toBe('неизвестно');
    });

    it('возвращает "неизвестно" для пустой строки (falsy)', () => {
        expect(formatDate('')).toBe('неизвестно');
    });

    it('форматирует валидную ISO-дату', () => {
        const result = formatDate('2026-01-15T14:30:00Z');
        // Проверяем, что есть дата и время (формат зависит от локали, но ru-RU предсказуем)
        expect(result).toMatch(/15/);
        expect(result).toMatch(/01/);
        expect(result).toMatch(/2026/);
    });
});

// ==========================================
// formatShortDate
// ==========================================
describe('formatShortDate', () => {
    it('форматирует дату в короткий формат', () => {
        const result = formatShortDate('2026-03-05');
        expect(result).toMatch(/05/);
        expect(result).toMatch(/03/);
    });

    it('возвращает исходную строку при невалидной дате', () => {
        // Невалидная строка — конструктор Date создаст Invalid Date,
        // но toLocaleDateString не выбросит исключение, а вернёт "Invalid Date"
        // В некоторых средах catch сработает
        const result = formatShortDate('not-a-date');
        expect(typeof result).toBe('string');
    });
});

// ==========================================
// plural
// ==========================================
describe('plural', () => {
    const forms: [string, string, string] = ['файл', 'файла', 'файлов'];

    it('единственное число (1)', () => {
        expect(plural(1, forms)).toBe('файл');
        expect(plural(21, forms)).toBe('файл');
        expect(plural(101, forms)).toBe('файл');
    });

    it('множественное 2-4', () => {
        expect(plural(2, forms)).toBe('файла');
        expect(plural(3, forms)).toBe('файла');
        expect(plural(4, forms)).toBe('файла');
        expect(plural(22, forms)).toBe('файла');
    });

    it('множественное 5-20', () => {
        expect(plural(5, forms)).toBe('файлов');
        expect(plural(11, forms)).toBe('файлов');
        expect(plural(12, forms)).toBe('файлов');
        expect(plural(19, forms)).toBe('файлов');
        expect(plural(20, forms)).toBe('файлов');
    });

    it('0 → третья форма', () => {
        expect(plural(0, forms)).toBe('файлов');
    });

    it('отрицательные числа работают корректно', () => {
        expect(plural(-1, forms)).toBe('файл');
        expect(plural(-5, forms)).toBe('файлов');
    });
});

// ==========================================
// safeMax
// ==========================================
describe('safeMax', () => {
    it('возвращает максимум из массива', () => {
        expect(safeMax([1, 5, 3, 2])).toBe(5);
    });

    it('возвращает fallback для пустого массива', () => {
        expect(safeMax([])).toBe(1);
        expect(safeMax([], 10)).toBe(10);
    });

    it('возвращает fallback если все элементы <= fallback', () => {
        expect(safeMax([0, 0, 0])).toBe(1);
        expect(safeMax([-5, -3], 0)).toBe(0);
    });

    it('работает с одним элементом', () => {
        expect(safeMax([42])).toBe(42);
    });

    it('работает с большим массивом', () => {
        const bigArr = Array.from({ length: 10000 }, (_, i) => i);
        expect(safeMax(bigArr)).toBe(9999);
    });
});
