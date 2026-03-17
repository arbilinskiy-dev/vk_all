/**
 * Тесты: messageHistoryMappers
 * Проверяем маппинг VK API данных в формат приложения:
 * — fromId передаётся из VK API в ChatMessageData
 * — direction определяется корректно
 * — вложения маппятся
 */
import { describe, it, expect } from 'vitest';
import { mapVkMessage, mapVkAttachment } from '../../features/messages/hooks/chat/messageHistoryMappers';
import { VkMessageItem } from '../../services/api/messages.api';

/** Хелпер: создание мок-сообщения VK API */
function createVkMessage(overrides: Partial<VkMessageItem> = {}): VkMessageItem {
    return {
        id: 1001,
        from_id: 12345,
        peer_id: 12345,
        text: 'Привет!',
        date: 1700000100,
        out: 0,
        read_state: 0,
        ...overrides,
    } as VkMessageItem;
}

const GROUP_ID = 123456;

describe('mapVkMessage', () => {
    it('передаёт fromId из VK API в ChatMessageData', () => {
        const result = mapVkMessage(createVkMessage({ from_id: 54321 }), GROUP_ID);
        expect(result.fromId).toBe(54321);
    });

    it('fromId для сообщения из группового чата (от участника)', () => {
        const result = mapVkMessage(createVkMessage({
            from_id: 100,
            peer_id: 2000000001,
            out: 0,
        }), GROUP_ID);
        expect(result.fromId).toBe(100);
        expect(result.direction).toBe('incoming');
    });

    it('fromId для исходящего сообщения от сообщества', () => {
        const result = mapVkMessage(createVkMessage({
            from_id: -GROUP_ID,
            out: 1,
        }), GROUP_ID);
        expect(result.fromId).toBe(-GROUP_ID);
        expect(result.direction).toBe('outgoing');
    });

    it('маппит текст и timestamp', () => {
        const result = mapVkMessage(createVkMessage({
            text: 'Тестовое сообщение',
            date: 1700000200,
        }), GROUP_ID);
        expect(result.text).toBe('Тестовое сообщение');
        expect(result.timestamp).toBeTruthy();
    });

    it('маппит replyMessage если есть', () => {
        const result = mapVkMessage(createVkMessage({
            reply_message: { id: 999, text: 'Исходный', from_id: 12345, out: 0, date: 1700000000 },
        }), GROUP_ID);
        expect(result.replyMessage).toBeDefined();
        expect(result.replyMessage!.text).toBe('Исходный');
    });

    it('маппит forwardedMessages если есть', () => {
        const result = mapVkMessage(createVkMessage({
            fwd_messages: [
                { id: 888, text: 'Пересланное', from_id: 100, out: 0, date: 1700000000 },
            ],
        }), GROUP_ID);
        expect(result.forwardedMessages).toBeDefined();
        expect(result.forwardedMessages!.length).toBe(1);
        expect(result.forwardedMessages![0].text).toBe('Пересланное');
    });
});

describe('mapVkAttachment', () => {
    it('маппит фото', () => {
        const result = mapVkAttachment({
            type: 'photo',
            photo: {
                sizes: [
                    { url: 'https://example.com/small.jpg', width: 100, height: 100 },
                    { url: 'https://example.com/large.jpg', width: 800, height: 600 },
                ],
            },
        });
        expect(result).not.toBeNull();
        expect(result!.type).toBe('photo');
        expect(result!.url).toBe('https://example.com/large.jpg');
    });

    it('возвращает null для unknown с дефолтным fallback', () => {
        const result = mapVkAttachment({ type: 'unknown_type' } as any);
        // Неизвестный тип возвращает объект с type 'unknown'
        expect(result).toBeDefined();
        expect(result!.type).toBe('unknown');
    });
});
