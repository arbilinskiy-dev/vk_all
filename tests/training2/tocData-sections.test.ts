// Тесты отдельных секций — проверка структуры каждого sectionXData

import { describe, it, expect } from 'vitest';
import { section0 } from '../../features/training2/data/section0Data';
import { section1 } from '../../features/training2/data/section1Data';
import { section2 } from '../../features/training2/data/section2Data';
import { section3 } from '../../features/training2/data/section3Data';
import { section4 } from '../../features/training2/data/section4Data';
import { section5 } from '../../features/training2/data/section5Data';
import { section6 } from '../../features/training2/data/section6Data';
import { section7 } from '../../features/training2/data/section7Data';
import { section8 } from '../../features/training2/data/section8Data';
import { section9 } from '../../features/training2/data/section9Data';
import { section10 } from '../../features/training2/data/section10Data';
import type { TocItem } from '../../features/training2/data/types';

// ────────────────────────────────────────────────────────────────
// Вспомогательные функции
// ────────────────────────────────────────────────────────────────

/** Проверяет, что объект соответствует интерфейсу TocItem */
function assertTocItemShape(item: TocItem, context: string) {
    expect(typeof item.title, `${context}: title должен быть строкой`).toBe('string');
    expect(item.title.trim().length, `${context}: title не должен быть пустым`).toBeGreaterThan(0);
    expect(typeof item.path, `${context}: path должен быть строкой`).toBe('string');
    expect(item.path.trim().length, `${context}: path не должен быть пустым`).toBeGreaterThan(0);
    if (item.children !== undefined) {
        expect(Array.isArray(item.children), `${context}: children должен быть массивом`).toBe(true);
        for (const child of item.children) {
            assertTocItemShape(child, `${context} > ${child.path}`);
        }
    }
}

/** Рекурсивно считает все узлы в дереве (включая корень) */
function countNodes(item: TocItem): number {
    let count = 1;
    if (item.children) {
        for (const child of item.children) {
            count += countNodes(child);
        }
    }
    return count;
}

/** Возвращает заголовки children верхнего уровня */
function topChildrenTitles(item: TocItem): string[] {
    return (item.children ?? []).map(c => c.title);
}

// ────────────────────────────────────────────────────────────────
// Тесты
// ────────────────────────────────────────────────────────────────

describe('section0Data — Раздел 0: О Центре обучения', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section0, 'section0');
    });

    it('path начинается с "0"', () => {
        expect(section0.path.startsWith('0')).toBe(true);
    });

    it('содержит подразделы 0.1, 0.2, 0.3', () => {
        const titles = topChildrenTitles(section0);
        expect(titles.length).toBe(3);
        expect(titles.some(t => t.includes('0.1'))).toBe(true);
        expect(titles.some(t => t.includes('0.2'))).toBe(true);
        expect(titles.some(t => t.includes('0.3'))).toBe(true);
    });
});

describe('section1Data — Раздел 1: Введение в приложение', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section1, 'section1');
    });

    it('path начинается с "1-"', () => {
        expect(section1.path.startsWith('1-')).toBe(true);
    });

    it('содержит подразделы о знакомстве с интерфейсом', () => {
        const titles = topChildrenTitles(section1);
        expect(titles.some(t => t.includes('интерфейс') || t.includes('Интерфейс'))).toBe(true);
    });
});

describe('section2Data — Раздел 2: Модуль "Контент-менеджмент" (самый большой)', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section2, 'section2');
    });

    it('path начинается с "2-"', () => {
        expect(section2.path.startsWith('2-')).toBe(true);
    });

    it('содержит подразделы 2.1, 2.2, 2.3, 2.4', () => {
        const titles = topChildrenTitles(section2);
        expect(titles.length).toBe(4);
        expect(titles.some(t => t.includes('2.1'))).toBe(true);
        expect(titles.some(t => t.includes('2.2'))).toBe(true);
        expect(titles.some(t => t.includes('2.3'))).toBe(true);
        expect(titles.some(t => t.includes('2.4'))).toBe(true);
    });

    it('является самой большой секцией по количеству узлов', () => {
        const allSections = [section0, section1, section2, section3, section4, section5, section6, section7, section8, section9, section10];
        const counts = allSections.map(s => countNodes(s));
        const maxCount = Math.max(...counts);
        expect(countNodes(section2)).toBe(maxCount);
    });

    it('2.1 (Отложенные) содержит подразделы о модальном окне поста', () => {
        const schedule = section2.children!.find(c => c.path === '2-1-schedule');
        expect(schedule).toBeDefined();
        const modalSection = schedule!.children!.find(c => c.path === '2-1-7-post-modal');
        expect(modalSection).toBeDefined();
        expect(modalSection!.children!.length).toBeGreaterThan(5);
    });

    it('2.4 (Автоматизации) содержит подразделы о конкурсах', () => {
        const automations = section2.children!.find(c => c.path === '2-4-automations');
        expect(automations).toBeDefined();
        const titles = topChildrenTitles(automations!);
        expect(titles.some(t => t.includes('Конкурс') || t.includes('конкурс'))).toBe(true);
    });
});

