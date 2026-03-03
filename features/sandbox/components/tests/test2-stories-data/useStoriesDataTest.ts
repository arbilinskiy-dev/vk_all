/**
 * Хук логики для Теста 2: Получение данных историй (stories.get / getStats / getViewers).
 *
 * Полностью изолирован от основной логики приложения.
 * Тестирует 3 метода VK API с 4 типами токенов:
 * - User Token (токен пользователя-админа)
 * - User Non-Admin Token (токен пользователя НЕ админа)
 * - Community Token (токен сообщества)
 * - Service Token (сервисный токен приложения)
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Лог одного шага VK API */
export interface StepLog {
    step: number;
    name: string;
    description: string;
    success: boolean;
    request: Record<string, any> | null;
    response: Record<string, any> | null;
    http_status: number | null;
    elapsed_ms: number;
    error: Record<string, any> | null;
}

/** Результат одного метода с одним токеном */
export interface TokenResult {
    method: string;
    token_type: 'user' | 'user_non_admin' | 'community' | 'service';
    step: StepLog;
    summary: Record<string, any> | null;
    skipped?: boolean;
}

/** Результат одного метода со всеми токенами */
export interface MethodResult {
    method: string;
    group_id: number;
    story_id: number | null;
    results_by_token: TokenResult[];
    tokens_tested: number;
    tokens_success: number;
}

/** Ячейка матрицы результатов */
export interface MatrixCell {
    success: boolean;
    skipped: boolean;
    error_code: number | null;
    error_msg: string | null;
    elapsed_ms: number;
}

/** Полный результат теста (все методы × все токены) */
export interface FullTestResult {
    overall_results: MethodResult[];
    matrix: Record<string, Record<string, MatrixCell>>;
    group_id: number;
    story_id: number | null;
    error?: string;
}

/** Доступные VK API методы */
export type StoryMethod = 'stories.get' | 'stories.getStats' | 'stories.getViewers' | 'viewers_details';

/** Режим запуска */
export type TestMode = 'single' | 'all';

// ─── Хук ────────────────────────────────────────────────

