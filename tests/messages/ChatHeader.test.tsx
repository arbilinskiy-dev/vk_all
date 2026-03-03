/**
 * Тесты: ChatHeader
 * Проверяем рендер шапки чата:
 * — отображение имени, статуса
 * — поиск: открытие/закрытие
 * — фильтры отображения: тумблеры
 * — кнопки действий
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatHeader } from '../../features/messages/components/chat/ChatHeader';
import { ConversationUser, ChatDisplayFilters } from '../../features/messages/types';

/** Мок-пользователь */
function createUser(overrides: Partial<ConversationUser> = {}): ConversationUser {
    return {
        id: '100',
        firstName: 'Анна',
        lastName: 'Сидорова',
        onlineStatus: 'online',
        ...overrides,
    };
}

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof ChatHeader>> = {}) {
    return {
        user: createUser(),
        searchQuery: '',
        searchFilter: 'all' as const,
        onSearchChange: vi.fn(),
        onFilterChange: vi.fn(),
        displayFilters: { hideAttachments: false, hideKeyboard: false } as ChatDisplayFilters,
        onDisplayFiltersChange: vi.fn(),
        ...overrides,
    };
}

describe('ChatHeader', () => {
    // === Имя и статус ===
    it('отображает имя пользователя', () => {
        render(<ChatHeader {...createProps()} />);
        expect(screen.getByText('Анна Сидорова')).toBeInTheDocument();
    });

    it('показывает «в сети» для статуса online', () => {
        render(<ChatHeader {...createProps()} />);
        expect(screen.getByText('в сети')).toBeInTheDocument();
    });

    it('показывает «не в сети» для статуса offline без lastSeen', () => {
        render(<ChatHeader {...createProps({ user: createUser({ onlineStatus: 'offline' }) })} />);
        expect(screen.getByText('не в сети')).toBeInTheDocument();
    });

    it('показывает «был(а) недавно» для статуса recently', () => {
        render(<ChatHeader {...createProps({ user: createUser({ onlineStatus: 'recently' }) })} />);
        expect(screen.getByText('был(а) недавно')).toBeInTheDocument();
    });

    // === Индикатор онлайн (зелёная точка) ===
    it('показывает зелёную точку при online', () => {
        const { container } = render(<ChatHeader {...createProps()} />);
        expect(container.querySelector('.bg-green-400')).toBeInTheDocument();
    });

    it('НЕ показывает зелёную точку при offline', () => {
        const { container } = render(
            <ChatHeader {...createProps({ user: createUser({ onlineStatus: 'offline' }) })} />
        );
        expect(container.querySelector('.bg-green-400')).not.toBeInTheDocument();
    });

    // === Аватар-заглушка ===
    it('показывает инициалы если нет аватара', () => {
        render(<ChatHeader {...createProps({ user: createUser({ avatarUrl: undefined }) })} />);
        expect(screen.getByText('АС')).toBeInTheDocument();
    });

    // === Поиск ===
    it('открывает панель поиска по клику на кнопку', () => {
        render(<ChatHeader {...createProps()} />);
        const searchBtn = screen.getByTitle('Поиск по диалогу');
        fireEvent.click(searchBtn);
        expect(screen.getByPlaceholderText('Поиск по сообщениям...')).toBeInTheDocument();
    });

    it('очищает поиск при закрытии панели', () => {
        const onSearchChange = vi.fn();
        render(<ChatHeader {...createProps({ onSearchChange })} />);
        const searchBtn = screen.getByTitle('Поиск по диалогу');
        // Открытие
        fireEvent.click(searchBtn);
        // Закрытие
        fireEvent.click(searchBtn);
        expect(onSearchChange).toHaveBeenCalledWith('');
    });

    // === Фильтры ===
    it('открывает панель фильтров', () => {
        render(<ChatHeader {...createProps()} />);
        const filterBtn = screen.getByTitle('Фильтры отображения');
        fireEvent.click(filterBtn);
        expect(screen.getByText('Фильтры отображения')).toBeInTheDocument();
    });

    it('рендерит тумблеры «Скрыть вложения» и «Скрыть кнопки»', () => {
        render(<ChatHeader {...createProps()} />);
        const filterBtn = screen.getByTitle('Фильтры отображения');
        fireEvent.click(filterBtn);
        expect(screen.getByText('Скрыть вложения')).toBeInTheDocument();
        expect(screen.getByText('Скрыть кнопки')).toBeInTheDocument();
    });

    it('переключает тумблер hideAttachments', () => {
        const onDisplayFiltersChange = vi.fn();
        render(<ChatHeader {...createProps({ onDisplayFiltersChange })} />);
        // Открыть фильтры
        fireEvent.click(screen.getByTitle('Фильтры отображения'));
        // Кликаем по тумблеру (кнопка с h-6 w-11)
        const toggleButtons = screen.getByText('Скрыть вложения').closest('label')?.querySelector('button');
        if (toggleButtons) fireEvent.click(toggleButtons);
        expect(onDisplayFiltersChange).toHaveBeenCalledWith({ hideAttachments: true, hideKeyboard: false });
    });

    // === Кнопка обновления ===
    it('рендерит кнопку обновления при наличии onRefresh', () => {
        render(<ChatHeader {...createProps({ onRefresh: vi.fn() })} />);
        expect(screen.getByTitle(/Обновить историю/)).toBeInTheDocument();
    });

    it('НЕ рендерит кнопку обновления без onRefresh', () => {
        render(<ChatHeader {...createProps()} />);
        expect(screen.queryByTitle(/Обновить историю/)).not.toBeInTheDocument();
    });

    it('вызывает onRefresh при клике', () => {
        const onRefresh = vi.fn();
        render(<ChatHeader {...createProps({ onRefresh })} />);
        fireEvent.click(screen.getByTitle(/Обновить историю/));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    // === Кнопка «Открыть в VK» ===
    it('рендерит ссылку на VK при наличии vkDialogUrl', () => {
        render(<ChatHeader {...createProps({ vkDialogUrl: 'https://vk.com/gim12345?sel=100' })} />);
        const link = screen.getByTitle('Открыть диалог в VK');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://vk.com/gim12345?sel=100');
        expect(link).toHaveAttribute('target', '_blank');
    });

    // === Underline табы фильтра направления ===
    it('рендерит табы «Все / Наши / Пользователя» в фильтрах', () => {
        render(<ChatHeader {...createProps()} />);
        fireEvent.click(screen.getByTitle('Фильтры отображения'));
        expect(screen.getByText('Все')).toBeInTheDocument();
        expect(screen.getByText('Наши')).toBeInTheDocument();
        expect(screen.getByText('Пользователя')).toBeInTheDocument();
    });

    it('вызывает onFilterChange при клике на таб «Наши»', () => {
        const onFilterChange = vi.fn();
        render(<ChatHeader {...createProps({ onFilterChange })} />);
        fireEvent.click(screen.getByTitle('Фильтры отображения'));
        // Кликаем на «Наши» — первый в фильтрах
        const allButtons = screen.getAllByText('Наши');
        fireEvent.click(allButtons[0]);
        expect(onFilterChange).toHaveBeenCalledWith('outgoing');
    });
});
