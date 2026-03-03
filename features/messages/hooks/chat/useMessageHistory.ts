/**
 * useMessageHistory — хаб-хук для работы с историей сообщений.
 *
 * Типы/интерфейсы/константы → messageHistoryTypes.ts
 * Маппер-функции            → messageHistoryMappers.ts
 * 
 * Логика кэширования:
 * 1. При входе в диалог → запрос к бэкенду (бэкенд сам решает: кэш или VK API)
 * 2. Бэкенд возвращает source="cache"|"vk_api"
 * 3. Подгрузка старых — offset-пагинация через тот же эндпоинт
 * 4. "Загрузить все" — отдельный POST эндпоинт
 * 5. Отправка — POST /messages/send, оптимистичное добавление в UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessageData, MailingUserInfo, MessageAttachment } from '../../types';
import {
    getMessageHistory,
    loadAllMessages,
    sendMessage as apiSendMessage,
    uploadMessageAttachment,
    VkMessageItem,
} from '../../../../services/api/messages.api';
import { msgLog, msgWarn, msgGroup, msgGroupEnd, fmtUser, fmtProject } from '../../utils/messagesLogger';

// --- Вынесенные модули ---
import { UseMessageHistoryParams, UseMessageHistoryResult, MessageStats, PAGE_SIZE } from './messageHistoryTypes';
import { mapVkMessage } from './messageHistoryMappers';

// Реэкспорт типов для обратной совместимости
export type { MessageStats } from './messageHistoryTypes';

/**
 * Автопрочтение: если после наших исходящих сообщений есть входящее от пользователя,
 * значит пользователь видел наши сообщения → помечаем их как прочитанные.
 * Проходим массив от конца к началу: находим последнее входящее, всё исходящее до него — прочитано.
 */
function autoMarkReadByIncoming(messages: ChatMessageData[]): ChatMessageData[] {
    // Находим индекс последнего входящего сообщения
    let lastIncomingIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].direction === 'incoming') {
            lastIncomingIdx = i;
            break;
        }
    }
    // Нет входящих — ничего не меняем
    if (lastIncomingIdx === -1) return messages;

    // Помечаем все исходящие ДО последнего входящего как прочитанные
    let changed = false;
    const result = messages.map((msg, idx) => {
        if (idx < lastIncomingIdx && msg.direction === 'outgoing' && !msg.isRead) {
            changed = true;
            return { ...msg, isRead: true };
        }
        return msg;
    });
    return changed ? result : messages;
}

