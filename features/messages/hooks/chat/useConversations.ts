/**
 * useConversations — хаб-хук для загрузки списка диалогов.
 *
 * Типы/интерфейсы → conversationsTypes.ts
 * Маппер-функции  → conversationsMappers.ts
 */

import { useState, useEffect, useCallback, useMemo, useRef, SetStateAction } from 'react';
import { SystemListSubscriber } from '../../../../shared/types';
import { getSubscribers } from '../../../../services/api/lists.api';
import { getUnreadCounts, getLastMessages, getConversationsInit, toggleDialogImportant, VkMessageItem } from '../../../../services/api/messages.api';
import { Conversation, MessagesChannel, MailingUserInfo } from '../../types';
import { msgLog, msgWarn, msgGroup, msgGroupEnd, fmtProject, fmtUser, fmtCount } from '../../utils/messagesLogger';

// --- Вынесенные модули ---
import { UseConversationsParams, UseConversationsResult, PAGE_SIZE } from './conversationsTypes';
import { mapSubscriberToConversation } from './conversationsMappers';
import { getCachedConversations, setCachedConversations } from './conversationsCache';

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
    /** Общее кол-во непрочитанных диалогов (стабильное, не зависит от фильтра).
     *  Обновляется при: fetchData, updateUnreadCount (SSE), resetAllUnreadCounts. */
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    /** Словарь непрочитанных: vk_user_id → count */
    const [unreadCountsMap, setUnreadCountsMap] = useState<Record<number, number>>({});
    /** Словарь последних сообщений: vk_user_id → VkMessageItem */
    const [lastMessagesMap, setLastMessagesMap] = useState<Record<number, VkMessageItem>>({});
    /** Словарь пометок «Важное»: vk_user_id → true */
    const [importantMap, setImportantMap] = useState<Record<number, boolean>>({});
    /** Словарь меток диалогов: vk_user_id → [label_id, ...] */
    const [dialogLabelsMap, setDialogLabelsMap] = useState<Record<number, string[]>>({});

    /** Ref: для какого проекта загружены текущие подписчики (защита от stale-данных при переключении) */
    const loadedProjectRef = useRef<string | null>(null);
    /** Ref: предыдущий проект — для отличия «смена проекта» от «смена фильтра» */
    const prevProjectRef = useRef<string | null>(null);
    /** Ref: поколение запроса (защита от race condition при быстром переключении) */
    const fetchGenerationRef = useRef(0);
    /** Ref: синхронная копия unreadCountsMap — для updateUnreadCount без side-effects в updater
     *  (вынесен из setUnreadCountsMap чтобы избежать двойного подсчёта в React StrictMode) */
    const unreadCountsMapRef = useRef<Record<number, number>>({});
    /** Ref-копии для сохранения в кеш при переключении проекта (useEffect не должен зависеть от state) */
    const lastMessagesMapRef = useRef<Record<number, VkMessageItem>>({});
    const importantMapRef = useRef<Record<number, boolean>>({});
    const dialogLabelsMapRef = useRef<Record<number, string[]>>({});
    /** Ref-копии для сохранения в кеш (subscribers / totalCount / totalUnreadCount / filterUnread) */
    const subscribersRef = useRef<SystemListSubscriber[]>([]);
    const totalCountRef = useRef(0);
    const totalUnreadCountRef = useRef(0);
    const filterUnreadRef = useRef(filterUnread);

    // Кэш порядка сортировки — стабилизирует позиции при обновлении только данных (mark-read, превью)
    // Полная пересортировка только при изменении subscribers (загрузка, loadMore, SSE новый пользователь)
    // или при явном запросе через requestResort()
    const cachedSortOrderRef = useRef<Map<string, number>>(new Map());

    // ═══════════════════════════════════════════════════════════════════════════
    // Render-time cache swap — устраняет промежуточный пустой рендер при смене проекта.
    // React позволяет вызывать setState во время рендера если это условно и не зациклится.
    // https://react.dev/reference/react/useState#storing-information-from-previous-renders
    // ═══════════════════════════════════════════════════════════════════════════
    const [renderProjectId, setRenderProjectId] = useState<string | null>(null);
    if (projectId !== renderProjectId) {
        setRenderProjectId(projectId);
        filterUnreadRef.current = filterUnread;

        // Сохраняем уходящий проект в кеш
        const departingProject = loadedProjectRef.current;
        if (departingProject && subscribersRef.current.length > 0) {
            setCachedConversations(departingProject, {
                subscribers: subscribersRef.current,
                totalCount: totalCountRef.current,
                totalUnreadCount: totalUnreadCountRef.current,
                unreadCountsMap: unreadCountsMapRef.current,
                lastMessagesMap: lastMessagesMapRef.current,
                importantMap: importantMapRef.current,
                dialogLabelsMap: dialogLabelsMapRef.current,
                filterUnread: filterUnreadRef.current,
            });
        }

        if (projectId) {
            const cached = getCachedConversations(projectId);
            if (cached) {
                // КЕШ HIT → мгновенное восстановление (React перезапустит рендер с новым state)
                msgLog('CONVERSATIONS', `📂 [render-time] Смена проекта → ${fmtProject(projectId)}. Восстановление из кеша.`);
                setSubscribers(cached.subscribers);
                subscribersRef.current = cached.subscribers;
                setTotalCount(cached.totalCount);
                totalCountRef.current = cached.totalCount;
                setTotalUnreadCount(cached.totalUnreadCount);
                totalUnreadCountRef.current = cached.totalUnreadCount;
                setUnreadCountsMap(cached.unreadCountsMap);
                unreadCountsMapRef.current = cached.unreadCountsMap;
                setLastMessagesMap(cached.lastMessagesMap);
                lastMessagesMapRef.current = cached.lastMessagesMap;
                setImportantMap(cached.importantMap);
                importantMapRef.current = cached.importantMap;
                setDialogLabelsMap(cached.dialogLabelsMap);
                dialogLabelsMapRef.current = cached.dialogLabelsMap;
                loadedProjectRef.current = projectId;
                setPage(1);
                cachedSortOrderRef.current = new Map();
            } else {
                // КЕШ MISS → очищаем state (скелетоны покажет effectiveIsLoading)
                msgLog('CONVERSATIONS', `📂 [render-time] Смена проекта → ${fmtProject(projectId)}. Нет кеша — очистка.`);
                setSubscribers([]);
                subscribersRef.current = [];
                setTotalCount(0);
                totalCountRef.current = 0;
                setTotalUnreadCount(0);
                totalUnreadCountRef.current = 0;
                setUnreadCountsMap({});
                unreadCountsMapRef.current = {};
                setLastMessagesMap({});
                lastMessagesMapRef.current = {};
                setImportantMap({});
                importantMapRef.current = {};
                setDialogLabelsMap({});
                dialogLabelsMapRef.current = {};
                loadedProjectRef.current = null;
                setPage(1);
                cachedSortOrderRef.current = new Map();
            }
        } else {
            // Проект сброшен → полная очистка
            msgLog('CONVERSATIONS', '📂 [render-time] Проект сброшен (null). Очистка.');
            setSubscribers([]);
            subscribersRef.current = [];
            setTotalCount(0);
            totalCountRef.current = 0;
            setTotalUnreadCount(0);
            totalUnreadCountRef.current = 0;
            setUnreadCountsMap({});
            unreadCountsMapRef.current = {};
            setLastMessagesMap({});
            lastMessagesMapRef.current = {};
            setImportantMap({});
            importantMapRef.current = {};
            setDialogLabelsMap({});
            dialogLabelsMapRef.current = {};
            loadedProjectRef.current = null;
            prevProjectRef.current = null;
            setPage(1);
            setError(null);
            cachedSortOrderRef.current = new Map();
        }
    }

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
        // isLoading=true только если нет кешированных данных (нечего показать пользователю).
        // Если кеш есть — данные уже на экране, обновление идёт фоново.
        const hasCachedData = loadedProjectRef.current === projectId && subscribers.length > 0;
        if (!hasCachedData) {
            setIsLoading(true);
        }
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
                    const merged = [...prev, ...newItems];
                    subscribersRef.current = merged;
                    return merged;
                });
                setTotalCount(response.total_count);
                totalCountRef.current = response.total_count;

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
                            setLastMessagesMap(prev => {
                                const merged = { ...prev, ...newMap };
                                lastMessagesMapRef.current = merged;
                                return merged;
                            });
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

                // Парсим dialog labels (метки/ярлыки)
                const newDialogLabelsMap: Record<number, string[]> = {};
                if (result.dialog_labels) {
                    for (const [key, value] of Object.entries(result.dialog_labels)) {
                        if (Array.isArray(value) && value.length > 0) {
                            newDialogLabelsMap[Number(key)] = value;
                        }
                    }
                }

                // Батч: все обновления состояния за один render
                setSubscribers(mergedItems);
                subscribersRef.current = mergedItems;
                setTotalCount(mainTotal);
                totalCountRef.current = mainTotal;
                setUnreadCountsMap(unreadMap);
                unreadCountsMapRef.current = unreadMap;
                setLastMessagesMap(newLastMsgsMap);
                lastMessagesMapRef.current = newLastMsgsMap;
                setImportantMap(newImportantMap);
                importantMapRef.current = newImportantMap;
                setDialogLabelsMap(newDialogLabelsMap);
                dialogLabelsMapRef.current = newDialogLabelsMap;
                loadedProjectRef.current = projectId;
                const pageWithUnread = mergedItems.filter(s => (unreadMap[s.vk_user_id] || 0) > 0).length;
                const totalWithUnread = Object.keys(unreadMap).filter(k => unreadMap[Number(k)] > 0).length;
                // Стабильный счётчик непрочитанных: для фильтра unread total_count = кол-во непрочитанных,
                // для all — считаем из unread_counts (бэкенд отдаёт непрочитанных первыми)
                if (filterUnread === 'unread') {
                    const val = Math.max(mainTotal, totalWithUnread);
                    setTotalUnreadCount(val);
                    totalUnreadCountRef.current = val;
                } else {
                    setTotalUnreadCount(totalWithUnread);
                    totalUnreadCountRef.current = totalWithUnread;
                }
                msgLog('CONVERSATIONS', `fetchData: батч завершён, ${mergedItems.length} подписчиков, ${pageWithUnread} с непрочитанными на странице (${totalWithUnread} всего в проекте)`);

                // Сохраняем в кеш для мгновенного переключения обратно
                setCachedConversations(projectId, {
                    subscribers: mergedItems,
                    totalCount: mainTotal,
                    totalUnreadCount: filterUnread === 'unread' ? Math.max(mainTotal, totalWithUnread) : totalWithUnread,
                    unreadCountsMap: unreadMap,
                    lastMessagesMap: newLastMsgsMap,
                    importantMap: newImportantMap,
                    dialogLabelsMap: newDialogLabelsMap,
                    filterUnread,
                });
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

    // Загрузка при смене проекта ИЛИ фильтра.
    // Состояние (кеш restore/clear) уже обработано в render-time блоке выше.
    // useEffect только запускает fetchData для загрузки/обновления данных с сервера.
    useEffect(() => {
        filterUnreadRef.current = filterUnread;

        if (projectId) {
            const isProjectChange = projectId !== prevProjectRef.current;
            prevProjectRef.current = projectId;

            if (isProjectChange) {
                // Фоновое обновление (кеш восстановлен в render-time) или первая загрузка
                msgLog('CONVERSATIONS', `📂 [useEffect] Смена проекта → ${fmtProject(projectId)}. Запуск fetchData.`);
                fetchData(1, false);
            } else {
                // Смена фильтра (или реконнект) — перезагрузка БЕЗ сброса данных
                msgLog('CONVERSATIONS', `🔄 Смена фильтра → ${filterUnread}. Перезагрузка без сброса.`);
                setPage(1);
                fetchData(1, false);
            }
        } else {
            // Проект null — state уже очищен в render-time
            prevProjectRef.current = null;
        }
    }, [projectId, fetchData]);

    /**
     * Обновить количество непрочитанных для конкретного пользователя.
     * Вызывается из SSE-обработчиков (new_message / message_read).
     *
     * ВАЖНО: setTotalUnreadCount вынесен НАРУЖУ из updater setUnreadCountsMap,
     * чтобы избежать двойного подсчёта в React StrictMode (StrictMode вызывает updater дважды,
     * и side-effect внутри него тоже дублируется → бейдж показывал 12 вместо 6).
     * Синхронная копия unreadCountsMapRef позволяет корректно определить переход 0↔>0.
     */
    const updateUnreadCount = useCallback((vkUserId: number, count: number) => {
        // Читаем текущее значение из синхронного ref (не из state, который может быть stale в батче)
        const oldCount = unreadCountsMapRef.current[vkUserId] || 0;
        if (oldCount === count) {
            msgLog('CONVERSATIONS', `updateUnreadCount: ${fmtUser(vkUserId)} = ${fmtCount(count)} (без изменений)`);
            return;
        }

        msgLog('CONVERSATIONS', `updateUnreadCount: ${fmtUser(vkUserId)} ${fmtCount(oldCount)} → ${fmtCount(count)}`);

        // Синхронно обновляем ref (для следующего вызова в том же батче SSE-событий)
        unreadCountsMapRef.current = { ...unreadCountsMapRef.current, [vkUserId]: count };

        // Обновляем React state
        setUnreadCountsMap(prev => ({ ...prev, [vkUserId]: count }));

        // Обновляем стабильный totalUnreadCount: отслеживаем переходы 0↔>0
        if (oldCount === 0 && count > 0) {
            totalUnreadCountRef.current = totalUnreadCountRef.current + 1;
            setTotalUnreadCount(t => t + 1);
        } else if (oldCount > 0 && count === 0) {
            totalUnreadCountRef.current = Math.max(0, totalUnreadCountRef.current - 1);
            setTotalUnreadCount(t => Math.max(0, t - 1));
        }
    }, []);

    /**
     * Обновить последнее сообщение для конкретного диалога.
     * Вызывается из SSE-обработчиков (new_message / send).
     */
    const updateLastMessage = useCallback((vkUserId: number, message: VkMessageItem) => {
        msgLog('CONVERSATIONS', `updateLastMessage: ${fmtUser(vkUserId)}, msg_id=${message.id}, text="${(message.text || '').slice(0, 40)}"`);
        lastMessagesMapRef.current = { ...lastMessagesMapRef.current, [vkUserId]: message };
        setLastMessagesMap(prev => ({ ...prev, [vkUserId]: message }));
    }, []);

    /**
     * Сбросить счётчики непрочитанных для всех диалогов.
     * Вызывается после успешного mark-all-read на бэкенде.
     */
    const resetAllUnreadCounts = useCallback(() => {
        msgLog('CONVERSATIONS', '🧹 resetAllUnreadCounts: сброс ВСЕХ счётчиков непрочитанных на 0');
        setUnreadCountsMap({});
        unreadCountsMapRef.current = {};
        setTotalUnreadCount(0);
        totalUnreadCountRef.current = 0;
    }, []);

    /**
     * Переключить пометку «Важное» для диалога.
     * Оптимистичное обновление: сразу меняем локально, затем отправляем на сервер.
     */
    const toggleImportant = useCallback(async (vkUserId: number, isImportant: boolean) => {
        if (!projectId) return;
        // Оптимистичное обновление
        importantMapRef.current = { ...importantMapRef.current, [vkUserId]: isImportant };
        setImportantMap(prev => ({ ...prev, [vkUserId]: isImportant }));
        try {
            await toggleDialogImportant(projectId, vkUserId, isImportant);
            msgLog('CONVERSATIONS', `⭐ toggleImportant: ${fmtUser(vkUserId)} → ${isImportant}`);
        } catch (err) {
            // Откат при ошибке
            importantMapRef.current = { ...importantMapRef.current, [vkUserId]: !isImportant };
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
            const updated = [newSub, ...prev];
            subscribersRef.current = updated;
            return updated;
        });
        // Увеличиваем totalCount
        totalCountRef.current = totalCountRef.current + 1;
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
        subscribersRef.current = [];
        fetchData(1, false);
    }, [fetchData]);

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
        const mapped = subscribers.map(sub => mapSubscriberToConversation(sub, projectId, channel, unreadCountsMap, lastMessagesMap, importantMap, dialogLabelsMap));
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
    }, [subscribers, projectId, channel, unreadCountsMap, lastMessagesMap, importantMap, dialogLabelsMap, sortVersion]);

    // Есть ли ещё данные для подгрузки
    const hasMore = subscribers.length < totalCount;

    // Эффективная загрузка: загрузка идёт ИЛИ проект сменился но данные ещё не получены
    // Это убирает мигание пустого состояния при смене проекта: sidebar сразу показывает loading,
    // не дожидаясь useEffect → fetchData → setIsLoading(true)
    const effectiveIsLoading = isLoading || (!!projectId && projectId !== loadedProjectRef.current);

    // Защита от stale totalUnreadCount при смене проекта:
    // аналогично conversations (который возвращает [] когда projectId !== loadedProjectRef),
    // возвращаем 0, пока проект не загружен — иначе бейдж мерцает со старым значением
    const effectiveTotalUnreadCount = (!!projectId && projectId !== loadedProjectRef.current) ? 0 : totalUnreadCount;

    // Обёртка над setDialogLabelsMap — синхронизирует ref для корректного кеширования
    const setDialogLabelsMapWrapped = useCallback((action: SetStateAction<Record<number, string[]>>) => {
        if (typeof action === 'function') {
            setDialogLabelsMap(prev => {
                const next = action(prev);
                dialogLabelsMapRef.current = next;
                return next;
            });
        } else {
            dialogLabelsMapRef.current = action;
            setDialogLabelsMap(action);
        }
    }, []);

    return {
        conversations,
        isLoading: effectiveIsLoading,
        error,
        totalCount,
        totalUnreadCount: effectiveTotalUnreadCount,
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
        dialogLabelsMap,
        setDialogLabelsMap: setDialogLabelsMapWrapped,
    };
};
