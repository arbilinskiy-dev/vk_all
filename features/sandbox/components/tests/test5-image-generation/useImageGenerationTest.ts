/**
 * Хук логики для Теста 5: Генерация изображений через Google AI.
 *
 * Полностью изолирован от основной логики приложения.
 * Тестирует генерацию изображений через Gemini (generateContent + IMAGE)
 * и Imagen (predict endpoint).
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Модель для генерации изображений */
export interface ImageModel {
    display_name: string;
    model_id: string;
    method: string; // 'gemini' | 'imagen'
    description: string;
}

/** Результат генерации одного изображения */
export interface ImageResult {
    success: boolean;
    http_status: number | null;
    elapsed_ms: number;
    image_base64: string | null;
    image_mime: string | null;
    response_text: string | null;
    error: { code: string | number | null; message: string; status: string | null } | null;
}

/** Полный результат генерации через одну модель */
export interface ImageGenerationResult {
    display_name: string;
    model_id: string;
    method: string;
    description: string;
    result: ImageResult;
}

/** Статус генерации для прогресс-отображения */
export interface ImageModelStatus {
    model_id: string;
    status: 'pending' | 'generating' | 'done';
    result?: ImageGenerationResult;
}

// ─── Хук ────────────────────────────────────────────────

export function useImageGenerationTest() {
    // Настройки
    const [apiKey, setApiKey] = useState('AIzaSyB-PT42OOiuLhRvPr-dF-kHFFnwf5TTTVA');
    const [proxyUrl, setProxyUrl] = useState('');
    const [prompt, setPrompt] = useState('');

    // Список моделей
    const [models, setModels] = useState<ImageModel[]>([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Состояние
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<ImageModelStatus[]>([]);
    const [results, setResults] = useState<ImageGenerationResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    /** Загрузить список моделей */
    const loadModels = useCallback(async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test5/models`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setModels(data.models || []);
            setModelsLoaded(true);
        } catch (err: any) {
            setError(`Не удалось загрузить модели: ${err.message}`);
        }
    }, []);

    /** Генерация через одну модель */
    const generateSingle = useCallback(async (modelId: string) => {
        if (!apiKey.trim() || !prompt.trim()) {
            setError('Введите API ключ и промпт');
            return;
        }

        setIsLoading(true);
        setResults([]);
        setError(null);
        setProgress([{ model_id: modelId, status: 'generating' }]);

        try {
            const resp = await fetch(
                `${API_BASE_URL}/sandbox/test5/generate?model_id=${encodeURIComponent(modelId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: apiKey.trim(),
                        prompt: prompt.trim(),
                        proxy_url: proxyUrl.trim() || null,
                    }),
                }
            );
            const data: ImageGenerationResult = await resp.json();
            setResults([data]);
            setProgress([{ model_id: modelId, status: 'done', result: data }]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, proxyUrl, prompt]);

    /** Генерация через все модели последовательно */
    const generateAll = useCallback(async () => {
        if (!apiKey.trim() || !prompt.trim()) {
            setError('Введите API ключ и промпт');
            return;
        }

        setIsLoading(true);
        setResults([]);
        setError(null);

        // Загружаем модели если не загружены
        let currentModels = models;
        if (currentModels.length === 0) {
            try {
                const resp = await fetch(`${API_BASE_URL}/sandbox/test5/models`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                currentModels = data.models || [];
                setModels(currentModels);
                setModelsLoaded(true);
            } catch (err: any) {
                setError(err.message);
                setIsLoading(false);
                return;
            }
        }

        if (currentModels.length === 0) {
            setError('Список моделей пуст');
            setIsLoading(false);
            return;
        }

        // Инициализируем прогресс
        const initialProgress: ImageModelStatus[] = currentModels.map(m => ({
            model_id: m.model_id,
            status: 'pending' as const,
        }));
        setProgress(initialProgress);

        const allResults: ImageGenerationResult[] = [];

        // Тестируем каждую модель последовательно
        for (let i = 0; i < currentModels.length; i++) {
            const model = currentModels[i];

            // Обновляем статус: текущая — generating
            setProgress(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'generating' as const } : p
            ));

            try {
                console.log(`[Test5] Генерация ${i + 1}/${currentModels.length}: ${model.model_id}`);
                const resp = await fetch(
                    `${API_BASE_URL}/sandbox/test5/generate?model_id=${encodeURIComponent(model.model_id)}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            api_key: apiKey.trim(),
                            prompt: prompt.trim(),
                            proxy_url: proxyUrl.trim() || null,
                        }),
                    }
                );

                const data: ImageGenerationResult = await resp.json();
                allResults.push(data);

                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, status: 'done' as const, result: data } : p
                ));
                setResults([...allResults]);
            } catch (err: any) {
                console.error(`[Test5] Ошибка сети: ${model.model_id}`, err);
                const errorResult: ImageGenerationResult = {
                    display_name: model.display_name,
                    model_id: model.model_id,
                    method: model.method,
                    description: model.description,
                    result: {
                        success: false,
                        http_status: null,
                        elapsed_ms: 0,
                        image_base64: null,
                        image_mime: null,
                        response_text: null,
                        error: { code: 'NETWORK', message: err.message, status: 'NETWORK_ERROR' },
                    },
                };
                allResults.push(errorResult);
                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, status: 'done' as const, result: errorResult } : p
                ));
                setResults([...allResults]);
            }
        }

        setIsLoading(false);
    }, [apiKey, proxyUrl, prompt, models]);

    return {
        apiKey, setApiKey,
        proxyUrl, setProxyUrl,
        prompt, setPrompt,
        models, modelsLoaded, loadModels,
        isLoading, progress, results, error,
        generateSingle, generateAll,
    };
}
