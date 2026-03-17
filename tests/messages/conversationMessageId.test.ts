/**
 * Тесты: conversationMessageId маппинг
 * Проверяем: mapVkMessage корректно маппит conversation_message_id
 */

import { describe, it, expect } from 'vitest';
import { mapVkMessage } from '../../features/messages/hooks/chat/messageHistoryMappers';

describe('mapVkMessage — conversationMessageId', () => {
    const baseItem = {
        id: 100,
        peer_id: 12345,
        from_id: 12345,
        text: 'Тестовое сообщение',
        date: 1700000000,
        out: 0,
        read_state: 1,
    };

    it('маппит conversation_message_id если присутствует', () => {
        const item = { ...baseItem, conversation_message_id: 42 };
        const result = mapVkMessage(item, 100500);
        expect(result.conversationMessageId).toBe(42);
    });

    it('conversationMessageId = undefined если поля нет', () => {
        const result = mapVkMessage(baseItem, 100500);
        expect(result.conversationMessageId).toBeUndefined();
    });

    it('маппит остальные поля корректно', () => {
        const item = { ...baseItem, conversation_message_id: 7 };
        const result = mapVkMessage(item, 100500);
        expect(result.id).toBe('100');
        expect(result.direction).toBe('incoming');
        expect(result.text).toBe('Тестовое сообщение');
        expect(result.fromId).toBe(12345);
    });
});
