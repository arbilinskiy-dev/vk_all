/**
 * API-сервис: прочитано/непрочитано — пометка диалогов.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';
import type {
    MarkReadResponse,
    MarkUnreadResponse,
    MarkAllReadResponse,
} from './messages.types';

/**
 * Помечает диалог как прочитанный для всех менеджеров.
 * Вызывается при открытии диалога или при получении SSE-события в открытом диалоге.
 */
export async function markDialogAsRead(
    projectId: string,
    userId: number,
    managerId?: string,
): Promise<MarkReadResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
            manager_id: managerId || undefined,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка отметки прочтения: ${response.status}`);
    }

    return response.json();
}

/**
 * Помечает диалог как непрочитанный.
 * Сбрасывает last_read на предпоследний входящий message_id,
 * чтобы последнее входящее сообщение отображалось как непрочитанное (бейдж = 1).
 */
export async function markDialogAsUnread(
    projectId: string,
    userId: number,
    managerId?: string,
): Promise<MarkUnreadResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/mark-unread`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
            manager_id: managerId || undefined,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка отметки непрочитанным: ${response.status}`);
    }

    return response.json();
}

/**
 * Помечает ВСЕ диалоги проекта как прочитанные одним запросом.
 * Используется кнопкой «Прочитать все» в интерфейсе.
 */
export async function markAllDialogsAsRead(
    projectId: string,
    managerId?: string,
): Promise<MarkAllReadResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            manager_id: managerId || undefined,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка массовой пометки прочитанными: ${response.status}`);
    }

    return response.json();
}
