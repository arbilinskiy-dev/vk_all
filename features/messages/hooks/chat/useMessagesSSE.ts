/**
 * Хук для подключения к SSE-потоку сообщений.
 * 
 * Подключается к GET /api/messages/stream и получает push-уведомления:
 * - new_message: новое входящее/исходящее сообщение
 * - message_read: диалог прочитан другим менеджером
 * - user_read: пользователь VK прочитал наши исходящие сообщения
 * - user_typing: пользователь VK печатает
 * - dialog_focus: менеджер открыл/покинул диалог
 * 
 * EventSource автоматически переподключается при обрыве.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { API_BASE_URL } from '../../../../shared/config';
import {
    SSEMessageEvent,
    SSENewMessageData,
    SSEMessageReadData,
    SSEAllReadData,
    SSEUserReadData,
    SSEUserTypingData,
    SSEDialogFocusData,
    SSEMailingUserUpdatedData,
} from '../../types';
import { msgLog, msgWarn, msgError, fmtProject, fmtUser, fmtCount } from '../../utils/messagesLogger';
import { getManagerId } from '../../utils/getManagerId';

/** Колбэки на события SSE */
export interface SSECallbacks {
    /** Новое сообщение (входящее или исходящее через callback) */
    onNewMessage?: (data: SSENewMessageData) => void;
    /** Диалог прочитан (другим менеджером) */
    onMessageRead?: (data: SSEMessageReadData) => void;
    /** Пользователь VK прочитал наши исходящие сообщения */
    onUserRead?: (data: SSEUserReadData) => void;
    /** Пользователь VK печатает сообщение */
    onUserTyping?: (data: SSEUserTypingData) => void;
    /** Менеджер открыл/покинул диалог */
    onDialogFocus?: (data: SSEDialogFocusData) => void;
    /** Данные пользователя в рассылке обновлены (при message_new) */
    onMailingUserUpdated?: (data: SSEMailingUserUpdatedData) => void;
    /** Все диалоги прочитаны другим менеджером (mark-all-read) */
    onAllRead?: (data: SSEAllReadData) => void;
    /** SSE переподключился после разрыва — могли быть пропущены события */
    onReconnect?: () => void;
}

interface UseMessagesSSEParams {
    /** ID проекта для подписки (null = не подключаемся) */
    projectId: string | null;
    /** Колбэки на события */
    callbacks: SSECallbacks;
    /** Имя текущего менеджера (для отображения другим) */
    managerName?: string;
}

interface UseMessagesSSEResult {
    /** Подключен ли SSE в данный момент */
    isConnected: boolean;
    /** ID менеджера текущей вкладки */
    managerId: string;
}

