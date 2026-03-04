import { callApi } from '../../shared/utils/apiClient';

// --- Типы ---

/** Роль пользователя */
export interface UserRole {
    id: string;
    name: string;
    description: string | null;
    color: string;
    sort_order: number;
    created_at: string;
}

/** Пользователь с ролью */
export interface UserWithRole {
    user_id: string;
    username: string;
    full_name: string;
    role_id: string | null;
    role_name: string | null;
    role_color: string | null;
}

// --- API-функции ---

/** Получить все роли */
export const getRoles = async (): Promise<{ success: boolean; roles: UserRole[] }> => {
    return callApi('roles/list', {});
};

/** Создать роль */
export const createRole = async (data: {
    name: string;
    description?: string;
    color?: string;
}): Promise<{ success: boolean; role: UserRole }> => {
    return callApi('roles/create', data);
};

/** Обновить роль */
export const updateRole = async (data: {
    role_id: string;
    name?: string;
    description?: string;
    color?: string;
}): Promise<{ success: boolean; role: UserRole }> => {
    return callApi('roles/update', data);
};

/** Удалить роль */
export const deleteRole = async (role_id: string): Promise<{ success: boolean }> => {
    return callApi('roles/delete', { role_id });
};

/** Назначить роль пользователю */
export const assignRole = async (
    user_id: string,
    role_id: string | null
): Promise<{ success: boolean }> => {
    return callApi('roles/assign', { user_id, role_id });
};

/** Получить пользователей с ролями */
export const getUsersWithRoles = async (): Promise<{
    success: boolean;
    users: UserWithRole[];
}> => {
    return callApi('roles/users', {});
};
