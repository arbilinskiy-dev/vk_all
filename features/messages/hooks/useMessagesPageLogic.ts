/**
 * Хук логики страницы «Сообщения».
 * Подключает историю сообщений, данные пользователя, посты, SSE-поток,
 * mark-read/unread, dialog-focus и typing-индикаторы.
 */
import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { Project, AuthUser } from '../../../shared/types';
import { Conversation, ChatMessageData, MessageSearchFilter, SSENewMessageData, SSEMessageReadData, SSEUserReadData, SSEUserTypingData, SSEDialogFocusData, SSEMailingUserUpdatedData, MailingUserInfo } from '../types';
import { ManagerFocusInfo } from './chat/useTypingState';
import { useMessageHistory } from './chat/useMessageHistory';
import { useMailingUserInfo } from './mailing/useMailingUserInfo';
import { useUserPosts } from './user/useUserPosts';
import { useMessagesSSE } from './chat/useMessagesSSE';
import { mapVkMessage } from './chat/messageHistoryMappers';
import { markDialogAsRead, markDialogAsUnread, setDialogFocus } from '../../../services/api/messages.api';
import { msgLog, msgWarn, msgGroup, msgGroupEnd, fmtProject, fmtUser, fmtCount } from '../utils/messagesLogger';
import { getManagerId } from '../utils/getManagerId';

interface UseMessagesPageLogicParams {
    activeProject: Project | null;
    activeConversationId: string | null;
    onSelectConversation: (id: string | null) => void;
    conversations: Conversation[];
    updateUnreadCount?: (vkUserId: number, count: number) => void;
    updateLastMessage?: (vkUserId: number, message: any) => void;
    addNewConversationFromSSE?: (user: MailingUserInfo) => void;
    user?: AuthUser;
    onUserTyping?: (data: SSEUserTypingData) => void;
    onDialogFocusUpdate?: (data: SSEDialogFocusData, myManagerId: string) => void;
    onAllRead?: () => void;
    typingUsers?: Set<number>;
    dialogFocuses?: Map<number, ManagerFocusInfo[]>;
    /** Оптимистичное обновление бейджа проекта в sidebar (projectId, unreadDialogsCount) */
    onProjectUnreadUpdate?: (projectId: string, count: number) => void;
    /** Запросить пересортировку списка диалогов (при новом входящем сообщении) */
    requestResort?: () => void;
}