describe('section3Data — Раздел 3: Модуль "Списки"', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section3, 'section3');
    });

    it('path начинается с "3-"', () => {
        expect(section3.path.startsWith('3-')).toBe(true);
    });

    it('содержит подраздел о системных списках', () => {
        const titles = topChildrenTitles(section3);
        expect(titles.some(t => t.includes('Системные списки'))).toBe(true);
    });
});

describe('section4Data — Раздел 4: Управление проектами', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section4, 'section4');
    });

    it('path начинается с "4-"', () => {
        expect(section4.path.startsWith('4-')).toBe(true);
    });

    it('содержит подраздел «База проектов»', () => {
        const titles = topChildrenTitles(section4);
        expect(titles.some(t => t.includes('База проектов'))).toBe(true);
    });

    it('содержит подраздел «Архив проектов»', () => {
        const titles = topChildrenTitles(section4);
        expect(titles.some(t => t.includes('Архив'))).toBe(true);
    });
});

describe('section5Data — Раздел 5: Продвинутые инструменты', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section5, 'section5');
    });

    it('path начинается с "5-"', () => {
        expect(section5.path.startsWith('5-')).toBe(true);
    });

    it('содержит подраздел об AI-помощнике', () => {
        const titles = topChildrenTitles(section5);
        expect(titles.some(t => t.includes('AI'))).toBe(true);
    });
});

describe('section6Data — Раздел 6: Администрирование', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section6, 'section6');
    });

    it('path начинается с "6-"', () => {
        expect(section6.path.startsWith('6-')).toBe(true);
    });

    it('содержит подраздел «Управление пользователями»', () => {
        const titles = topChildrenTitles(section6);
        expect(titles.some(t => t.includes('пользовател'))).toBe(true);
    });
});

describe('section7Data — Раздел 7: Авторизация и безопасность', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section7, 'section7');
    });

    it('path начинается с "7-"', () => {
        expect(section7.path.startsWith('7-')).toBe(true);
    });

    it('содержит подразделы о входе и ролях', () => {
        const titles = topChildrenTitles(section7);
        expect(titles.some(t => t.includes('Страница входа'))).toBe(true);
        expect(titles.some(t => t.includes('Роли'))).toBe(true);
    });
});

describe('section8Data — Раздел 8: Модальные окна и диалоги', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section8, 'section8');
    });

    it('path начинается с "8-"', () => {
        expect(section8.path.startsWith('8-')).toBe(true);
    });

    it('содержит подразделы для постов, заметок и превью', () => {
        const titles = topChildrenTitles(section8);
        expect(titles.some(t => t.includes('пост'))).toBe(true);
        expect(titles.some(t => t.includes('замет'))).toBe(true);
        expect(titles.some(t => t.includes('Превью'))).toBe(true);
    });
});

describe('section9Data — Раздел 9: Дополнительные модули', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section9, 'section9');
    });

    it('path начинается с "9-"', () => {
        expect(section9.path.startsWith('9-')).toBe(true);
    });

    it('содержит минимально 2 подраздела (сообщения, статистика)', () => {
        expect(section9.children!.length).toBeGreaterThanOrEqual(2);
    });
});

describe('section10Data — Раздел 10: FAQ и решение проблем (последний)', () => {
    it('экспортирует объект с корректной структурой TocItem', () => {
        assertTocItemShape(section10, 'section10');
    });

    it('path начинается с "10-"', () => {
        expect(section10.path.startsWith('10-')).toBe(true);
    });

    it('содержит подразделы FAQ и troubleshooting', () => {
        const titles = topChildrenTitles(section10);
        expect(titles.some(t => t.includes('Частые вопросы'))).toBe(true);
        expect(titles.some(t => t.includes('проблем'))).toBe(true);
    });

    it('является последним разделом (path = "10-faq")', () => {
        expect(section10.path).toBe('10-faq');
    });
});
