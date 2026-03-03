// Тесты хаб-файла tocData.ts — проверяет корректную сборку всех секций

import { describe, it, expect } from 'vitest';
import { toc } from '../../features/training2/data/tocData';
import type { TocItem } from '../../features/training2/data/types';

// ────────────────────────────────────────────────────────────────
// Вспомогательная функция: рекурсивный сбор всех id (path) из дерева
// ────────────────────────────────────────────────────────────────
function collectPaths(items: TocItem[]): string[] {
    const result: string[] = [];
    for (const item of items) {
        result.push(item.path);
        if (item.children) {
            result.push(...collectPaths(item.children));
        }
    }
    return result;
}

// Вспомогательная функция: рекурсивный сбор всех title
function collectTitles(items: TocItem[]): string[] {
    const result: string[] = [];
    for (const item of items) {
        result.push(item.title);
        if (item.children) {
            result.push(...collectTitles(item.children));
        }
    }
    return result;
}

describe('tocData — хаб-файл', () => {
    it('массив toc экспортируется и является массивом', () => {
        expect(Array.isArray(toc)).toBe(true);
    });

    it('массив toc содержит ровно 11 элементов (разделы 0–10)', () => {
        expect(toc).toHaveLength(11);
    });

    it('каждый элемент верхнего уровня имеет обязательные поля title, path и children', () => {
        for (const item of toc) {
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('path');
            expect(item).toHaveProperty('children');
            // children должен быть массивом
            expect(Array.isArray(item.children)).toBe(true);
        }
    });

    it('все path уникальны во всём дереве (нет дублей)', () => {
        const allPaths = collectPaths(toc);
        const uniquePaths = new Set(allPaths);
        // Если есть дубли — выводим их для отладки
        const duplicates = allPaths.filter((p, i) => allPaths.indexOf(p) !== i);
        expect(duplicates).toEqual([]);
        expect(uniquePaths.size).toBe(allPaths.length);
    });

    it('нет пустых title во всём дереве', () => {
        const allTitles = collectTitles(toc);
        for (const title of allTitles) {
            expect(typeof title).toBe('string');
            expect(title.trim().length).toBeGreaterThan(0);
        }
    });

    it('нет пустых path во всём дереве', () => {
        const allPaths = collectPaths(toc);
        for (const path of allPaths) {
            expect(typeof path).toBe('string');
            expect(path.trim().length).toBeGreaterThan(0);
        }
    });

    it('порядок разделов: 0, 1, 2, …, 10', () => {
        // Каждый раздел начинается с соответствующего числа в path
        const expectedPrefixes = ['0-', '1-', '2-', '3-', '4-', '5-', '6-', '7-', '8-', '9-', '10-'];
        for (let i = 0; i < toc.length; i++) {
            expect(toc[i].path.startsWith(expectedPrefixes[i])).toBe(true);
        }
    });

    it('каждый раздел верхнего уровня имеет непустой массив children', () => {
        for (const item of toc) {
            expect(item.children!.length).toBeGreaterThan(0);
        }
    });
});
