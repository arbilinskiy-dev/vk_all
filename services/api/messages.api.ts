/**
 * API-сервис для модуля сообщений.
 * Получение истории, загрузка всех, отправка — через бэкенд с кэшированием в БД.
 */

import { API_BASE_URL } from '../../shared/config';

/** Элемент сообщения VK API */
export interface VkMessageItem {
    id: number;
    /** ID отправителя (0 = от имени сообщества) */
    from_id: number;
    /** ID диалога (peer_id) */
    peer_id: number;
    /** Текст сообщения */
    text: string;
    /** Unix timestamp отправки */
    date: number;
    /** Прочитано ли сообщение (1 = да) */
    read_state?: number;
    /** Исходящее ли сообщение (1 = да) */
    out: number;
    /** Вложения */
    attachments?: VkAttachment[];
    /** Клавиатура бота (кнопки, прикреплённые к сообщению) */
    keyboard?: VkKeyboard;
    /** Имя менеджера, отправившего сообщение через нашу систему */
    sent_by_name?: string;
    /** Payload кнопки бота — строка JSON. Присутствует когда юзер нажал кнопку бота или бот отправил сообщение */
    payload?: string;
    /** Сообщение удалено из ВК (есть в нашей базе, но нет в VK) */
    is_deleted_from_vk?: boolean;
}

/** Действие кнопки VK */
export interface VkKeyboardButtonAction {
    type: 'text' | 'callback' | 'open_link' | 'open_app' | 'location' | 'vkpay';
    label?: string;
    link?: string;
    payload?: string;
    app_id?: number;
    hash?: string;
}

/** Кнопка клавиатуры VK */
export interface VkKeyboardButton {
    action: VkKeyboardButtonAction;
    color?: 'primary' | 'secondary' | 'negative' | 'positive';
}

/** Клавиатура бота VK (инлайн-кнопки внутри сообщения) */
export interface VkKeyboard {
    one_time?: boolean;
    inline?: boolean;
    buttons: VkKeyboardButton[][];
}

/** Вложение VK */
export interface VkAttachment {
    type: string;
    photo?: {
        sizes: { url: string; width: number; height: number; type: string }[];
    };
    doc?: {
        title: string;
        url: string;
        size?: number;
        ext?: string;
    };
    audio_message?: {
        link_ogg: string;
        link_mp3: string;
        duration: number;
    };
    sticker?: {
        images: { url: string; width: number; height: number }[];
    };
    video?: {
        title: string;
        duration?: number;
        image?: { url: string; width?: number; height?: number }[];
    };
    link?: {
        url: string;
        title?: string;
        description?: string;
        photo?: {
            sizes: { url: string; width: number; height: number; type: string }[];
        };
    };
    wall?: {
        id: number;
        from_id: number;
        text?: string;
        attachments?: VkAttachment[];
    };
    poll?: {
        id: number;
        question: string;
        answers: { text: string; votes: number }[];
    };
    market?: {
        title: string;
        description?: string;
        price?: { text: string };
        thumb_photo?: string;
    };
    graffiti?: {
        url: string;
        width: number;
        height: number;
    };
    gift?: {
        id: number;
        thumb_256?: string;
    };
}

/** Ответ эндпоинта /api/messages/history */
export interface MessageHistoryResponse {
    success: boolean;
    /** Общее количество сообщений в диалоге */
    count: number;
    /** Массив сообщений VK API */
    items: VkMessageItem[];
    /** Источник данных: "vk_api" или "cache" */
    source?: string;
    /** Количество сообщений в кэше */
    cached_count?: number;
    /** Все ли сообщения загружены */
    is_fully_loaded?: boolean;
    /** Данные пользователя из рассылки (если запрошены через include_user_info) */
    user_info?: Record<string, unknown> | null;
    /** Статистика по направлению сообщений (при offset=0) */
    message_stats?: {
        /** Входящих сообщений (от пользователя) в кэше */
        incoming_count: number;
        /** Исходящих сообщений (от нас) в кэше */
        outgoing_count: number;
        /** Всего сообщений в кэше */
        cached_total: number;
    } | null;
}

/** Ответ эндпоинта /api/messages/history/all */
export interface LoadAllMessagesResponse {
    success: boolean;
    /** Итого загружено в кэш */
    total_loaded: number;
    /** Всего сообщений в диалоге */
    total_count: number;
    /** Были ли уже загружены ранее */
    already_loaded: boolean;
}

/** Ответ эндпоинта /api/messages/send */
export interface SendMessageResponse {
    success: boolean;
    /** VK ID отправленного сообщения */
    message_id: number;
    /** Сообщение в формате VK API (для добавления в список) */
    item: VkMessageItem;
}

/** Ответ эндпоинта /api/messages/upload-attachment */
export interface UploadMessageAttachmentResponse {
    success: boolean;
    /** VK attachment ID (например "photo-123_456", "doc-123_456", "video-123_456") */
    attachment_id: string;
    /** Тип вложения: photo | video | document */
    attachment_type: 'photo' | 'video' | 'document';
    /** URL превью (для фото, для PDF-документов) */
    preview_url: string;
    /** Имя файла */
    file_name?: string;
    /** Размер файла в байтах (для документов) */
    file_size?: number;
    /** URL скачивания файла (для документов) */
    file_url?: string;
}