export function useMessagesPageLogic({
    activeProject,
    activeConversationId,
    onSelectConversation,
    conversations,
    updateUnreadCount,
    updateLastMessage,
    addNewConversationFromSSE,
    user,
    onUserTyping,
    onDialogFocusUpdate,
    onAllRead,
    typingUsers,
    dialogFocuses,
    onProjectUnreadUpdate,
    requestResort,
}: UseMessagesPageLogicParams) {
    // Лог рендера компонента
    msgLog('RENDER', `📝 MessagesPage render: project=${activeProject?.id || 'null'}, conv=${activeConversationId || 'null'}, conversations.len=${conversations.length}`);

    // Активный диалог
    const activeConversation = useMemo(
        () => conversations.find(c => c.id === activeConversationId) || null,
        [conversations, activeConversationId]
    );

    // VK user_id собеседника
    const vkUserId = activeConversation ? Number(activeConversation.user.id) || null : null;
    // VK group_id из проекта
    const vkGroupId = activeProject?.vkProjectId ? Number(activeProject.vkProjectId) || null : null;
    // ID проекта
    const projectId = activeProject?.id || null;

    // Ссылка на диалог в VK (gim{group_id}/convo/{user_id})
    const vkDialogUrl = vkGroupId && vkUserId
        ? `https://vk.com/gim${vkGroupId}/convo/${vkUserId}`
        : null;

    // =========================================================================
    // ФИЛЬТРАЦИЯ СООБЩЕНИЙ (серверная)
    // =========================================================================

    // Фильтр по направлению: 'all' | 'incoming' | 'outgoing'
    const [messageDirection, setMessageDirection] = useState<MessageSearchFilter>('all');
    // Дебаунсированный текст поиска (отправляется на сервер)
    const [debouncedSearchText, setDebouncedSearchText] = useState<string>('');

    // Сброс фильтров при смене диалога
    const prevConvIdRef = useRef(activeConversationId);
    if (prevConvIdRef.current !== activeConversationId) {
        prevConvIdRef.current = activeConversationId;
        // React sync reset: сбрасываем фильтры при смене диалога
        if (messageDirection !== 'all') setMessageDirection('all');
        if (debouncedSearchText !== '') setDebouncedSearchText('');
    }

    // =========================================================================
    // ДАННЫЕ
    // =========================================================================

    // Загрузка истории сообщений через бэкенд
    const {
        messages,
        isLoading: isMessagesLoading,
        isLoadingMore,
        isLoadingAll,
        isSending,
        error: messagesError,
        hasMore,
        isFullyLoaded,
        loadMore,
        loadAll,
        refresh: refreshMessages,
        sendMessage,
        addIncomingMessage,
        forceReload,
        markMessagesAsRead,
        lastRawVkItem,
        userInfoFromHistory,
        messageStats,
    } = useMessageHistory({
        projectId,
        userId: vkUserId,
        groupId: vkGroupId,
        direction: messageDirection === 'all' ? null : messageDirection,
        searchText: debouncedSearchText || null,
    });

    // Загрузка данных пользователя из рассылки (используем данные из history если есть)
    const {
        userInfo,
        isLoading: isUserInfoLoading,
        isRefreshing: isUserInfoRefreshing,
        error: userInfoError,
        isFound: isUserInfoFound,
        refresh: refreshUserInfo,
        updateFromSSE: updateUserInfoFromSSE,
    } = useMailingUserInfo({
        projectId,
        userId: vkUserId,
        initialData: userInfoFromHistory,
    });

    // Загрузка постов пользователя (автора) в сообществе
    const {
        posts: userPosts,
        totalCount: userPostsTotalCount,
        isLoading: isUserPostsLoading,
        error: userPostsError,
        hasMore: userPostsHasMore,
        loadMore: loadMoreUserPosts,
    } = useUserPosts({
        projectId,
        userId: vkUserId,
    });

    // =========================================================================
    // REFS
    // =========================================================================

    // Ref для текущего vkUserId (чтобы SSE-колбэки видели актуальное значение)
    const vkUserIdRef = useRef(vkUserId);
    vkUserIdRef.current = vkUserId;

    // ID менеджера (стабильный, из localStorage — тот же что в useMessagesSSE)
    const managerId = useRef(getManagerId()).current;

    // Имя менеджера (для отображения другим менеджерам)
    // Для admin — оставляем username, для пользователей — используем ФИО (если заполнено)
    const managerName = user?.role === 'admin'
        ? (user?.username || 'Менеджер')
        : (user?.full_name || user?.username || 'Менеджер');

    // =========================================================================
    // ЭФФЕКТЫ
    // =========================================================================

    // --- Обновляем превью последнего сообщения в сайдбаре при первой загрузке истории ---
    // ВАЖНО: vkUserId НЕ в зависимостях! Используем ref.
    // Причина: при переключении диалога vkUserId меняется мгновенно (render),
    // а lastRawVkItem обновляется позже (через loadInitial в passive effect).
    // Если включить vkUserId в deps — эффект срабатывает с НОВЫМ userId но СТАРЫМ lastRawVkItem,
    // и записывает сообщение предыдущего пользователя в превью нового.
    useEffect(() => {
        if (lastRawVkItem && vkUserIdRef.current) {
            updateLastMessage?.(vkUserIdRef.current, lastRawVkItem);
        }
    }, [lastRawVkItem, updateLastMessage]); // vkUserId намеренно исключён — берём из ref

    // --- Mark-as-read при открытии диалога (ПОСЛЕ загрузки сообщений) ---
    const markedDialogRef = useRef<string | null>(null);

    // Сброс при смене диалога
    useEffect(() => {
        markedDialogRef.current = null;
        msgLog('RENDER', `📨 Смена диалога: ${fmtUser(vkUserId)}, сброс markedDialogRef`);
    }, [vkUserId]);

    useEffect(() => {
        // Ждём пока загрузка завершится
        if (isMessagesLoading) return;
        if (!projectId || !vkUserId) return;
        // Ключевая проверка: сообщения реально загружены в БД
        if (messages.length === 0) return;

        // Уже помечали для этого диалога — пропускаем
        const dialogKey = `${projectId}_${vkUserId}`;
        if (markedDialogRef.current === dialogKey) return;
        markedDialogRef.current = dialogKey;

        msgLog('MARK_READ', `📨 Mark-as-read при открытии диалога: ${fmtProject(projectId)} / ${fmtUser(vkUserId)}, сообщений=${messages.length}`);

        // Сообщения загружены → CachedMessage записи есть в БД → mark-read сработает корректно
        markDialogAsRead(projectId, vkUserId, managerId).then(() => {
            msgLog('MARK_READ', `✅ mark-read успешно: ${fmtUser(vkUserId)} → unread=0`);
            updateUnreadCount?.(vkUserId, 0);
            // Оптимистичное обновление бейджа проекта в sidebar:
            // Пересчитываем кол-во непрочитанных диалогов на основе текущих conversations,
            // не дожидаясь global SSE (который может не прийти или задержаться)
            if (onProjectUnreadUpdate && projectId) {
                const unreadDialogsAfterMarkRead = conversations.filter(c => {
                    // Текущий диалог уже обнулён — исключаем из подсчёта
                    if (String(c.user.id) === String(vkUserId)) return false;
                    return c.unreadCount > 0;
                }).length;
                msgLog('MARK_READ', `📌 Оптимистичное обновление бейджа проекта: ${fmtProject(projectId)} → ${fmtCount(unreadDialogsAfterMarkRead)} непрочитанных диалогов`);
                onProjectUnreadUpdate(projectId, unreadDialogsAfterMarkRead);
            }
        }).catch(err => {
            msgWarn('MARK_READ', `Ошибка mark-read при открытии ${fmtUser(vkUserId)}`, err);
        });
    }, [isMessagesLoading, messages.length, projectId, vkUserId, managerId, updateUnreadCount, onProjectUnreadUpdate, conversations]);

    // --- Dialog Focus: сообщаем бэкенду что мы открыли/покинули диалог ---
    const prevFocusRef = useRef<{ projectId: string; vkUserId: number } | null>(null);

    useEffect(() => {
        // Leave предыдущий диалог
        if (prevFocusRef.current) {
            const prev = prevFocusRef.current;
            msgLog('DIALOG_FOCUS', `🚪 Leave: ${fmtProject(prev.projectId)} / ${fmtUser(prev.vkUserId)}, manager=${managerId}`);
            setDialogFocus(prev.projectId, prev.vkUserId, managerId, managerName, 'leave').catch(() => {});
            prevFocusRef.current = null;
        }

        // Enter новый диалог
        if (projectId && vkUserId) {
            msgLog('DIALOG_FOCUS', `🚪 Enter: ${fmtProject(projectId)} / ${fmtUser(vkUserId)}, manager=${managerId}`);
            setDialogFocus(projectId, vkUserId, managerId, managerName, 'enter').catch(() => {});
            prevFocusRef.current = { projectId, vkUserId };
        }

        // Cleanup: leave при размонтировании
        return () => {
            if (prevFocusRef.current) {
                const prev = prevFocusRef.current;
                setDialogFocus(prev.projectId, prev.vkUserId, managerId, managerName, 'leave').catch(() => {});
                prevFocusRef.current = null;
            }
        };
    }, [projectId, vkUserId, managerId, managerName]);

    // =========================================================================
    // SSE-КОЛБЭКИ
    // =========================================================================

    /** Обёртка над sendMessage — автоматически прокидывает managerId и managerName */
    const sendMessageWithSender = useCallback(async (text: string, attachments?: File[]) => {
        return sendMessage(text, attachments, managerId, managerName);
    }, [sendMessage, managerId, managerName]);

    const handleNewMessage = useCallback((data: SSENewMessageData) => {
        // Определяем, открыт ли сейчас этот диалог
        const isActiveDialog = vkUserIdRef.current === data.vk_user_id;

        msgGroup('PROJECT_SSE', `📩 handleNewMessage: ${fmtUser(data.vk_user_id)}, is_incoming=${data.is_incoming}, isActiveDialog=${isActiveDialog}`);
        msgLog('PROJECT_SSE', `  unread_count=${data.unread_count}, cache_action=${data.cache_action}, msg_id=${data.message?.id}`);

        // Обновляем бейдж непрочитанных в сайдбаре
        if (!data.is_incoming) {
            // ИСХОДЯЩЕЕ сообщение (от нас или стороннего сервиса через VK API).
            // Диалог точно "обработан" — обнуляем бейдж.
            // Это предотвращает фантомные непрочитанные от старых входящих при перезагрузке кэша.
            msgLog('PROJECT_SSE', `  Исходящее → обнуляем бейдж: ${fmtUser(data.vk_user_id)}`);
            updateUnreadCount?.(data.vk_user_id, 0);
        } else if (!isActiveDialog) {
            // ВХОДЯЩЕЕ, диалог НЕ открыт — ставим реальный счётчик
            msgLog('PROJECT_SSE', `  Бейдж обновляем: ${fmtUser(data.vk_user_id)} → ${fmtCount(data.unread_count)} (диалог НЕ открыт)`);
            updateUnreadCount?.(data.vk_user_id, data.unread_count);
        } else {
            // ВХОДЯЩЕЕ, диалог ОТКРЫТ — не ставим ненулевое значение (mark-read обнулит ниже)
            msgLog('PROJECT_SSE', `  Диалог открыт — бейдж НЕ обновляем, будет mark-read`);
        }

        // Обновляем превью последнего сообщения в списке диалогов
        if (data.message) {
            updateLastMessage?.(data.vk_user_id, data.message);
        }

        // При входящем сообщении — запрашиваем пересортировку (пользователь поднимается вверх)
        if (data.is_incoming) {
            requestResort?.();
        }

        // Если сообщение для текущего открытого диалога — добавляем в чат
        if (isActiveDialog) {
            if (data.cache_action === 'reload') {
                msgLog('PROJECT_SSE', `  cache_action=reload → forceReload()`);
                // Кэш перестроен бэкендом — перезагружаем историю
                forceReload();
            } else if (vkGroupId) {
                // Append — маппим VK сообщение через mapVkMessage (включая вложения)
                const newMsg = mapVkMessage(data.message, vkGroupId);
                addIncomingMessage(newMsg);
            }

            // Диалог открыт — сразу обнуляем бейдж и помечаем как прочитанный
            if (data.is_incoming && projectId) {
                msgLog('MARK_READ', `  Диалог открыт → auto mark-read для ${fmtUser(data.vk_user_id)}`);
                // Сначала обнуляем бейдж локально (мгновенно)
                updateUnreadCount?.(data.vk_user_id, 0);
                // Затем отправляем mark-read на сервер
                markDialogAsRead(projectId, data.vk_user_id, managerId).then(() => {
                    msgLog('MARK_READ', `  auto mark-read успешно для ${fmtUser(data.vk_user_id)}`);
                    // Оптимистичное обновление бейджа проекта в sidebar
                    if (onProjectUnreadUpdate) {
                        const unreadAfter = conversations.filter(c => {
                            if (String(c.user.id) === String(data.vk_user_id)) return false;
                            return c.unreadCount > 0;
                        }).length;
                        onProjectUnreadUpdate(projectId, unreadAfter);
                    }
                }).catch(err => {
                    msgWarn('MARK_READ', `Ошибка auto mark-read для ${fmtUser(data.vk_user_id)}`, err);
                });
            }
        }
        msgGroupEnd('PROJECT_SSE');
    }, [updateUnreadCount, updateLastMessage, addIncomingMessage, forceReload, projectId, vkGroupId, onProjectUnreadUpdate, conversations, requestResort]);

    const handleMessageRead = useCallback((data: SSEMessageReadData) => {
        // Другой менеджер прочитал диалог — обнуляем бейдж
        msgLog('MARK_READ', `👁️ handleMessageRead: ${fmtUser(data.vk_user_id)} unread=${fmtCount(data.unread_count)}, read_by=${data.read_by || '(self)'} (многопользовательский режим)`);
        updateUnreadCount?.(data.vk_user_id, data.unread_count);
    }, [updateUnreadCount]);

    // Пользователь VK прочитал наши исходящие сообщения → ставим галочки
    const handleUserRead = useCallback((data: SSEUserReadData) => {
        msgLog('MARK_READ', `👀 handleUserRead: ${fmtUser(data.vk_user_id)} прочитал до msg_id=${data.read_message_id}, активный диалог=${vkUserIdRef.current === data.vk_user_id}`);
        if (vkUserIdRef.current === data.vk_user_id) {
            markMessagesAsRead(data.read_message_id);
        }
    }, [markMessagesAsRead]);

    // SSE-обёртка для user_typing → делегируем в useTypingState через App.tsx
    const handleUserTypingSSE = useCallback((data: SSEUserTypingData) => {
        onUserTyping?.(data);
    }, [onUserTyping]);

    // SSE-обёртка для dialog_focus → делегируем в useTypingState через App.tsx
    const handleDialogFocusSSE = useCallback((data: SSEDialogFocusData) => {
        onDialogFocusUpdate?.(data, managerId);
    }, [onDialogFocusUpdate, managerId]);

    // SSE: данные пользователя рассылки обновлены (при callback message_new)
    // 1) Обновляем UserInfoPanel если это текущий открытый диалог
    // 2) Добавляем нового пользователя в sidebar если его ещё нет в списке
    const handleMailingUserUpdated = useCallback((data: SSEMailingUserUpdatedData) => {
        if (!data.user) return;

        msgLog('PROJECT_SSE', `👤 handleMailingUserUpdated: ${fmtUser(data.user.vk_user_id)} (${data.user.first_name} ${data.user.last_name}), активный диалог=${vkUserIdRef.current === data.user.vk_user_id}`);

        // Обновляем инфо-панель если это текущий открытый диалог
        if (vkUserIdRef.current === data.user.vk_user_id) {
            updateUserInfoFromSSE(data.user);
        }

        // Динамически добавляем нового пользователя в список диалогов (sidebar)
        // Если пользователь уже есть — addNewConversationFromSSE проигнорирует
        addNewConversationFromSSE?.(data.user);
    }, [updateUserInfoFromSSE, addNewConversationFromSSE]);

    // SSE: все диалоги прочитаны другим менеджером (mark-all-read)
    const handleAllRead = useCallback(() => {
        msgLog('MARK_READ', `✅ SSE all_read: другой менеджер прочитал все диалоги (многопользовательский режим)`);
        onAllRead?.();
    }, [onAllRead]);

    // SSE: переподключение после обрыва — обновляем открытый диалог чтобы не пропустить сообщения
    const handleReconnect = useCallback(() => {
        if (vkUserIdRef.current && projectId) {
            msgLog('PROJECT_SSE', `🔄 SSE reconnect → forceReload для открытого диалога ${fmtUser(vkUserIdRef.current)}`);
            forceReload();
        }
    }, [projectId, forceReload]);

    // Подключение SSE
    const { isConnected } = useMessagesSSE({
        projectId,
        callbacks: {
            onNewMessage: handleNewMessage,
            onMessageRead: handleMessageRead,
            onUserRead: handleUserRead,
            onUserTyping: handleUserTypingSSE,
            onDialogFocus: handleDialogFocusSSE,
            onMailingUserUpdated: handleMailingUserUpdated,
            onAllRead: handleAllRead,
            onReconnect: handleReconnect,
        },
        managerName,
    });

    // Данные typing/focus для текущего диалога
    const isCurrentUserTyping = vkUserId ? (typingUsers?.has(vkUserId) ?? false) : false;
    const currentDialogManagers = vkUserId ? (dialogFocuses?.get(vkUserId) || []) : [];

    // --- Отметить диалог как непрочитанный → обновить счётчик → закрыть диалог ---
    const handleMarkAsUnread = useCallback(async () => {
        if (!projectId || !vkUserId) return;
        try {
            msgLog('MARK_READ', `⬅️ handleMarkAsUnread: ${fmtUser(vkUserId)}, ${fmtProject(projectId)}`);
            const result = await markDialogAsUnread(projectId, vkUserId, managerId);
            msgLog('MARK_READ', `⬅️ handleMarkAsUnread успешно: ${fmtUser(vkUserId)} unread=${fmtCount(result.unread_count)}`);
            // Обновляем бейдж непрочитанных в сайдбаре
            updateUnreadCount?.(vkUserId, result.unread_count);
            // Оптимистичное обновление бейджа проекта в sidebar
            if (onProjectUnreadUpdate && projectId) {
                // +1 потому что текущий диалог стал непрочитанным
                const unreadAfter = conversations.filter(c => {
                    if (String(c.user.id) === String(vkUserId)) return false;
                    return c.unreadCount > 0;
                }).length + 1;
                onProjectUnreadUpdate(projectId, unreadAfter);
            }
            // Закрываем диалог (возвращаем к списку)
            onSelectConversation(null);
        } catch (err) {
            msgWarn('MARK_READ', `Ошибка mark-as-unread ${fmtUser(vkUserId)}`, err);
        }
    }, [projectId, vkUserId, managerId, updateUnreadCount, onSelectConversation, onProjectUnreadUpdate, conversations]);

    // =========================================================================
    // ВОЗВРАТ
    // =========================================================================

    return {
        state: {
            activeConversation,
            vkDialogUrl,
            // История сообщений
            messages,
            isMessagesLoading,
            isLoadingMore,
            isLoadingAll,
            isSending,
            messagesError,
            hasMore,
            isFullyLoaded,
            messageStats,
            // Данные пользователя
            userInfo,
            isUserInfoLoading,
            isUserInfoRefreshing,
            userInfoError,
            isUserInfoFound,
            // Посты пользователя
            userPosts,
            userPostsTotalCount,
            isUserPostsLoading,
            userPostsError,
            userPostsHasMore,
            // SSE
            isConnected,
            // Typing/Focus
            isCurrentUserTyping,
            currentDialogManagers,
            // Фильтрация сообщений
            messageDirection,
            debouncedSearchText,
        },
        actions: {
            loadMore,
            loadAll,
            refreshMessages,
            sendMessageWithSender,
            refreshUserInfo,
            loadMoreUserPosts,
            handleMarkAsUnread,
            setMessageDirection,
            setDebouncedSearchText,
        },
    };
}
