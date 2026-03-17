/**
 * Unit-тесты для services/api/management.api.ts — функция refreshAllMailing.
 * Проверяет: правильный URL, метод вызова callApi, возвращаемый результат.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем callApi
const mockCallApi = vi.fn();
vi.mock('../../shared/utils/apiClient', () => ({
    callApi: (...args: unknown[]) => mockCallApi(...args),
    API_BASE_URL: 'http://localhost:8000/api',
}));

import {
    refreshAllMailing,
    refreshAllSubscribers,
    refreshAllPosts,
} from '../../services/api/management.api';

describe('management.api.ts — refreshAllMailing', () => {
    beforeEach(() => {
        mockCallApi.mockReset();
        mockCallApi.mockResolvedValue({ taskId: 'mocked-task-id' });
    });

    // ─── refreshAllMailing ──────────────────────────────────────────────

    it('вызывает callApi с правильным URL', async () => {
        await refreshAllMailing();

        expect(mockCallApi).toHaveBeenCalledWith('management/refresh-all-mailing');
    });

    it('не передаёт никаких параметров (без тела запроса)', async () => {
        await refreshAllMailing();

        // callApi вызван ровно с одним аргументом — URL
        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi.mock.calls[0]).toHaveLength(1);
    });

    it('возвращает {taskId} из ответа', async () => {
        mockCallApi.mockResolvedValue({ taskId: 'test-task-123' });

        const result = await refreshAllMailing();

        expect(result).toEqual({ taskId: 'test-task-123' });
    });

    it('пробрасывает ошибку при сбое API', async () => {
        mockCallApi.mockRejectedValue(new Error('Network Error'));

        await expect(refreshAllMailing()).rejects.toThrow('Network Error');
    });

    // ─── Сравнение с другими API-функциями ──────────────────────────────

    it('refreshAllSubscribers вызывает другой URL', async () => {
        await refreshAllSubscribers();

        expect(mockCallApi).toHaveBeenCalledWith('management/refresh-all-subscribers');
    });

    it('refreshAllPosts принимает параметры limit и mode', async () => {
        await refreshAllPosts('1000', 'limit');

        expect(mockCallApi).toHaveBeenCalledWith(
            'management/refresh-all-posts',
            { limit: '1000', mode: 'limit' }
        );
    });
});
