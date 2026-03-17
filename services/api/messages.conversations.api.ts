/**
 * API-сервис: список диалогов, последние сообщения, непрочитанные.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';
import type {
    ConversationsInitResponse,
    LastMessagesResponse,
    UnreadCountsResponse,
    UnreadDialogCountsBatchResponse,
    CommunityChatsResponse,
} from './messages.types';

/**
 * Единый эндпоинт инициализации модуля сообщений.
 * Заменяет 4 отдельных запроса (2x getSubscribers + getUnreadCounts + getLastMessages)
 * одним вызовом — устраняет waterfall, экономит ~500ms-1s.
 */
export async function getConversationsInit(
    projectId: string,
    page: number = 1,
    sortUnreadFirst: boolean = true,
    filterUnread: string = 'all',
): Promise<ConversationsInitResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations-init`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            page,
            sort_unread_first: sortUnreadFirst,
            filter_unread: filterUnread,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки диалогов: ${response.status}`);
    }

    return response.json();
}

/**
 * Получает последнее сообщение для каждого диалога (пакетно).
 * Используется для превью в списке диалогов.
 */
export async function getLastMessages(
    projectId: string,
    userIds: number[],
): Promise<LastMessagesResponse> {
    if (userIds.length === 0) {
        return { success: true, messages: {} };
    }

    const params = new URLSearchParams({
        project_id: projectId,
        user_ids: userIds.join(','),
    });

    const response = await fetch(`${API_BASE_URL}/messages/last-messages?${params}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки последних сообщений: ${response.status}`);
    }

    return response.json();
}

/**
 * Получает количество непрочитанных входящих сообщений по диалогам.
 * Если userIds не указан — возвращает для всех диалогов в кэше.
 */
export async function getUnreadCounts(
    projectId: string,
    userIds?: number[],
): Promise<UnreadCountsResponse> {
    const params = new URLSearchParams({ project_id: projectId });
    if (userIds && userIds.length > 0) {
        params.set('user_ids', userIds.join(','));
    }

    const response = await fetch(`${API_BASE_URL}/messages/unread-counts?${params}`, {
        headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения непрочитанных: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Пакетный подсчёт количества ДИАЛОГОВ с непрочитанными для нескольких проектов.
 * Один HTTP-запрос → один SQL-запрос. Используется для бейджей в сайдбаре.
 */
export async function getUnreadDialogCountsBatch(
    projectIds: string[],
): Promise<UnreadDialogCountsBatchResponse> {
    if (projectIds.length === 0) {
        return { success: true, counts: {} };
    }

    const params = new URLSearchParams({ project_ids: projectIds.join(',') });
    const response = await fetch(`${API_BASE_URL}/messages/unread-dialog-counts-batch?${params}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка пакетного подсчёта непрочитанных: ${response.status}`);
    }

    return response.json();
}


/**
 * Получает список групповых чатов из кэша БД (мгновенно).
 */
export async function getCommunityChats(
    projectId: string,
): Promise<CommunityChatsResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/community-chats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ project_id: projectId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки чатов: ${response.status}`);
    }

    return response.json();
}

/**
 * Синхронизирует групповые чаты с VK API → сохраняет в БД.
 * Медленная операция (до 15 запросов к VK API).
 */
export async function syncCommunityChats(
    projectId: string,
): Promise<CommunityChatsResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/community-chats/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ project_id: projectId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка синхронизации чатов: ${response.status}`);
    }

    return response.json();
}
