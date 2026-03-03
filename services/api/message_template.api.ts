/**
 * API-модуль для работы с шаблонами ответов сообщений.
 * CRUD + предпросмотр через callApi.
 */

import { callApi } from '../../shared/utils/apiClient';

// --- Типы ---

/** Вложение шаблона */
export interface MessageTemplateAttachment {
    type: string;       // 'photo', 'video', 'document'
    vk_id: string;      // VK attachment ID, например "photo-123456_789012"
    preview_url?: string;
    name?: string;
}

/** Шаблон ответа */
export interface MessageTemplate {
    id: string;
    project_id: string;
    name: string;
    text: string;
    attachments?: MessageTemplateAttachment[] | null;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

/** Данные для создания шаблона */
export interface MessageTemplateCreate {
    name: string;
    text: string;
    attachments?: MessageTemplateAttachment[] | null;
    sort_order?: number;
}

/** Данные для обновления шаблона */
export interface MessageTemplateUpdate {
    name?: string;
    text?: string;
    attachments?: MessageTemplateAttachment[] | null;
    sort_order?: number;
}

/** Ответ предпросмотра */
export interface MessageTemplatePreviewResponse {
    preview_text: string;
    original_text: string;
}

// --- API-функции ---

/**
 * Получить все шаблоны проекта.
 */
export const getMessageTemplates = async (projectId: string): Promise<MessageTemplate[]> => {
    return callApi<MessageTemplate[]>('message-templates/list', { projectId });
};

/**
 * Создать новый шаблон.
 */
export const createMessageTemplate = async (
    projectId: string,
    template: MessageTemplateCreate,
): Promise<MessageTemplate> => {
    return callApi<MessageTemplate>('message-templates/create', { projectId, template });
};

/**
 * Обновить шаблон.
 */
export const updateMessageTemplate = async (
    templateId: string,
    template: MessageTemplateUpdate,
): Promise<MessageTemplate> => {
    return callApi<MessageTemplate>('message-templates/update', { templateId, template });
};

/**
 * Удалить шаблон.
 */
export const deleteMessageTemplate = async (templateId: string): Promise<{ success: boolean }> => {
    return callApi<{ success: boolean }>('message-templates/delete', { templateId });
};

/**
 * Предпросмотр шаблона с подстановкой переменных.
 */
export const previewMessageTemplate = async (
    projectId: string,
    text: string,
    userId?: number,
): Promise<MessageTemplatePreviewResponse> => {
    return callApi<MessageTemplatePreviewResponse>('message-templates/preview', {
        projectId,
        text,
        userId: userId || null,
    });
};
