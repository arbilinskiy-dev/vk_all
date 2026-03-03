// Тесты типов — runtime-проверка структуры TocItem

import { describe, it, expect } from 'vitest';
import type { TocItem } from '../../features/training2/data/types';
import { toc } from '../../features/training2/data/tocData';

// ────────────────────────────────────────────────────────────────
// Вспомогательные функции для runtime-валидации типа TocItem
// ────────────────────────────────────────────────────────────────

/**
 * Проверяет, что объект соответствует интерфейсу TocItem в runtime.
 * Возвращает true если объект валидный, иначе строку с описанием ошибки.
 */
function validateTocItem(obj: unknown, prefix = 'root'): true | string {
    if (typeof obj !== 'object' || obj === null) {
        return `${prefix}: ожидается объект, получено ${typeof obj}`;
    }

    const item = obj as Record<string, unknown>;

    // Обязательное поле title
    if (!('title' in item)) {
        return `${prefix}: отсутствует обязательное поле "title"`;
    }
    if (typeof item.title !== 'string') {
        return `${prefix}: поле "title" должно быть строкой, получено ${typeof item.title}`;
    }

    // Обязательное поле path
    if (!('path' in item)) {
        return `${prefix}: отсутствует обязательное поле "path"`;
    }
    if (typeof item.path !== 'string') {
        return `${prefix}: поле "path" должно быть строкой, получено ${typeof item.path}`;
    }

    // Опциональное поле children
    if ('children' in item && item.children !== undefined) {
        if (!Array.isArray(item.children)) {
            return `${prefix}: поле "children" должно быть массивом, получено ${typeof item.children}`;
        }
        for (let i = 0; i < item.children.length; i++) {
            const childResult = validateTocItem(item.children[i], `${prefix}.children[${i}]`);
            if (childResult !== true) {
                return childResult;
            }
        }
    }

    return true;
}

/** Рекурсивно собирает все узлы в плоский массив */
function flattenTocItems(items: TocItem[]): TocItem[] {
    const result: TocItem[] = [];
    for (const item of items) {
        result.push(item);
        if (item.children) {
            result.push(...flattenTocItems(item.children));
        }
    }
    return result;
}

describe('TocItem — runtime-валидация типа', () => {
    it('все элементы верхнего уровня проходят runtime-валидацию TocItem', () => {
        for (const item of toc) {
            const result = validateTocItem(item, item.path);
            expect(result).toBe(true);
        }
    });

    it('ВСЕ узлы дерева (рекурсивно) проходят runtime-валидацию', () => {
        const allItems = flattenTocItems(toc);
        // В дереве должно быть больше 100 узлов (section2 одна содержит десятки)
        expect(allItems.length).toBeGreaterThan(100);
        for (const item of allItems) {
            const result = validateTocItem(item, item.path);
            expect(result).toBe(true);
        }
    });

    it('каждый TocItem содержит только допустимые ключи (title, path, children)', () => {
        const allowedKeys = new Set(['title', 'path', 'children']);
        const allItems = flattenTocItems(toc);
        for (const item of allItems) {
            const keys = Object.keys(item);
            for (const key of keys) {
                expect(allowedKeys.has(key), `Неожиданный ключ "${key}" в узле ${item.path}`).toBe(true);
            }
        }
    });

    it('validateTocItem корректно отклоняет невалидные объекты', () => {
        // Нет title
        expect(validateTocItem({ path: 'x' })).toContain('title');
        // Нет path
        expect(validateTocItem({ title: 'x' })).toContain('path');
        // Не объект
        expect(validateTocItem(null)).toContain('объект');
        expect(validateTocItem('строка')).toContain('объект');
        // children не массив
        expect(validateTocItem({ title: 'x', path: 'x', children: 'bad' })).toContain('массивом');
        // Всё верно — возвращает true
        expect(validateTocItem({ title: 'OK', path: 'ok' })).toBe(true);
        expect(validateTocItem({ title: 'OK', path: 'ok', children: [] })).toBe(true);
    });

    it('leaf-узлы (без children) тоже валидны', () => {
        const allItems = flattenTocItems(toc);
        const leaves = allItems.filter(i => !i.children || i.children.length === 0);
        expect(leaves.length).toBeGreaterThan(0);
        for (const leaf of leaves) {
            expect(typeof leaf.title).toBe('string');
            expect(typeof leaf.path).toBe('string');
        }
    });

    it('path содержит только допустимые символы (латиница, цифры, дефис)', () => {
        const allItems = flattenTocItems(toc);
        const validPathRegex = /^[a-z0-9-]+$/;
        for (const item of allItems) {
            expect(
                validPathRegex.test(item.path),
                `path "${item.path}" содержит недопустимые символы`
            ).toBe(true);
        }
    });
});