/** Ответ эндпоинта /api/messages/last-messages */
export interface LastMessagesResponse {
    success: boolean;
    /** Словарь: vk_user_id (строка) → последнее сообщение в формате VK API */
    messages: Record<string, VkMessageItem>;
}

/** Ответ эндпоинта /api/messages/conversations-init */
export interface ConversationsInitResponse {
    /** Метаданные списка проекта */
    meta: Record<string, unknown>;
    /** Подписчики (отсортированы: непрочитанные наверху) */
    subscribers: import('../../shared/types').SystemListSubscriber[];
    /** Общее количество подписчиков в проекте */
    total_count: number;
    /** Словарь непрочитанных: vk_user_id (строка) → количество */
    unread_counts: Record<string, number>;
    /** Словарь последних сообщений: vk_user_id (строка) → сообщение VK API */
    last_messages: Record<string, VkMessageItem>;
    /** Словарь важных диалогов: vk_user_id (строка) → true */
    important_dialogs?: Record<string, boolean>;
    /** Словарь меток диалогов: vk_user_id (строка) → [label_id, ...] */
    dialog_labels?: Record<string, string[]>;
}

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
        headers: { 'Content-Type': 'application/json' },
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

    const response = await fetch(`${API_BASE_URL}/messages/last-messages?${params}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки последних сообщений: ${response.status}`);
    }

    return response.json();
}

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

    const response = await fetch(`${API_BASE_URL}/messages/history?${params}`);
    
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
        headers: { 'Content-Type': 'application/json' },
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
): Promise<SendMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
            message,
            sender_id: senderId || undefined,
            sender_name: senderName || undefined,
            attachment: attachment || undefined,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка отправки сообщения: ${response.status}`);
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
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки вложения: ${response.status}`);
    }

    return response.json();
}

/** Ответ эндпоинта /api/messages/user-info */
export interface MailingUserInfoResponse {
    success: boolean;
    found: boolean;
    user: import('../../features/messages/types').MailingUserInfo | null;
}

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

    const response = await fetch(`${API_BASE_URL}/messages/user-info?${params}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения данных пользователя: ${response.status}`);
    }
    
    return response.json();
}

// =============================================================================
// MARK-READ — пометить диалог как прочитанный
// =============================================================================

/** Ответ эндпоинта /api/messages/mark-read */
export interface MarkReadResponse {
    success: boolean;
    unread_count: number;
    last_read_message_id: number;
}

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
        headers: { 'Content-Type': 'application/json' },
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

// =============================================================================
// MARK-UNREAD — пометить диалог как непрочитанный
// =============================================================================

/** Ответ эндпоинта /api/messages/mark-unread */
export interface MarkUnreadResponse {
    success: boolean;
    unread_count: number;
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
        headers: { 'Content-Type': 'application/json' },
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

// =============================================================================
// MARK-ALL-READ — пометить ВСЕ диалоги проекта как прочитанные
// =============================================================================

/** Ответ эндпоинта /api/messages/mark-all-read */
export interface MarkAllReadResponse {
    success: boolean;
    updated_count: number;
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
        headers: { 'Content-Type': 'application/json' },
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

// =============================================================================
// UNREAD COUNTS — количество непрочитанных по диалогам
// =============================================================================

/** Ответ эндпоинта /api/messages/unread-counts */
export interface UnreadCountsResponse {
    success: boolean;
    /** Словарь: vk_user_id (строка) → количество непрочитанных */
    counts: Record<string, number>;
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

    const response = await fetch(`${API_BASE_URL}/messages/unread-counts?${params}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения непрочитанных: ${response.status}`);
    }
    
    return response.json();
}

/** Ответ пакетного эндпоинта /api/messages/unread-dialog-counts-batch */
export interface UnreadDialogCountsBatchResponse {
    success: boolean;
    /** Словарь: project_id → количество диалогов с непрочитанными */
    counts: Record<string, number>;
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
    const response = await fetch(`${API_BASE_URL}/messages/unread-dialog-counts-batch?${params}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка пакетного подсчёта непрочитанных: ${response.status}`);
    }

    return response.json();
}


// =============================================================================
// DIALOG FOCUS — трекинг менеджеров в диалогах
// =============================================================================

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
        headers: { 'Content-Type': 'application/json' },
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

/** Отправка статуса "печатает" в VK (менеджер → пользователь) */
export async function sendTypingStatus(
    projectId: string,
    userId: number,
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/messages/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, user_id: userId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка typing: ${response.status}`);
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
        headers: { 'Content-Type': 'application/json' },
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

/** Ответ со всеми активными фокусами */
export interface DialogFocusesResponse {
    success: boolean;
    focuses: Record<string, { manager_id: string; manager_name: string }[]>;
}

/** Получение всех активных фокусов для проекта */
export async function getDialogFocuses(
    projectId: string,
): Promise<DialogFocusesResponse> {
    const response = await fetch(
        `${API_BASE_URL}/messages/dialog-focuses?project_id=${encodeURIComponent(projectId)}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка получения фокусов: ${response.status}`);
    }

    return response.json();
}