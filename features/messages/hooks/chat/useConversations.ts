/**
 * useConversations — хаб-хук для загрузки списка диалогов.
 *
 * Типы/интерфейсы → conversationsTypes.ts
 * Маппер-функции  → conversationsMappers.ts
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SystemListSubscriber } from '../../../../shared/types';
import { getSubscribers } from '../../../../services/api/lists.api';
import { getUnreadCounts, getLastMessages, getConversationsInit, toggleDialogImportant, VkMessageItem } from '../../../../services/api/messages.api';
import { Conversation, MessagesChannel, MailingUserInfo } from '../../types';
import { msgLog, msgWarn, msgGroup, msgGroupEnd, fmtProject, fmtUser, fmtCount } from '../../utils/messagesLogger';

// --- Вынесенные модули ---
import { UseConversationsParams, UseConversationsResult, PAGE_SIZE } from './conversationsTypes';
import { mapSubscriberToConversation } from './conversationsMappers';

// Реэкспорт типов для обратной совместимости
export type { UseConversationsParams, UseConversationsResult };

/**
 * Хук для загрузки списка диалогов из списка рассылки проекта.
 * Использует существующий API getSubscribers с listType='mailing'.
 */
export const useConversations = ({ projectId, channel, filterUnread = 'all' }: UseConversationsParams): UseConversationsResult => {
    const [subscribers, setSubscribers] = useState<SystemListSubscriber[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    /** Словарь непрочитанных: vk_user_id → count */
    const [unreadCountsMap, setUnreadCountsMap] = useState<Record<number, number>>({});
    /** Словарь последних сообщений: vk_user_id → VkMessageItem */
    const [lastMessagesMap, setLastMessagesMap] = useState<Record<number, VkMessageItem>>({});
    /** Словарь пометок «Важное»: vk_user_id → true */
    const [importantMap, setImportantMap] = useState<Record<number, boolean>>({});

    /** Ref: для какого проекта загружены текущие подписчики (защита от stale-данных при переключении) */
    const loadedProjectRef = useRef<string | null>(null);
    /** Ref: предыдущий проект — для отличия «смена проекта» от «смена фильтра» */
    const prevProjectRef = useRef<string | null>(null);
    /** Ref: поколение запроса (защита от race condition при быстром переключении) */
    const fetchGenerationRef = useRef(0);

    /**
     * Хелпер: стандартный вызов getSubscribers с текущими параметрами
     */
    const callGetSubscribers = useCallback((projId: string, pageNum: number, unreadFilter: string) => {
        return getSubscribers(
            projId, pageNum, '', 'mailing',
            'all', 'all', 'any', 'all', 'any', 'any', 'any',
            unreadFilter,
        );
    }, []);

    // Загрузка данных (подписчики + метаданные: непрочитанные и последние сообщения)
    // Стратегия "unread-first": при filter=all параллельно грузим непрочитанных + обычную страницу,
    // затем мержим — непрочитанные всегда первые в списке
    const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
        if (!projectId) return;

        const generation = ++fetchGenerationRef.current;
        msgLog('CONVERSATIONS', `fetchData: ${fmtProject(projectId)}, page=${pageNum}, append=${append}, filter=${filterUnread}, gen=${generation}`);
        setIsLoading(true);
        setError(null);

        try {
            if (append) {
                // Подгрузка (loadMore) — стандартный запрос + дедупликация
                const response = await callGetSubscribers(projectId, pageNum, filterUnread);

                if (fetchGenerationRef.current !== generation) {
                    msgWarn('CONVERSATIONS', `fetchData: запрос устарел (gen=${generation}), пропуск`);
                    return;
                }

                msgLog('CONVERSATIONS', `fetchData append: получено ${response.items.length} подписчиков, всего ${response.total_count}`);

                // Дедупликация: убираем пользователей которые уже в списке
                // (могли быть подгружены как unread-first на первой странице)
                setSubscribers(prev => {
                    const existingIds = new Set(prev.map(s => s.vk_user_id));
                    const newItems = response.items.filter(s => !existingIds.has(s.vk_user_id));
                    msgLog('CONVERSATIONS', `fetchData append: дедупликация — ${response.items.length - newItems.length} дублей убрано, добавлено ${newItems.length}`);
                    return [...prev, ...newItems];
                });
                setTotalCount(response.total_count);

                // Загружаем last messages только для НОВЫХ пользователей
                if (response.items.length > 0) {
                    const newUserIds = response.items.map(s => s.vk_user_id);
                    getLastMessages(projectId, newUserIds).then(res => {
                        if (fetchGenerationRef.current !== generation) return;
                        if (res.success && res.messages) {
                            const newMap: Record<number, VkMessageItem> = {};
                            for (const [key, value] of Object.entries(res.messages)) {
                                newMap[Number(key)] = value;
                            }
                            setLastMessagesMap(prev => ({ ...prev, ...newMap }));
                        }
                    }).catch(() => {});
                }
            } else {
                // ═══════════════════════════════════════════════════════════════
                // Первичная загрузка — ОПТИМИЗИРОВАНО: единый эндпоинт conversations-init
                // Заменяет 4 запроса (2x getSubscribers + getUnreadCounts + getLastMessages)
                // одним вызовом, устраняя waterfall и экономя ~500ms-1s
                // ═══════════════════════════════════════════════════════════════

                const sortUnreadFirst = filterUnread === 'all';
                const result = await getConversationsInit(projectId, pageNum, sortUnreadFirst, filterUnread);

                if (fetchGenerationRef.current !== generation) {
                    msgWarn('CONVERSATIONS', `fetchData: запрос устарел (gen=${generation}), пропуск`);
                    return;
                }

                const mergedItems = result.subscribers as SystemListSubscriber[];
                const mainTotal = result.total_count;

                msgLog('CONVERSATIONS', `fetchData: conversations-init получено ${mergedItems.length} подписчиков, всего ${mainTotal}`);

                // Парсим unread counts
                const unreadMap: Record<number, number> = {};
                if (result.unread_counts) {
                    for (const [key, value] of Object.entries(result.unread_counts)) {
                        unreadMap[Number(key)] = value as number;
                    }
                }

                // Парсим last messages
                const newLastMsgsMap: Record<number, VkMessageItem> = {};
                if (result.last_messages) {
                    for (const [key, value] of Object.entries(result.last_messages)) {
                        newLastMsgsMap[Number(key)] = value as VkMessageItem;
                    }
                }

                // Парсим important dialogs
                const newImportantMap: Record<number, boolean> = {};
                if (result.important_dialogs) {
                    for (const [key, value] of Object.entries(result.important_dialogs)) {
                        newImportantMap[Number(key)] = !!value;
                    }
                }

                // Батч: все обновления состояния за один render
                setSubscribers(mergedItems);
                setTotalCount(mainTotal);
                setUnreadCountsMap(unreadMap);
                setLastMessagesMap(newLastMsgsMap);
                setImportantMap(newImportantMap);
                loadedProjectRef.current = projectId;
                const pageWithUnread = mergedItems.filter(s => (unreadMap[s.vk_user_id] || 0) > 0).length;
                const totalWithUnread = Object.keys(unreadMap).filter(k => unreadMap[Number(k)] > 0).length;
                msgLog('CONVERSATIONS', `fetchData: батч завершён, ${mergedItems.length} подписчиков, ${pageWithUnread} с непрочитанными на странице (${totalWithUnread} всего в проекте)`);
            }
        } catch (err) {
            if (fetchGenerationRef.current !== generation) return;
            const message = err instanceof Error ? err.message : 'Ошибка загрузки списка рассылки';
            setError(message);
            msgWarn('CONVERSATIONS', `fetchData: ошибка загрузки ${fmtProject(projectId)}`, err);
        } finally {
            // Сбрасываем isLoading только для актуального запроса
            if (fetchGenerationRef.current === generation) {
                setIsLoading(false);
            }
        }
    }, [projectId, filterUnread, callGetSubscribers]);

    // Загрузка при смене проекта ИЛИ фильтра
    // Различаем: смена проекта → полный сброс, смена фильтра → перезагрузка без сброса
    useEffect(() => {
        if (projectId) {
            const isProjectChange = projectId !== prevProjectRef.current;
            prevProjectRef.current = projectId;

            if (isProjectChange) {
                // Смена проекта — полный сброс данных
                msgLog('CONVERSATIONS', `📂 Смена проекта → ${fmtProject(projectId)}. Сброс состояния и загрузка.`);
                setPage(1);
                setSubscribers([]);
                setUnreadCountsMap({});
                setLastMessagesMap({});
                setImportantMap({});
                cachedSortOrderRef.current = new Map();
                // loadedProjectRef обновится в fetchData после получения данных
            } else {
                // Смена фильтра (или реконнект) — перезагрузка БЕЗ сброса данных
                // Старые данные видны пока грузятся новые — нет мигания пустого списка
                msgLog('CONVERSATIONS', `🔄 Смена фильтра → ${filterUnread}. Перезагрузка без сброса.`);
                setPage(1);
            }
            fetchData(1, false);
        } else {
            msgLog('CONVERSATIONS', '📂 Проект сброшен (null). Очистка.');
            setSubscribers([]);
            setTotalCount(0);
            setPage(1);
            setError(null);
            setUnreadCountsMap({});
            setLastMessagesMap({});
            setImportantMap({});
            cachedSortOrderRef.current = new Map();
            loadedProjectRef.current = null;
            prevProjectRef.current = null;
        }
    }, [projectId, fetchData]);

    /**
     * Обновить количество непрочитанных для конкретного пользователя.
     * Вызывается из SSE-обработчиков (new_message / message_read).
     */
    const updateUnreadCount = useCallback((vkUserId: number, count: number) => {
        setUnreadCountsMap(prev => {
            if (prev[vkUserId] === count) {
                msgLog('CONVERSATIONS', `updateUnreadCount: ${fmtUser(vkUserId)} = ${fmtCount(count)} (без изменений)`);
                return prev;
            }
            msgLog('CONVERSATIONS', `updateUnreadCount: ${fmtUser(vkUserId)} ${fmtCount(prev[vkUserId] || 0)} → ${fmtCount(count)}`);
            return { ...prev, [vkUserId]: count };
        });
    }, []);

    /**
     * Обновить последнее сообщение для конкретного диалога.
     * Вызывается из SSE-обработчиков (new_message / send).
     */
    const updateLastMessage = useCallback((vkUserId: number, message: VkMessageItem) => {
        msgLog('CONVERSATIONS', `updateLastMessage: ${fmtUser(vkUserId)}, msg_id=${message.id}, text="${(message.text || '').slice(0, 40)}"`);
        setLastMessagesMap(prev => ({ ...prev, [vkUserId]: message }));
    }, []);

    /**
     * Сбросить счётчики непрочитанных для всех диалогов.
     * Вызывается после успешного mark-all-read на бэкенде.
     */
    const resetAllUnreadCounts = useCallback(() => {
        msgLog('CONVERSATIONS', '🧹 resetAllUnreadCounts: сброс ВСЕХ счётчиков непрочитанных на 0');
        setUnreadCountsMap({});
    }, []);

    /**
     * Переключить пометку «Важное» для диалога.
     * Оптимистичное обновление: сразу меняем локально, затем отправляем на сервер.
     */
    const toggleImportant = useCallback(async (vkUserId: number, isImportant: boolean) => {
        if (!projectId) return;
        // Оптимистичное обновление
        setImportantMap(prev => ({ ...prev, [vkUserId]: isImportant }));
        try {
            await toggleDialogImportant(projectId, vkUserId, isImportant);
            msgLog('CONVERSATIONS', `⭐ toggleImportant: ${fmtUser(vkUserId)} → ${isImportant}`);
        } catch (err) {
            // Откат при ошибке
            setImportantMap(prev => ({ ...prev, [vkUserId]: !isImportant }));
            msgWarn('CONVERSATIONS', `Ошибка toggleImportant ${fmtUser(vkUserId)}`, err);
        }
    }, [projectId]);

    /**
     * Добавить нового пользователя в список диалогов из SSE mailing_user_updated.
     * Маппит MailingUserInfo → SystemListSubscriber и вставляет в начало списка.
     * Если пользователь уже есть — игнорирует (дублирование невозможно).
     */
    const addNewConversationFromSSE = useCallback((user: MailingUserInfo) => {
        setSubscribers(prev => {
            // Проверяем — если пользователь уже есть, не добавляем
            if (prev.some(s => s.vk_user_id === user.vk_user_id)) {
                msgLog('CONVERSATIONS', `addNewConversationFromSSE: ${fmtUser(user.vk_user_id)} уже в списке, пропуск`);
                return prev;
            }
            msgLog('CONVERSATIONS', `➕ addNewConversationFromSSE: добавляем ${fmtUser(user.vk_user_id)} (${user.first_name} ${user.last_name})`);

            // Маппинг MailingUserInfo → SystemListSubscriber
            const newSub: SystemListSubscriber = {
                id: `sse-${user.vk_user_id}`,
                vk_user_id: user.vk_user_id,
                first_name: user.first_name || 'Пользователь',
                last_name: user.last_name || '',
                domain: user.domain,
                photo_url: user.photo_url,
                sex: user.sex,
                bdate: user.bdate,
                city: user.city,
                country: user.country,
                has_mobile: user.has_mobile ? 1 : 0,
                last_seen: user.last_seen,
                platform: user.platform,
                added_at: user.added_at || new Date().toISOString(),
                deactivated: user.deactivated,
                is_closed: user.is_closed,
                can_access_closed: user.can_access_closed,
                can_write_private_message: user.can_write_private_message,
                source: user.source || 'callback',
            };

            // Вставляем в начало списка (новый диалог появляется сверху)
            return [newSub, ...prev];
        });
        // Увеличиваем totalCount
        setTotalCount(prev => prev + 1);
    }, []);

    // Подгрузка следующей страницы
    const loadMore = useCallback(() => {
        if (isLoading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage, true);
    }, [page, isLoading, fetchData]);

    // Перезагрузка
    const refresh = useCallback(() => {
        setPage(1);
        setSubscribers([]);
        fetchData(1, false);
    }, [fetchData]);

    // Кэш порядка сортировки — стабилизирует позиции при обновлении только данных (mark-read, превью)
    // Полная пересортировка только при изменении subscribers (загрузка, loadMore, SSE новый пользователь)
    // или при явном запросе через requestResort()
    const cachedSortOrderRef = useRef<Map<string, number>>(new Map());
    const prevSubscribersRef = useRef<SystemListSubscriber[]>([]);
    const [sortVersion, setSortVersion] = useState(0);
    const prevSortVersionRef = useRef(0);

    /**
     * Запросить пересортировку списка диалогов.
     * Вызывается при получении НОВОГО входящего сообщения через SSE (новое сообщение — пользователь поднимается вверх).
     * НЕ вызывается при mark-read и обновлении превью из истории (позиции стабильны).
     */
    const requestResort = useCallback(() => {
        setSortVersion(v => v + 1);
    }, []);

    // Маппинг подписчиков в диалоги (с реальными unread counts и последними сообщениями)
    // Сортировка: стабильная — пересортировка только при изменении subscribers или sortVersion
    const conversations = useMemo<Conversation[]>(() => {
        if (!projectId) return [];
        // Защита от stale-данных: не показываем подписчиков старого проекта в новом
        if (projectId !== loadedProjectRef.current) return [];
        const mapped = subscribers.map(sub => mapSubscriberToConversation(sub, projectId, channel, unreadCountsMap, lastMessagesMap, importantMap));
        const unreadTotal = mapped.filter(c => c.unreadCount > 0).length;
        msgLog('CONVERSATIONS', `🔄 useMemo conversations: ${mapped.length} диалогов, из них с непрочитанными: ${unreadTotal}, ${fmtProject(projectId)}`);

        // Определяем нужна ли полная пересортировка:
        // 1. Кэш пуст (первая загрузка)
        // 2. Subscribers изменились (новая загрузка, loadMore, SSE новый пользователь)
        // 3. Явный запрос через requestResort() (новое входящее сообщение)
        const subscribersChanged = subscribers !== prevSubscribersRef.current;
        const sortVersionChanged = sortVersion !== prevSortVersionRef.current;
        prevSortVersionRef.current = sortVersion;
        const needsFullSort = cachedSortOrderRef.current.size === 0 || subscribersChanged || sortVersionChanged;

        if (needsFullSort) {
            prevSubscribersRef.current = subscribers;
            msgLog('CONVERSATIONS', `🔄 Полная пересортировка: subscribersChanged=${subscribersChanged}, sortVersionChanged=${sortVersionChanged}, cacheSize=${cachedSortOrderRef.current.size}`);

            // Сортируем: непрочитанные сверху (по кол-ву непрочитанных), затем по дате последнего сообщения
            mapped.sort((a, b) => {
                const aUnread = a.unreadCount || 0;
                const bUnread = b.unreadCount || 0;

                // Оба имеют непрочитанные — больше непрочитанных = выше
                if (aUnread > 0 && bUnread > 0) {
                    return bUnread - aUnread;
                }
                // Только один имеет непрочитанные — он выше
                if (aUnread > 0) return -1;
                if (bUnread > 0) return 1;

                // Оба прочитаны — сортируем по дате последнего сообщения (новее = выше)
                const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return bTime - aTime;
            });

            // Обновляем кэш порядка
            const newOrder = new Map<string, number>();
            mapped.forEach((c, i) => newOrder.set(c.id, i));
            cachedSortOrderRef.current = newOrder;
        } else {
            // Стабильная сортировка: сохраняем кэшированный порядок
            // (mark-read, обновление превью из истории — данные обновляются, позиции стабильны)
            msgLog('CONVERSATIONS', `🔄 Стабильная сортировка: используем кэшированный порядок (${cachedSortOrderRef.current.size} записей)`);
            const cachedOrder = cachedSortOrderRef.current;
            mapped.sort((a, b) => {
                const aOrder = cachedOrder.get(a.id) ?? 9999;
                const bOrder = cachedOrder.get(b.id) ?? 9999;
                return aOrder - bOrder;
            });
        }

        return mapped;
    }, [subscribers, projectId, channel, unreadCountsMap, lastMessagesMap, importantMap, sortVersion]);

    // Есть ли ещё данные для подгрузки
    const hasMore = subscribers.length < totalCount;

    // Эффективная загрузка: загрузка идёт ИЛИ проект сменился но данные ещё не получены
    // Это убирает мигание пустого состояния при смене проекта: sidebar сразу показывает loading,
    // не дожидаясь useEffect → fetchData → setIsLoading(true)
    const effectiveIsLoading = isLoading || (!!projectId && projectId !== loadedProjectRef.current);

    return {
        conversations,
        isLoading: effectiveIsLoading,
        error,
        totalCount,
        page,
        loadMore,
        hasMore,
        refresh,
        updateUnreadCount,
        updateLastMessage,
        addNewConversationFromSSE,
        resetAllUnreadCounts,
        requestResort,
        toggleImportant,
    };
};