export function useMessageHistory({
    projectId,
    userId,
    groupId,
    direction = null,
    searchText = null,
}: UseMessageHistoryParams): UseMessageHistoryResult {
    const hasParams = !!(projectId && userId && groupId);
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [isLoading, setIsLoading] = useState(() => hasParams);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const [source, setSource] = useState<string | null>(null);
    /** Последнее (самое новое) сырое VK-сообщение — для превью в сайдбаре */
    const [lastRawVkItem, setLastRawVkItem] = useState<VkMessageItem | null>(null);
    /** Данные пользователя полученные вместе с историей */
    const [userInfoFromHistory, setUserInfoFromHistory] = useState<MailingUserInfo | null>(null);
    /** Статистика по направлению сообщений */
    const [messageStats, setMessageStats] = useState<MessageStats | null>(null);

    // Рефы для предотвращения race conditions
    const loadingRef = useRef(false);
    const currentUserIdRef = useRef<number | null>(null);
    /** ID сообщений, отправленных через sendMessage (защита от дублирования с SSE) */
    const sentMessageIdsRef = useRef<Set<string>>(new Set());
    /** Флаг: были ли когда-либо загружены сообщения (для определения первой загрузки при forceRefresh) */
    const hadMessagesRef = useRef(false);

    // =========================================================================
    // СИНХРОННЫЙ СБРОС при смене параметров (React-паттерн: adjust state during render)
    // React увидит setState во время рендера, выбросит текущий JSX и перерендерит
    // с новым состоянием ДО отрисовки в браузере → нет мигания старых данных.
    // =========================================================================
    const paramsKey = `${projectId}_${userId}_${groupId}`;
    const [trackedParamsKey, setTrackedParamsKey] = useState(paramsKey);

    // Отдельный ключ для фильтров — мягкий сброс (только сообщения + пагинация)
    const filterKey = `${direction || 'all'}_${searchText || ''}`;
    const [trackedFilterKey, setTrackedFilterKey] = useState(filterKey);

    if (paramsKey !== trackedParamsKey) {
        console.log(
            '%c[MSG-HISTORY] 🔄 SYNC RESET (смена параметров во время рендера)',
            'color:#ff0;background:#333;font-weight:bold;padding:2px 6px',
            { from: trackedParamsKey, to: paramsKey, hasParams }
        );
        setTrackedParamsKey(paramsKey);
        setMessages([]);
        setIsLoading(hasParams);
        setError(null);
        setTotalCount(0);
        setOffset(0);
        setIsFullyLoaded(false);
        setSource(null);
        setLastRawVkItem(null);
        // userInfoFromHistory и messageStats НЕ сбрасываем —
        // stale-данные остаются видны с animate-data-swap,
        // пока API-ответ не заменит их на актуальные
        // Сброс рефов — предотвращает race condition с предыдущим запросом
        loadingRef.current = false;
        currentUserIdRef.current = userId;
        sentMessageIdsRef.current.clear();
        hadMessagesRef.current = false;
        // При смене диалога — сбрасываем ключ фильтра тоже
        setTrackedFilterKey(filterKey);
    }

    // Мягкий сброс при смене фильтра (direction/search) — без полного reset диалога
    if (filterKey !== trackedFilterKey && paramsKey === trackedParamsKey) {
        console.log(
            '%c[MSG-HISTORY] 🔍 FILTER RESET (смена фильтра/поиска)',
            'color:#0af;background:#333;font-weight:bold;padding:2px 6px',
            { from: trackedFilterKey, to: filterKey }
        );
        setTrackedFilterKey(filterKey);
        setMessages([]);
        setIsLoading(true);
        setError(null);
        setTotalCount(0);
        setOffset(0);
        // НЕ сбрасываем: isFullyLoaded, source, lastRawVkItem, messageStats
        // — фильтр просто переключает вид, base-данные сохраняются
        loadingRef.current = false;
    }

    /**
     * Загрузка первой страницы (при смене диалога или фильтра).
     * forceRefresh=true → бэкенд принудительно обновляет кэш из VK API.
     */
    const loadInitial = useCallback(async (forceRefresh: boolean = false) => {
        if (!projectId || !userId || !groupId) {
            console.log('%c[MSG-HISTORY] loadInitial: SKIP (нет данных)', 'color:#999', { projectId, userId, groupId });
            msgLog('HISTORY', `loadInitial: пропуск (нет данных: proj=${projectId}, user=${userId}, group=${groupId}). Сброс.`);
            setMessages([]);
            setTotalCount(0);
            setOffset(0);
            setError(null);
            setIsFullyLoaded(false);
            setSource(null);
            sentMessageIdsRef.current.clear();
            return;
        }

        if (loadingRef.current) {
            console.log('%c[MSG-HISTORY] loadInitial: SKIP (уже грузится)', 'color:#f90', { userId });
            msgWarn('HISTORY', `loadInitial: пропуск — уже идёт загрузка (race condition?)`);
            return;
        }
        loadingRef.current = true;
        currentUserIdRef.current = userId;
        sentMessageIdsRef.current.clear();

        console.log(
            '%c[MSG-HISTORY] loadInitial: START',
            'color:#0af;font-weight:bold',
            { userId, forceRefresh, hadMessages: hadMessagesRef.current }
        );
        msgGroup('HISTORY', `📥 loadInitial: ${fmtProject(projectId)} / ${fmtUser(userId)}, force=${forceRefresh}`);
        
        // Sync reset уже поставил isLoading=true при смене диалога.
        // Здесь ставим только для forceRefresh (кнопка «Обновить» того же диалога).
        if (forceRefresh && !hadMessagesRef.current) {
            console.log('%c[MSG-HISTORY] → setIsLoading(true) — forceRefresh без данных', 'color:#f00;font-weight:bold');
            setIsLoading(true);
        } else {
            console.log('%c[MSG-HISTORY] → isLoading уже управляется sync reset', 'color:#0a0');
        }
        setError(null);
        setOffset(0);
        setIsFullyLoaded(false);
        setLastRawVkItem(null);
        // userInfoFromHistory и messageStats НЕ сбрасываем —
        // API-ответ заменит их на актуальные

        try {
            // При первичной загрузке (offset=0) запрашиваем данные пользователя вместе с историей
            const data = await getMessageHistory(
                projectId, userId, PAGE_SIZE, 0, forceRefresh, true,
                direction || undefined, searchText || undefined,
            );
            
            if (currentUserIdRef.current !== userId) {
                msgWarn('HISTORY', `loadInitial: userId изменился в процессе загрузки (race condition). Ожидали ${userId}, текущий ${currentUserIdRef.current}`);
                msgGroupEnd('HISTORY');
                return;
            }

            setTotalCount(data.count);
            setSource(data.source || null);
            setIsFullyLoaded(data.is_fully_loaded || false);
            msgLog('HISTORY', `Ответ: count=${data.count}, source=${data.source}, items=${data.items.length}, is_fully_loaded=${data.is_fully_loaded}`);

            // Сохраняем статистику по направлению сообщений (приходит при offset=0)
            if (data.message_stats) {
                setMessageStats({
                    totalInDialog: data.count,
                    totalInCache: data.message_stats.cached_total,
                    incomingCount: data.message_stats.incoming_count,
                    outgoingCount: data.message_stats.outgoing_count,
                    deletedFromVkCount: data.message_stats.deleted_from_vk_count || 0,
                });
            } else {
                setMessageStats(null);
            }

            // Сохраняем данные пользователя из ответа (если есть)
            if (data.user_info) {
                setUserInfoFromHistory(data.user_info as unknown as MailingUserInfo);
            } else {
                setUserInfoFromHistory(null);
            }

            // VK API возвращает от новых к старым — переворачиваем
            const mapped = autoMarkReadByIncoming(
                data.items
                    .map(item => mapVkMessage(item, groupId))
                    .reverse()
            );

            console.log(
                '%c[MSG-HISTORY] loadInitial: DONE — setMessages()',
                'color:#0a0;font-weight:bold',
                { newCount: mapped.length, userId, source: data.source }
            );
            setMessages(mapped);
            setOffset(data.items.length);
            if (mapped.length > 0) {
                hadMessagesRef.current = true;
                console.log('%c[MSG-HISTORY] → hadMessagesRef = true', 'color:#0a0');
            }

            msgLog('HISTORY', `✅ loadInitial завершён: ${mapped.length} сообщений отображено`);
            msgGroupEnd('HISTORY');

            // Сохраняем самое новое сообщение (items[0] — VK отдаёт от новых к старым)
            if (data.items.length > 0) {
                setLastRawVkItem(data.items[0]);
            }
        } catch (err: any) {
            if (currentUserIdRef.current !== userId) {
                msgGroupEnd('HISTORY');
                return;
            }
            msgWarn('HISTORY', `loadInitial ошибка: ${err.message}`, err);
            msgGroupEnd('HISTORY');
            setError(err.message || 'Ошибка загрузки сообщений');
        } finally {
            console.log('%c[MSG-HISTORY] loadInitial: FINALLY — setIsLoading(false)', 'color:#999');
            setIsLoading(false);
            loadingRef.current = false;
        }
    }, [projectId, userId, groupId, direction, searchText]);

    /**
     * Подгрузка старых сообщений (пагинация вверх).
     */
    const loadMore = useCallback(async () => {
        if (!projectId || !userId || !groupId) return;
        if (loadingRef.current) return;
        if (offset >= totalCount) return;

        loadingRef.current = true;
        setIsLoadingMore(true);

        try {
            const data = await getMessageHistory(
                projectId, userId, PAGE_SIZE, offset,
                false, false,
                direction || undefined, searchText || undefined,
            );
            
            if (currentUserIdRef.current !== userId) return;

            const mapped = data.items
                .map(item => mapVkMessage(item, groupId))
                .reverse();

            // Автопрочтение: объединяем старые + существующие и пересчитываем
            setMessages(prev => autoMarkReadByIncoming([...mapped, ...prev]));
            setOffset(prev => prev + data.items.length);
            setTotalCount(data.count);
            setIsFullyLoaded(data.is_fully_loaded || false);
        } catch (err: any) {
            if (currentUserIdRef.current !== userId) return;
            setError(err.message || 'Ошибка загрузки сообщений');
        } finally {
            setIsLoadingMore(false);
            loadingRef.current = false;
        }
    }, [projectId, userId, groupId, offset, totalCount, direction, searchText]);

    /**
     * Загрузить ВСЕ сообщения (для полного контекста менеджера).
     */
    const loadAll = useCallback(async () => {
        if (!projectId || !userId || !groupId) return;
        if (isLoadingAll) return;

        setIsLoadingAll(true);
        setError(null);

        try {
            const result = await loadAllMessages(projectId, userId);
            
            if (currentUserIdRef.current !== userId) return;

            // После загрузки всех — перечитываем первую страницу (теперь из кэша)
            // Но нужно загрузить всё — делаем запрос с большим лимитом
            setIsFullyLoaded(true);
            setTotalCount(result.total_count);

            // Перезагружаем данные из кэша (теперь там всё) с учётом текущих фильтров
            const data = await getMessageHistory(
                projectId, userId, PAGE_SIZE, 0,
                false, false,
                direction || undefined, searchText || undefined,
            );
            
            if (currentUserIdRef.current !== userId) return;

            const mapped = autoMarkReadByIncoming(
                data.items
                    .map(item => mapVkMessage(item, groupId))
                    .reverse()
            );

            setMessages(mapped);
            setOffset(data.items.length);

            // Обновляем статистику после загрузки всех сообщений
            if (data.message_stats) {
                setMessageStats({
                    totalInDialog: data.count,
                    totalInCache: data.message_stats.cached_total,
                    incomingCount: data.message_stats.incoming_count,
                    outgoingCount: data.message_stats.outgoing_count,
                });
            }
        } catch (err: any) {
            if (currentUserIdRef.current !== userId) return;
            setError(err.message || 'Ошибка загрузки всех сообщений');
        } finally {
            setIsLoadingAll(false);
        }
    }, [projectId, userId, groupId, isLoadingAll, direction, searchText]);

    /**
     * Отправить сообщение.
     * Оптимистичное обновление: сразу добавляем в UI, потом подтверждаем с сервера.
     * attachments — TODO: загрузка фото/видео через VK API (photos.getMessagesUploadServer)
     */
    /**
     * Отправить сообщение.
     * Оптимистичное обновление: сразу добавляем в UI, потом подтверждаем с сервера.
     * attachments — загрузка фото через VK API (photos.getMessagesUploadServer → send).
     */
    const handleSendMessage = useCallback(async (text: string, attachments?: File[], senderId?: string, senderName?: string): Promise<boolean> => {
        const trimmed = text.trim();
        const hasFiles = attachments && attachments.length > 0;
        if (!projectId || !userId || !groupId || (!trimmed && !hasFiles)) return false;

        // Локальные превью из прикреплённых файлов (мгновенное отображение до загрузки на сервер)
        const localPreviews: MessageAttachment[] = [];
        if (hasFiles) {
            for (const file of attachments!) {
                const isPhoto = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                const blobUrl = (isPhoto || isVideo) ? URL.createObjectURL(file) : '';
                if (isPhoto) {
                    localPreviews.push({ type: 'photo', url: blobUrl, previewUrl: blobUrl });
                } else if (isVideo) {
                    localPreviews.push({ type: 'video', url: '', name: file.name, previewUrl: blobUrl });
                } else {
                    // Документ — без blob-превью, только имя и размер
                    localPreviews.push({ type: 'document', url: '', name: file.name, size: file.size });
                }
            }
        }

        // Оптимистичное добавление — сразу с локальными превью вложений
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: ChatMessageData = {
            id: tempId,
            direction: 'outgoing',
            text: trimmed,
            timestamp: new Date().toISOString(),
            isRead: false,
            sentByName: senderName || undefined,
            attachments: localPreviews.length > 0 ? localPreviews : undefined,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setIsSending(true);

        try {
            // Шаг 1: Загружаем вложения (если есть) — получаем VK attachment IDs
            let attachmentStr: string | undefined;
            // Превью загруженных фото для оптимистичного отображения
            const uploadedPreviews: MessageAttachment[] = [];

            if (hasFiles) {
                const uploadPromises = attachments!.map(file => uploadMessageAttachment(projectId, userId, file));

                const uploadResults = await Promise.all(uploadPromises);
                const attachmentIds: string[] = [];

                for (const result of uploadResults) {
                    if (result.success && result.attachment_id) {
                        attachmentIds.push(result.attachment_id);
                        // Определяем тип для оптимистичного отображения
                        const attType = result.attachment_type || 'photo';
                        if (attType === 'photo') {
                            uploadedPreviews.push({
                                type: 'photo',
                                url: result.preview_url || '',
                                previewUrl: result.preview_url || '',
                            });
                        } else if (attType === 'video') {
                            uploadedPreviews.push({
                                type: 'video',
                                url: '',
                                name: result.file_name || 'Видео',
                                previewUrl: result.preview_url || '',
                            });
                        } else {
                            // document
                            uploadedPreviews.push({
                                type: 'document',
                                url: result.file_url || '',
                                name: result.file_name || 'Документ',
                                size: result.file_size,
                                previewUrl: result.preview_url || '',
                            });
                        }
                    }
                }

                if (attachmentIds.length > 0) {
                    attachmentStr = attachmentIds.join(',');
                }
            }

            // Обновляем оптимистичное сообщение — добавляем превью вложений
            if (uploadedPreviews.length > 0) {
                setMessages(prev => prev.map(m => 
                    m.id === tempId ? { ...m, attachments: uploadedPreviews } : m
                ));
            }

            // Шаг 2: Отправляем сообщение с attachment строкой
            const result = await apiSendMessage(projectId, userId, trimmed, senderId, senderName, attachmentStr);
            
            if (currentUserIdRef.current !== userId) return true;

            // Заменяем оптимистичное сообщение реальным
            const realMsg = mapVkMessage(result.item, groupId);
            // Если бэкенд не вернул вложения в item — подставляем из upload
            if (uploadedPreviews.length > 0 && (!realMsg.attachments || realMsg.attachments.length === 0)) {
                realMsg.attachments = uploadedPreviews;
            }
            // Запоминаем ID чтобы SSE не добавил дубль
            sentMessageIdsRef.current.add(realMsg.id);
            setMessages(prev => {
                const hasTemp = prev.some(m => m.id === tempId);
                const hasReal = prev.some(m => m.id === realMsg.id);

                // Хелпер: умный мёрж — предпочитает массив с бОльшим количеством вложений,
                // а при равном — предпочитает incoming (более свежие данные)
                const smartMerge = (existing: ChatMessageData, incoming: typeof realMsg): ChatMessageData => {
                    const existingAtts = existing.attachments || [];
                    const incomingAtts = incoming.attachments || [];
                    // Берём массив с бОльшим кол-вом; при равном — incoming (API/SSE данные свежее blob)
                    const bestAtts = incomingAtts.length >= existingAtts.length
                        ? (incomingAtts.length > 0 ? incomingAtts : existingAtts)
                        : existingAtts;
                    return {
                        ...existing,
                        ...incoming,
                        attachments: bestAtts.length > 0 ? bestAtts : undefined,
                    };
                };

                if (hasTemp && hasReal) {
                    // SSE уже заменил temp реальным → мёржим данные (сохраняя вложения)
                    return prev
                        .filter(m => m.id !== tempId)
                        .map(m => m.id === realMsg.id ? smartMerge(m, realMsg) : m);
                }
                if (hasTemp && !hasReal) {
                    // SSE ещё не пришло → заменяем temp на реальное, сохраняя лучшие вложения
                    return prev.map(m => m.id === tempId ? smartMerge(m, realMsg) : m);
                }
                if (!hasTemp && hasReal) {
                    // SSE заменил temp → мёржим данные (сохраняя вложения)
                    return prev.map(m => m.id === realMsg.id ? smartMerge(m, realMsg) : m);
                }
                // Ни temp ни real нет (edge case) → добавляем
                return [...prev, realMsg];
            });
            // Обновляем totalCount только если SSE ещё не сделал этого
            // (sentMessageIdsRef отслеживает — если SSE заменил temp, он уже посчитан)
            setTotalCount(prev => prev + 1);

            // Оптимистичное обновление статистики: +1 исходящее
            setMessageStats(prev => prev ? {
                ...prev,
                totalInDialog: prev.totalInDialog + 1,
                totalInCache: prev.totalInCache + 1,
                outgoingCount: prev.outgoingCount + 1,
            } : null);

            return true;
        } catch (err: any) {
            // Откатываем оптимистичное сообщение
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setError(err.message || 'Ошибка отправки сообщения');
            return false;
        } finally {
            setIsSending(false);
        }
    }, [projectId, userId, groupId]);

    /**
     * Добавить входящее сообщение из SSE без полной перезагрузки.
     * Дедупликация по id — если сообщение уже есть (например, оптимистичное), пропускаем.
     * 
     * Логика автопрочтения: если пришло входящее сообщение от пользователя,
     * значит он видел наши предыдущие исходящие — помечаем их как прочитанные.
     */
    const addIncomingMessage = useCallback((messageData: ChatMessageData) => {
        setMessages(prev => {
            // Проверяем дубликаты (по id сообщения) — мёржим вложения если SSE принёс более полные данные
            const existingIdx = prev.findIndex(m => m.id === messageData.id);
            if (existingIdx !== -1) {
                const existing = prev[existingIdx];
                // Если у существующего сообщения нет вложений (или blob-превью), а у нового есть — мёржим
                if (messageData.attachments && messageData.attachments.length > 0
                    && (!existing.attachments || existing.attachments.length === 0)) {
                    msgLog('HISTORY', `addIncomingMessage: msg_id=${messageData.id} уже есть, мёржим вложения (${messageData.attachments.length} шт.)`);
                    return prev.map((m, i) => i === existingIdx ? { ...m, attachments: messageData.attachments } : m);
                }
                msgLog('HISTORY', `addIncomingMessage: msg_id=${messageData.id} уже есть, пропуск`);
                return prev;
            }
            // Защита от race condition: если мы сами отправили это сообщение — оно придёт через sendMessage
            if (sentMessageIdsRef.current.has(messageData.id)) {
                msgLog('HISTORY', `addIncomingMessage: msg_id=${messageData.id} — наше отправленное, пропуск`);
                return prev;
            }

            // Для ИСХОДЯЩИХ SSE-сообщений: если есть temp-* (ожидающая отправка) —
            // ЗАМЕНЯЕМ temp на реальное SSE-сообщение (вместо добавления нового).
            // Это предотвращает race condition: SSE приходит раньше чем handleSendMessage
            // завершается, и удаление temp потом не уменьшает количество сообщений.
            if (messageData.direction === 'outgoing') {
                const tempIdx = prev.findIndex(m => m.id.startsWith('temp-'));
                if (tempIdx !== -1) {
                    const tempMsg = prev[tempIdx];
                    msgLog('HISTORY', `➕ addIncomingMessage: msg_id=${messageData.id} (outgoing) → замена temp ${tempMsg.id} на реальное сообщение`);
                    // Помечаем ID чтобы handleSendMessage не добавил дубль
                    sentMessageIdsRef.current.add(messageData.id);
                    // Мёржим: предпочитаем массив с бОльшим кол-вом вложений
                    const tempAtts = tempMsg.attachments || [];
                    const sseAtts = messageData.attachments || [];
                    const bestAtts = sseAtts.length >= tempAtts.length
                        ? (sseAtts.length > 0 ? sseAtts : tempAtts)
                        : tempAtts;
                    const merged: ChatMessageData = {
                        ...tempMsg,
                        ...messageData,
                        attachments: bestAtts.length > 0 ? bestAtts : undefined,
                    };
                    return prev.map((m, i) => i === tempIdx ? merged : m);
                }
            }

            msgLog('HISTORY', `➕ addIncomingMessage: msg_id=${messageData.id}, direction=${messageData.direction}, text="${(messageData.text || '').slice(0, 40)}"`);

            // Автопрочтение: входящее от пользователя → все предыдущие исходящие помечаем как прочитанные
            if (messageData.direction === 'incoming') {
                msgLog('HISTORY', `👁️ auto-read: входящее от пользователя → помечаем все предыдущие исходящие как прочитанные`);
                const updated = prev.map(m =>
                    m.direction === 'outgoing' && !m.isRead
                        ? { ...m, isRead: true }
                        : m
                );
                return [...updated, messageData];
            }

            return [...prev, messageData];
        });
        // Увеличиваем счётчик только если не дубль отправленного
        if (sentMessageIdsRef.current.has(messageData.id)) return;
        setTotalCount(prev => prev + 1);

        // Оптимистичное обновление статистики: +1 входящее или исходящее
        setMessageStats(prev => {
            if (!prev) return null;
            const isOutgoing = messageData.direction === 'outgoing';
            return {
                ...prev,
                totalInDialog: prev.totalInDialog + 1,
                totalInCache: prev.totalInCache + 1,
                incomingCount: prev.incomingCount + (isOutgoing ? 0 : 1),
                outgoingCount: prev.outgoingCount + (isOutgoing ? 1 : 0),
            };
        });
    }, []);

    /**
     * Принудительная перезагрузка — вызывается при SSE cache_action="reload".
     * Кэш перестроен на бэкенде, нужно перечитать данные.
     * Сбрасываем loadingRef чтобы не заблокироваться, если параллельная загрузка ещё идёт.
     */
    const forceReload = useCallback(() => {
        msgLog('HISTORY', `🔄 forceReload: принудительная перезагрузка (cache_action=reload) для ${fmtUser(currentUserIdRef.current)}`);
        loadingRef.current = false;
        loadInitial(false); // false = из кэша (он уже обновлён бэкендом)
    }, [loadInitial]);

    /**
     * Пометить исходящие сообщения как прочитанные (до указанного message_id включительно).
     * Вызывается при SSE-событии user_read — пользователь VK прочитал наши сообщения.
     */
    const markMessagesAsRead = useCallback((upToMessageId: number) => {
        msgLog('HISTORY', `👁️ markMessagesAsRead: пометка исходящих как прочитанных до msg_id=${upToMessageId}`);
        setMessages(prev => prev.map(msg => {
            // Помечаем только исходящие и непрочитанные
            if (msg.direction === 'outgoing' && !msg.isRead) {
                const msgId = Number(msg.id);
                if (!isNaN(msgId) && msgId <= upToMessageId) {
                    return { ...msg, isRead: true };
                }
            }
            return msg;
        }));
    }, []);

    // Автозагрузка при смене диалога
    useEffect(() => {
        loadInitial(false);
    }, [loadInitial]);

    const hasMore = offset < totalCount;

    return {
        messages,
        isLoading,
        isLoadingMore,
        isLoadingAll,
        isSending,
        error,
        totalCount,
        hasMore,
        isFullyLoaded,
        source,
        loadMore,
        loadAll,
        refresh: () => loadInitial(true),
        sendMessage: handleSendMessage,
        addIncomingMessage,
        forceReload,
        markMessagesAsRead,
        lastRawVkItem,
        userInfoFromHistory,
        messageStats,
    };
}