export function useMessagesSSE({
    projectId,
    callbacks,
    managerName = '',
}: UseMessagesSSEParams): UseMessagesSSEResult {
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbacksRef = useRef(callbacks);
    const managerId = useRef(getManagerId()).current;
    /** Флаг: было ли хотя бы одно успешное подключение (для отслеживания reconnect) */
    const hadConnectionRef = useRef(false);

    // Обновляем ref колбэков при каждом рендере (чтобы не пересоздавать EventSource)
    callbacksRef.current = callbacks;

    // Обработчик SSE-события
    const handleSSEEvent = useCallback((eventType: string, rawData: string) => {
        try {
            const parsed: SSEMessageEvent = JSON.parse(rawData);

            switch (eventType) {
                case 'new_message': {
                    const d = parsed.data as SSENewMessageData;
                    msgLog('PROJECT_SSE', `📩 new_message: ${fmtUser(d.vk_user_id)}, is_incoming=${d.is_incoming}, unread=${fmtCount(d.unread_count)}, cache_action=${d.cache_action}, msg_id=${d.message?.id}`);
                    callbacksRef.current.onNewMessage?.(d);
                    break;
                }
                case 'message_read': {
                    const d = parsed.data as SSEMessageReadData;
                    msgLog('PROJECT_SSE', `👁️ message_read: ${fmtUser(d.vk_user_id)}, unread=${fmtCount(d.unread_count)}, read_by=${d.read_by || '(self)'}`);
                    callbacksRef.current.onMessageRead?.(d);
                    break;
                }
                case 'unread_update': {
                    const d = parsed.data as SSEMessageReadData;
                    msgLog('PROJECT_SSE', `🔔 unread_update: ${fmtUser(d.vk_user_id)}, unread=${fmtCount(d.unread_count)}`);
                    // unread_update имеет ту же структуру что message_read — делегируем
                    callbacksRef.current.onMessageRead?.(d);
                    break;
                }
                case 'all_read': {
                    const d = parsed.data as SSEAllReadData;
                    msgLog('PROJECT_SSE', `✅ all_read: ${fmtProject(d.project_id)}, обновлено ${d.updated_count} диалогов, read_by=${d.read_by || '?'}`);
                    // Все диалоги прочитаны другим менеджером
                    callbacksRef.current.onAllRead?.(d);
                    break;
                }
                case 'user_read': {
                    const d = parsed.data as SSEUserReadData;
                    msgLog('PROJECT_SSE', `👀 user_read: ${fmtUser(d.vk_user_id)} прочитал до msg_id=${d.read_message_id}`);
                    callbacksRef.current.onUserRead?.(d);
                    break;
                }
                case 'user_typing': {
                    const d = parsed.data as SSEUserTypingData;
                    msgLog('TYPING', `⌨️ user_typing: ${fmtUser(d.vk_user_id)}`);
                    callbacksRef.current.onUserTyping?.(d);
                    break;
                }
                case 'dialog_focus': {
                    const d = parsed.data as SSEDialogFocusData;
                    // Прокидываем project_id из конверта SSE-события для защиты от кросс-проектных гонок
                    d.project_id = parsed.project_id;
                    msgLog('DIALOG_FOCUS', `👥 dialog_focus: ${fmtUser(d.vk_user_id)}, manager=${d.manager_name} (${d.manager_id}), action=${d.action}, project=${d.project_id}`);
                    callbacksRef.current.onDialogFocus?.(d);
                    break;
                }
                case 'mailing_user_updated': {
                    const d = parsed.data as SSEMailingUserUpdatedData;
                    msgLog('PROJECT_SSE', `👤 mailing_user_updated: ${fmtUser(d.user?.vk_user_id)} (${d.user?.first_name} ${d.user?.last_name})`);
                    callbacksRef.current.onMailingUserUpdated?.(d);
                    break;
                }
            }
        } catch (error: unknown) {
            msgError('PROJECT_SSE', 'Ошибка парсинга SSE-события', error);
        }
    }, []);

    useEffect(() => {
        if (!projectId) {
            // Нет проекта — отключаемся
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Закрываем предыдущее подключение
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Создаём SSE подключение (с manager_name для dialog_focus)
        const params = new URLSearchParams({
            project_id: projectId,
            manager_id: managerId,
            manager_name: managerName,
        });
        const url = `${API_BASE_URL}/messages/stream?${params.toString()}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        // Подключение установлено
        es.addEventListener('connected', () => {
            const isReconnect = hadConnectionRef.current;
            hadConnectionRef.current = true;
            msgLog('PROJECT_SSE', `✅ Подключен к ${fmtProject(projectId)}, manager_id=${managerId}${isReconnect ? ' (RECONNECT)' : ''}`);
            setIsConnected(true);
            // При переподключении — уведомляем, что могли быть пропущены события
            // Бэкенд отправит LVC-события через subscribe(), но для открытого диалога
            // нужно дополнительно подтянуть свежую историю
            if (isReconnect) {
                callbacksRef.current.onReconnect?.();
            }
        });

        // Новое сообщение
        es.addEventListener('new_message', (e: MessageEvent) => {
            handleSSEEvent('new_message', e.data);
        });

        // Диалог прочитан
        es.addEventListener('message_read', (e: MessageEvent) => {
            handleSSEEvent('message_read', e.data);
        });

        // Обновление непрочитанных
        es.addEventListener('unread_update', (e: MessageEvent) => {
            handleSSEEvent('unread_update', e.data);
        });

        // Все диалоги прочитаны (кнопка «Прочитать все» другим менеджером)
        es.addEventListener('all_read', (e: MessageEvent) => {
            handleSSEEvent('all_read', e.data);
        });

        // Пользователь VK прочитал наши сообщения
        es.addEventListener('user_read', (e: MessageEvent) => {
            handleSSEEvent('user_read', e.data);
        });

        // Пользователь VK печатает
        es.addEventListener('user_typing', (e: MessageEvent) => {
            handleSSEEvent('user_typing', e.data);
        });

        // Менеджер открыл/покинул диалог
        es.addEventListener('dialog_focus', (e: MessageEvent) => {
            handleSSEEvent('dialog_focus', e.data);
        });

        // Данные пользователя рассылки обновлены (при callback message_new)
        es.addEventListener('mailing_user_updated', (e: MessageEvent) => {
            handleSSEEvent('mailing_user_updated', e.data);
        });

        // Ошибка подключения (EventSource автоматически переподключится)
        es.onerror = () => {
            setIsConnected(false);
            msgWarn('PROJECT_SSE', `Соединение потеряно для ${fmtProject(projectId)}, переподключение...`);
        };

        // При открытии
        es.onopen = () => {
            setIsConnected(true);
        };

        // Очистка при размонтировании или смене проекта
        return () => {
            hadConnectionRef.current = false;
            es.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        };
    }, [projectId, managerId, managerName, handleSSEEvent]);

    return { isConnected, managerId };
}
