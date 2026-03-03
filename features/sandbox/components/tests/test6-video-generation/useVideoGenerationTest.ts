/**
 * Хук логики для Теста 6: Генерация видео через Google AI (Veo).
 *
 * Полностью изолирован от основной логики приложения.
 * Видеогенерация — асинхронный процесс:
 * 1. Старт → operation_name
 * 2. Поллинг каждые N секунд → done/not done
 * 3. Когда готово → video_uri
 */

import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Модель Veo */
export interface VideoModel {
    display_name: string;
    model_id: string;
    description: string;
}

/** Попытка использования API метода */
export interface MethodAttempt {
    method: string;
    http_status: number | null;
    elapsed_ms: number;
    response_preview: any;
}

/** Результат запуска генерации */
export interface VideoStartResult {
    display_name: string;
    model_id: string;
    success: boolean;
    operation_name: string | null;
    method_used: string | null;
    is_done: boolean;
    video_uri?: string | null;
    response?: any;
    attempts?: MethodAttempt[];
    error?: { code: string | number | null; message: string; status?: string } | null;
}

/** Результат проверки операции */
export interface VideoCheckResult {
    success: boolean;
    is_done: boolean;
    video_uri: string | null;
    elapsed_ms: number;
    response?: any;
    error?: { code: string | number | null; message: string; status?: string } | null;
}

/** Статус генерации для конкретной модели */
export interface VideoModelState {
    model_id: string;
    display_name: string;
    status: 'idle' | 'starting' | 'polling' | 'done' | 'error';
    operation_name: string | null;
    method_used: string | null;
    video_uri: string | null;
    attempts: MethodAttempt[];
    pollCount: number;
    error: string | null;
    startResult?: VideoStartResult;
}

// ─── Хук ────────────────────────────────────────────────

