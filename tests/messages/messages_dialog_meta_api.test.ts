/**
 * Тесты: messages.dialog-meta.api.ts
 * Проверяем: getMailingUserInfo, setDialogFocus, toggleDialogImportant, getDialogFocuses
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
    getMailingUserInfo,
    setDialogFocus,
    toggleDialogImportant,
    getDialogFocuses,
} from '../../services/api/messages.dialog-meta.api';

function okResponse(data: unknown) {
    return { ok: true, status: 200, json: async () => data };
}
function errorResponse(status: number, detail?: string) {
    return { ok: false, status, json: async () => (detail ? { detail } : {}) };
}

describe('messages.dialog-meta.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getMailingUserInfo ──────────────────────────────────────

    describe('getMailingUserInfo', () => {
        it('отправляет GET с project_id и user_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, found: false, user: null }));

            await getMailingUserInfo('proj-1', 42);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('http://test-api.local/api/messages/user-info?');
            expect(url).toContain('project_id=proj-1');
            expect(url).toContain('user_id=42');
            expect(url).not.toContain('force_refresh');
        });

        it('добавляет force_refresh=true', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, found: true, user: {} }));

            await getMailingUserInfo('proj-1', 42, true);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('force_refresh=true');
        });

        it('возвращает данные пользователя', async () => {
            const userData = { success: true, found: true, user: { vk_id: 42, first_name: 'Test' } };
            mockFetch.mockResolvedValue(okResponse(userData));

            const result = await getMailingUserInfo('proj-1', 42);
            expect(result.found).toBe(true);
            expect(result.user).toBeTruthy();
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(errorResponse(500, 'VK API error'));

            await expect(getMailingUserInfo('proj-1', 42)).rejects.toThrow('VK API error');
        });
    });

    // ─── setDialogFocus ──────────────────────────────────────────

    describe('setDialogFocus', () => {
        it('отправляет POST при enter', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true }));

            await setDialogFocus('proj-1', 42, 'mgr-1', 'Иван', 'enter');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/dialog-focus');
            expect(opts.method).toBe('POST');
            const body = JSON.parse(opts.body);
            expect(body).toEqual({
                project_id: 'proj-1',
                vk_user_id: 42,
                manager_id: 'mgr-1',
                manager_name: 'Иван',
                action: 'enter',
            });
        });

        it('отправляет POST при leave', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true }));

            await setDialogFocus('proj-1', 42, 'mgr-1', 'Иван', 'leave');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.action).toBe('leave');
        });

        it('выбрасывает ошибку при неудаче', async () => {
            mockFetch.mockResolvedValue(errorResponse(422, 'Validation error'));

            await expect(setDialogFocus('proj-1', 42, 'mgr-1', 'Иван', 'enter')).rejects.toThrow('Validation error');
        });
    });

    // ─── toggleDialogImportant ───────────────────────────────────

    describe('toggleDialogImportant', () => {
        it('отправляет PUT с is_important=true', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, is_important: true }));

            await toggleDialogImportant('proj-1', 42, true);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/toggle-important');
            expect(opts.method).toBe('PUT');
            const body = JSON.parse(opts.body);
            expect(body.is_important).toBe(true);
        });

        it('отправляет PUT с is_important=false', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, is_important: false }));

            await toggleDialogImportant('proj-1', 42, false);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.is_important).toBe(false);
        });

        it('возвращает новый статус', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, is_important: true }));

            const result = await toggleDialogImportant('proj-1', 42, true);
            expect(result.is_important).toBe(true);
        });
    });

    // ─── getDialogFocuses ────────────────────────────────────────

    describe('getDialogFocuses', () => {
        it('отправляет GET с project_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, focuses: {} }));

            await getDialogFocuses('proj-1');

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('http://test-api.local/api/messages/dialog-focuses');
            expect(url).toContain('project_id=proj-1');
        });

        it('возвращает активные фокусы', async () => {
            const focuses = {
                '42': [{ manager_id: 'mgr-1', manager_name: 'Иван' }],
                '99': [{ manager_id: 'mgr-2', manager_name: 'Мария' }],
            };
            mockFetch.mockResolvedValue(okResponse({ success: true, focuses }));

            const result = await getDialogFocuses('proj-1');
            expect(Object.keys(result.focuses)).toHaveLength(2);
            expect(result.focuses['42'][0].manager_name).toBe('Иван');
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(errorResponse(500));

            await expect(getDialogFocuses('proj-1')).rejects.toThrow('Ошибка получения фокусов: 500');
        });
    });
});
