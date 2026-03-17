/**
 * Типы, интерфейсы и константы для хука useConversations.
 */

import React from 'react';
import { VkMessageItem } from '../../../../services/api/messages.api';
import { Conversation, MessagesChannel, MailingUserInfo } from '../../types';

/** Параметры запроса */
export interface UseConversationsParams {
    projectId: string | null;
    channel: MessagesChannel;
    /** Фильтр по непрочитанным: 'all' | 'unread' | 'important' | 'chats' */
    filterUnread?: 'all' | 'unread' | 'important' | 'chats';
}

/** Результат хука */
export interface UseConversationsResult {
    /** Список диалогов (маппинг из SystemListSubscriber → Conversation) */
    conversations: Conversation[];
    /** Загружается ли список */
    isLoading: boolean;
    /** Ошибка загрузки */
    error: string | null;
    /** Общее количество пользователей в списке рассылки */
    totalCount: number;
    /** Общее количество непрочитанных диалогов (стабильное, не зависит от текущего фильтра) */
    totalUnreadCount: number;
    /** Текущая страница (пагинация) */
    page: number;
    /** Загрузить следующую страницу (подгрузка при скролле) */
    loadMore: () => void;
    /** Есть ли ещё страницы для подгрузки */
    hasMore: boolean;
    /** Перезагрузить данные */
    refresh: () => void;
    /** Обновить количество непрочитанных для конкретного пользователя (вызывается из SSE) */
    updateUnreadCount: (vkUserId: number, count: number) => void;
    /** Обновить последнее сообщение для диалога (вызывается из SSE при новом сообщении) */
    updateLastMessage: (vkUserId: number, message: VkMessageItem) => void;
    /** Добавить нового пользователя в список диалогов (из SSE mailing_user_updated) */
    addNewConversationFromSSE: (user: MailingUserInfo) => void;
    /** Сбросить счётчики непрочитанных для всех диалогов (после mark-all-read) */
    resetAllUnreadCounts: () => void;
    /** Запросить пересортировку списка (при новом входящем сообщении; mark-read не вызывает пересортировку) */
    requestResort: () => void;
    /** Переключить пометку «Важное» для диалога (звёздочка) */
    toggleImportant: (vkUserId: number, isImportant: boolean) => Promise<void>;
    /** Словарь меток диалогов: vk_user_id → [label_id, ...] */
    dialogLabelsMap: Record<number, string[]>;
    /** Сеттер dialogLabelsMap (для обновления из useDialogLabels) */
    setDialogLabelsMap: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
}

/** Размер страницы (сколько пользователей подгружаем за раз) */
export const PAGE_SIZE = 50;
