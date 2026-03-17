/**
 * Тесты: amAnalysisConstants — константы для АМ-анализа.
 * Проверяем: PERIOD_OPTIONS, GROUP_COLORS.
 */

import { describe, it, expect } from 'vitest';
import { PERIOD_OPTIONS, GROUP_COLORS } from '../../features/messages/components/stats/amAnalysisConstants';

describe('amAnalysisConstants', () => {

    // === PERIOD_OPTIONS ===

    describe('PERIOD_OPTIONS', () => {
        it('содержит 4 варианта периода', () => {
            expect(PERIOD_OPTIONS).toHaveLength(4);
        });

        it('каждый вариант имеет label и value', () => {
            for (const opt of PERIOD_OPTIONS) {
                expect(opt).toHaveProperty('label');
                expect(opt).toHaveProperty('value');
                expect(typeof opt.label).toBe('string');
                expect(typeof opt.value).toBe('number');
            }
        });

        it('содержит стандартные периоды: 7, 14, 30, 90', () => {
            const values = PERIOD_OPTIONS.map(o => o.value);
            expect(values).toEqual([7, 14, 30, 90]);
        });

        it('лейблы содержат слово «дней»', () => {
            for (const opt of PERIOD_OPTIONS) {
                expect(opt.label).toMatch(/дней/);
            }
        });
    });

    // === GROUP_COLORS ===

    describe('GROUP_COLORS', () => {
        it('содержит 5 групп действий', () => {
            expect(Object.keys(GROUP_COLORS)).toHaveLength(5);
        });

        it('содержит все обязательные группы', () => {
            const expectedGroups = ['dialogs', 'messages', 'labels', 'templates', 'promocodes'];
            for (const group of expectedGroups) {
                expect(GROUP_COLORS).toHaveProperty(group);
            }
        });

        it('все цвета — валидные HEX', () => {
            const hexRegex = /^#[0-9a-fA-F]{6}$/;
            for (const color of Object.values(GROUP_COLORS)) {
                expect(color).toMatch(hexRegex);
            }
        });

        it('все цвета уникальны', () => {
            const colors = Object.values(GROUP_COLORS);
            const unique = new Set(colors);
            expect(unique.size).toBe(colors.length);
        });
    });
});
