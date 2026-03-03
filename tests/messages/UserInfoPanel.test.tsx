/**
 * Тесты: UserInfoPanel
 * Проверяем рендер панели информации о пользователе:
 * — состояния загрузки, ошибки, «не найден»
 * — отображение профиля: имя, аватар, ссылка
 * — переключение вкладок (underline стиль)
 * — статистика сообщений
 * — информационные строки
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Мокаем дочерние компоненты-вкладки (тяжёлые, тестируем отдельно)
vi.mock('../../features/messages/components/user-info/UserPostsTab', () => ({
    UserPostsTab: () => <div data-testid="user-posts-tab" />,
}));

vi.mock('../../features/messages/components/attachments/AttachmentsTab', () => ({
    AttachmentsTab: () => <div data-testid="attachments-tab" />,
}));

// Мокаем ImagePreviewModal (чтобы не тянуть зависимости)
vi.mock('../../shared/components/modals/ImagePreviewModal', () => ({
    ImagePreviewModal: () => null,
}));

import { UserInfoPanel } from '../../features/messages/components/user-info/UserInfoPanel';
import { ConversationUser, MailingUserInfo } from '../../features/messages/types';

/** Мок ConversationUser */
function createUser(overrides: Partial<ConversationUser> = {}): ConversationUser {
    return {
        id: '200',
        firstName: 'Мария',
        lastName: 'Иванова',
        onlineStatus: 'online',
        ...overrides,
    };
}

/** Мок MailingUserInfo */
function createUserInfo(overrides: Partial<MailingUserInfo> = {}): MailingUserInfo {
    return {
        vk_user_id: 200,
        first_name: 'Мария',
        last_name: 'Иванова',
        domain: 'mivanova',
        city: 'Москва',
        country: 'Россия',
        can_access_closed: true,
        can_write_private_message: true,
        added_at: '2025-06-15T10:00:00Z',
        first_message_date: '2025-06-15T10:00:00Z',
        last_incoming_message_date: '2026-02-20T14:00:00Z',
        last_outgoing_message_date: '2026-02-21T09:00:00Z',
        ...overrides,
    };
}

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof UserInfoPanel>> = {}) {
    return {
        userInfo: createUserInfo(),
        user: createUser(),
        isLoading: false,
        error: null,
        isFound: true,
        ...overrides,
    };
}

describe('UserInfoPanel', () => {
    // === Состояние загрузки ===
    it('показывает «Загрузка профиля...» при isLoading=true и без данных', () => {
        render(<UserInfoPanel {...createProps({ isLoading: true, userInfo: null })} />);
        expect(screen.getByText('Загрузка профиля...')).toBeInTheDocument();
    });

    // === Состояние ошибки ===
    it('показывает текст ошибки', () => {
        render(<UserInfoPanel {...createProps({ error: 'Ошибка сервера' })} />);
        expect(screen.getByText('Ошибка сервера')).toBeInTheDocument();
    });

    // === Не найден в рассылке ===
    it('показывает «не найден в базе рассылки» при isFound=false', () => {
        render(<UserInfoPanel {...createProps({ isFound: false, userInfo: null })} />);
        expect(screen.getByText('Пользователь не найден в базе рассылки')).toBeInTheDocument();
    });

    // === Базовый рендер профиля ===
    it('отображает имя пользователя', () => {
        render(<UserInfoPanel {...createProps()} />);
        expect(screen.getByText('Мария Иванова')).toBeInTheDocument();
    });

    it('отображает ссылку на VK', () => {
        render(<UserInfoPanel {...createProps()} />);
        const link = screen.getByText('vk.com/mivanova');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://vk.com/mivanova');
    });

    it('показывает статус «Можно писать» при can_write_private_message=true', () => {
        render(<UserInfoPanel {...createProps()} />);
        expect(screen.getByText('Можно писать')).toBeInTheDocument();
    });

    it('показывает статус «Нельзя писать» при can_write_private_message=false', () => {
        render(<UserInfoPanel {...createProps({ userInfo: createUserInfo({ can_write_private_message: false }) })} />);
        expect(screen.getByText('Нельзя писать')).toBeInTheDocument();
    });

    // === Инициалы аватара ===
    it('показывает инициалы если нет аватара', () => {
        render(<UserInfoPanel {...createProps({ user: createUser({ avatarUrl: undefined }) })} />);
        expect(screen.getByText('МИ')).toBeInTheDocument();
    });

    // === Вкладки (underline-стиль) ===
    it('рендерит вкладки «Профиль», «Посты», «Вложения»', () => {
        render(<UserInfoPanel {...createProps()} />);
        expect(screen.getByText('Профиль')).toBeInTheDocument();
        expect(screen.getByText(/Посты/)).toBeInTheDocument();
        expect(screen.getByText('Вложения')).toBeInTheDocument();
    });

    it('показывает счётчик постов в табе', () => {
        render(<UserInfoPanel {...createProps({ userPostsTotalCount: 12 })} />);
        expect(screen.getByText('Посты - 12')).toBeInTheDocument();
    });

    it('переключается на вкладку «Посты» по клику', () => {
        render(<UserInfoPanel {...createProps()} />);
        fireEvent.click(screen.getByText(/Посты/));
        expect(screen.getByTestId('user-posts-tab')).toBeInTheDocument();
    });

    it('переключается на вкладку «Вложения» по клику', () => {
        render(<UserInfoPanel {...createProps()} />);
        fireEvent.click(screen.getByText('Вложения'));
        expect(screen.getByTestId('attachments-tab')).toBeInTheDocument();
    });

    // === Информационные строки ===
    it('отображает город', () => {
        render(<UserInfoPanel {...createProps()} />);
        expect(screen.getByText('Москва')).toBeInTheDocument();
    });

    it('отображает страну как subValue если отличается от города', () => {
        render(<UserInfoPanel {...createProps()} />);
        expect(screen.getByText('Россия')).toBeInTheDocument();
    });

    // === Статистика сообщений ===
    it('рендерит блок статистики сообщений', () => {
        render(
            <UserInfoPanel {...createProps({
                messageStats: {
                    totalInDialog: 150,
                    totalInCache: 100,
                    incomingCount: 60,
                    outgoingCount: 40,
                },
            })} />
        );
        expect(screen.getByText('150')).toBeInTheDocument(); // всего в VK
        expect(screen.getByText('100')).toBeInTheDocument(); // в базе
        expect(screen.getByText('60')).toBeInTheDocument();  // от клиента
        expect(screen.getByText('40')).toBeInTheDocument();  // от нас
    });

    // === Кнопка обновления ===
    it('рендерит кнопку «Обновить» при наличии onRefresh', () => {
        render(<UserInfoPanel {...createProps({ onRefresh: vi.fn() })} />);
        expect(screen.getByText('Обновить')).toBeInTheDocument();
    });

    it('вызывает onRefresh при клике', () => {
        const onRefresh = vi.fn();
        render(<UserInfoPanel {...createProps({ onRefresh })} />);
        fireEvent.click(screen.getByText('Обновить'));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    // === Дополнительная информация ===
    it('отображает источник пользователя', () => {
        render(<UserInfoPanel {...createProps({ userInfo: createUserInfo({ source: 'рассылка' }) })} />);
        expect(screen.getByText(/Источник: рассылка/)).toBeInTheDocument();
    });
});
