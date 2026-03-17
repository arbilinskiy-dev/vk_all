/**
 * Маппер-функции для преобразования данных VK API в формат приложения.
 * mapVkAttachment — вложения VK → MessageAttachment
 * mapVkMessage — VkMessageItem → ChatMessageData
 */

import { ChatMessageData, MessageAttachment, MessageKeyboard } from '../../types';
import { VkMessageItem, VkAttachment } from '../../../../services/api/messages.api';

/**
 * Маппинг вложения VK → наш формат MessageAttachment.
 */
export function mapVkAttachment(att: VkAttachment): MessageAttachment | null {
    switch (att.type) {
        case 'photo': {
            const sizes = att.photo?.sizes || [];
            const best = sizes.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b), sizes[0]);
            if (!best) return null;
            return { type: 'photo', url: best.url, previewUrl: best.url };
        }
        case 'doc': {
            if (!att.doc) return null;
            return { type: 'document', url: att.doc.url, name: att.doc.title, size: att.doc.size };
        }
        case 'audio_message': {
            if (!att.audio_message) return null;
            return { type: 'audio_message', url: att.audio_message.link_mp3, duration: att.audio_message.duration };
        }
        case 'sticker': {
            const images = att.sticker?.images || [];
            const img = images.find(i => i.width === 128) || images[0];
            if (!img) return null;
            return { type: 'sticker', url: img.url, previewUrl: img.url };
        }
        case 'video': {
            const imgs = att.video?.image || [];
            const preview = imgs.length > 0 ? imgs[imgs.length - 1]?.url : undefined;
            return { type: 'video', url: '', name: att.video?.title, previewUrl: preview, duration: att.video?.duration };
        }
        case 'link': {
            if (!att.link) return null;
            const linkSizes = att.link.photo?.sizes || [];
            const linkPreview = linkSizes.length > 0
                ? linkSizes.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b), linkSizes[0])?.url
                : undefined;
            return { type: 'link', url: att.link.url, name: att.link.title, description: att.link.description, previewUrl: linkPreview };
        }
        case 'wall': {
            if (!att.wall) return null;
            const wallText = att.wall.text || 'Запись со стены';
            return { type: 'wall', url: `https://vk.com/wall${att.wall.from_id}_${att.wall.id}`, name: 'Запись со стены', description: wallText.substring(0, 200) };
        }
        case 'poll': {
            if (!att.poll) return null;
            return { 
                type: 'poll', 
                url: '', 
                name: att.poll.question, 
                pollAnswers: att.poll.answers?.map(a => ({ text: a.text, votes: a.votes })),
            };
        }
        case 'market': {
            if (!att.market) return null;
            return { 
                type: 'market', 
                url: '', 
                name: att.market.title, 
                description: att.market.price?.text,
                previewUrl: att.market.thumb_photo,
            };
        }
        case 'graffiti': {
            if (!att.graffiti) return null;
            return { type: 'graffiti', url: att.graffiti.url, previewUrl: att.graffiti.url };
        }
        case 'gift': {
            if (!att.gift) return null;
            return { type: 'gift', url: '', previewUrl: att.gift.thumb_256 };
        }
        default:
            // Неизвестный тип — показываем как плашку
            return { type: 'unknown', url: '', name: `Вложение: ${att.type}` };
    }
}

/**
 * Маппинг сообщения VK API → ChatMessageData.
 */
export function mapVkMessage(item: VkMessageItem, groupId: number): ChatMessageData {
    const isOutgoing = item.out === 1 || item.from_id < 0;

    const attachments: MessageAttachment[] = (item.attachments || [])
        .map(mapVkAttachment)
        .filter((a): a is MessageAttachment => a !== null);

    // Маппинг клавиатуры бота (кнопки сообщения)
    let keyboard: MessageKeyboard | undefined;
    if (item.keyboard && item.keyboard.buttons && item.keyboard.buttons.length > 0) {
        keyboard = {
            inline: item.keyboard.inline ?? false,
            buttons: item.keyboard.buttons,
        };
    }

    // Определяем, связано ли сообщение с ботом (payload присутствует = нажатие кнопки или ответ бота)
    const isBotMessage = !!item.payload;

    // Парсинг reply_message — сообщение, на которое это ответ
    let replyMessage: ChatMessageData['replyMessage'] | undefined;
    if (item.reply_message) {
        const replyIsOutgoing = item.reply_message.out === 1 || item.reply_message.from_id < 0;
        replyMessage = {
            id: String(item.reply_message.id),
            text: item.reply_message.text || '',
            direction: replyIsOutgoing ? 'outgoing' : 'incoming',
        };
    }

    // Парсинг fwd_messages — пересланные сообщения
    let forwardedMessages: ChatMessageData['forwardedMessages'] | undefined;
    if (item.fwd_messages && item.fwd_messages.length > 0) {
        forwardedMessages = item.fwd_messages.map(fwd => {
            const fwdIsOutgoing = fwd.out === 1 || fwd.from_id < 0;
            return {
                id: String(fwd.id),
                text: fwd.text || '',
                direction: fwdIsOutgoing ? 'outgoing' : 'incoming' as const,
                timestamp: new Date(fwd.date * 1000).toISOString(),
            };
        });
    }

    return {
        id: String(item.id),
        conversationMessageId: item.conversation_message_id,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        fromId: item.from_id,
        text: item.text || '',
        timestamp: new Date(item.date * 1000).toISOString(),
        isRead: item.read_state === 1,
        attachments: attachments.length > 0 ? attachments : undefined,
        keyboard,
        sentByName: item.sent_by_name,
        isBotMessage,
        isDeletedFromVk: item.is_deleted_from_vk || false,
        replyMessage,
        forwardedMessages,
    };
}
