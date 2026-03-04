/**
 * Типы для модуля "Работа с сообщениями"
 */

/** Канал обмена сообщениями */
export type MessagesChannel = 'vk' | 'tg';

/** Статус пользователя в сети */
export type UserOnlineStatus = 'online' | 'offline' | 'recently';

/** Направление сообщения */
export type MessageDirection = 'incoming' | 'outgoing';

/** Тип вложения */
export type AttachmentType = 'photo' | 'document' | 'audio' | 'video' | 'sticker' | 'link' | 'wall' | 'poll' | 'audio_message' | 'graffiti' | 'gift' | 'market' | 'unknown';

/** Вложение к сообщению */
export interface MessageAttachment {
    type: AttachmentType;
    url: string;
    /** Название файла / заголовок */
    name?: string;
    /** Превью (для фото/видео) */
    previewUrl?: string;
    /** Описание (для ссылок, записей, опросов) */
    description?: string;
    /** Длительность в секундах (аудио, видео) */
    duration?: number;
    /** Размер файла в байтах */
    size?: number;
    /** Варианты опроса */
    pollAnswers?: { text: string; votes: number }[];
}

/** Действие кнопки VK */
export interface VkKeyboardButtonAction {
    type: 'text' | 'callback' | 'open_link' | 'open_app' | 'location' | 'vkpay';
    label?: string;
    link?: string;
    payload?: string;
}

/** Кнопка клавиатуры VK */
export interface VkKeyboardButtonData {
    action: VkKeyboardButtonAction;
    color?: 'primary' | 'secondary' | 'negative' | 'positive';
}

/** Клавиатура бота (кнопки, прикреплённые к сообщению) */
export interface MessageKeyboard {
    inline: boolean;
    buttons: VkKeyboardButtonData[][];
}

/** Одно сообщение в диалоге */
export interface ChatMessageData {
    id: string;
    /** Направление: входящее от юзера или исходящее от сообщества */
    direction: MessageDirection;
    text: string;
    timestamp: string; // ISO строка
    /** Прочитано ли сообщение */
    isRead: boolean;
    /** Вложения */
    attachments?: MessageAttachment[];
    /** Клавиатура бота (кнопки) */
    keyboard?: MessageKeyboard;
    /** Имя менеджера, отправившего сообщение через нашу систему */
    sentByName?: string;
    /** Сообщение связано с ботом (нажатие кнопки или ответ бота) */
    isBotMessage?: boolean;
    /** Сообщение удалено из ВК (есть в нашей базе, но нет в VK) */
    isDeletedFromVk?: boolean;
}

/** Собеседник (пользователь ВК или Telegram) */
export interface ConversationUser {
    id: string;
    /** Имя пользователя */
    firstName: string;
    /** Фамилия пользователя */
    lastName: string;
    /** URL аватара */
    avatarUrl?: string;
    /** Статус пользователя в сети */
    onlineStatus: UserOnlineStatus;
    /** Последний раз был в сети (ISO строка) */
    lastSeen?: string;
}

/** Диалог (беседа) с пользователем */
export interface Conversation {
    id: string;
    /** Собеседник */
    user: ConversationUser;
    /** Последнее сообщение */
    lastMessage?: ChatMessageData;
    /** Количество непрочитанных входящих сообщений */
    unreadCount: number;
    /** Канал (vk или tg) */
    channel: MessagesChannel;
    /** ID проекта, к которому привязан диалог */
    projectId: string;
    /** Диалог помечен как «Важный» (звёздочка) */
    isImportant?: boolean;
    /** ID меток (ярлыков), назначенных диалогу */
    labelIds?: string[];
}

/** Фильтр поиска по сообщениям */
export type MessageSearchFilter = 'all' | 'outgoing' | 'incoming';

/** Фильтры отображения в чате (скрытие элементов для компактности) */
export interface ChatDisplayFilters {
    /** Скрывать вложения в сообщениях */
    hideAttachments: boolean;
    /** Скрывать кнопки бота (keyboard) в сообщениях */
    hideKeyboard: boolean;
    /** Скрывать сообщения бота/рассылки целиком */
    hideBotMessages: boolean;
}

