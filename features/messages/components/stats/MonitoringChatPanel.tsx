/**
 * Панель read-only превью чата в мониторинге сообщений.
 * Показывает историю переписки с пользователем, без возможности отправки.
 * Кнопка «Перейти в чат» → переключает в модуль сообщений (через onNavigateToChat).
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import { ChatMessageData } from '../../types';
import { ChatMessageList } from '../chat/ChatMessageList';
import { UserAvatar } from './MessageStatsHelpers';
import { getMessageHistory, VkMessageItem } from '../../../../services/api/messages.api';
import { mapVkMessage } from '../../hooks/chat/messageHistoryMappers';

/** Данные выбранного пользователя в мониторинге */
export interface MonitoringChatUser {
    /** VK user ID */
    vkUserId: number;
    /** ID проекта */
    projectId: string;
    /** Имя пользователя (если есть) */
    firstName?: string | null;
    /** Фамилия пользователя (если есть) */
    lastName?: string | null;
    /** URL фото */
    photoUrl?: string | null;
    /** VK ID группы (для определения direction) */
    groupId?: number | null;
}

interface MonitoringChatPanelProps {
    /** Выбранный пользователь */
    chatUser: MonitoringChatUser;
    /** Map проектов для отображения имени */
    projectsMap: Map<string, Project>;
    /** Закрыть панель */
    onClose: () => void;
    /** Перейти в полноценный чат (модуль сообщений) */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
}

/** Размер страницы для пагинации */
const PAGE_SIZE = 50;

export const MonitoringChatPanel: React.FC<MonitoringChatPanelProps> = ({
    chatUser,
    projectsMap,
    onClose,
    onNavigateToChat,
}) => {
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Реф для предотвращения race conditions
    const currentUserRef = useRef<string>('');

    const project = projectsMap.get(chatUser.projectId);
    const groupId = chatUser.groupId || project?.vkProjectId || null;

    // Ключ для отслеживания смены пользователя
    const userKey = `${chatUser.projectId}_${chatUser.vkUserId}`;

    // Имя пользователя
    const userName = useMemo(() => {
        const parts = [chatUser.firstName, chatUser.lastName].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : `ID ${chatUser.vkUserId}`;
    }, [chatUser.firstName, chatUser.lastName, chatUser.vkUserId]);

    /** Загрузка первой страницы сообщений */
    const loadInitial = useCallback(async () => {
        if (!chatUser.projectId || !chatUser.vkUserId) return;

        const key = `${chatUser.projectId}_${chatUser.vkUserId}`;
        currentUserRef.current = key;

        setIsLoading(true);
        setError(null);
        setMessages([]);
        setOffset(0);

        try {
            const data = await getMessageHistory(
                chatUser.projectId,
                chatUser.vkUserId,
                PAGE_SIZE,
                0,
                false, // не принудительное обновление
                false, // не нужна user_info
            );

            // Проверка race condition
            if (currentUserRef.current !== key) return;

            const gid = groupId || 0;
            const mapped = data.items.map((item: VkMessageItem) => mapVkMessage(item, gid));
            // Сортировка от старых к новым
            mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setMessages(mapped);
            setTotalCount(data.count);
            setOffset(data.items.length);
            setHasMore(data.items.length < data.count && !data.is_fully_loaded);
        } catch (e: any) {
            if (currentUserRef.current !== key) return;
            setError(e.message || 'Ошибка загрузки сообщений');
        } finally {
            if (currentUserRef.current === key) {
                setIsLoading(false);
            }
        }
    }, [chatUser.projectId, chatUser.vkUserId, groupId]);

    /** Подгрузка старых сообщений */
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const data = await getMessageHistory(
                chatUser.projectId,
                chatUser.vkUserId,
                PAGE_SIZE,
                offset,
                false,
                false,
            );

            const gid = groupId || 0;
            const mapped = data.items.map((item: VkMessageItem) => mapVkMessage(item, gid));
            mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setMessages(prev => {
                // Дедупликация
                const existingIds = new Set(prev.map(m => m.id));
                const newMsgs = mapped.filter(m => !existingIds.has(m.id));
                // Старые идут в начало
                return [...newMsgs, ...prev];
            });
            setOffset(prev => prev + data.items.length);
            setHasMore(offset + data.items.length < data.count);
        } catch (e: any) {
            console.error('Ошибка подгрузки сообщений:', e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [chatUser.projectId, chatUser.vkUserId, offset, groupId, isLoadingMore, hasMore]);

    // Загрузка при смене пользователя
    useEffect(() => {
        loadInitial();
    }, [userKey]); // eslint-disable-line react-hooks/exhaustive-deps

    /** URL диалога в VK */
    const vkDialogUrl = groupId
        ? `https://vk.com/gim${groupId}?sel=${chatUser.vkUserId}`
        : `https://vk.com/id${chatUser.vkUserId}`;

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 animate-fade-in">
            {/* === Шапка панели === */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Аватар пользователя */}
                    {chatUser.photoUrl ? (
                        <UserAvatar url={chatUser.photoUrl} name={userName} />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-400 truncate">
                            {project?.name || chatUser.projectId}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Обновить */}
                    <button
                        onClick={loadInitial}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors"
                        title="Обновить переписку"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {/* Открыть в VK */}
                    <a
                        href={vkDialogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
                        title="Открыть диалог в VK"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>

                    {/* Перейти в полноценный чат */}
                    {onNavigateToChat && (
                        <button
                            onClick={() => onNavigateToChat(chatUser.projectId, chatUser.vkUserId)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors"
                            title="Перейти в чат (полный интерфейс)"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    )}

                    {/* Закрыть панель */}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        title="Закрыть превью"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* === Кнопка «Перейти в чат» === */}
            {onNavigateToChat && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-indigo-50/50">
                    <span className="text-xs text-gray-500">Только просмотр</span>
                    <button
                        onClick={() => onNavigateToChat(chatUser.projectId, chatUser.vkUserId)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Перейти в чат
                    </button>
                </div>
            )}

            {/* === Контент: загрузка / ошибка / сообщения === */}
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="loader mx-auto h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                    <p className="text-sm text-gray-400 mt-3">Загрузка переписки...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <svg className="h-10 w-10 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-500 text-center mb-2">{error}</p>
                    <button
                        onClick={loadInitial}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
                    >
                        Повторить
                    </button>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <svg className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm text-gray-500 text-center">Нет сообщений</p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                        История переписки пуста
                    </p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Счётчик сообщений */}
                    <div className="flex-shrink-0 flex items-center justify-center py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gray-400">
                            {messages.length} из {totalCount} сообщений
                        </span>
                    </div>
                    <ChatMessageList
                        messages={messages}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                    />
                </div>
            )}
        </div>
    );
};
