/**
 * Тесты: ForwardToChatModal.tsx
 * Проверяем: рендер модала, выбор чата, отправку пересылки
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ForwardToChatModal } from '../../features/messages/components/chat/ForwardToChatModal';
import type { Conversation, ChatMessageData } from '../../features/messages/types';

// Мок-данные: групповые чаты
const mockGroupChats: Conversation[] = [
    {
        id: 'chat-2000000001',
        user: { id: '2000000001', firstName: 'Чат менеджеров', lastName: '', onlineStatus: 'online' as const },
        unreadCount: 0,
        channel: 'vk',
        projectId: 'proj-1',
        isGroupChat: true,
        membersCount: 5,
        peerId: 2000000001,
    },
    {
        id: 'chat-2000000002',
        user: { id: '2000000002', firstName: 'Чат владельцев', lastName: '', onlineStatus: 'offline' as const },
        unreadCount: 0,
        channel: 'vk',
        projectId: 'proj-1',
        isGroupChat: true,
        membersCount: 3,
        peerId: 2000000002,
    },
];

// Обычный диалог — не должен показываться в списке
const mockRegularConversation: Conversation = {
    id: 'conv-12345',
    user: { id: '12345', firstName: 'Иван', lastName: 'Иванов', onlineStatus: 'online' as const },
    unreadCount: 2,
    channel: 'vk',
    projectId: 'proj-1',
};

const mockSelectedMessages: ChatMessageData[] = [
    {
        id: '100',
        conversationMessageId: 10,
        direction: 'incoming',
        fromId: 12345,
        text: 'Сообщение от клиента',
        timestamp: new Date().toISOString(),
        isRead: true,
    },
    {
        id: '101',
        conversationMessageId: 11,
        direction: 'outgoing',
        fromId: -100,
        text: 'Ответ менеджера',
        timestamp: new Date().toISOString(),
        isRead: true,
    },
];

describe('ForwardToChatModal', () => {
    const mockOnSend = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const allConversations = [...mockGroupChats, mockRegularConversation];

    it('рендерит заголовок с количеством сообщений', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Переслать в чат')).toBeTruthy();
        expect(screen.getByText(/2 сообщений/)).toBeTruthy();
    });

    it('показывает только групповые чаты (не обычные диалоги)', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Чат менеджеров')).toBeTruthy();
        expect(screen.getByText('Чат владельцев')).toBeTruthy();
        expect(screen.queryByText('Иван')).toBeFalsy(); // Обычный диалог не показывается в списке чатов
    });

    it('исключает sourcePeerId из списка чатов', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={2000000001} // Если мы уже в этом чате
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.queryByText('Чат менеджеров')).toBeFalsy();
        expect(screen.getByText('Чат владельцев')).toBeTruthy();
    });

    it('кнопка "Переслать" заблокирована без выбора чата', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        const sendButton = screen.getByText('Переслать');
        expect(sendButton.closest('button')?.disabled).toBe(true);
    });

    it('выбор чата и отправка', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        // Кликаем по чату
        fireEvent.click(screen.getByText('Чат менеджеров'));

        // Кнопка активна
        const sendButton = screen.getByText('Переслать');
        expect(sendButton.closest('button')?.disabled).toBe(false);

        // Отправляем
        fireEvent.click(sendButton);
        expect(mockOnSend).toHaveBeenCalledWith(2000000001, '');
    });

    it('отправка с комментарием', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        fireEvent.click(screen.getByText('Чат владельцев'));

        // Вводим комментарий
        const textarea = screen.getByPlaceholderText('Комментарий (необязательно)...');
        fireEvent.change(textarea, { target: { value: 'Внимание, негатив!' } });

        fireEvent.click(screen.getByText('Переслать'));
        expect(mockOnSend).toHaveBeenCalledWith(2000000002, 'Внимание, негатив!');
    });

    it('закрытие модала по кнопке "Отмена"', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        fireEvent.click(screen.getByText('Отмена'));
        expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('превью выбранных сообщений', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Сообщение от клиента')).toBeTruthy();
        expect(screen.getByText('Ответ менеджера')).toBeTruthy();
    });

    it('показывает количество участников чата', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('5 участников')).toBeTruthy();
        expect(screen.getByText('3 участников')).toBeTruthy();
    });

    it('состояние загрузки блокирует кнопки', () => {
        render(
            <ForwardToChatModal
                conversations={allConversations}
                selectedMessages={mockSelectedMessages}
                userName="Иван"
                sourcePeerId={12345}
                isSending={true}
                onSend={mockOnSend}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('Отправка...')).toBeTruthy();
    });
});
