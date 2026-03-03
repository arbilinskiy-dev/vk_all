// Тесты утилит для ContentManagementOverview
import { describe, it, expect } from 'vitest';
import {
    getPostCountColorClasses,
    filterProjects,
} from '../../features/training/components/content/section2/content-management-overview/contentManagementUtils';
import { Project } from '../../features/training/components/content/section2/content-management-overview/types';

// =============================================================================
// getPostCountColorClasses — определение цвета badge по количеству постов
// =============================================================================
describe('getPostCountColorClasses', () => {
    it('возвращает красные классы для 0 постов', () => {
        const result = getPostCountColorClasses(0);
        expect(result).toContain('red');
        expect(result).toContain('bg-gradient');
    });

    it('возвращает оранжевые классы для 1-4 постов', () => {
        expect(getPostCountColorClasses(1)).toContain('orange');
        expect(getPostCountColorClasses(3)).toContain('orange');
        expect(getPostCountColorClasses(4)).toContain('orange');
    });

    it('возвращает серые классы для 5-10 постов (средний диапазон)', () => {
        const result = getPostCountColorClasses(5);
        expect(result).toContain('gray');
    });

    it('возвращает серые классы для 10 постов (граничное значение)', () => {
        const result = getPostCountColorClasses(10);
        expect(result).toContain('gray');
    });

    it('возвращает зелёные классы для >10 постов', () => {
        const result = getPostCountColorClasses(11);
        expect(result).toContain('green');
        expect(result).toContain('bg-gradient');
    });

    it('возвращает зелёные классы для большого количества постов', () => {
        const result = getPostCountColorClasses(100);
        expect(result).toContain('green');
    });
});

// =============================================================================
// filterProjects — фильтрация проектов по поиску, команде и постам
// =============================================================================
describe('filterProjects', () => {
    // Тестовые данные
    const mockProjects: Project[] = [
        { id: '1', name: 'Автоключи Мастер', team: 'В', posts: 0, hasWarning: true },
        { id: '2', name: 'Тестовое сообщество', team: 'С', posts: 3, hasWarning: false },
        { id: '3', name: 'Фиолето Суши', team: 'В', posts: 7, hasWarning: false },
        { id: '4', name: 'Без команды проект', team: '', posts: 12, hasWarning: false },
        { id: '5', name: 'Команда А проект', team: 'А', posts: 0, hasWarning: true },
    ];

    describe('фильтр по поиску', () => {
        it('возвращает все проекты при пустом запросе', () => {
            const result = filterProjects(mockProjects, '', 'all', 'all');
            expect(result).toHaveLength(5);
        });

        it('фильтрует по названию (регистронезависимо)', () => {
            const result = filterProjects(mockProjects, 'тестовое', 'all', 'all');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Тестовое сообщество');
        });

        it('возвращает пустой массив, если ничего не найдено', () => {
            const result = filterProjects(mockProjects, 'несуществующий', 'all', 'all');
            expect(result).toHaveLength(0);
        });
    });

    describe('фильтр по команде', () => {
        it('возвращает все проекты при фильтре "all"', () => {
            const result = filterProjects(mockProjects, '', 'all', 'all');
            expect(result).toHaveLength(5);
        });

        it('фильтрует по команде "В"', () => {
            const result = filterProjects(mockProjects, '', 'В', 'all');
            expect(result).toHaveLength(2);
            expect(result.every(p => p.team === 'В')).toBe(true);
        });

        it('фильтрует по команде "С"', () => {
            const result = filterProjects(mockProjects, '', 'С', 'all');
            expect(result).toHaveLength(1);
            expect(result[0].team).toBe('С');
        });

        it('фильтрует по команде "А"', () => {
            const result = filterProjects(mockProjects, '', 'А', 'all');
            expect(result).toHaveLength(1);
            expect(result[0].team).toBe('А');
        });

        it('фильтрует проекты без команды', () => {
            const result = filterProjects(mockProjects, '', 'none', 'all');
            // "none" фильтр: p.team должна быть falsy (пустая строка)
            expect(result.every(p => !p.team)).toBe(true);
        });
    });

    describe('фильтр по количеству постов', () => {
        it('возвращает проекты без постов (empty)', () => {
            const result = filterProjects(mockProjects, '', 'all', 'empty');
            expect(result.every(p => p.posts === 0)).toBe(true);
        });

        it('возвращает проекты с постами (not_empty)', () => {
            const result = filterProjects(mockProjects, '', 'all', 'not_empty');
            expect(result.every(p => p.posts > 0)).toBe(true);
        });

        it('возвращает проекты с <5 постами (lt5)', () => {
            const result = filterProjects(mockProjects, '', 'all', 'lt5');
            expect(result.every(p => p.posts > 0 && p.posts < 5)).toBe(true);
        });

        it('возвращает проекты с 5-10 постами', () => {
            const result = filterProjects(mockProjects, '', 'all', '5-10');
            expect(result.every(p => p.posts >= 5 && p.posts <= 10)).toBe(true);
        });

        it('возвращает проекты с >10 постами (gt10)', () => {
            const result = filterProjects(mockProjects, '', 'all', 'gt10');
            expect(result.every(p => p.posts > 10)).toBe(true);
        });
    });

    describe('комбинированные фильтры', () => {
        it('применяет поиск + фильтр команды одновременно', () => {
            const result = filterProjects(mockProjects, 'суши', 'В', 'all');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Фиолето Суши');
        });

        it('применяет все три фильтра одновременно', () => {
            const result = filterProjects(mockProjects, '', 'В', 'empty');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });
    });
});
