import { useState, useCallback, useEffect, useRef } from 'react';
import { Project } from '../../../../shared/types';
import { setupCallbackAuto } from '../../../../services/api/vk.api';
import { refreshMailingStream, RefreshProgress } from '../../../../services/api/lists.api';

/**
 * Состояние готовности рассылки:
 * - 'checking'    — идёт проверка (токен, callback)
 * - 'no-token'    — нет токена сообщества
 * - 'no-callback' — нет настроенного callback-сервера
 * - 'setting-up-callback' — автоматическая настройка callback в процессе
 * - 'callback-error'      — ошибка настройки callback
 * - 'ready'       — всё ОК, можно собирать подписчиков
 * - 'collecting'  — идёт сбор подписчиков (стриминг)
 * - 'done'        — сбор завершён
 * - 'error'       — ошибка сбора
 */
export type MailingReadiness =
    | 'checking'
    | 'no-token'
    | 'no-callback'
    | 'setting-up-callback'
    | 'callback-error'
    | 'ready'
    | 'collecting'
    | 'done'
    | 'error';

export interface UseMailingCollectionResult {
    /** Текущее состояние готовности */
    readiness: MailingReadiness;
    /** Прогресс сбора (при collecting) */
    progress: RefreshProgress | null;
    /** Лейбл прогресса (например "123/456") */
    progressLabel: string;
    /** Ошибка (callback-error или error) */
    errorMessage: string | null;
    /** Сообщение о результате настройки callback */
    callbackSetupMessage: string | null;
    /** Код ошибки VK API (2000 = лимит серверов) */
    callbackErrorCode: number | null;
    /** Ссылка на настройки API сообщества VK */
    vkApiSettingsUrl: string | null;
    /** Запустить проверку готовности */
    checkReadiness: () => void;
    /** Запустить автонастройку callback */
    setupCallback: () => void;
    /** Запустить сбор подписчиков рассылки */
    startCollection: () => void;
    /** Сбросить состояние (для повторной попытки) */
    reset: () => void;
}

interface UseMailingCollectionParams {
    /** Активный проект */
    project: Project | null;
    /** Колбэк вызывается при появлении первых данных (чтобы reload conversations) */
    onDataAvailable?: () => void;
}

/**
 * Хук для проверки готовности и сбора подписчиков рассылки.
 * Последовательно проверяет: токен → callback → запуск стриминга.
 */
