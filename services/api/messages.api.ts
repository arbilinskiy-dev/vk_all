/**
 * API-сервис для модуля сообщений — ХАБ-реэкспорт.
 *
 * Логика разнесена по подмодулям:
 *   messages.types.ts              — все интерфейсы и типы
 *   messages.conversations.api.ts  — список диалогов, непрочитанные
 *   messages.chat.api.ts           — история, отправка, вложения, typing
 *   messages.read-status.api.ts    — прочитано / непрочитано
 *   messages.dialog-meta.api.ts    — фокус, важное, данные пользователя
 */

// Типы
export type {
    VkMessageItem,
    VkKeyboardButtonAction,
    VkKeyboardButton,
    VkKeyboard,
    VkAttachment,
    MessageHistoryResponse,
    LoadAllMessagesResponse,
    SendMessageResponse,
    UploadMessageAttachmentResponse,
    LastMessagesResponse,
    ConversationsInitResponse,
    MailingUserInfoResponse,
    MarkReadResponse,
    MarkUnreadResponse,
    MarkAllReadResponse,
    UnreadCountsResponse,
    UnreadDialogCountsBatchResponse,
    DialogFocusesResponse,
} from './messages.types';

// Диалоги и непрочитанные
export {
    getConversationsInit,
    getLastMessages,
    getUnreadCounts,
    getUnreadDialogCountsBatch,
} from './messages.conversations.api';

// Чат: история, отправка, вложения, typing
export {
    getMessageHistory,
    loadAllMessages,
    sendMessage,
    uploadMessageAttachment,
    sendTypingStatus,
} from './messages.chat.api';

// Прочитано / непрочитано
export {
    markDialogAsRead,
    markDialogAsUnread,
    markAllDialogsAsRead,
} from './messages.read-status.api';

// Метаданные диалогов: фокус, важное, user-info
export {
    getMailingUserInfo,
    setDialogFocus,
    toggleDialogImportant,
    getDialogFocuses,
} from './messages.dialog-meta.api';

// Действия менеджеров в диалогах (хронология чата)
export { getChatActions } from './messages.chat-actions.api';
export type { ChatActionItem, ChatActionsResponse } from './messages.chat-actions.api';