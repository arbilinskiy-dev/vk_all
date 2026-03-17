/**
 * API-сервис: метаданные диалогов — фокус менеджеров, важное, данные пользователя.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';
import type {
    MailingUserInfoResponse,
    DialogFocusesResponse,
} from './messages.types';

/**
 * Получает данные пользователя из рассылки (профиль, даты контактов, статистика).
 * При force_refresh=true принудительно запрашивает свежие данные из VK API.
 */
export async function getMailingUserInfo(
    projectId: string,
    userId: number,
    forceRefresh: boolean = false,
): Promise<MailingUserInfoResponse> {
    const params = new URLSearchParams({
        project_id: projectId,
        user_id: String(userId),
    });
    if (forceRefresh) {
        params.set('force_refresh', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/messages/user-info?${params}`, {
        headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения данных пользователя: ${response.status}`);
    }
    
    return response.json();
}

/** Запрос на установку/снятие фокуса менеджера на диалоге */
export async function setDialogFocus(
    projectId: string,
    vkUserId: number,
    managerId: string,
    managerName: string,
    action: 'enter' | 'leave',
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/messages/dialog-focus`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            vk_user_id: vkUserId,
            manager_id: managerId,
            manager_name: managerName,
            action,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка dialog-focus: ${response.status}`);
    }

    return response.json();
}

/**
 * Переключить пометку «Важное» для диалога.
 */
export async function toggleDialogImportant(
    projectId: string,
    vkUserId: number,
    isImportant: boolean,
): Promise<{ success: boolean; is_important: boolean }> {
    const response = await fetch(`${API_BASE_URL}/messages/toggle-important`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            vk_user_id: vkUserId,
            is_important: isImportant,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка toggle-important: ${response.status}`);
    }

    return response.json();
}

/** Получение всех активных фокусов для проекта */
export async function getDialogFocuses(
    projectId: string,
): Promise<DialogFocusesResponse> {
    const response = await fetch(
        `${API_BASE_URL}/messages/dialog-focuses?project_id=${encodeURIComponent(projectId)}`,
        { headers: getAuthHeaders() },
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения фокусов: ${response.status}`);
    }

    return response.json();
}
