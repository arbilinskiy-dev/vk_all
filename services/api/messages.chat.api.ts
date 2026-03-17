/**
 * API-сервис: операции внутри диалога — история, отправка, вложения, печатает.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';
import type {
    MessageHistoryResponse,
    LoadAllMessagesResponse,
    SendMessageResponse,
    UploadMessageAttachmentResponse,
} from './messages.types';

/**
 * Получает историю сообщений с пользователем (с кэшированием на бэкенде).
 * @param includeUserInfo — если true, ответ будет содержать user_info (данные из рассылки)
 * @param direction — серверная фильтрация по направлению: "incoming" | "outgoing"
 * @param search — серверный поиск по тексту сообщений
 */
export async function getMessageHistory(
    projectId: string,
    userId: number,
    count: number = 200,
    offset: number = 0,
    forceRefresh: boolean = false,
    includeUserInfo: boolean = false,
    direction?: string,
    search?: string,
): Promise<MessageHistoryResponse> {
    const params = new URLSearchParams({
        project_id: projectId,
        user_id: String(userId),
        count: String(count),
        offset: String(offset),
    });
    if (forceRefresh) {
        params.set('force_refresh', 'true');
    }
    if (includeUserInfo) {
        params.set('include_user_info', 'true');
    }
    if (direction) {
        params.set('direction', direction);
    }
    if (search) {
        params.set('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/messages/history?${params}`, {
        headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки истории сообщений: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Загружает ВСЕ сообщения с пользователем (полная история).
 * Может занять время при большом количестве сообщений.
 */
export async function loadAllMessages(
    projectId: string,
    userId: number,
): Promise<LoadAllMessagesResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/history/all`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки всех сообщений: ${response.status}`);
    }

    return response.json();
}

/**
 * Отправляет сообщение пользователю от имени сообщества.
 * attachment — строка VK attachment ID через запятую ("photo123_456,photo123_789").
 */
export async function sendMessage(
    projectId: string,
    userId: number,
    message: string,
    senderId?: string,
    senderName?: string,
    attachment?: string,
    replyTo?: number,
    forwardMessages?: string,
): Promise<SendMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
            message,
            sender_id: senderId || undefined,
            sender_name: senderName || undefined,
            attachment: attachment || undefined,
            reply_to: replyTo || undefined,
            forward_messages: forwardMessages || undefined,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка отправки сообщения: ${response.status}`);
    }

    return response.json();
}

/**
 * Пересылает сообщения из одного диалога в другой (групповой чат).
 * Использует VK API forward JSON параметр для кросс-диалоговой пересылки.
 * @param targetPeerId — peer_id целевого чата (куда пересылаем)
 * @param sourcePeerId — peer_id исходного диалога (откуда берём сообщения)
 * @param conversationMessageIds — ID сообщений внутри исходного диалога
 * @param groupId — ID сообщества (число, без минуса)
 * @param comment — опциональный комментарий к пересылке
 */
export async function forwardToChat(
    projectId: string,
    targetPeerId: number,
    sourcePeerId: number,
    conversationMessageIds: number[],
    groupId: number,
    senderId?: string,
    senderName?: string,
    comment?: string,
    sourceUserName?: string,
): Promise<SendMessageResponse> {
    // Формируем JSON для параметра forward (VK API)
    const forwardJson = JSON.stringify({
        peer_id: sourcePeerId,
        conversation_message_ids: conversationMessageIds,
        owner_id: -groupId,
    });

    // Inline keyboard с кнопкой «Открыть диалог» → ссылка на VK диалог с клиентом
    const keyboardJson = JSON.stringify({
        inline: true,
        buttons: [[{
            action: {
                type: 'open_link',
                link: `https://vk.com/gim${groupId}?sel=${sourcePeerId}`,
                label: `💬 Диалог с ${sourceUserName || 'клиентом'}`,
            },
        }]],
    });

    const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            project_id: projectId,
            user_id: targetPeerId,
            message: comment || '',
            sender_id: senderId || undefined,
            sender_name: senderName || undefined,
            forward: forwardJson,
            keyboard: keyboardJson,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка пересылки сообщений: ${response.status}`);
    }

    return response.json();
}

/**
 * Загружает фото для отправки в личном сообщении.
 * Возвращает VK attachment ID (например "photo-123_456").
 */
export async function uploadMessageAttachment(
    projectId: string,
    userId: number,
    file: File,
): Promise<UploadMessageAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('user_id', String(userId));

    const response = await fetch(`${API_BASE_URL}/messages/upload-attachment`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки вложения: ${response.status}`);
    }

    return response.json();
}

/** Отправка статуса "печатает" в VK (менеджер → пользователь) */
export async function sendTypingStatus(
    projectId: string,
    userId: number,
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/messages/typing`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ project_id: projectId, user_id: userId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка typing: ${response.status}`);
    }

    return response.json();
}