export function useVideoGenerationTest() {
    // Настройки
    const [apiKey, setApiKey] = useState('AIzaSyB-PT42OOiuLhRvPr-dF-kHFFnwf5TTTVA');
    const [proxyUrl, setProxyUrl] = useState('');
    const [prompt, setPrompt] = useState('');
    const [durationSeconds, setDurationSeconds] = useState(8);
    const [pollIntervalSec, setPollIntervalSec] = useState(10);

    // Список моделей
    const [models, setModels] = useState<VideoModel[]>([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Состояния моделей
    const [modelStates, setModelStates] = useState<VideoModelState[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref для таймеров поллинга (чтобы их можно было остановить)
    const pollTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

    /** Загрузить список моделей */
    const loadModels = useCallback(async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test6/models`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setModels(data.models || []);
            setModelsLoaded(true);
        } catch (err: any) {
            setError(`Не удалось загрузить модели: ${err.message}`);
        }
    }, []);

    /** Остановить все поллинги */
    const stopAllPolling = useCallback(() => {
        pollTimers.current.forEach(timer => clearInterval(timer));
        pollTimers.current.clear();
    }, []);

    /** Поллинг одной операции */
    const pollOperation = useCallback(async (modelId: string, operationName: string) => {
        console.log(`[Test6] Поллинг: ${modelId}, operation: ${operationName}`);

        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test6/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey.trim(),
                    operation_name: operationName,
                    proxy_url: proxyUrl.trim() || null,
                }),
            });

            const data: VideoCheckResult = await resp.json();

            setModelStates(prev => prev.map(ms => {
                if (ms.model_id !== modelId) return ms;

                if (data.is_done) {
                    // Готово — останавливаем поллинг
                    const timer = pollTimers.current.get(modelId);
                    if (timer) {
                        clearInterval(timer);
                        pollTimers.current.delete(modelId);
                    }

                    return {
                        ...ms,
                        status: 'done' as const,
                        video_uri: data.video_uri,
                        pollCount: ms.pollCount + 1,
                    };
                }

                if (!data.success) {
                    // Ошибка — останавливаем поллинг
                    const timer = pollTimers.current.get(modelId);
                    if (timer) {
                        clearInterval(timer);
                        pollTimers.current.delete(modelId);
                    }

                    return {
                        ...ms,
                        status: 'error' as const,
                        error: data.error?.message || 'Ошибка поллинга',
                        pollCount: ms.pollCount + 1,
                    };
                }

                // Ещё не готово — продолжаем
                return {
                    ...ms,
                    pollCount: ms.pollCount + 1,
                };
            }));
        } catch (err: any) {
            console.error(`[Test6] Ошибка поллинга: ${modelId}`, err);
            // Не останавливаем поллинг при сетевой ошибке — повторим
            setModelStates(prev => prev.map(ms =>
                ms.model_id === modelId ? { ...ms, pollCount: ms.pollCount + 1 } : ms
            ));
        }
    }, [apiKey, proxyUrl]);

    /** Запустить генерацию для одной модели */
    const startSingle = useCallback(async (modelId: string) => {
        if (!apiKey.trim() || !prompt.trim()) {
            setError('Введите API ключ и промпт');
            return;
        }

        const model = models.find(m => m.model_id === modelId);
        if (!model) return;

        setError(null);
        setIsRunning(true);

        // Инициализируем состояние модели
        const initialState: VideoModelState = {
            model_id: modelId,
            display_name: model.display_name,
            status: 'starting',
            operation_name: null,
            method_used: null,
            video_uri: null,
            attempts: [],
            pollCount: 0,
            error: null,
        };
        setModelStates([initialState]);

        try {
            const resp = await fetch(
                `${API_BASE_URL}/sandbox/test6/start?model_id=${encodeURIComponent(modelId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: apiKey.trim(),
                        prompt: prompt.trim(),
                        duration_seconds: durationSeconds,
                        proxy_url: proxyUrl.trim() || null,
                    }),
                }
            );

            const data: VideoStartResult = await resp.json();

            if (data.success) {
                const newState: VideoModelState = {
                    ...initialState,
                    status: data.is_done ? 'done' : 'polling',
                    operation_name: data.operation_name,
                    method_used: data.method_used,
                    video_uri: data.video_uri || null,
                    attempts: data.attempts || [],
                    startResult: data,
                };
                setModelStates([newState]);

                // Если не готово и есть operation_name — запускаем поллинг
                if (!data.is_done && data.operation_name) {
                    const timer = setInterval(
                        () => pollOperation(modelId, data.operation_name!),
                        pollIntervalSec * 1000
                    );
                    pollTimers.current.set(modelId, timer);
                }
            } else {
                setModelStates([{
                    ...initialState,
                    status: 'error',
                    attempts: data.attempts || [],
                    error: data.error?.message || 'Не удалось запустить генерацию',
                    startResult: data,
                }]);
            }
        } catch (err: any) {
            setModelStates([{
                ...initialState,
                status: 'error',
                error: err.message,
            }]);
        }

        setIsRunning(false);
    }, [apiKey, proxyUrl, prompt, durationSeconds, models, pollIntervalSec, pollOperation]);

    /** Запустить генерацию для всех моделей последовательно */
    const startAll = useCallback(async () => {
        if (!apiKey.trim() || !prompt.trim()) {
            setError('Введите API ключ и промпт');
            return;
        }

        // Загружаем модели если нужно
        let currentModels = models;
        if (currentModels.length === 0) {
            try {
                const resp = await fetch(`${API_BASE_URL}/sandbox/test6/models`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                currentModels = data.models || [];
                setModels(currentModels);
                setModelsLoaded(true);
            } catch (err: any) {
                setError(err.message);
                return;
            }
        }

        setError(null);
        setIsRunning(true);
        stopAllPolling();

        // Инициализируем состояния
        const initialStates: VideoModelState[] = currentModels.map(m => ({
            model_id: m.model_id,
            display_name: m.display_name,
            status: 'idle' as const,
            operation_name: null,
            method_used: null,
            video_uri: null,
            attempts: [],
            pollCount: 0,
            error: null,
        }));
        setModelStates(initialStates);

        // Запускаем последовательно
        for (let i = 0; i < currentModels.length; i++) {
            const model = currentModels[i];

            setModelStates(prev => prev.map((ms, idx) =>
                idx === i ? { ...ms, status: 'starting' as const } : ms
            ));

            try {
                console.log(`[Test6] Старт ${i + 1}/${currentModels.length}: ${model.model_id}`);
                const resp = await fetch(
                    `${API_BASE_URL}/sandbox/test6/start?model_id=${encodeURIComponent(model.model_id)}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            api_key: apiKey.trim(),
                            prompt: prompt.trim(),
                            duration_seconds: durationSeconds,
                            proxy_url: proxyUrl.trim() || null,
                        }),
                    }
                );

                const data: VideoStartResult = await resp.json();

                if (data.success) {
                    setModelStates(prev => prev.map((ms, idx) =>
                        idx === i ? {
                            ...ms,
                            status: data.is_done ? 'done' as const : 'polling' as const,
                            operation_name: data.operation_name,
                            method_used: data.method_used,
                            video_uri: data.video_uri || null,
                            attempts: data.attempts || [],
                            startResult: data,
                        } : ms
                    ));

                    // Запускаем поллинг если нужно
                    if (!data.is_done && data.operation_name) {
                        const timer = setInterval(
                            () => pollOperation(model.model_id, data.operation_name!),
                            pollIntervalSec * 1000
                        );
                        pollTimers.current.set(model.model_id, timer);
                    }
                } else {
                    setModelStates(prev => prev.map((ms, idx) =>
                        idx === i ? {
                            ...ms,
                            status: 'error' as const,
                            attempts: data.attempts || [],
                            error: data.error?.message || 'Ошибка запуска',
                            startResult: data,
                        } : ms
                    ));
                }
            } catch (err: any) {
                setModelStates(prev => prev.map((ms, idx) =>
                    idx === i ? { ...ms, status: 'error' as const, error: err.message } : ms
                ));
            }
        }

        setIsRunning(false);
    }, [apiKey, proxyUrl, prompt, durationSeconds, models, pollIntervalSec, pollOperation, stopAllPolling]);

    return {
        apiKey, setApiKey,
        proxyUrl, setProxyUrl,
        prompt, setPrompt,
        durationSeconds, setDurationSeconds,
        pollIntervalSec, setPollIntervalSec,
        models, modelsLoaded, loadModels,
        modelStates, isRunning, error,
        startSingle, startAll, stopAllPolling,
    };
}
