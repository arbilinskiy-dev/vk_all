/**
 * Хук для извлечения и группировки вложений из загруженных сообщений.
 * Работает полностью на клиенте — фильтрует attachments из массива ChatMessageData[].
 * 
 * Категории:
 * - photos: фото, граффити
 * - videos: видео
 * - links: ссылки, записи со стены
 * - files: документы
 */

import { useMemo } from 'react';
import { ChatMessageData, MessageAttachment, MessageDirection } from '../../types';

// =============================================================================
// ТИПЫ
// =============================================================================

/** Вложение с контекстом сообщения-источника */
export interface AttachmentItem extends MessageAttachment {
    /** ID сообщения, из которого взято вложение */
    messageId: string;
    /** Дата сообщения (ISO строка) */
    messageDate: string;
    /** Направление: от клиента или от нас */
    direction: MessageDirection;
}

/** Категория вложений */
export type AttachmentCategory = 'photos' | 'videos' | 'links' | 'files';

/** Сгруппированные вложения */
export interface GroupedAttachments {
    photos: AttachmentItem[];
    videos: AttachmentItem[];
    links: AttachmentItem[];
    files: AttachmentItem[];
    /** Общее количество вложений */
    totalCount: number;
}

// =============================================================================
// ХУК
// =============================================================================

interface UseConversationAttachmentsParams {
    /** Массив загруженных сообщений */
    messages: ChatMessageData[];
}

/**
 * Извлекает все вложения из загруженных сообщений и группирует по категориям.
 */
export function useConversationAttachments({ messages }: UseConversationAttachmentsParams): GroupedAttachments {
    return useMemo(() => {
        const photos: AttachmentItem[] = [];
        const videos: AttachmentItem[] = [];
        const links: AttachmentItem[] = [];
        const files: AttachmentItem[] = [];

        for (const msg of messages) {
            if (!msg.attachments || msg.attachments.length === 0) continue;

            for (const att of msg.attachments) {
                const item: AttachmentItem = {
                    ...att,
                    messageId: msg.id,
                    messageDate: msg.timestamp,
                    direction: msg.direction,
                };

                switch (att.type) {
                    case 'photo':
                    case 'graffiti':
                        photos.push(item);
                        break;
                    case 'video':
                        videos.push(item);
                        break;
                    case 'link':
                    case 'wall':
                        // Дедупликация: не добавляем ссылку, если URL уже есть
                        if (!links.some(l => l.url === item.url)) {
                            links.push(item);
                        }
                        break;
                    case 'document':
                        files.push(item);
                        break;
                    // sticker, audio_message, poll, market, gift, unknown — не включаем
                }
            }
        }

        return {
            photos,
            videos,
            links,
            files,
            totalCount: photos.length + videos.length + links.length + files.length,
        };
    }, [messages]);
}
