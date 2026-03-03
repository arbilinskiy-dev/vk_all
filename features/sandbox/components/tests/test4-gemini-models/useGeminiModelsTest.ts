/**
 * Хук логики для Теста 4: Проверка доступности моделей Google AI.
 *
 * Полностью изолирован от основной логики приложения.
 * Тестирует доступность каждой модели Gemini / Imagen / Gemma
 * путём отправки минимального запроса к Google AI API.
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Описание модели для отображения */
export interface ModelInfo {
    display_name: string;
    model_id: string;
    category: string;
    test_type: string;
}

/** Ответ об ошибке от API */
export interface ApiError {
    code: string | number | null;
    message: string;
    status: string | null;
}

/** Результат тестирования одной модели */
export interface ModelTestResult {
    success: boolean;
    http_status: number | null;
    elapsed_ms: number;
    response_text: string | null;
    error: ApiError | null;
    raw_response: Record<string, any> | null;
}

/** Полный результат теста одной модели */
export interface SingleModelResult {
    display_name: string;
    model_id: string;
    category: string;
    test_type: string;
    result: ModelTestResult;
}

/** Сводка по всем моделям */
export interface AllModelsResult {
    total_models: number;
    success_count: number;
    fail_count: number;
    quota_exhausted_count: number;
    total_elapsed_ms: number;
    results: SingleModelResult[];
}

/** Статус тестирования конкретной модели (для прогресс-бара) */
export interface ModelTestStatus {
    model_id: string;
    status: 'pending' | 'testing' | 'done';
    result?: SingleModelResult;
}

// ─── Хук ────────────────────────────────────────────────

