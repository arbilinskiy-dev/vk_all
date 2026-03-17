/**
 * Тесты: messages.chat.api.ts
 * Проверяем: getMessageHistory, loadAllMessages, sendMessage, uploadMessageAttachment, sendTypingStatus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://test-api.local/api',
}));

vi.mock('../../shared/utils/apiClient', () => ({
    getAuthHeaders: vi.fn((includeContentType = true) => {
        const h: Record<string, string> = { 'X-Session-Token': 'test-token' };
        if (includeContentType) h['Content-Type'] = 'application/json';
        return h;
    }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
    getMessageHistory,
    loadAllMessages,
    sendMessage,
    uploadMessageAttachment,
    sendTypingStatus,
} from '../../services/api/messages.chat.api';

function okResponse(data: unknown) {
    return { ok: true, status: 200, json: async () => data };
}
function errorResponse(status: number, detail?: string) {
    return { ok: false, status, json: async () => (detail ? { detail } : {}) };
}

describe('messages.chat.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getMessageHistory ───────────────────────────────────────

    describe('getMessageHistory', () => {
        const mockHistory = { success: true, count: 5, items: [] };

        it('отправляет GET с базовыми параметрами', async () => {
            mockFetch.mockResolvedValue(okResponse(mockHistory));

            await getMessageHistory('proj-1', 12345);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('project_id=proj-1');
            expect(url).toContain('user_id=12345');
            expect(url).toContain('count=200');
            expect(url).toContain('offset=0');
        });

        it('добавляет опциональные параметры', async () => {
            mockFetch.mockResolvedValue(okResponse(mockHistory));

            await getMessageHistory('proj-1', 12345, 50, 100, true, true, 'incoming', 'привет');

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).toContain('count=50');
            expect(url).toContain('offset=100');
            expect(url).toContain('force_refresh=true');
            expect(url).toContain('include_user_info=true');
            expect(url).toContain('direction=incoming');
            expect(url).toContain('search=');
        });

        it('не добавляет force_refresh/include_user_info когда false', async () => {
            mockFetch.mockResolvedValue(okResponse(mockHistory));

            await getMessageHistory('proj-1', 12345, 200, 0, false, false);

            const url = mockFetch.mock.calls[0][0] as string;
            expect(url).not.toContain('force_refresh');
            expect(url).not.toContain('include_user_info');
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(errorResponse(500, 'DB error'));

            await expect(getMessageHistory('proj-1', 1)).rejects.toThrow('DB error');
        });
    });

    // ─── loadAllMessages ─────────────────────────────────────────

    describe('loadAllMessages', () => {
        it('отправляет POST с project_id и user_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, total_loaded: 500, total_count: 500, already_loaded: false }));

            await loadAllMessages('proj-1', 99);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/history/all');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual({ project_id: 'proj-1', user_id: 99 });
        });

        it('возвращает результат загрузки', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, total_loaded: 100, total_count: 100, already_loaded: true }));

            const result = await loadAllMessages('proj-1', 99);
            expect(result.already_loaded).toBe(true);
            expect(result.total_loaded).toBe(100);
        });
    });

    // ─── sendMessage ─────────────────────────────────────────────

    describe('sendMessage', () => {
        it('отправляет POST с минимальными параметрами', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, message_id: 1, item: {} }));

            await sendMessage('proj-1', 42, 'Привет!');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.project_id).toBe('proj-1');
            expect(body.user_id).toBe(42);
            expect(body.message).toBe('Привет!');
            expect(body.sender_id).toBeUndefined();
            expect(body.sender_name).toBeUndefined();
            expect(body.attachment).toBeUndefined();
        });

        it('передаёт sender_id, sender_name и attachment', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true, message_id: 2, item: {} }));

            await sendMessage('proj-1', 42, 'Фото', 'mgr-1', 'Иван', 'photo123_456');

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.sender_id).toBe('mgr-1');
            expect(body.sender_name).toBe('Иван');
            expect(body.attachment).toBe('photo123_456');
        });

        it('выбрасывает ошибку при неудачной отправке', async () => {
            mockFetch.mockResolvedValue(errorResponse(403, 'Сообщения запрещены'));

            await expect(sendMessage('proj-1', 42, 'тест')).rejects.toThrow('Сообщения запрещены');
        });
    });

    // ─── uploadMessageAttachment ─────────────────────────────────

    describe('uploadMessageAttachment', () => {
        it('отправляет FormData без Content-Type', async () => {
            mockFetch.mockResolvedValue(okResponse({
                success: true,
                attachment_id: 'photo-1_2',
                attachment_type: 'photo',
                preview_url: 'https://example.com/photo.jpg',
            }));

            const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
            await uploadMessageAttachment('proj-1', 42, file);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/upload-attachment');
            expect(opts.method).toBe('POST');
            // Проверяем что тело — FormData
            expect(opts.body).toBeInstanceOf(FormData);
            // Проверяем что Content-Type НЕ установлен (для FormData)
            expect(opts.headers['Content-Type']).toBeUndefined();
        });

        it('возвращает attachment_id', async () => {
            mockFetch.mockResolvedValue(okResponse({
                success: true,
                attachment_id: 'doc-1_99',
                attachment_type: 'document',
                preview_url: '',
            }));

            const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
            const result = await uploadMessageAttachment('proj-1', 42, file);
            expect(result.attachment_id).toBe('doc-1_99');
        });
    });

    // ─── sendTypingStatus ────────────────────────────────────────

    describe('sendTypingStatus', () => {
        it('отправляет POST с project_id и user_id', async () => {
            mockFetch.mockResolvedValue(okResponse({ success: true }));

            await sendTypingStatus('proj-1', 42);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api.local/api/messages/typing');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual({ project_id: 'proj-1', user_id: 42 });
        });
    });
});