export const useMailingCollection = ({
    project,
    onDataAvailable,
}: UseMailingCollectionParams): UseMailingCollectionResult => {
    const [readiness, setReadiness] = useState<MailingReadiness>('checking');
    const [progress, setProgress] = useState<RefreshProgress | null>(null);
    const [progressLabel, setProgressLabel] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [callbackSetupMessage, setCallbackSetupMessage] = useState<string | null>(null);
    const [callbackErrorCode, setCallbackErrorCode] = useState<number | null>(null);

    // Ref для отслеживания, были ли уже уведомлены о данных
    const dataNotifiedRef = useRef(false);
    // Ref для актуального project
    const projectRef = useRef(project);
    projectRef.current = project;

    // Сброс при смене проекта
    useEffect(() => {
        dataNotifiedRef.current = false;
        setProgress(null);
        setProgressLabel('');
        setErrorMessage(null);
        setCallbackSetupMessage(null);
    }, [project?.id]);

    /**
     * Проверяем готовность: токен → confirmation_code (= callback настроен через наш интерфейс)
     * 
     * Логика:
     * 1. Нет communityToken → no-token
     * 2. Нет vk_confirmation_code → no-callback (бэкенд не сможет подтвердить callback от VK)
     * 3. Всё заполнено → ready
     * 
     * Не дёргаем VK API — достаточно проверить что confirmation_code записан.
     * Без него наш бэкенд не ответит VK при подтверждении сервера.
     */
    const checkReadiness = useCallback(async () => {
        if (!project) return;

        setReadiness('checking');
        setErrorMessage(null);
        setCallbackSetupMessage(null);

        const projectName = project.name || project.id;

        // 1. Проверка токена сообщества
        const hasToken = !!(project.communityToken);
        const hasAdditionalTokens = !!(project.additional_community_tokens && project.additional_community_tokens.length > 0);

        console.log(`[useMailingCollection] Проверка "${projectName}": token=${hasToken}, additionalTokens=${hasAdditionalTokens}, confirmationCode=${!!project.vk_confirmation_code}`);

        if (!hasToken && !hasAdditionalTokens) {
            console.log(`[useMailingCollection] → no-token`);
            setReadiness('no-token');
            return;
        }

        // 2. Проверка confirmation_code (= callback настроен через наш интерфейс)
        if (!project.vk_confirmation_code) {
            console.log(`[useMailingCollection] → no-callback (vk_confirmation_code пуст)`);
            setReadiness('no-callback');
            return;
        }

        // Всё готово
        console.log(`[useMailingCollection] → ready`);
        setReadiness('ready');
    }, [project?.id, project?.communityToken, project?.additional_community_tokens, project?.vk_confirmation_code, project?.name]);

    // Автопроверка при смене проекта (стабильные зависимости — только примитивы)
    useEffect(() => {
        if (project) {
            checkReadiness();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id, project?.communityToken, project?.vk_confirmation_code]);

    /**
     * Автоматическая настройка callback
     */
    const setupCallback = useCallback(async () => {
        const proj = projectRef.current;
        if (!proj) return;

        setReadiness('setting-up-callback');
        setErrorMessage(null);
        setCallbackSetupMessage(null);
        setCallbackErrorCode(null);

        try {
            // Определяем окружение
            const env = window.localStorage.getItem('api_environment') || 'production';
            const isLocal = env === 'local';

            const result = await setupCallbackAuto({
                project_id: proj.id,
                is_local: isLocal,
            });

            if (result.success) {
                setCallbackSetupMessage(`Callback настроен: ${result.server_name} (${result.callback_url})`);
                setReadiness('ready');
            } else {
                setErrorMessage(result.message || 'Не удалось настроить callback');
                setCallbackErrorCode(result.error_code ?? null);
                setReadiness('callback-error');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка настройки callback';
            setErrorMessage(message);
            setReadiness('callback-error');
        }
    }, []);

    /**
     * Запуск сбора подписчиков рассылки (стриминг)
     */
    const startCollection = useCallback(async () => {
        const proj = projectRef.current;
        if (!proj) return;

        setReadiness('collecting');
        setProgress(null);
        setProgressLabel('');
        setErrorMessage(null);
        dataNotifiedRef.current = false;

        try {
            await refreshMailingStream(proj.id, (prog: RefreshProgress) => {
                setProgress(prog);

                // Формируем лейбл прогресса
                if (prog.loaded !== undefined && prog.total !== undefined) {
                    setProgressLabel(`${prog.loaded}/${prog.total}`);
                } else if (prog.message) {
                    setProgressLabel(prog.message);
                }

                // Как только появились первые данные — уведомляем (чтобы refresh conversations)
                if (prog.loaded && prog.loaded > 0 && !dataNotifiedRef.current) {
                    dataNotifiedRef.current = true;
                    onDataAvailable?.();
                }
            });

            // Сбор завершён успешно
            setReadiness('done');
            // Финальное обновление данных
            onDataAvailable?.();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка сбора подписчиков';
            setErrorMessage(message);
            setReadiness('error');
        }
    }, [onDataAvailable]);

    /**
     * Сброс состояния для повторной попытки
     */
    const reset = useCallback(() => {
        setProgress(null);
        setProgressLabel('');
        setErrorMessage(null);
        setCallbackSetupMessage(null);
        setCallbackErrorCode(null);
        dataNotifiedRef.current = false;
        checkReadiness();
    }, [checkReadiness]);

    // Формируем ссылку на настройки API сообщества VK
    const vkApiSettingsUrl = project?.vkGroupShortName
        ? `https://vk.com/${project.vkGroupShortName}?act=api`
        : project?.vkProjectId
            ? `https://vk.com/club${project.vkProjectId}?act=api`
            : null;

    return {
        readiness,
        progress,
        progressLabel,
        errorMessage,
        callbackSetupMessage,
        callbackErrorCode,
        vkApiSettingsUrl,
        checkReadiness,
        setupCallback,
        startCollection,
        reset,
    };
};
