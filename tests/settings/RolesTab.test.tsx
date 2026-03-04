/**
 * Тесты для компонента RolesTab — управление ролями пользователей.
 * Проверяет рендер ролей, создание, удаление, назначение.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Моки API ---
const mockGetRoles = vi.fn();
const mockCreateRole = vi.fn();
const mockUpdateRole = vi.fn();
const mockDeleteRole = vi.fn();
const mockAssignRole = vi.fn();
const mockGetUsersWithRoles = vi.fn();

vi.mock('../../services/api/roles.api', () => ({
    getRoles: (...args: any[]) => mockGetRoles(...args),
    createRole: (...args: any[]) => mockCreateRole(...args),
    updateRole: (...args: any[]) => mockUpdateRole(...args),
    deleteRole: (...args: any[]) => mockDeleteRole(...args),
    assignRole: (...args: any[]) => mockAssignRole(...args),
    getUsersWithRoles: (...args: any[]) => mockGetUsersWithRoles(...args),
}));

import { RolesTab } from '../../features/users/components/RolesTab';

// --- Фикстуры ---
const MOCK_ROLES = [
    {
        id: 'role-1',
        name: 'Администратор',
        description: 'Полный доступ',
        color: '#6366f1',
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
    },
    {
        id: 'role-2',
        name: 'Менеджер',
        description: null,
        color: '#22c55e',
        sort_order: 1,
        created_at: '2026-01-02T00:00:00Z',
    },
];

const MOCK_USERS = [
    {
        user_id: 'user-1',
        username: 'ivan',
        full_name: 'Иван Петров',
        role_id: 'role-1',
        role_name: 'Администратор',
        role_color: '#6366f1',
    },
    {
        user_id: 'user-2',
        username: 'maria',
        full_name: 'Мария Сидорова',
        role_id: null,
        role_name: null,
        role_color: null,
    },
];

/** Настроить моки для успешной загрузки данных */
function setupSuccessMocks() {
    mockGetRoles.mockResolvedValue({ success: true, roles: MOCK_ROLES });
    mockGetUsersWithRoles.mockResolvedValue({ success: true, users: MOCK_USERS });
    mockCreateRole.mockResolvedValue({ success: true, role: MOCK_ROLES[0] });
    mockUpdateRole.mockResolvedValue({ success: true, role: MOCK_ROLES[0] });
    mockDeleteRole.mockResolvedValue({ success: true });
    mockAssignRole.mockResolvedValue({ success: true });
}

