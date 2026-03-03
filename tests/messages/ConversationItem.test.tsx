/**
 * Тесты: ConversationItem
 * Проверяем рендер элемента списка диалогов:
 * — отображение имени, времени, аватара
 * — badge непрочитанных
 * — индикатор «печатает»
 * — индикатор менеджера
 * — клик → onClick вызывается
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversationItem } from '../../features/messages/components/conversations/ConversationItem';
import { Conversation, ConversationUser } from '../../features/messages/types';

/** Хелпер: создание мок-пользователя */
function createUser(overrides: Partial<ConversationUser> = {}): ConversationUser {
    return {
        id: '123',
        firstName: 'Иван',
        lastName: 'Петров',
        onlineStatus: 'offline',
        ...overrides,
    };
}

/** Хелпер: создание мок-диалога */
function createConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
        id: 'conv-1',
        user: createUser(),
        unreadCount: 0,
        channel: 'vk',
        projectId: 'proj-1',
        ...overrides,
    };
}

describe('ConversationItem', () => {
    // === Базовый рендер ===
    it('отображает имя и фамилию пользователя', () => {
        render(
            <ConversationItem
                conversation={createConversation()}
                isActive={false}
                onClick={vi.fn()}
            />
        );
        expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    it('отображает «Нет сообщений» когда нет lastMessage', () => {
        render(
            <ConversationItem
                conversation={createConversation({ lastMessage: undefined })}
                isActive={false}
                onClick={vi.fn()}
            />
        );
        expect(screen.getByText('Нет сообщений')).toBeInTheDocument();
    });

    // === Превью последнего сообщения ===
    it('показывает «Вы: » для исходящих сообщений', () => {
        const conv = createConversation({
            lastMessage: {
                id: 'msg-1',
                direction: 'outgoing',
                text: 'Привет!',
                timestamp: new Date().toISOString(),
                isRead: false,
            },
        });
        render(<ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />);
        expect(screen.getByText('Вы:')).toBeInTheDocument();
    });

    it('показывает имя пользователя для входящих сообщений', () => {
        const conv = createConversation({
            lastMessage: {
                id: 'msg-1',
                direction: 'incoming',
                text: 'Привет!',
                timestamp: new Date().toISOString(),
                isRead: false,
            },
        });
        render(<ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />);
        expect(screen.getByText('Иван:')).toBeInTheDocument();
    });

    // === Badge непрочитанных ===
    it('показывает badge непрочитанных при unreadCount > 0', () => {
        const conv = createConversation({ unreadCount: 5 });
        render(<ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('НЕ показывает badge при unreadCount = 0', () => {
        const conv = createConversation({ unreadCount: 0 });
        const { container } = render(
            <ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />
        );
        // Ищем элемент badge (bg-indigo-600 с числом)
        const badges = container.querySelectorAll('.bg-indigo-600');
        expect(badges.length).toBe(0);
    });

    // === Индикатор онлайн ===
    it('показывает индикатор онлайн при статусе online', () => {
        const conv = createConversation({
            user: createUser({ onlineStatus: 'online' }),
        });
        const { container } = render(
            <ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />
        );
        // Зелёная точка
        const greenDot = container.querySelector('.bg-green-400');
        expect(greenDot).toBeInTheDocument();
    });

    it('НЕ показывает индикатор онлайн при статусе offline', () => {
        const conv = createConversation({
            user: createUser({ onlineStatus: 'offline' }),
        });
        const { container } = render(
            <ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />
        );
        const greenDot = container.querySelector('.bg-green-400');
        expect(greenDot).not.toBeInTheDocument();
    });

    // === Клик ===
    it('вызывает onClick при клике на элемент', () => {
        const onClick = vi.fn();
        render(
            <ConversationItem
                conversation={createConversation()}
                isActive={false}
                onClick={onClick}
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    // === Активный элемент ===
    it('применяет стиль bg-indigo-50 к активному диалогу', () => {
        const { container } = render(
            <ConversationItem
                conversation={createConversation()}
                isActive={true}
                onClick={vi.fn()}
            />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('bg-indigo-50');
    });

    // === Индикатор «печатает...» ===
    it('показывает «печатает...» при isTyping=true', () => {
        render(
            <ConversationItem
                conversation={createConversation()}
                isActive={false}
                onClick={vi.fn()}
                isTyping={true}
            />
        );
        expect(screen.getByText('печатает...')).toBeInTheDocument();
    });

    // === Менеджер отвечает ===
    it('показывает «менеджер отвечает» при focusedManagers', () => {
        render(
            <ConversationItem
                conversation={createConversation()}
                isActive={false}
                onClick={vi.fn()}
                focusedManagers={[{ managerId: 'm-1', managerName: 'Алексей', since: Date.now() }]}
            />
        );
        expect(screen.getByText('Алексей отвечает')).toBeInTheDocument();
    });

    it('показывает «менеджеры отвечают» при нескольких менеджерах', () => {
        render(
            <ConversationItem
                conversation={createConversation()}
                isActive={false}
                onClick={vi.fn()}
                focusedManagers={[
                    { managerId: 'm-1', managerName: 'Алексей', since: Date.now() },
                    { managerId: 'm-2', managerName: 'Мария', since: Date.now() },
                ]}
            />
        );
        expect(screen.getByText('Алексей, Мария отвечают')).toBeInTheDocument();
    });

    // === Аватар-заглушка (инициалы) ===
    it('показывает инициалы если нет аватара', () => {
        const conv = createConversation({
            user: createUser({ avatarUrl: undefined }),
        });
        render(<ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />);
        expect(screen.getByText('ИП')).toBeInTheDocument();
    });

    // === Вложение без текста ===
    it('показывает «Вложение» для сообщения без текста но с вложением', () => {
        const conv = createConversation({
            lastMessage: {
                id: 'msg-2',
                direction: 'outgoing',
                text: '',
                timestamp: new Date().toISOString(),
                isRead: true,
                attachments: [{ type: 'photo', url: 'https://example.com/photo.jpg' }],
            },
        });
        render(<ConversationItem conversation={conv} isActive={false} onClick={vi.fn()} />);
        expect(screen.getByText('Вложение')).toBeInTheDocument();
    });
});
