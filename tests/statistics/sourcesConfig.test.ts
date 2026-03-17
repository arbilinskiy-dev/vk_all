/**
 * Тесты sourcesConfig — проверяем целостность конфигурации источников.
 * Гарантируем, что после декомпозиции массив SOURCES не потерял элементы и свойства.
 */

import { describe, it, expect } from 'vitest';
import { SOURCES } from '../../features/statistics/dlvry/sourcesConfig';

describe('sourcesConfig — SOURCES[]', () => {
    it('содержит ровно 4 источника', () => {
        expect(SOURCES).toHaveLength(4);
    });

    it('ключи источников: vkapp, site, ios, android', () => {
        const keys = SOURCES.map(s => s.key);
        expect(keys).toEqual(['vkapp', 'site', 'ios', 'android']);
    });

    it('у каждого источника есть label', () => {
        SOURCES.forEach(src => {
            expect(src.label).toBeTruthy();
            expect(typeof src.label).toBe('string');
        });
    });

    it('у каждого источника есть SVG-иконка (React-элемент)', () => {
        SOURCES.forEach(src => {
            expect(src.icon).toBeDefined();
            // React-элемент — объект с $$typeof
            expect(typeof src.icon).toBe('object');
        });
    });

    it('у каждого источника заполнены все Tailwind-классы', () => {
        const requiredFields = [
            'color', 'numberClass', 'iconClass', 'iconBgClass',
            'hoverBorderClass', 'barClass', 'badgeBg', 'badgeText', 'dotClass',
        ] as const;

        SOURCES.forEach(src => {
            requiredFields.forEach(field => {
                expect(src[field], `${src.key}.${field}`).toBeTruthy();
            });
        });
    });

    it('color — валидный HEX-цвет', () => {
        SOURCES.forEach(src => {
            expect(src.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });
});
