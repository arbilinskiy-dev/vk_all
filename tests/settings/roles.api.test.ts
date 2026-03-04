/**
 * Тесты для API-модуля roles.api — проверка вызовов callApi.
 * Каждая функция должна вызывать callApi с правильным путём и параметрами.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Мок callApi ---
const mockCallApi = vi.fn();

vi.mock('../../shared/utils/apiClient', () => ({
    callApi: (...args: any[]) => mockCallApi(...args),
}));

import {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    getUsersWithRoles,
} from '../../services/api/roles.api';

describe('roles.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCallApi.mockResolvedValue({ success: true });
    });

    // --- getRoles ---

    it('getRoles() вызывает callApi("roles/list", {})', async () => {
        await getRoles();

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/list', {});
    });

    it('getRoles() возвращает результат callApi', async () => {
        const expected = { success: true, roles: [{ id: '1', name: 'Admin' }] };
        mockCallApi.mockResolvedValue(expected);

        const result = await getRoles();

        expect(result).toEqual(expected);
    });

    // --- createRole ---

    it('createRole(payload) вызывает callApi("roles/create", payload)', async () => {
        const payload = { name: 'Тестовая роль', description: 'Описание', color: '#ff0000' };
        await createRole(payload);

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/create', payload);
    });

    it('createRole() передаёт объект как есть', async () => {
        const payload = { name: 'Минимум' };
        await createRole(payload);

        expect(mockCallApi).toHaveBeenCalledWith('roles/create', payload);
    });

    // --- updateRole ---

    it('updateRole(payload) вызывает callApi("roles/update", payload)', async () => {
        const payload = { role_id: 'r-1', name: 'Новое имя', color: '#00ff00' };
        await updateRole(payload);

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/update', payload);
    });

    // --- deleteRole ---

    it('deleteRole(roleId) вызывает callApi("roles/delete", { role_id: roleId })', async () => {
        await deleteRole('role-123');

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/delete', { role_id: 'role-123' });
    });

    it('deleteRole() корректно формирует payload с переданным id', async () => {
        await deleteRole('abc-xyz');

        expect(mockCallApi).toHaveBeenCalledWith('roles/delete', { role_id: 'abc-xyz' });
    });

    // --- assignRole ---

    it('assignRole(userId, roleId) вызывает callApi("roles/assign", { user_id, role_id })', async () => {
        await assignRole('user-1', 'role-2');

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/assign', {
            user_id: 'user-1',
            role_id: 'role-2',
        });
    });

    it('assignRole с role_id = null → передаёт null', async () => {
        await assignRole('user-1', null);

        expect(mockCallApi).toHaveBeenCalledWith('roles/assign', {
            user_id: 'user-1',
            role_id: null,
        });
    });

    // --- getUsersWithRoles ---

    it('getUsersWithRoles() вызывает callApi("roles/users", {})', async () => {
        await getUsersWithRoles();

        expect(mockCallApi).toHaveBeenCalledTimes(1);
        expect(mockCallApi).toHaveBeenCalledWith('roles/users', {});
    });

    it('getUsersWithRoles() возвращает результат callApi', async () => {
        const expected = { success: true, users: [{ user_id: '1', username: 'test' }] };
        mockCallApi.mockResolvedValue(expected);

        const result = await getUsersWithRoles();

        expect(result).toEqual(expected);
    });
});
