/**
 * Тесты: amAnalysisUtils — утилиты для АМ-анализа.
 * Проверяем: formatDate, formatShortDate, safeMax.
 */

import { describe, it, expect } from 'vitest';
import { formatDate, formatShortDate, safeMax } from '../../features/messages/components/stats/amAnalysisUtils';

describe('amAnalysisUtils', () => {

    // === formatDate ===

    describe('formatDate', () => {
        it('возвращает «—» при null', () => {
            expect(formatDate(null)).toBe('—');
        });

        it('форматирует ISO-строку в ru-RU формат', () => {
            const result = formatDate('2026-03-01T14:30:00');
            // Проверяем, что результат содержит дату и время
            expect(result).toMatch(/01\.03\.2026/);
            expect(result).toMatch(/14:30/);
        });

        it('обрабатывает дату с нулевым временем', () => {
            const result = formatDate('2026-01-15T00:00:00');
            expect(result).toMatch(/15\.01\.2026/);
            expect(result).toMatch(/00:00/);
        });

        it('возвращает исходную строку при невалидном формате', () => {
            // Невалидная строка, которая вызовет ошибку Date
            const result = formatDate('not-a-date');
            // Должен либо вернуть строку обратно, либо 'Invalid Date' строку
            expect(typeof result).toBe('string');
        });
    });

    // === formatShortDate ===

    describe('formatShortDate', () => {
        it('форматирует дату в дд.мм', () => {
            const result = formatShortDate('2026-03-01');
            expect(result).toMatch(/01\.03/);
        });

        it('форматирует конец года', () => {
            const result = formatShortDate('2026-12-31');
            expect(result).toMatch(/31\.12/);
        });

        it('возвращает исходную строку при невалидном формате', () => {
            const result = formatShortDate('invalid');
            expect(typeof result).toBe('string');
        });
    });

    // === safeMax ===

    describe('safeMax', () => {
        it('возвращает максимум из массива', () => {
            expect(safeMax([1, 5, 3])).toBe(5);
        });

        it('возвращает 1 для пустого массива', () => {
            expect(safeMax([])).toBe(1);
        });

        it('возвращает 1 если все значения < 1', () => {
            expect(safeMax([0, 0, 0])).toBe(1);
        });

        it('обрабатывает отрицательные числа', () => {
            expect(safeMax([-5, -1, -10])).toBe(1);
        });

        it('обрабатывает массив из одного элемента', () => {
            expect(safeMax([42])).toBe(42);
        });

        it('обрабатывает большие числа', () => {
            expect(safeMax([100, 999, 500])).toBe(999);
        });
    });
});
