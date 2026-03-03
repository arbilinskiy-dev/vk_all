/**
 * Тесты: ConversationsSidebar
 * Проверяем сайдбар со списком диалогов:
 * — рендер заголовка, счётчика
 * — поиск по имени
 * — underline фильтр «Все / Непрочитанные»
 * — состояния: загрузка, ошибка, пустой список
 * — «Прочитать все» через ConfirmationModal
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Мокаем тяжёлые зависимости
vi.mock('../../features/messages/components/conversations/ConversationItem', () => ({
    ConversationItem: ({ conversation, onClick }: any) => (
        <button data-testid={`conv-${conversation.id}`} onClick={onClick}>
            {conversation.user.firstName} {conversation.user.lastName}
        </button>
    ),
}));

vi.mock('../../features/messages/components/chat/MailingOnboarding', () => ({
    MailingOnboarding: () => <div data-testid="mailing-onboarding" />,
}));

vi.mock('../../features/messages/hooks/mailing/useMailingCollection', () => ({
    useMailingCollection: () => ({
        readiness: 'ready',
        isCollecting: false,
    }),
}));

vi.mock('../../shared/components/modals/ConfirmationModal', () => ({
    ConfirmationModal: ({ title, onConfirm, onCancel }: any) => (
        <div data-testid="confirmation-modal">
            <span>{title}</span>
            <button data-testid="confirm-btn" onClick={onConfirm}>Подтвердить</button>
            <button data-testid="cancel-btn" onClick={onCancel}>Отмена</button>
        </div>
    ),
}));

import { ConversationsSidebar } from '../../features/messages/components/conversations/ConversationsSidebar';
import { Conversation } from '../../features/messages/types';

/** Мок-диалог */
function createConv(id: string, firstName: string, lastName: string, unreadCount = 0): Conversation {
    return {
        id,
        user: { id, firstName, lastName, onlineStatus: 'offline' },
        unreadCount,
        channel: 'vk',
        projectId: 'proj-1',
    };
}

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof ConversationsSidebar>> = {}) {
    return {
        conversations: [
            createConv('1', 'Алексей', 'Смирнов', 3),
            createConv('2', 'Мария', 'Козлова', 0),
            createConv('3', 'Дмитрий', 'Петров', 1),
        ],
        activeConversationId: null,
        onSelectConversation: vi.fn(),
        projectName: 'Тестовый проект',
        ...overrides,
    };
}

describe('ConversationsSidebar', () => {
    // === Базовый рендер ===
    it('рендерит заголовок «Диалоги»', () => {
        render(<ConversationsSidebar {...createProps()} />);
        expect(screen.getByText('Диалоги')).toBeInTheDocument();
    });

    it('отображает название проекта', () => {
        render(<ConversationsSidebar {...createProps()} />);
        expect(screen.getByText('Тестовый проект')).toBeInTheDocument();
    });

    it('отображает счётчик пользователей', () => {
        render(<ConversationsSidebar {...createProps({ totalCount: 42 })} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    // === Список диалогов ===
    it('рендерит все 3 диалога', () => {
        render(<ConversationsSidebar {...createProps()} />);
        expect(screen.getByTestId('conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conv-3')).toBeInTheDocument();
    });

    it('вызывает onSelectConversation при клике на диалог', () => {
        const onSelect = vi.fn();
        render(<ConversationsSidebar {...createProps({ onSelectConversation: onSelect })} />);
        fireEvent.click(screen.getByTestId('conv-1'));
        expect(onSelect).toHaveBeenCalledWith('1');
    });

    // === Поиск ===
    it('фильтрует диалоги по имени', () => {
        render(<ConversationsSidebar {...createProps()} />);
        const input = screen.getByPlaceholderText('Поиск по имени...');
        fireEvent.change(input, { target: { value: 'Мария' } });
        // Остаётся только Мария
        expect(screen.getByTestId('conv-2')).toBeInTheDocument();
        expect(screen.queryByTestId('conv-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('conv-3')).not.toBeInTheDocument();
    });

    it('показывает «Пользователи не найдены» при пустом результате поиска', () => {
        render(<ConversationsSidebar {...createProps()} />);
        const input = screen.getByPlaceholderText('Поиск по имени...');
        fireEvent.change(input, { target: { value: 'Несуществующий' } });
        expect(screen.getByText('Пользователи не найдены')).toBeInTheDocument();
    });

    it('очищает поиск по клику на крестик', () => {
        render(<ConversationsSidebar {...createProps()} />);
        const input = screen.getByPlaceholderText('Поиск по имени...');
        fireEvent.change(input, { target: { value: 'тест' } });
        // Находим кнопку «Сбросить поиск»
        const clearBtn = screen.getByTitle('Сбросить поиск');
        fireEvent.click(clearBtn);
        // Снова видим все диалоги
        expect(screen.getByTestId('conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conv-3')).toBeInTheDocument();
    });

    // === Фильтр непрочитанных (underline табы) ===
    it('рендерит табы «Все / Непрочитанные» при наличии onFilterUnreadChange', () => {
        render(<ConversationsSidebar {...createProps({ onFilterUnreadChange: vi.fn() })} />);
        expect(screen.getByText('Все')).toBeInTheDocument();
        expect(screen.getByText('Непрочитанные')).toBeInTheDocument();
    });

    it('вызывает onFilterUnreadChange при клике на таб «Непрочитанные»', () => {
        const onFilter = vi.fn();
        render(<ConversationsSidebar {...createProps({ onFilterUnreadChange: onFilter })} />);
        fireEvent.click(screen.getByText('Непрочитанные'));
        expect(onFilter).toHaveBeenCalledWith('unread');
    });

    // === Кнопка «Прочитать все» ===
    it('показывает кнопку «Прочитать все» при наличии onMarkAllRead', () => {
        render(<ConversationsSidebar {...createProps({
            onFilterUnreadChange: vi.fn(),
            onMarkAllRead: vi.fn(),
        })} />);
        expect(screen.getByText('Прочитать все')).toBeInTheDocument();
    });

    it('открывает ConfirmationModal при клике на «Прочитать все»', () => {
        render(<ConversationsSidebar {...createProps({
            onFilterUnreadChange: vi.fn(),
            onMarkAllRead: vi.fn(),
        })} />);
        fireEvent.click(screen.getByText('Прочитать все'));
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    // === Состояние загрузки ===
    it('показывает «Загрузка списка рассылки...» при isLoading без данных', () => {
        render(<ConversationsSidebar {...createProps({ isLoading: true, conversations: [] })} />);
        expect(screen.getByText('Загрузка списка рассылки...')).toBeInTheDocument();
    });

    // === Состояние ошибки ===
    it('показывает текст ошибки', () => {
        render(<ConversationsSidebar {...createProps({ error: 'Ошибка загрузки' })} />);
        expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
    });

    it('рендерит кнопку «Повторить» при ошибке и наличии onRefresh', () => {
        render(<ConversationsSidebar {...createProps({ error: 'Ошибка', onRefresh: vi.fn() })} />);
        expect(screen.getByText('Повторить')).toBeInTheDocument();
    });

    // === Кнопка обновления ===
    it('рендерит кнопку обновления при наличии onRefresh', () => {
        render(<ConversationsSidebar {...createProps({ onRefresh: vi.fn() })} />);
        expect(screen.getByTitle('Обновить список')).toBeInTheDocument();
    });

    it('вызывает onRefresh при клике на обновление', () => {
        const onRefresh = vi.fn();
        render(<ConversationsSidebar {...createProps({ onRefresh })} />);
        fireEvent.click(screen.getByTitle('Обновить список'));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });
});
