/**
 * Хук для загрузки данных пользователя из рассылки.
 * Используется в панели информации о пользователе (правая часть MessagesPage).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MailingUserInfo } from '../../types';
import { getMailingUserInfo } from '../../../../services/api/messages.api';

interface UseMailingUserInfoParams {
    projectId: string | null;
    userId: number | null;
    /** Данные пользователя полученные вместе с историей сообщений (чтобы не делать отдельный запрос) */
    initialData?: MailingUserInfo | null;
}

interface UseMailingUserInfoResult {
    /** Данные пользователя */
    userInfo: MailingUserInfo | null;
    /** Идёт первичная загрузка (показываем спиннер) */
    isLoading: boolean;
    /** Идёт фоновое обновление данных (НЕ заменяем контент спиннером) */
    isRefreshing: boolean;
    /** Ошибка */
    error: string | null;
    /** Найден ли пользователь в рассылке */
    isFound: boolean;
    /** Перезагрузить данные */
    refresh: () => void;
    /** Прямое обновление данных из SSE (без HTTP-запроса) */
    updateFromSSE: (data: MailingUserInfo) => void;
}

export function useMailingUserInfo({ projectId, userId, initialData }: UseMailingUserInfoParams): UseMailingUserInfoResult {
    const [userInfo, setUserInfo] = useState<MailingUserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!userId && !initialData);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFound, setIsFound] = useState(false);
    /** Трекер: была ли первичная загрузка (хотя бы один юзер был загружен) */
    const hadDataRef = useRef(false);

    // =========================================================================
    // СИНХРОННЫЙ СБРОС при смене userId (React-паттерн: adjust state during render)
    // =========================================================================
    const [trackedUserId, setTrackedUserId] = useState(userId);

    if (userId !== trackedUserId) {
        console.log(
            '%c[USER-INFO] 🔄 SYNC RESET (смена userId во время рендера)',
            'color:#ff0;background:#333;font-weight:bold;padding:2px 6px',
            { from: trackedUserId, to: userId }
        );
        setTrackedUserId(userId);
        // userInfo и isFound НЕ сбрасываем — stale-данные остаются видны
        // с animate-data-swap, пока initialData из API не заменит их
        setIsLoading(false);
        setIsRefreshing(false);
        setError(null);
        hadDataRef.current = false;
    }

    // Если пришли данные из history-ответа — подставляем сразу (без HTTP-запроса)
    useEffect(() => {
        console.log(
            '%c[USER-INFO] initialData effect',
            'color:#c0f',
            { hasInitialData: !!initialData, userId, hadData: hadDataRef.current }
        );
        if (initialData) {
            console.log('%c[USER-INFO] → подставляем initialData, setIsLoading(false)', 'color:#0a0');
            setUserInfo(initialData);
            setIsFound(true);
            setError(null);
            setIsLoading(false);
            hadDataRef.current = true;
        }
    }, [initialData]);

    /**
     * @param forceRefresh — запросить свежие данные из VK API (а не кэш)
     * @param silent — тихий режим: не показываем ни спиннер, ни лоадер на кнопке «Обновить»
     */
    const fetchUser = useCallback(async (forceRefresh: boolean = false, silent: boolean = false) => {
        if (!projectId || !userId) {
            setUserInfo(null);
            setIsFound(false);
            setError(null);
            return;
        }

        console.log(
            '%c[USER-INFO] fetchUser: START',
            'color:#0af;font-weight:bold',
            { userId, forceRefresh, silent, hadData: hadDataRef.current, hasUserInfo: !!userInfo }
        );

        // silent — под капотом, никаких визуальных индикаторов
        // forceRefresh — кнопка «Обновить», крутим иконку
        // первичная загрузка (нет данных) — спиннер вместо контента
        if (!silent) {
            if (forceRefresh) {
                console.log('%c[USER-INFO] → setIsRefreshing(true)', 'color:#f90');
                setIsRefreshing(true);
            } else if (!hadDataRef.current) {
                console.log('%c[USER-INFO] → setIsLoading(true) — первая загрузка', 'color:#f00;font-weight:bold');
                setIsLoading(true);
            } else {
                console.log('%c[USER-INFO] → НЕ ставим isLoading/isRefreshing (hadData=true, silent switch)', 'color:#0a0');
            }
        } else {
            console.log('%c[USER-INFO] → silent=true, никаких визуальных состояний', 'color:#999');
        }
        setError(null);

        try {
            const response = await getMailingUserInfo(projectId, userId, forceRefresh);
            console.log(
                '%c[USER-INFO] fetchUser: RESPONSE',
                'color:#0a0;font-weight:bold',
                { success: response.success, found: response.found, userId, forceRefresh }
            );
            if (response.success && response.found && response.user) {
                setUserInfo(response.user);
                setIsFound(true);
            } else {
                setUserInfo(null);
                setIsFound(false);
            }
        } catch (err) {
            // В тихом режиме — молча глотаем ошибку, данные не сбрасываем
            if (!silent) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки данных пользователя');
                if (!forceRefresh) {
                    setUserInfo(null);
                    setIsFound(false);
                }
            }
        } finally {
            if (!silent) {
                if (forceRefresh) {
                    setIsRefreshing(false);
                } else {
                    setIsLoading(false);
                }
            }
        }
    }, [projectId, userId]);

    // Загружаем при смене пользователя (без force) — но только если нет initialData
    useEffect(() => {
        console.log(
            '%c[USER-INFO] fetchUser effect (смена юзера)',
            'color:#c0f',
            { userId, hasInitialData: !!initialData, hadData: hadDataRef.current }
        );
        if (!initialData) {
            console.log('%c[USER-INFO] → вызываем fetchUser(false)', 'color:#0af');
            fetchUser(false);
        } else {
            console.log('%c[USER-INFO] → SKIP fetchUser (есть initialData)', 'color:#0a0');
        }
    }, [fetchUser, initialData]);

    // Автообновление: при открытии диалога параллельно с getHistory запрашиваем свежие данные из VK API
    // (аналог кнопки «Обновить» — stale-while-revalidate паттерн)
    const autoRefreshKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!projectId || !userId) {
            autoRefreshKeyRef.current = null;
            return;
        }

        const key = `${projectId}_${userId}`;
        if (autoRefreshKeyRef.current === key) return;
        autoRefreshKeyRef.current = key;

        // Задержка: даём initialData из ответа getHistory подставиться первой,
        // чтобы пользователь сразу увидел кэшированные данные, а VK-обновление пришло фоном
        const timer = setTimeout(() => {
            // silent=true — под капотом, кнопка «Обновить» не крутится
            fetchUser(true, true);
        }, 300);

        return () => clearTimeout(timer);
    }, [projectId, userId, fetchUser]);

    // Принудительное обновление — вызывает VK API даже если кэш свежий
    const forceRefresh = useCallback(() => {
        fetchUser(true);
    }, [fetchUser]);

    // Прямое обновление данных из SSE-события (без HTTP-запроса)
    const updateFromSSE = useCallback((data: MailingUserInfo) => {
        setUserInfo(data);
        setIsFound(true);
        setError(null);
    }, []);

    return {
        userInfo,
        isLoading,
        isRefreshing,
        error,
        isFound,
        refresh: forceRefresh,
        updateFromSSE,
    };
}