export function useStoriesDataTest() {
    // Токены (предзаполнены для удобства тестирования)
    const [userToken, setUserToken] = useState('vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q');
    const [userNonAdminToken, setUserNonAdminToken] = useState('vk1.a.Q507FxMI_Z6vjc_pnP84lpoEW7Nw1xFnRzmRfZsgIriNWiUIN3M06PaNusVvPxfgVpnrpLlTeLiA7EJ-Eg49MkwjshBN5XgbhU2G0MXkKEQUyel9Ivu4N1crts0A8-rpHlwH9erxtst--DxR2IpRR_b5P_s7SrlTiIQe9RR6Bq2wz_hwQEcyFrIXqS4e4HGj9VAhxd1clP_VWQ6z07zF2g');
    const [communityToken, setCommunityToken] = useState('vk1.a.95YIp2524hmexX5wFwuRcbNyYfcdKhFtciIWooFpenYNbZX7cBrgGgw8n9q3RGqKKxU5CCXs4WGptLKXPm23uBvKB0m-RydyWrEz-mPj2-j5M0SwN_RJRjl3v0xWQO4hjor2Gwodr8uiKxcEF0-r4iZvKPRb2BdLFpP5V4za-_E49FQIApRgQ9JvZJqplsBLYkyTvoaiJJLmki7u3cyMsg');
    const [serviceToken, setServiceToken] = useState('b62b66e0b62b66e0b62b66e038b51509debb62bb62b66e0df42994822a34d5c05ac5596');

    // Параметры
    const [groupId, setGroupId] = useState('');
    const [storyId, setStoryId] = useState('');
    const [viewersCount, setViewersCount] = useState('10');

    // Режим
    const [selectedMethod, setSelectedMethod] = useState<StoryMethod>('stories.get');
    const [testMode, setTestMode] = useState<TestMode>('single');

    // Состояние
    const [isLoading, setIsLoading] = useState(false);
    const [singleResult, setSingleResult] = useState<MethodResult | null>(null);
    const [fullResult, setFullResult] = useState<FullTestResult | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);

    /** Запуск одного метода с 3 токенами */
    const runSingleMethodTest = useCallback(async () => {
        if (!groupId.trim() || isNaN(Number(groupId))) {
            setRequestError('Введите корректный ID группы (число без минуса)');
            return;
        }

        // Хотя бы один токен должен быть указан
        if (!userToken.trim() && !userNonAdminToken.trim() && !communityToken.trim() && !serviceToken.trim()) {
            setRequestError('Укажите хотя бы один токен');
            return;
        }

        // Для getStats и getViewers нужен story_id
        if ((selectedMethod === 'stories.getStats' || selectedMethod === 'stories.getViewers') && !storyId.trim()) {
            setRequestError(`Для ${selectedMethod} необходимо указать Story ID`);
            return;
        }

        setIsLoading(true);
        setSingleResult(null);
        setFullResult(null);
        setRequestError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/sandbox/test2/single-method?method=${encodeURIComponent(selectedMethod)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        group_id: parseInt(groupId.trim()),
                        story_id: storyId.trim() ? parseInt(storyId.trim()) : null,
                        user_token: userToken.trim() || null,
                        user_non_admin_token: userNonAdminToken.trim() || null,
                        community_token: communityToken.trim() || null,
                        service_token: serviceToken.trim() || null,
                        viewers_count: parseInt(viewersCount) || 10,
                    }),
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const data: MethodResult = await response.json();
            setSingleResult(data);
        } catch (error: any) {
            setRequestError(error.message || 'Неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    }, [groupId, storyId, userToken, userNonAdminToken, communityToken, serviceToken, selectedMethod, viewersCount]);

    /** Запуск полного теста: все 3 метода × все токены */
    const runFullTest = useCallback(async () => {
        if (!groupId.trim() || isNaN(Number(groupId))) {
            setRequestError('Введите корректный ID группы (число без минуса)');
            return;
        }

        if (!userToken.trim() && !userNonAdminToken.trim() && !communityToken.trim() && !serviceToken.trim()) {
            setRequestError('Укажите хотя бы один токен');
            return;
        }

        setIsLoading(true);
        setSingleResult(null);
        setFullResult(null);
        setRequestError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/sandbox/test2/full-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_id: parseInt(groupId.trim()),
                    story_id: storyId.trim() ? parseInt(storyId.trim()) : null,
                    user_token: userToken.trim() || null,
                    user_non_admin_token: userNonAdminToken.trim() || null,
                    community_token: communityToken.trim() || null,
                    service_token: serviceToken.trim() || null,
                    viewers_count: parseInt(viewersCount) || 10,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const data: FullTestResult = await response.json();
            setFullResult(data);
        } catch (error: any) {
            setRequestError(error.message || 'Неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    }, [groupId, storyId, userToken, userNonAdminToken, communityToken, serviceToken, viewersCount]);

    /** Запуск теста в зависимости от режима */
    const runTest = useCallback(() => {
        if (testMode === 'single') {
            return runSingleMethodTest();
        } else {
            return runFullTest();
        }
    }, [testMode, runSingleMethodTest, runFullTest]);

    /** Сброс результатов */
    const resetResults = useCallback(() => {
        setSingleResult(null);
        setFullResult(null);
        setRequestError(null);
    }, []);

    /** Полный сброс */
    const resetAll = useCallback(() => {
        setUserToken('');
        setUserNonAdminToken('');
        setCommunityToken('');
        setServiceToken('');
        setGroupId('');
        setStoryId('');
        setViewersCount('10');
        setSelectedMethod('stories.get');
        setTestMode('single');
        setIsLoading(false);
        setSingleResult(null);
        setFullResult(null);
        setRequestError(null);
    }, []);

    return {
        // Токены
        userToken, setUserToken,
        userNonAdminToken, setUserNonAdminToken,
        communityToken, setCommunityToken,
        serviceToken, setServiceToken,
        // Параметры
        groupId, setGroupId,
        storyId, setStoryId,
        viewersCount, setViewersCount,
        // Режим
        selectedMethod, setSelectedMethod,
        testMode, setTestMode,
        // Состояние
        isLoading,
        singleResult,
        fullResult,
        requestError,
        // Действия
        runTest,
        resetResults,
        resetAll,
    };
}
