/**
 * Тесты: messages.conversations.api.ts
 * Проверяем: getConversationsInit, getLastMessages, getUnreadCounts, getUnreadDialogCountsBatch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем зависимости перед импортом
vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://test-api.local/api',
}));

vi.mock('../../shared/utils/apiClient', () => ({
    getAuthHeaders: vi.fn(() => ({
        'Content-Type': 'application/json',
        'X-Session-Token': 'test-token',
    })),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
    getConversationsInit,
    getLastMessages,
    getUnreadCounts,
    getUnreadDialogCountsBatch,
} from '../../services/api/messages.conversations.api';

// Хелпер: создать успешный Response
function okResponse(data: unknown) {
    return {
        ok: true,
        status: 200,
        json: async () => data,
    };
}

// Хелпер: создать ошибочный Response
function errorResponse(status: number, detail?: string) {
    return {
        ok: false,
        status,
        json: async () => (detail ? { detail } : {}),
    };
}

describe('messages.conversations.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getConversationsInit ────────────────────────────────────

    describe('getConversationsInit', () => {
        const mockResponse = {
            meta: {},
            subscribers: [],
            total_count: 0,
            unread_counts: {},
            last_messages: {},
        };

        it('отправляет POST с правильным URL и телом', async () => {
            mockFetch.mockResolvedValue(okResponse(mockResponse));

            await getConversationsInit('proj-1');

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/conversations-init');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual({
                project_id: 'proj-1',
                page: 1,
                sort_unread_first: true,
                filter_unread: 'all',
            });
        });

        it('передаёт кастомные параметры', async () => {
            mockFetch.mockResolvedValue(okResponse(mockResponse));

            await getConversationsInit('proj-2', 3, false, 'unread');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.page).toBe(3);
            expect(body.sort_unread_first).toBe(false);
            expect(body.filter_unread).toBe('unread');
        });

        it('выбрасывает ошибку при неуспешном ответе (с detail)', async () => {
            mockFetch.mockResolvedValue(errorResponse(500, 'Internal Server Error'));

            await expect(getConversationsInit('proj-1')).rejects.toThrow('Internal Server Error');
        });

        it('выбрасывает ошибку при неуспешном ответе (без detail)', async () => {
            mockFetch.mockResolvedValue(errorResponse(403));

            await expect(getConversationsInit('proj-1')).rejects.toThrow('Ошибка загрузки диалогов: 403');
        });

        it('возвращает данные при успешном ответе', async () => {
            const data = { ...mockResponse, total_count: 42 };
            mockFetch.mockResolvedValue(okResponse(data));

            const result = await getConversationsInit('proj-1');
            expect(result.total_count).toBe(42);
        });
    });

    // ─── getLastMessages ─────────────────────────────────────────

    describe('getLastMessages', () => {
        it('возвращает пустой результат при пустом массиве userIds', async () => {
            const result = await getLastMessages('proj-1', []);

            expect(mockFetch).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true, messages: {} });
        });

        it('отправляет GET с правильными query-параметрами', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, messages: {} }));

            await getLastMessages('proj-1', [100, 200, 300]);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('http://test-api.local/api/messages/last-messages?');
            expect(url).toContain('project_id=proj-1');
            expect(url).toContain('user_ids=100%2C200%2C300');
        });

        it('выбрасывает ошибку при неуспешном ответе', async () => {
            mockFetch.mockResolvedValue(errorResponse(404, 'Not found'));

            await expect(getLastMessages('proj-1', [1])).rejects.toThrow('Not found');
        });
    });

    // ─── getUnreadCounts ─────────────────────────────────────────

    describe('getUnreadCounts', () => {
        it('отправляет GET без user_ids если не указаны', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, counts: {} }));

            await getUnreadCounts('proj-1');

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('project_id=proj-1');
            expect(url).not.toContain('user_ids');
        });

        it('добавляет user_ids в query-параметры', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, counts: {} }));

            await getUnreadCounts('proj-1', [10, 20]);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('user_ids=10%2C20');
        });

        it('не добавляет user_ids при пустом массиве', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, counts: {} }));

            await getUnreadCounts('proj-1', []);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).not.toContain('user_ids');
        });
    });

    // ─── getUnreadDialogCountsBatch ──────────────────────────────

    describe('getUnreadDialogCountsBatch', () => {
        it('возвращает пустой результат для пустого массива projectIds', async () => {
            const result = await getUnreadDialogCountsBatch([]);

            expect(mockFetch).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true, counts: {} });
        });

        it('отправляет GET с project_ids', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, counts: { 'p1': 3, 'p2': 0 } }));

            const result = await getUnreadDialogCountsBatch(['p1', 'p2']);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('project_ids=p1%2Cp2');
            expect(result.counts['p1']).toBe(3);
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(errorResponse(500));

            await expect(getUnreadDialogCountsBatch(['p1'])).rejects.toThrow('Ошибка пакетного подсчёта непрочитанных: 500');
        });
    });
});
