/**
 * Типы и интерфейсы модуля сообщений.
 * Используются во всех messages.*.api.ts подмодулях.
 */

// =============================================================================
// VK API — базовые типы сообщений
// =============================================================================

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
    /** Сообщение, на которое это ответ (reply) */
    reply_message?: VkMessageItem;
    /** Пересланные сообщения (forwarded) */
    fwd_messages?: VkMessageItem[];
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

// =============================================================================
// Response-типы эндпоинтов
// =============================================================================

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
        /** Количество удалённых из VK сообщений */
        deleted_from_vk_count?: number;
    } | null;
    /** Профили участников (для групповых чатов, extended=1) */
    profiles?: Array<{ id: number; first_name?: string; last_name?: string }>;
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

/** Ответ эндпоинта /api/messages/user-info */
export interface MailingUserInfoResponse {
    success: boolean;
    found: boolean;
    user: import('../../features/messages/types').MailingUserInfo | null;
}

/** Ответ эндпоинта /api/messages/mark-read */
export interface MarkReadResponse {
    success: boolean;
    unread_count: number;
    last_read_message_id: number;
}

/** Ответ эндпоинта /api/messages/mark-unread */
export interface MarkUnreadResponse {
    success: boolean;
    unread_count: number;
}

/** Ответ эндпоинта /api/messages/mark-all-read */
export interface MarkAllReadResponse {
    success: boolean;
    updated_count: number;
}

// =============================================================================
// Групповые чаты (беседы) сообщества
// =============================================================================

/** Элемент группового чата сообщества */
export interface CommunityChat {
    /** peer_id чата (>= 2000000001) */
    peer_id: number;
    /** Локальный chat_id (peer_id - 2000000000) */
    chat_id: number;
    /** Название чата */
    title: string;
    /** Количество участников */
    members_count: number;
    /** URL фото чата */
    photo_url?: string | null;
    /** Статус участия: 'in' | 'kicked' | 'left' */
    state?: string;
    /** Количество непрочитанных */
    unread_count: number;
    /** Последнее сообщение */
    last_message?: VkMessageItem | null;
    /** Имя отправителя последнего сообщения */
    last_message_sender?: string | null;
}

/** Ответ эндпоинта /api/messages/community-chats */
export interface CommunityChatsResponse {
    chats: CommunityChat[];
    count: number;
    error?: string;
}

/** Ответ эндпоинта /api/messages/unread-counts */
export interface UnreadCountsResponse {
    success: boolean;
    /** Словарь: vk_user_id (строка) → количество непрочитанных */
    counts: Record<string, number>;
}

/** Ответ пакетного эндпоинта /api/messages/unread-dialog-counts-batch */
export interface UnreadDialogCountsBatchResponse {
    success: boolean;
    /** Словарь: project_id → количество диалогов с непрочитанными */
    counts: Record<string, number>;
}

/** Ответ со всеми активными фокусами */
export interface DialogFocusesResponse {
    success: boolean;
    focuses: Record<string, { manager_id: string; manager_name: string }[]>;
}
