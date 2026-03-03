/**
 * Тесты утилит для раздела «Админ-инструменты».
 * Покрывает: formatDuration, parseWorkersData, parseProjectsData.
 */
import { describe, it, expect } from 'vitest';
import {
    formatDuration,
    parseWorkersData,
    parseProjectsData,
} from '../../features/settings/utils/adminToolsUtils';

// ─── formatDuration ─────────────────────────────────────────────────────

describe('formatDuration', () => {
    it('возвращает "0 сек" для нуля секунд', () => {
        expect(formatDuration(0)).toBe('0 сек');
    });

    it('возвращает секунды, если меньше минуты', () => {
        expect(formatDuration(30)).toBe('30 сек');
    });

    it('возвращает ровно 1 мин 0 сек для 60 секунд', () => {
        expect(formatDuration(60)).toBe('1 мин 0 сек');
    });

    it('корректно форматирует минуты и секунды', () => {
        // 3661 сек = 61 мин 1 сек
        expect(formatDuration(3661)).toBe('61 мин 1 сек');
    });

    it('возвращает тире для отрицательных значений', () => {
        expect(formatDuration(-1)).toBe('—');
        expect(formatDuration(-100)).toBe('—');
    });

    it('дробные секунды округляются вниз', () => {
        expect(formatDuration(59.9)).toBe('59 сек');
        expect(formatDuration(90.7)).toBe('1 мин 30 сек');
    });
});

// ─── parseWorkersData ───────────────────────────────────────────────────

describe('parseWorkersData', () => {
    it('возвращает null для undefined', () => {
        expect(parseWorkersData(undefined)).toBeNull();
    });

    it('возвращает null для пустой строки', () => {
        expect(parseWorkersData('')).toBeNull();
    });

    it('возвращает null для невалидного JSON', () => {
        expect(parseWorkersData('это не json')).toBeNull();
    });

    it('возвращает null для пустого массива', () => {
        expect(parseWorkersData('[]')).toBeNull();
    });

    it('возвращает null, если нет нужных полей (worker_id/id + current)', () => {
        const data = JSON.stringify([{ foo: 'bar' }]);
        expect(parseWorkersData(data)).toBeNull();
    });

    it('парсит массив с полем id и current', () => {
        const workers = [
            { id: 1, name: 'W1', current: 'proj-1', status: 'processing', processed: 5, total: 10, errors: 0 },
        ];
        const result = parseWorkersData(JSON.stringify(workers));
        expect(result).toEqual(workers);
    });

    it('парсит массив с полем worker_id и current', () => {
        const workers = [
            { worker_id: 1, name: 'W1', current: 'proj-2', status: 'done', processed: 10, total: 10, errors: 0 },
        ];
        const result = parseWorkersData(JSON.stringify(workers));
        expect(result).toEqual(workers);
    });

    it('возвращает null для объекта (не массив)', () => {
        expect(parseWorkersData(JSON.stringify({ id: 1, current: 'x' }))).toBeNull();
    });
});

// ─── parseProjectsData ──────────────────────────────────────────────────

describe('parseProjectsData', () => {
    it('возвращает null для undefined', () => {
        expect(parseProjectsData(undefined)).toBeNull();
    });

    it('возвращает null для пустой строки', () => {
        expect(parseProjectsData('')).toBeNull();
    });

    it('возвращает null для невалидного JSON', () => {
        expect(parseProjectsData('не json вообще')).toBeNull();
    });

    it('возвращает null для пустого массива', () => {
        expect(parseProjectsData('[]')).toBeNull();
    });

    it('возвращает null, если нет поля project_id', () => {
        const data = JSON.stringify([{ name: 'test' }]);
        expect(parseProjectsData(data)).toBeNull();
    });

    it('парсит массив проектов с project_id', () => {
        const projects = [
            {
                project_id: 'p1',
                project_name: 'Проект 1',
                vk_id: '123',
                status: 'done',
                token_name: 'tok1',
                loaded: 100,
                total: 100,
                added: 5,
                left: 2,
                error: '',
            },
            {
                project_id: 'p2',
                project_name: 'Проект 2',
                vk_id: '456',
                status: 'error',
                token_name: 'tok2',
                loaded: 0,
                total: 50,
                added: 0,
                left: 0,
                error: 'Ошибка доступа',
            },
        ];
        const result = parseProjectsData(JSON.stringify(projects));
        expect(result).toEqual(projects);
        expect(result).toHaveLength(2);
    });

    it('возвращает null для объекта (не массив)', () => {
        expect(parseProjectsData(JSON.stringify({ project_id: 'x' }))).toBeNull();
    });
});
