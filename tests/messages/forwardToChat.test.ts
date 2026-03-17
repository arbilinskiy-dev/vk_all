/**
 * Тесты: forwardToChat API
 * Проверяем: формирование запроса пересылки между диалогами
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://test-api.local/api',
}));

vi.mock('../../shared/utils/apiClient', () => ({
    getAuthHeaders: vi.fn(() => ({
        'X-Session-Token': 'test-token',
        'Content-Type': 'application/json',
    })),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { forwardToChat } from '../../services/api/messages.chat.api';

describe('forwardToChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('отправляет POST с корректным forward JSON', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, message_id: 999 }),
        });

        await forwardToChat(
            'proj-1',          // projectId
            2000000001,        // targetPeerId
            12345,             // sourcePeerId
            [10, 11, 12],      // conversationMessageIds
            100500,            // groupId
            'mgr_123',         // senderId
            'Админ',            // senderName
            'Внимание, негатив' // comment
        );

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('http://test-api.local/api/messages/send');
        expect(options.method).toBe('POST');

        const body = JSON.parse(options.body);
        expect(body.project_id).toBe('proj-1');
        expect(body.user_id).toBe(2000000001);
        expect(body.message).toBe('Внимание, негатив');
        expect(body.sender_id).toBe('mgr_123');
        expect(body.sender_name).toBe('Админ');

        // forward — JSON строка с параметрами кросс-диалоговой пересылки
        const forwardData = JSON.parse(body.forward);
        expect(forwardData.peer_id).toBe(12345);
        expect(forwardData.conversation_message_ids).toEqual([10, 11, 12]);
        expect(forwardData.owner_id).toBe(-100500);
    });

    it('отправляет пустой комментарий если не указан', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, message_id: 1000 }),
        });

        await forwardToChat('proj-1', 2000000002, 12345, [5], 200);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.message).toBe('');
        expect(body.sender_id).toBeUndefined();
        expect(body.sender_name).toBeUndefined();
    });

    it('выбрасывает ошибку при неудачном ответе', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ detail: 'Нет доступа к чату' }),
        });

        await expect(
            forwardToChat('proj-1', 2000000001, 12345, [10], 100)
        ).rejects.toThrow('Нет доступа к чату');
    });

    it('использует дефолтное сообщение об ошибке при отсутствии detail', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        await expect(
            forwardToChat('proj-1', 2000000001, 12345, [10], 100)
        ).rejects.toThrow('Ошибка пересылки сообщений: 500');
    });
});
