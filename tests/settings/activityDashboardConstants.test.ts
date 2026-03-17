/**
 * Тесты для констант activity-dashboard/constants.ts
 * Проверяем полноту маппингов и структуру.
 */

import { describe, it, expect } from 'vitest';
import {
    EVENT_LABELS,
    EVENT_COLORS,
    FALLBACK_COLOR,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    ACTION_LABELS,
    PERIOD_OPTIONS,
} from '../../features/users/components/activity-dashboard/constants';

describe('activity-dashboard constants', () => {
    // --- EVENT_LABELS ---
    it('EVENT_LABELS содержит все 5 типов событий', () => {
        const expectedKeys = ['login_success', 'login_failed', 'logout', 'timeout', 'force_logout'];
        expect(Object.keys(EVENT_LABELS)).toEqual(expect.arrayContaining(expectedKeys));
        expect(Object.keys(EVENT_LABELS)).toHaveLength(5);
    });

    it('EVENT_LABELS — все значения строки на русском', () => {
        for (const val of Object.values(EVENT_LABELS)) {
            expect(typeof val).toBe('string');
            expect(val.length).toBeGreaterThan(0);
        }
    });

    // --- EVENT_COLORS ---
    it('EVENT_COLORS содержит stroke и bg для каждого типа', () => {
        for (const key of Object.keys(EVENT_LABELS)) {
            expect(EVENT_COLORS[key]).toBeDefined();
            expect(EVENT_COLORS[key].stroke).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(EVENT_COLORS[key].bg).toMatch(/^bg-/);
        }
    });

    it('FALLBACK_COLOR имеет stroke и bg', () => {
        expect(FALLBACK_COLOR.stroke).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(FALLBACK_COLOR.bg).toMatch(/^bg-/);
    });

    // --- CATEGORY_LABELS ---
    it('CATEGORY_LABELS содержит все 6 категорий', () => {
        const expectedKeys = ['posts', 'messages', 'ai', 'market', 'automations', 'settings'];
        expect(Object.keys(CATEGORY_LABELS)).toEqual(expect.arrayContaining(expectedKeys));
        expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6);
    });

    // --- CATEGORY_COLORS ---
    it('CATEGORY_COLORS содержит hex-цвет для каждой категории', () => {
        for (const key of Object.keys(CATEGORY_LABELS)) {
            expect(CATEGORY_COLORS[key]).toBeDefined();
            expect(CATEGORY_COLORS[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
    });

    // --- ACTION_LABELS ---
    it('ACTION_LABELS содержит >10 типов действий', () => {
        expect(Object.keys(ACTION_LABELS).length).toBeGreaterThan(10);
    });

    it('ACTION_LABELS — все значения непустые строки', () => {
        for (const val of Object.values(ACTION_LABELS)) {
            expect(typeof val).toBe('string');
            expect(val.length).toBeGreaterThan(0);
        }
    });

    // --- PERIOD_OPTIONS ---
    it('PERIOD_OPTIONS содержит 4 периода', () => {
        expect(PERIOD_OPTIONS).toHaveLength(4);
    });

    it('PERIOD_OPTIONS — каждый имеет label и числовой value', () => {
        for (const p of PERIOD_OPTIONS) {
            expect(typeof p.label).toBe('string');
            expect(typeof p.value).toBe('number');
            expect(p.value).toBeGreaterThan(0);
        }
    });

    it('PERIOD_OPTIONS — значения по возрастанию', () => {
        const values = PERIOD_OPTIONS.map(p => p.value);
        for (let i = 1; i < values.length; i++) {
            expect(values[i]).toBeGreaterThan(values[i - 1]);
        }
    });
});
