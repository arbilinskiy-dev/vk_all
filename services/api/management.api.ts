
import { Project, User, AdministeredGroup, SyncGroupsResult } from '../../shared/types';
import { callApi, API_BASE_URL } from '../../shared/utils/apiClient';

// --- SYSTEM INFO API ---

/**
 * Получает текущую версию бэкенда.
 */
export const getBackendVersion = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/version`);
        if (!response.ok) return 'unknown';
        const data = await response.json();
        return data.version || 'unknown';
    } catch {
        return 'offline';
    }
};

// --- DATABASE MANAGEMENT API ---

/**
 * Загружает ВСЕ активные проекты из БД для страницы управления.
 */
export const getAllProjectsForManagement = async (): Promise<Project[]> => {
    return callApi<Project[]>('management/getAllProjects');
};

/**
 * Загружает ВСЕ архивированные проекты из БД.
 */
export const getArchivedProjects = async (): Promise<Project[]> => {
    return callApi<Project[]>('management/getArchivedProjects');
};

/**
 * Безвозвратно удаляет проект и все связанные с ним данные.
 */
export const permanentlyDeleteProject = async (projectId: string): Promise<{ success: boolean }> => {
    return callApi('management/permanentlyDeleteProject', { projectId });
};

/**
 * Отправляет список измененных проектов для массового обновления.
 */
export const updateProjects = async (projects: Project[]): Promise<{ success: boolean }> => {
    return callApi('management/updateProjects', { projects });
};

/**
 * Отправляет список URL для добавления новых проектов.
 */
export const addProjectsByUrls = async (urls: string): Promise<{ added: number, skipped: number, errors: number }> => {
    return callApi('management/addProjectsByUrls', { urls });
};

// --- USER MANAGEMENT API ---

/**
 * Загружает ВСЕХ пользователей из БД для страницы управления.
 */
export const getAllUsers = async (): Promise<User[]> => {
    return callApi<User[]>('users/getAll');
};

/**
 * Отправляет список измененных пользователей для массового обновления.
 */
export const updateUsers = async (users: User[]): Promise<{ success: boolean }> => {
    return callApi('users/updateAll', { users });
};

// --- ADMINISTERED GROUPS API ---

/**
 * Загружает список администрируемых групп из БД.
 */
export const getAdministeredGroups = async (): Promise<AdministeredGroup[]> => {
    return callApi<AdministeredGroup[]>('management/administered-groups/get');
};

/**
 * Запускает процесс синхронизации администрируемых групп с VK.
 */
export const syncAdministeredGroups = async (): Promise<SyncGroupsResult> => {
    return callApi('management/administered-groups/sync');
};

/**
 * Запускает процесс сканирования администраторов для конкретной группы.
 */
export const syncGroupAdmins = async (groupId: number): Promise<AdministeredGroup> => {
    return callApi<AdministeredGroup>(`management/administered-groups/${groupId}/sync-admins`, {});
};

/**
 * Запускает глобальный фоновый процесс сканирования администраторов для ВСЕХ групп.
 */
export const syncAllGroupAdmins = async (): Promise<{ taskId: string }> => {
    return callApi<{ taskId: string }>('management/administered-groups/sync-admins-bulk');
};

// --- PROMOTE TO ADMINS API ---

/** Результат назначения одного пользователя в одной группе */
export interface PromoteUserResult {
    group_id: number;
    group_name: string;
    user_id: number;
    user_name: string;
    was_member: boolean;
    joined: boolean;
    promoted: boolean;
    already_admin: boolean;
    error: string | null;
    recommendation: string | null;
}

/** Ответ массового назначения админов */
export interface PromoteToAdminsResponse {
    success: boolean;
    total_pairs: number;
    promoted_count: number;
    already_admin_count: number;
    joined_count: number;
    error_count: number;
    results: PromoteUserResult[];
}

/**
 * Массовое назначение системных страниц администраторами в группах VK.
 * Автоматически вступает в группу, если пользователь не является участником.
 */
export const promoteToAdmins = async (
    groupIds: number[],
    userIds: number[],
    role: string = 'administrator',
    includeEnvToken: boolean = false
): Promise<PromoteToAdminsResponse> => {
    return callApi<PromoteToAdminsResponse>('management/administered-groups/promote-to-admins', {
        group_ids: groupIds,
        user_ids: userIds,
        role,
        include_env_token: includeEnvToken
    });
};

// --- ADMIN BULK OPERATIONS API ---

/**
 * Запускает фоновую задачу для последовательного обновления подписчиков ВСЕХ активных проектов.
 */
export const refreshAllSubscribers = async (): Promise<{ taskId: string }> => {
    return callApi<{ taskId: string }>('management/refresh-all-subscribers');
};

/**
 * Запускает фоновую задачу для параллельного сбора постов ВСЕХ активных проектов.
 * @param limit - '100', '1000' или 'all'
 * @param mode - 'limit' (скачать limit постов) или 'actual' (только недостающие)
 */
export const refreshAllPosts = async (
    limit: '100' | '1000' | 'all' = '1000',
    mode: 'limit' | 'actual' = 'limit'
): Promise<{ taskId: string }> => {
    return callApi<{ taskId: string }>('management/refresh-all-posts', { limit, mode });
};

/**
 * Запускает фоновую задачу для обновления рассылки (dialogs) ВСЕХ проектов с community-токенами.
 */
export const refreshAllMailing = async (): Promise<{ taskId: string }> => {
    return callApi<{ taskId: string }>('management/refresh-all-mailing');
};
