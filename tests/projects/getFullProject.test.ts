/**
 * Тесты getFullProject — логика кеширования полных данных проекта.
 *
 * ЗАЧЕМ:
 *   getFullProject (ProjectsContext) — ключевая часть рефакторинга:
 *   вместо загрузки всех Project при старте, загружаем ProjectSummary,
 *   а полный Project подтягиваем по требованию через getProjectDetails.
 *
 *   Эти тесты проверяют:
 *     1. api.getProjectDetails вызывается для нового проекта
 *     2. Повторный вызов для того же проекта берёт данные из кеша (без API)
 *     3. Разные проекты вызывают API независимо
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '../../shared/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Unit-тест чистой логики getFullProject (без React-обёртки)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Воспроизводим логику getFullProject из ProjectsContext:
 *   - cache hit → возвращаем из кеша
 *   - cache miss → вызываем API → сохраняем в кеш
 */
function createGetFullProject(
    cache: Record<string, Project>,
    apiCall: (id: string) => Promise<Project>,
) {
    return async (projectId: string): Promise<Project> => {
        if (cache[projectId]) {
            return cache[projectId];
        }
        const fullProject = await apiCall(projectId);
        cache[projectId] = fullProject;
        return fullProject;
    };
}

const makeFullProject = (id: string): Project => ({
    id,
    name: `Проект ${id}`,
    vkProjectId: 100,
    vkGroupShortName: `group-${id}`,
    vkGroupName: `Группа ${id}`,
    vkLink: `https://vk.com/${id}`,
    notes: `Заметки ${id}`,
    team: 'Команда',
    variables: '{}',
    additional_community_tokens: [],
    last_market_update: '2026-01-01',
});


describe('getFullProject cache logic', () => {
    let cache: Record<string, Project>;
    let mockApiCall: ReturnType<typeof vi.fn>;
    let getFullProject: (id: string) => Promise<Project>;

    beforeEach(() => {
        cache = {};
        mockApiCall = vi.fn((id: string) => Promise.resolve(makeFullProject(id)));
        getFullProject = createGetFullProject(cache, mockApiCall);
    });

    it('вызывает API при первом запросе (cache miss)', async () => {
        const result = await getFullProject('proj-1');

        expect(mockApiCall).toHaveBeenCalledOnce();
        expect(mockApiCall).toHaveBeenCalledWith('proj-1');
        expect(result.id).toBe('proj-1');
        expect(result.notes).toBe('Заметки proj-1');
    });

    it('возвращает данные из кеша без API (cache hit)', async () => {
        // Первый вызов — заполняет кеш
        await getFullProject('proj-1');
        expect(mockApiCall).toHaveBeenCalledOnce();

        // Второй вызов — из кеша
        const result = await getFullProject('proj-1');
        expect(mockApiCall).toHaveBeenCalledOnce(); // НЕ вызван повторно
        expect(result.id).toBe('proj-1');
    });

    it('разные проекты вызывают API независимо', async () => {
        await getFullProject('proj-1');
        await getFullProject('proj-2');

        expect(mockApiCall).toHaveBeenCalledTimes(2);
        expect(mockApiCall).toHaveBeenCalledWith('proj-1');
        expect(mockApiCall).toHaveBeenCalledWith('proj-2');
    });

    it('кеш содержит полные данные Project (не summary)', async () => {
        await getFullProject('proj-1');

        const cached = cache['proj-1'];
        expect(cached).toBeDefined();
        // Проверяем что в кеше — полный Project с расширенными полями
        expect(cached.notes).toBe('Заметки proj-1');
        expect(cached.team).toBe('Команда');
        expect(cached.variables).toBe('{}');
        expect(cached.additional_community_tokens).toEqual([]);
        expect(cached.last_market_update).toBe('2026-01-01');
    });

    it('обрабатывает ошибку API корректно (не записывает в кеш)', async () => {
        mockApiCall.mockRejectedValueOnce(new Error('Network error'));

        await expect(getFullProject('proj-fail')).rejects.toThrow('Network error');
        expect(cache['proj-fail']).toBeUndefined(); // Не закешировалось
    });
});
