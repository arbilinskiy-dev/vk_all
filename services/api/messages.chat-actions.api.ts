/**
 * API-сервис: получение действий менеджеров в диалоге.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

/** Действие менеджера в хронологии чата (дублируется из features/messages/types для автономности API-слоя) */
export interface ChatActionItem {
    id: string;
    action_type: string;
    manager_id: string;
    manager_name: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

/** Ответ эндпоинта GET /messages/chat-actions */
export interface ChatActionsResponse {
    success: boolean;
    actions: ChatActionItem[];
}

/**
 * Получает действия менеджеров в диалоге для отображения в хронологии.
 */
export async function getChatActions(
    projectId: string,
    vkUserId: number,
    limit: number = 200,
): Promise<ChatActionsResponse> {
    const params = new URLSearchParams({
        project_id: projectId,
        vk_user_id: String(vkUserId),
        limit: String(limit),
    });

    const response = await fetch(`${API_BASE_URL}/messages/chat-actions?${params}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки действий чата: ${response.status}`);
    }

    return response.json();
}
