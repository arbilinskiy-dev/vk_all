/**
 * Хук для глобального SSE-стрима счётчиков непрочитанных диалогов.
 * 
 * Подключается к GET /api/messages/global-unread-stream и получает push-уведомления:
 * - unread_count_changed: { project_id, unread_dialogs_count }
 * 
 * Работает НЕЗАВИСИМО от активного проекта — обновляет счётчики
 * для ВСЕХ проектов в сайдбаре модуля «Сообщения».
 * 
 * EventSource автоматически переподключается при обрыве.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { API_BASE_URL } from '../../../shared/config';
import { msgLog, msgWarn, msgError, fmtProject, fmtCount } from '../utils/messagesLogger';

/** Данные события unread_count_changed */
interface UnreadCountChangedData {
    project_id: string;
    unread_dialogs_count: number;
}

interface UseGlobalUnreadSSEParams {
    /** Включён ли хук (true когда activeModule === 'am') */
    enabled: boolean;
    /** Колбэк обновления счётчика для конкретного проекта */
    onUnreadCountChanged: (projectId: string, count: number) => void;
}

interface UseGlobalUnreadSSEResult {
    /** Подключен ли глобальный SSE в данный момент */
    isConnected: boolean;
}

/**
 * Глобальный SSE-стрим для счётчиков непрочитанных диалогов.
 * Один EventSource на все проекты — минимальный трафик.
 */
export function useGlobalUnreadSSE({
    enabled,
    onUnreadCountChanged,
}: UseGlobalUnreadSSEParams): UseGlobalUnreadSSEResult {
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbackRef = useRef(onUnreadCountChanged);

    // Обновляем ref колбэка при каждом рендере (чтобы не пересоздавать EventSource)
    callbackRef.current = onUnreadCountChanged;

    // Обработчик SSE-события
    const handleEvent = useCallback((rawData: string) => {
        try {
            const parsed = JSON.parse(rawData);
            const data = parsed.data as UnreadCountChangedData;
            if (data && data.project_id !== undefined && data.unread_dialogs_count !== undefined) {
                msgLog('GLOBAL_SSE', `📡 unread_count_changed: ${fmtProject(data.project_id)} → ${fmtCount(data.unread_dialogs_count)} непрочитанных диалогов`);
                callbackRef.current(data.project_id, data.unread_dialogs_count);
            } else {
                msgWarn('GLOBAL_SSE', 'Получены данные без project_id/unread_dialogs_count', parsed);
            }
        } catch (error: unknown) {
            msgError('GLOBAL_SSE', 'Ошибка парсинга события', error);
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            // Отключаемся если модуль неактивен
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

        // Создаём SSE подключение к глобальному стриму
        const url = `${API_BASE_URL}/messages/global-unread-stream`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        // Подключение установлено
        es.addEventListener('connected', () => {
            msgLog('GLOBAL_SSE', '✅ Подключен к глобальному стриму счётчиков');
            setIsConnected(true);
        });

        // Изменение счётчика непрочитанных диалогов
        es.addEventListener('unread_count_changed', (e: MessageEvent) => {
            handleEvent(e.data);
        });

        // Ошибка подключения (EventSource автоматически переподключится)
        es.onerror = () => {
            setIsConnected(false);
            msgWarn('GLOBAL_SSE', 'Соединение потеряно, переподключение...');
        };

        // При открытии
        es.onopen = () => {
            setIsConnected(true);
        };

        // Очистка при размонтировании или отключении модуля
        return () => {
            es.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        };
    }, [enabled, handleEvent]);

    return { isConnected };
}
