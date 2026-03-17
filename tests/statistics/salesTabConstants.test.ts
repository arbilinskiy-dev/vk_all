/**
 * Тесты salesTabConstants — типы, константы и хелпер-функции
 * для таба «Статистика продаж».
 */

import { describe, it, expect } from 'vitest';
import {
    COLUMN_GROUPS,
    PERIOD_PRESETS,
    MONTH_NAMES_SHORT,
    getAvailableYears,
    localDateStr,
} from '../../features/statistics/dlvry/salesTabConstants';

// =============================================================================
// COLUMN_GROUPS
// =============================================================================
describe('COLUMN_GROUPS', () => {
    it('содержит 6 групп колонок', () => {
        expect(COLUMN_GROUPS).toHaveLength(6);
    });

    it('первая группа — «Основное» (main)', () => {
        expect(COLUMN_GROUPS[0]).toEqual({ key: 'main', label: 'Основное' });
    });

    it('каждая группа имеет key и label', () => {
        for (const g of COLUMN_GROUPS) {
            expect(g).toHaveProperty('key');
            expect(g).toHaveProperty('label');
            expect(typeof g.key).toBe('string');
            expect(typeof g.label).toBe('string');
        }
    });

    it('содержит все ожидаемые ключи', () => {
        const keys = COLUMN_GROUPS.map(g => g.key);
        expect(keys).toEqual(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat']);
    });
});

// =============================================================================
// PERIOD_PRESETS
// =============================================================================
describe('PERIOD_PRESETS', () => {
    it('содержит 13 пресетов', () => {
        expect(PERIOD_PRESETS).toHaveLength(13);
    });

    it('первый пресет — «Всё время» (key=null)', () => {
        expect(PERIOD_PRESETS[0]).toEqual({ key: null, label: 'Всё время' });
    });

    it('последний пресет — «Свой период» (custom)', () => {
        expect(PERIOD_PRESETS[PERIOD_PRESETS.length - 1]).toEqual({ key: 'custom', label: 'Свой период' });
    });

    it('содержит пресет «По месяцам» (year_month)', () => {
        const ym = PERIOD_PRESETS.find(p => p.key === 'year_month');
        expect(ym).toBeDefined();
        expect(ym!.label).toBe('По месяцам');
    });

    it('каждый пресет имеет label', () => {
        for (const p of PERIOD_PRESETS) {
            expect(typeof p.label).toBe('string');
            expect(p.label.length).toBeGreaterThan(0);
        }
    });
});

// =============================================================================
// MONTH_NAMES_SHORT
// =============================================================================
describe('MONTH_NAMES_SHORT', () => {
    it('содержит 12 сокращённых названий месяцев', () => {
        expect(MONTH_NAMES_SHORT).toHaveLength(12);
    });

    it('начинается с «Янв», заканчивается «Дек»', () => {
        expect(MONTH_NAMES_SHORT[0]).toBe('Янв');
        expect(MONTH_NAMES_SHORT[11]).toBe('Дек');
    });
});

// =============================================================================
// getAvailableYears
// =============================================================================
describe('getAvailableYears', () => {
    it('возвращает массив годов', () => {
        const years = getAvailableYears();
        expect(Array.isArray(years)).toBe(true);
        expect(years.length).toBeGreaterThan(0);
    });

    it('первый элемент — текущий год', () => {
        const years = getAvailableYears();
        expect(years[0]).toBe(new Date().getFullYear());
    });

    it('последний элемент — 2017', () => {
        const years = getAvailableYears();
        expect(years[years.length - 1]).toBe(2017);
    });

    it('годы идут по убыванию', () => {
        const years = getAvailableYears();
        for (let i = 1; i < years.length; i++) {
            expect(years[i]).toBeLessThan(years[i - 1]);
        }
    });
});

// =============================================================================
// localDateStr
// =============================================================================
describe('localDateStr', () => {
    it('форматирует дату в YYYY-MM-DD', () => {
        const d = new Date(2026, 0, 5); // 5 января 2026
        expect(localDateStr(d)).toBe('2026-01-05');
    });

    it('добавляет ведущий ноль к месяцу и дню', () => {
        const d = new Date(2025, 2, 9); // 9 марта 2025
        expect(localDateStr(d)).toBe('2025-03-09');
    });

    it('корректно форматирует конец года', () => {
        const d = new Date(2025, 11, 31); // 31 декабря 2025
        expect(localDateStr(d)).toBe('2025-12-31');
    });

    it('не сдвигает дату из-за UTC', () => {
        // localDateStr работает с локальным временем, без UTC
        const d = new Date(2026, 5, 15); // 15 июня 2026
        expect(localDateStr(d)).toBe('2026-06-15');
    });

    it('корректно форматирует 1 января', () => {
        const d = new Date(2026, 0, 1);
        expect(localDateStr(d)).toBe('2026-01-01');
    });
});