export function useGeminiModelsTest() {
    // API ключ (предзаполнен для удобства)
    const [apiKey, setApiKey] = useState('AIzaSyB-PT42OOiuLhRvPr-dF-kHFFnwf5TTTVA');
    // Опциональный прокси
    const [proxyUrl, setProxyUrl] = useState('');

    // Список моделей (загружается с бэкенда)
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Задержка между запросами (мс) — для соблюдения rate limits
    const [delayMs, setDelayMs] = useState(3000);

    // Режим: тестировать одну или все модели
    const [testMode, setTestMode] = useState<'single' | 'all'>('all');
    const [selectedModelId, setSelectedModelId] = useState<string>('');

    // Состояние
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<ModelTestStatus[]>([]);
    const [allResults, setAllResults] = useState<AllModelsResult | null>(null);
    const [singleResult, setSingleResult] = useState<SingleModelResult | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);

    /** Загрузить список доступных моделей */
    const loadModels = useCallback(async () => {
        console.log('[Test4] loadModels вызван, API_BASE_URL:', API_BASE_URL);
        try {
            const url = `${API_BASE_URL}/sandbox/test4/models`;
            console.log('[Test4] Загружаю модели:', url);
            const resp = await fetch(url);
            console.log('[Test4] loadModels ответ:', resp.status, resp.ok);
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }
            const data = await resp.json();
            console.log('[Test4] Получено моделей:', data.models?.length);
            setModels(data.models || []);
            setModelsLoaded(true);
            if (data.models?.length > 0 && !selectedModelId) {
                setSelectedModelId(data.models[0].model_id);
            }
        } catch (error: any) {
            console.error('[Test4] loadModels ошибка:', error);
            setRequestError(`Не удалось загрузить список моделей: ${error.message}`);
        }
    }, [selectedModelId]);

    /** Тестировать одну модель */
    const runSingleModelTest = useCallback(async () => {
        if (!apiKey.trim()) {
            setRequestError('Введите API ключ Google AI');
            return;
        }
        if (!selectedModelId) {
            setRequestError('Выберите модель для тестирования');
            return;
        }

        setIsLoading(true);
        setSingleResult(null);
        setAllResults(null);
        setRequestError(null);

        try {
            const resp = await fetch(
                `${API_BASE_URL}/sandbox/test4/single-model?model_id=${encodeURIComponent(selectedModelId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: apiKey.trim(),
                        proxy_url: proxyUrl.trim() || null,
                    }),
                }
            );

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${text}`);
            }

            const data: SingleModelResult = await resp.json();
            setSingleResult(data);
        } catch (error: any) {
            setRequestError(error.message || 'Неизвестная ошибка');
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, proxyUrl, selectedModelId]);

    /** Тестировать все модели (поштучно для прогресс-бара) */
    const runAllModelsTest = useCallback(async () => {
        console.log('[Test4] runAllModelsTest вызван, apiKey:', apiKey ? 'есть' : 'нет', 'models:', models.length);

        if (!apiKey.trim()) {
            setRequestError('Введите API ключ Google AI');
            return;
        }

        // Сразу показываем визуальную обратную связь
        setIsLoading(true);
        setSingleResult(null);
        setAllResults(null);
        setRequestError(null);

        try {
            // Убеждаемся, что модели загружены
            let currentModels = models;
            if (currentModels.length === 0) {
                console.log('[Test4] Модели не загружены, загружаю...');
                try {
                    const resp = await fetch(`${API_BASE_URL}/sandbox/test4/models`);
                    console.log('[Test4] GET models ответ:', resp.status);
                    if (!resp.ok) {
                        throw new Error(`HTTP ${resp.status}`);
                    }
                    const data = await resp.json();
                    currentModels = data.models || [];
                    setModels(currentModels);
                    setModelsLoaded(true);
                    console.log('[Test4] Загружено моделей:', currentModels.length);
                } catch (err: any) {
                    console.error('[Test4] Не удалось загрузить модели:', err);
                    setRequestError(`Не удалось загрузить список моделей: ${err.message}`);
                    setIsLoading(false);
                    return;
                }
            }

            if (currentModels.length === 0) {
                setRequestError('Список моделей пуст');
                setIsLoading(false);
                return;
            }

            console.log('[Test4] Старт тестирования', currentModels.length, 'моделей');

            // Инициализируем прогресс
            const initialProgress: ModelTestStatus[] = currentModels.map(m => ({
                model_id: m.model_id,
                status: 'pending' as const,
            }));
            setProgress(initialProgress);

            const results: SingleModelResult[] = [];
            let successCount = 0;
            let failCount = 0;
            let quotaExhaustedCount = 0;
            let totalElapsed = 0;

            // Утилита для задержки между запросами (rate limit)
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // Тестируем каждую модель последовательно
            for (let i = 0; i < currentModels.length; i++) {
                const model = currentModels[i];

                // Задержка перед каждым запросом (кроме первого) — чтобы не превышать RPM
                if (i > 0 && delayMs > 0) {
                    await delay(delayMs);
                }

                // Обновляем статус: текущая модель — testing
                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, status: 'testing' as const } : p
                ));

                try {
                    console.log(`[Test4] Тестирую ${i + 1}/${currentModels.length}: ${model.model_id}`);
                    const resp = await fetch(
                        `${API_BASE_URL}/sandbox/test4/single-model?model_id=${encodeURIComponent(model.model_id)}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                api_key: apiKey.trim(),
                                proxy_url: proxyUrl.trim() || null,
                            }),
                        }
                    );

                    console.log(`[Test4] ${model.model_id} → HTTP ${resp.status}`);
                    const data: SingleModelResult = await resp.json();
                    results.push(data);

                    if (data.result?.success) {
                        successCount++;
                    } else if (data.result?.http_status === 429) {
                        quotaExhaustedCount++;
                    } else {
                        failCount++;
                    }
                    totalElapsed += data.result?.elapsed_ms || 0;

                    // Обновляем статус: модель протестирована
                    setProgress(prev => prev.map((p, idx) =>
                        idx === i ? { ...p, status: 'done' as const, result: data } : p
                    ));
                } catch (error: any) {
                    console.error(`[Test4] Ошибка сети для ${model.model_id}:`, error);
                    // Ошибка сети / парсинга
                    const errorResult: SingleModelResult = {
                        display_name: model.display_name,
                        model_id: model.model_id,
                        category: model.category,
                        test_type: model.test_type,
                        result: {
                            success: false,
                            http_status: null,
                            elapsed_ms: 0,
                            response_text: null,
                            error: { code: 'NETWORK', message: error.message, status: 'NETWORK_ERROR' },
                            raw_response: null,
                        },
                    };
                    results.push(errorResult);
                    failCount++;

                    setProgress(prev => prev.map((p, idx) =>
                        idx === i ? { ...p, status: 'done' as const, result: errorResult } : p
                    ));
                }
            }

            console.log(`[Test4] Завершено: ${successCount} ✓, ${quotaExhaustedCount} ⏳, ${failCount} ✗`);

            // Итоговый результат
            setAllResults({
                total_models: currentModels.length,
                success_count: successCount,
                fail_count: failCount,
                quota_exhausted_count: quotaExhaustedCount,
                total_elapsed_ms: totalElapsed,
                results,
            });
        } catch (err: any) {
            console.error('[Test4] Критическая ошибка:', err);
            setRequestError(`Критическая ошибка: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, proxyUrl, models, delayMs]);

    return {
        // Настройки
        apiKey, setApiKey,
        proxyUrl, setProxyUrl,
        delayMs, setDelayMs,
        testMode, setTestMode,
        selectedModelId, setSelectedModelId,

        // Модели
        models, modelsLoaded, loadModels,

        // Состояние
        isLoading, progress,
        allResults, singleResult,
        requestError,

        // Действия
        runSingleModelTest,
        runAllModelsTest,
    };
}
