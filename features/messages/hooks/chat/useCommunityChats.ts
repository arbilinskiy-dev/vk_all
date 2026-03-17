/**
 * useCommunityChats — хук загрузки групповых чатов (бесед) сообщества.
 * 
 * Два режима:
 * 1. Загрузка из БД (мгновенно) — при входе во вкладку «Чаты»
 * 2. Синхронизация с VK API (медленно) — по кнопке «Синхронизация»
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCommunityChats, syncCommunityChats } from '../../../../services/api/messages.conversations.api';
import { CommunityChat } from '../../../../services/api/messages.types';
import { Conversation } from '../../types';
import { mapVkMessage } from './messageHistoryMappers';

/** Маппер: CommunityChat → Conversation */
function mapChatToConversation(chat: CommunityChat, projectId: string, groupId: number): Conversation {
    // Маппим последнее сообщение через общий маппер (если есть)
    const lastMessage = chat.last_message
        ? mapVkMessage(chat.last_message, groupId)
        : undefined;

    return {
        id: `chat-${chat.peer_id}`,
        user: {
            // Для группового чата peer_id — уникальный ID
            id: String(chat.peer_id),
            firstName: chat.title,
            lastName: '',
            avatarUrl: chat.photo_url || undefined,
            onlineStatus: 'unknown' as const,
        },
        lastMessage,
        unreadCount: 0, // Не показываем бейдж непрочитанных для групповых чатов — это путает пользователей
        channel: 'vk',
        projectId,
        isGroupChat: true,
        membersCount: chat.members_count,
        peerId: chat.peer_id,
    };
}

interface UseCommunityChatsParams {
    projectId: string | null;
    groupId: number | null;
}

interface UseCommunityChatsResult {
    chats: Conversation[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;
    refresh: () => void;
    sync: () => Promise<void>;
}

export function useCommunityChats({ projectId, groupId }: UseCommunityChatsParams): UseCommunityChatsResult {
    const [chats, setChats] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchGenRef = useRef(0);

    /** Загрузка из БД (мгновенно) */
    const fetchChats = useCallback(async () => {
        if (!projectId || !groupId) {
            setChats([]);
            return;
        }

        const gen = ++fetchGenRef.current;
        setIsLoading(true);
        setError(null);

        try {
            const result = await getCommunityChats(projectId);
            if (gen !== fetchGenRef.current) return;

            if (result.error) {
                setError(result.error);
                setChats([]);
                return;
            }

            const mapped = result.chats.map(c => mapChatToConversation(c, projectId, groupId));
            setChats(mapped);
        } catch (e) {
            if (gen !== fetchGenRef.current) return;
            setError(e instanceof Error ? e.message : 'Ошибка загрузки чатов');
            setChats([]);
        } finally {
            if (gen === fetchGenRef.current) {
                setIsLoading(false);
            }
        }
    }, [projectId, groupId]);

    /** Синхронизация с VK API → сохранение в БД → обновление списка */
    const syncChats = useCallback(async () => {
        if (!projectId || !groupId) return;

        setIsSyncing(true);
        setError(null);

        try {
            const result = await syncCommunityChats(projectId);

            if (result.error) {
                setError(result.error);
                return;
            }

            const mapped = result.chats.map(c => mapChatToConversation(c, projectId, groupId));
            setChats(mapped);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка синхронизации чатов');
        } finally {
            setIsSyncing(false);
        }
    }, [projectId, groupId]);

    // Загрузка из БД при смене проекта
    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    return {
        chats,
        isLoading,
        isSyncing,
        error,
        refresh: fetchChats,
        sync: syncChats,
    };
}