describe('RolesTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Мок confirm для диалога удаления
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    // --- Рендер и загрузка ---

    it('показывает лоадер пока данные загружаются', () => {
        // getRoles никогда не резолвится — pending
        mockGetRoles.mockReturnValue(new Promise(() => {}));
        mockGetUsersWithRoles.mockReturnValue(new Promise(() => {}));

        render(<RolesTab />);

        // Скелетон (animate-pulse элементы)
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('рендерит заголовок раздела ролей после загрузки', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Роли')).toBeInTheDocument();
        });
    });

    it('рендерит список ролей после загрузки (2 роли)', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            // Роль "Администратор" встречается в нескольких местах (список ролей, бейдж, select).
            // Проверяем наличие хотя бы одного элемента.
            const admins = screen.getAllByText('Администратор');
            expect(admins.length).toBeGreaterThanOrEqual(1);
            const managers = screen.getAllByText('Менеджер');
            expect(managers.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('показывает описание роли, если оно есть', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('— Полный доступ')).toBeInTheDocument();
        });
    });

    it('показывает количество пользователей в каждой роли', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            // 1 пользователь с role-1, 0 с role-2
            expect(screen.getByText('1 чел.')).toBeInTheDocument();
            expect(screen.getByText('0 чел.')).toBeInTheDocument();
        });
    });

    it('рендерит список пользователей с их ролями', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Иван Петров')).toBeInTheDocument();
            expect(screen.getByText('ivan')).toBeInTheDocument();
            expect(screen.getByText('Мария Сидорова')).toBeInTheDocument();
            expect(screen.getByText('maria')).toBeInTheDocument();
        });
    });

    it('показывает "Не назначена" для пользователя без роли', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Не назначена')).toBeInTheDocument();
        });
    });

    it('показывает сообщение об ошибке при неудачной загрузке', async () => {
        mockGetRoles.mockRejectedValue(new Error('Сервер недоступен'));
        mockGetUsersWithRoles.mockRejectedValue(new Error('Сервер недоступен'));

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
        });
    });

    // --- Создание роли ---

    it('кнопка "Создать роль" присутствует в форме', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Создать роль')).toBeInTheDocument();
        });
    });

    it('кнопка "Создать роль" disable если название пустое', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            const btn = screen.getByText('Создать роль');
            expect(btn).toBeDisabled();
        });
    });

    it('можно ввести название и подтвердить создание → вызывается createRole', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Роли')).toBeInTheDocument();
        });

        // Ввод названия роли
        const nameInput = screen.getByPlaceholderText('SMM-менеджер');
        fireEvent.change(nameInput, { target: { value: 'Новая роль' } });

        // Нажимаем "Создать роль"
        const createBtn = screen.getByText('Создать роль');
        expect(createBtn).not.toBeDisabled();
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(mockCreateRole).toHaveBeenCalledWith({
                name: 'Новая роль',
                description: undefined,
                color: '#6366f1', // первый цвет по умолчанию
            });
        });
    });

    it('создание роли с описанием передаёт description', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Роли')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('SMM-менеджер'), {
            target: { value: 'Тестовая роль' },
        });
        fireEvent.change(screen.getByPlaceholderText('Необязательно'), {
            target: { value: 'Описание тестовой роли' },
        });

        fireEvent.click(screen.getByText('Создать роль'));

        await waitFor(() => {
            expect(mockCreateRole).toHaveBeenCalledWith({
                name: 'Тестовая роль',
                description: 'Описание тестовой роли',
                color: '#6366f1',
            });
        });
    });

    // --- Удаление роли ---

    it('удаление роли → вызывается deleteRole', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        // Ждём полной загрузки данных
        await waitFor(() => {
            expect(screen.getAllByText('Удалить').length).toBeGreaterThan(0);
        });

        // Нажимаем первую кнопку "Удалить"
        const deleteButtons = screen.getAllByText('Удалить');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockDeleteRole).toHaveBeenCalledWith('role-1');
        });
    });

    it('удаление роли не вызывается если confirm = false', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getAllByText('Удалить').length).toBeGreaterThan(0);
        });

        const deleteButtons = screen.getAllByText('Удалить');
        fireEvent.click(deleteButtons[0]);

        expect(mockDeleteRole).not.toHaveBeenCalled();
    });

    // --- Назначение роли ---

    it('назначение роли пользователю → вызывается assignRole', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Назначение ролей')).toBeInTheDocument();
        });

        // Находим select для второго пользователя (Мария — без роли)
        const selects = screen.getAllByRole('combobox');
        // Мария — 2-й select, выбираем роль "Администратор" (role-1)
        fireEvent.change(selects[1], { target: { value: 'role-1' } });

        await waitFor(() => {
            expect(mockAssignRole).toHaveBeenCalledWith('user-2', 'role-1');
        });
    });

    it('снятие роли → assignRole вызывается с null', async () => {
        setupSuccessMocks();

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Назначение ролей')).toBeInTheDocument();
        });

        // Первый пользователь (Иван) — у него role-1, выбираем "Без роли"
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: '' } });

        await waitFor(() => {
            expect(mockAssignRole).toHaveBeenCalledWith('user-1', null);
        });
    });

    // --- Пустые данные ---

    it('показывает "Роли ещё не созданы" при отсутствии ролей', async () => {
        mockGetRoles.mockResolvedValue({ success: true, roles: [] });
        mockGetUsersWithRoles.mockResolvedValue({ success: true, users: [] });

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Роли ещё не созданы')).toBeInTheDocument();
        });
    });

    it('показывает "Нет пользователей" при пустом списке пользователей', async () => {
        mockGetRoles.mockResolvedValue({ success: true, roles: MOCK_ROLES });
        mockGetUsersWithRoles.mockResolvedValue({ success: true, users: [] });

        render(<RolesTab />);

        await waitFor(() => {
            expect(screen.getByText('Нет пользователей')).toBeInTheDocument();
        });
    });
});
