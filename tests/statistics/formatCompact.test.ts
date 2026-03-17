/**
 * Тесты formatCompact из dlvryFormatUtils.
 * Проверяем форматирование: тысячи, миллионы, малые числа, граничные значения.
 */

import { describe, it, expect } from 'vitest';
import { formatCompact } from '../../features/statistics/dlvry/dlvryFormatUtils';

describe('formatCompact', () => {
    it('числа < 1000 — без сокращений', () => {
        expect(formatCompact(0)).toBe('0');
        expect(formatCompact(1)).toBe('1');
        expect(formatCompact(999)).toBe('999');
        expect(formatCompact(500)).toBe('500');
    });

    it('тысячи — "X тыс."', () => {
        expect(formatCompact(1_000)).toBe('1 тыс.');
        expect(formatCompact(1_500)).toBe('2 тыс.'); // округление вверх
        expect(formatCompact(50_000)).toBe('50 тыс.');
        // 999_999 → 1000 тыс. (Intl может вставить неразрывный пробел)
        const result = formatCompact(999_999);
        expect(result).toContain('000');
        expect(result).toContain('тыс.');
    });

    it('миллионы — "X,XX млн"', () => {
        expect(formatCompact(1_000_000)).toBe('1 млн');
        expect(formatCompact(2_560_000)).toBe('2,56 млн');
        expect(formatCompact(10_000_000)).toBe('10 млн');
    });

    it('ровные миллионы — без дробной части', () => {
        expect(formatCompact(3_000_000)).toBe('3 млн');
        expect(formatCompact(5_000_000)).toBe('5 млн');
    });

    it('дробные миллионы — с запятой', () => {
        expect(formatCompact(1_234_567)).toBe('1,23 млн');
        expect(formatCompact(6_960_000)).toBe('6,96 млн');
    });

    it('граница: ровно 1000', () => {
        expect(formatCompact(1_000)).toBe('1 тыс.');
    });

    it('граница: ровно 1 000 000', () => {
        expect(formatCompact(1_000_000)).toBe('1 млн');
    });
});