/** Данные пользователя из рассылки (SystemListMailing) */
export interface MailingUserInfo {
    vk_user_id: number;
    first_name: string;
    last_name: string;
    photo_url?: string;
    sex?: number;
    bdate?: string;
    city?: string;
    country?: string;
    platform?: number;
    last_seen?: number;
    domain?: string;
    is_closed?: boolean;
    can_access_closed?: boolean;
    can_write_private_message?: boolean;
    deactivated?: string;
    has_mobile?: boolean;
    added_at?: string;
    first_message_date?: string;
    first_message_from_id?: number;
    last_message_date?: string;
    conversation_status?: string;
    source?: string;
    updated_at?: string;
    /** Дата последнего входящего сообщения (от клиента) — вычисляется из кэша */
    last_incoming_message_date?: string;
    /** Дата последнего исходящего сообщения (от нас) — вычисляется из кэша */
    last_outgoing_message_date?: string;
    /** Был ли профиль обновлён из VK API при этом запросе */
    profile_refreshed?: boolean;
}

// =============================================================================
// SSE (Server-Sent Events) — типы push-уведомлений
// =============================================================================

/** Типы SSE-событий модуля сообщений */
export type SSEEventType = 
    | 'new_message' 
    | 'message_read' 
    | 'unread_update' 
    | 'all_read'                // все диалоги прочитаны (mark-all-read другим менеджером)
    | 'connected'
    | 'user_read'              // пользователь VK прочитал наши исходящие
    | 'user_typing'            // пользователь VK печатает сообщение
    | 'dialog_focus'           // менеджер открыл/покинул диалог
    | 'mailing_user_updated';  // данные пользователя в рассылке обновлены (при message_new)

/** Данные нового сообщения из SSE */
export interface SSENewMessageData {
    vk_user_id: number;
    message: {
        id: number;
        from_id: number;
        peer_id: number;
        text: string;
        date: number;
        out: number;
        attachments?: unknown[];
        keyboard?: {
            one_time?: boolean;
            inline?: boolean;
            buttons: unknown[][];
        };
        /** Payload кнопки бота (строка JSON) */
        payload?: string;
        /** Имя менеджера, отправившего сообщение через нашу систему */
        sent_by_name?: string;
    };
    unread_count: number;
    is_incoming: boolean;
    /** "append" — дозаписано в кэш, "reload" — кэш перезагружен из VK API */
    cache_action: 'append' | 'reload';
}

/** Данные о прочтении диалога из SSE (менеджер прочитал) */
export interface SSEMessageReadData {
    vk_user_id: number;
    last_read_message_id: number;
    read_by?: string;
    unread_count: number;
}

/** Данные о прочтении всех диалогов (mark-all-read) */
export interface SSEAllReadData {
    project_id: string;
    updated_count: number;
    read_by?: string;
}

/** Данные о прочтении пользователем VK наших исходящих сообщений */
export interface SSEUserReadData {
    vk_user_id: number;
    /** ID сообщения, до которого пользователь прочитал */
    read_message_id: number;
}

/** Данные о печати пользователем VK */
export interface SSEUserTypingData {
    vk_user_id: number;
}

/** Данные о фокусе менеджера на диалоге */
export interface SSEDialogFocusData {
    vk_user_id: number;
    manager_id: string;
    manager_name: string;
    action: 'enter' | 'leave';
    /** ID проекта — для защиты от кросс-проектных гонок при переключении */
    project_id?: string;
}

/** Данные обновления пользователя рассылки из SSE (при callback message_new) */
export interface SSEMailingUserUpdatedData {
    /** Полные данные пользователя из SystemListMailing (после upsert) */
    user: MailingUserInfo;
}

/** Общее SSE-событие */
export interface SSEMessageEvent {
    type: SSEEventType;
    project_id: string;
    data: SSENewMessageData | SSEMessageReadData | SSEAllReadData | SSEUserReadData | SSEUserTypingData | SSEDialogFocusData | SSEMailingUserUpdatedData;
    timestamp: number;
}
