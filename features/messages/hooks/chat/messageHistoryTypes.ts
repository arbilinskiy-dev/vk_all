/**
 * Типы, интерфейсы и константы для хука useMessageHistory.
 */

import { ChatMessageData, MessageAttachment, MailingUserInfo } from '../../types';
import { VkMessageItem } from '../../../../services/api/messages.api';

/** Размер страницы для пагинации (сколько отображаем в интерфейсе за раз) */
export const PAGE_SIZE = 50;

interface UseMessageHistoryParams {
    /** ID проекта */
    projectId: string | null;
    /** VK user_id собеседника */
    userId: number | null;
    /** ID группы VK (для определения direction) */
    groupId: number | null;
    /** Серверная фильтрация по направлению: 'incoming' | 'outgoing' | null (все) */
    direction?: 'incoming' | 'outgoing' | null;
    /** Серверный поиск по тексту (уже дебаунсированный) */
    searchText?: string | null;
}

interface UseMessageHistoryResult {
    /** Массив сообщений (от старых к новым) */
    messages: ChatMessageData[];
    /** Идёт ли первичная загрузка */
    isLoading: boolean;
    /** Идёт ли подгрузка старых сообщений */
    isLoadingMore: boolean;
    /** Идёт ли загрузка всех сообщений */
    isLoadingAll: boolean;
    /** Идёт ли отправка сообщения */
    isSending: boolean;
    /** Ошибка */
    error: string | null;
    /** Общее количество сообщений в диалоге */
    totalCount: number;
    /** Есть ли ещё старые сообщения */
    hasMore: boolean;
    /** Все ли сообщения загружены */
    isFullyLoaded: boolean;
    /** Источник данных последнего запроса */
    source: string | null;
    /** Загрузить предыдущую страницу сообщений */
    loadMore: () => void;
    /** Загрузить ВСЕ сообщения */
    loadAll: () => void;
    /** Перезагрузить историю (force refresh из VK API) */
    refresh: () => void;
    /** Отправить сообщение (attachments — загрузка фото на бэкенд → VK API) */
    sendMessage: (text: string, attachments?: File[], senderId?: string, senderName?: string) => Promise<boolean>;
    /** Добавить входящее сообщение из SSE (без полной перезагрузки) */
    addIncomingMessage: (messageData: ChatMessageData) => void;
    /** Принудительная перезагрузка (для SSE cache_action=reload) */
    forceReload: () => void;
    /** Отметить исходящие сообщения как прочитанные (до указанного ID) */
    markMessagesAsRead: (upToMessageId: number) => void;
    /** Последнее (самое новое) сообщение в сыром VK-формате — для обновления превью в сайдбаре */
    lastRawVkItem: VkMessageItem | null;
    /** Данные пользователя из рассылки (из ответа history с include_user_info) */
    userInfoFromHistory: MailingUserInfo | null;
    /** Статистика сообщений: всего в VK, в кэше, входящих, исходящих */
    messageStats: MessageStats | null;
}

/** Статистика по сообщениям в диалоге */
export interface MessageStats {
    /** Всего сообщений в диалоге (из VK API) */
    totalInDialog: number;
    /** Всего в нашей базе (кэше) */
    totalInCache: number;
    /** Входящих (от пользователя) в кэше */
    incomingCount: number;
    /** Исходящих (от нас) в кэше */
    outgoingCount: number;
    /** Количество сообщений, удалённых из ВК (есть в базе, но нет в VK) */
    deletedFromVkCount: number;
}

export type { UseMessageHistoryParams, UseMessageHistoryResult };
