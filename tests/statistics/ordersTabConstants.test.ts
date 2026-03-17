/**
 * Тесты ordersTabConstants — типы, константы и хелпер-функции
 * для переключаемых групп колонок таба «Заказы».
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ORDER_COLUMN_GROUPS,
    ORDERS_COL_GROUPS_STORAGE_KEY,
    loadOrderColGroups,
    saveOrderColGroups,
    type OrderColGroup,
} from '../../features/statistics/dlvry/ordersTabConstants';

// =============================================================================
// ORDER_COLUMN_GROUPS
// =============================================================================
describe('ORDER_COLUMN_GROUPS', () => {
    it('содержит 3 группы колонок', () => {
        expect(ORDER_COLUMN_GROUPS).toHaveLength(3);
    });

    it('каждая группа имеет key, label и icon', () => {
        for (const g of ORDER_COLUMN_GROUPS) {
            expect(g).toHaveProperty('key');
            expect(g).toHaveProperty('label');
            expect(g).toHaveProperty('icon');
            expect(typeof g.key).toBe('string');
            expect(typeof g.label).toBe('string');
            expect(typeof g.icon).toBe('string');
        }
    });

    it('содержит все ожидаемые ключи в правильном порядке', () => {
        const keys = ORDER_COLUMN_GROUPS.map(g => g.key);
        expect(keys).toEqual(['finance', 'client', 'extra']);
    });

    it('первая группа — «Финансы» (finance)', () => {
        expect(ORDER_COLUMN_GROUPS[0].key).toBe('finance');
        expect(ORDER_COLUMN_GROUPS[0].label).toBe('Финансы');
    });

    it('вторая группа — «Клиент / VK» (client)', () => {
        expect(ORDER_COLUMN_GROUPS[1].key).toBe('client');
        expect(ORDER_COLUMN_GROUPS[1].label).toBe('Клиент / VK');
    });

    it('третья группа — «Дополнительно» (extra)', () => {
        expect(ORDER_COLUMN_GROUPS[2].key).toBe('extra');
        expect(ORDER_COLUMN_GROUPS[2].label).toBe('Дополнительно');
    });
});

// =============================================================================
// ORDERS_COL_GROUPS_STORAGE_KEY
// =============================================================================
describe('ORDERS_COL_GROUPS_STORAGE_KEY', () => {
    it('ключ localStorage определён', () => {
        expect(ORDERS_COL_GROUPS_STORAGE_KEY).toBe('dlvry_orders_col_groups');
    });
});

// =============================================================================
// loadOrderColGroups / saveOrderColGroups
// =============================================================================
describe('loadOrderColGroups', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('возвращает пустой Set если localStorage пуст', () => {
        const groups = loadOrderColGroups();
        expect(groups).toBeInstanceOf(Set);
        expect(groups.size).toBe(0);
    });

    it('загружает сохранённые группы из localStorage', () => {
        localStorage.setItem(ORDERS_COL_GROUPS_STORAGE_KEY, JSON.stringify(['finance', 'client']));

        const groups = loadOrderColGroups();
        expect(groups.size).toBe(2);
        expect(groups.has('finance')).toBe(true);
        expect(groups.has('client')).toBe(true);
        expect(groups.has('extra')).toBe(false);
    });

    it('возвращает пустой Set при невалидном JSON', () => {
        localStorage.setItem(ORDERS_COL_GROUPS_STORAGE_KEY, 'INVALID JSON!!!');

        const groups = loadOrderColGroups();
        expect(groups.size).toBe(0);
    });

    it('загружает одну группу', () => {
        localStorage.setItem(ORDERS_COL_GROUPS_STORAGE_KEY, JSON.stringify(['extra']));

        const groups = loadOrderColGroups();
        expect(groups.size).toBe(1);
        expect(groups.has('extra')).toBe(true);
    });
});

describe('saveOrderColGroups', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('сохраняет группы в localStorage', () => {
        const groups = new Set<OrderColGroup>(['finance', 'extra']);
        saveOrderColGroups(groups);

        const raw = localStorage.getItem(ORDERS_COL_GROUPS_STORAGE_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed).toContain('finance');
        expect(parsed).toContain('extra');
        expect(parsed).toHaveLength(2);
    });

    it('сохраняет пустой набор', () => {
        saveOrderColGroups(new Set<OrderColGroup>());

        const raw = localStorage.getItem(ORDERS_COL_GROUPS_STORAGE_KEY);
        expect(raw).toBe('[]');
    });

    it('roundtrip: save → load возвращает те же группы', () => {
        const original = new Set<OrderColGroup>(['finance', 'client', 'extra']);
        saveOrderColGroups(original);

        const loaded = loadOrderColGroups();
        expect(loaded.size).toBe(3);
        expect(loaded.has('finance')).toBe(true);
        expect(loaded.has('client')).toBe(true);
        expect(loaded.has('extra')).toBe(true);
    });
});
