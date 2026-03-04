/**
 * Маппер-функции для преобразования данных API в модели диалогов.
 * mapSubscriberToUser, mapVkMessageToChat, mapSubscriberToConversation.
 */

import { SystemListSubscriber } from '../../../../shared/types';
import { VkMessageItem } from '../../../../services/api/messages.api';
import { Conversation, ConversationUser, ChatMessageData, MessagesChannel } from '../../types';

/**
 * Маппинг SystemListSubscriber → ConversationUser.
 * Вычисляет онлайн-статус на основе last_seen.
 */
export const mapSubscriberToUser = (sub: SystemListSubscriber): ConversationUser => {
    // Определяем онлайн-статус по last_seen
    let onlineStatus: ConversationUser['onlineStatus'] = 'offline';
    let lastSeenIso: string | undefined;

    if (sub.last_seen) {
        const lastSeenDate = new Date(sub.last_seen * 1000); // unix timestamp → Date
        lastSeenIso = lastSeenDate.toISOString();
        const nowMs = Date.now();
        const diffMinutes = (nowMs - lastSeenDate.getTime()) / (1000 * 60);

        if (diffMinutes < 5) {
            onlineStatus = 'online';
        } else if (diffMinutes < 60) {
            onlineStatus = 'recently';
        } else {
            onlineStatus = 'offline';
        }
    }

    return {
        id: String(sub.vk_user_id),
        firstName: sub.first_name || 'Пользователь',
        lastName: sub.last_name || '',
        avatarUrl: sub.photo_url || undefined,
        onlineStatus,
        lastSeen: lastSeenIso,
    };
};

/**
 * Маппинг VkMessageItem → ChatMessageData для превью.
 */
export const mapVkMessageToChat = (msg: VkMessageItem): ChatMessageData => ({
    id: String(msg.id),
    direction: msg.out === 1 ? 'outgoing' : 'incoming',
    text: msg.text || '',
    timestamp: new Date(msg.date * 1000).toISOString(),
    isRead: msg.read_state === 1,
    isBotMessage: !!msg.payload || !!(msg.keyboard && msg.keyboard.buttons && msg.keyboard.buttons.length > 0),
});

/**
 * Маппинг SystemListSubscriber → Conversation.
 * Инжектируем реальный unreadCount, lastMessage, isImportant и labelIds.
 */
export const mapSubscriberToConversation = (
    sub: SystemListSubscriber,
    projectId: string,
    channel: MessagesChannel,
    unreadCountsMap: Record<number, number>,
    lastMessagesMap: Record<number, VkMessageItem>,
    importantMap?: Record<number, boolean>,
    labelsMap?: Record<number, string[]>,
): Conversation => {
    const vkMsg = lastMessagesMap[sub.vk_user_id];
    return {
        id: `conv-${sub.vk_user_id}`,
        user: mapSubscriberToUser(sub),
        lastMessage: vkMsg ? mapVkMessageToChat(vkMsg) : undefined,
        unreadCount: unreadCountsMap[sub.vk_user_id] || 0,
        channel,
        projectId,
        isImportant: importantMap?.[sub.vk_user_id] || false,
        labelIds: labelsMap?.[sub.vk_user_id] || undefined,
    };
};
