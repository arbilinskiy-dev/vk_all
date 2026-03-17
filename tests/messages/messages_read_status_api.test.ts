/**
 * Тесты: messages.read-status.api.ts
 * Проверяем: markDialogAsRead, markDialogAsUnread, markAllDialogsAsRead
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    markDialogAsRead,
    markDialogAsUnread,
    markAllDialogsAsRead,
} from '../../services/api/messages.read-status.api';

function okResponse(data: unknown) {
    return { ok: true, status: 200, json: async () => data };
}
function errorResponse(status: number, detail?: string) {
    return { ok: false, status, json: async () => (detail ? { detail } : {}) };
}

describe('messages.read-status.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── markDialogAsRead ────────────────────────────────────────

    describe('markDialogAsRead', () => {
        it('отправляет PUT с project_id и user_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, unread_count: 0, last_read_message_id: 999 }));

            await markDialogAsRead('proj-1', 42);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/mark-read');
            expect(opts.method).toBe('PUT');
            const body = JSON.parse(opts.body);
            expect(body.project_id).toBe('proj-1');
            expect(body.user_id).toBe(42);
            expect(body.manager_id).toBeUndefined();
        });

        it('передаёт manager_id когда указан', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, unread_count: 0, last_read_message_id: 100 }));

            await markDialogAsRead('proj-1', 42, 'mgr-5');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.manager_id).toBe('mgr-5');
        });

        it('возвращает unread_count и last_read_message_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, unread_count: 0, last_read_message_id: 555 }));

            const result = await markDialogAsRead('proj-1', 42);
            expect(result.unread_count).toBe(0);
            expect(result.last_read_message_id).toBe(555);
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(errorResponse(500, 'DB timeout'));

            await expect(markDialogAsRead('proj-1', 42)).rejects.toThrow('DB timeout');
        });
    });

    // ─── markDialogAsUnread ──────────────────────────────────────

    describe('markDialogAsUnread', () => {
        it('отправляет PUT на mark-unread', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, unread_count: 1 }));

            await markDialogAsUnread('proj-1', 42);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/mark-unread');
            expect(opts.method).toBe('PUT');
        });

        it('передаёт manager_id когда указан', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, unread_count: 1 }));

            await markDialogAsUnread('proj-1', 42, 'mgr-3');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.manager_id).toBe('mgr-3');
        });

        it('выбрасывает ошибку без detail', async () => {
            mockFetch.mockResolvedValue(errorResponse(400));

            await expect(markDialogAsUnread('proj-1', 42)).rejects.toThrow('Ошибка отметки непрочитанным: 400');
        });
    });

    // ─── markAllDialogsAsRead ────────────────────────────────────

    describe('markAllDialogsAsRead', () => {
        it('отправляет PUT на mark-all-read с project_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, updated_count: 15 }));

            await markAllDialogsAsRead('proj-1');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/mark-all-read');
            expect(opts.method).toBe('PUT');
            const body = JSON.parse(opts.body);
            expect(body.project_id).toBe('proj-1');
            expect(body.manager_id).toBeUndefined();
        });

        it('передаёт manager_id когда указан', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, updated_count: 5 }));

            await markAllDialogsAsRead('proj-1', 'mgr-7');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.manager_id).toBe('mgr-7');
        });

        it('возвращает количество обновлённых диалогов', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, updated_count: 23 }));

            const result = await markAllDialogsAsRead('proj-1');
            expect(result.updated_count).toBe(23);
        });
    });
});
