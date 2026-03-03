/**
 * Тест 6: Генерация видео через Google AI (Veo).
 *
 * Пользователь вводит промпт — тестируем генерацию через все модели Veo.
 * Видеогенерация асинхронная: запуск → поллинг → результат.
 * Для каждой модели пробуем 4 API-метода (generateContent, predictLongRunning,
 * predict, generateVideos) — определяем, какой работает.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
    useVideoGenerationTest,
    VideoModelState,
    MethodAttempt,
} from './useVideoGenerationTest';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Цвета статусов ─────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
    idle: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: '⏸', label: 'Ожидание' },
    starting: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', icon: '🚀', label: 'Запуск...' },
    polling: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', icon: '⏳', label: 'Генерация...' },
    done: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', icon: '✅', label: 'Готово' },
    error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', icon: '❌', label: 'Ошибка' },
};

// ─── Компонент: Карточка попытки API метода ──────────────

const AttemptBadge: React.FC<{ attempt: MethodAttempt }> = ({ attempt }) => {
    const isOk = attempt.http_status === 200;
    const is429 = attempt.http_status === 429;

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
            isOk ? 'bg-green-100 text-green-700'
                : is429 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
        }`}>
            <span className="font-mono font-medium">{attempt.method}</span>
            <span>→</span>
            <span className="font-mono">{attempt.http_status || 'ERR'}</span>
            <span className="text-gray-400">({attempt.elapsed_ms}ms)</span>
        </div>
    );
};

// ─── Компонент: Карточка модели ─────────────────────────

const VideoModelCard: React.FC<{ state: VideoModelState; apiKey: string; proxyUrl: string }> = ({ state, apiKey, proxyUrl }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const cfg = STATUS_CONFIG[state.status] || STATUS_CONFIG.idle;

    /** URL для просмотра видео через прокси бэкенда (обход CORS) */
    const proxyVideoUrl = useMemo(() => {
        if (!state.video_uri || !apiKey) return null;
        const params = new URLSearchParams({
            api_key: apiKey,
            video_uri: state.video_uri,
        });
        if (proxyUrl) params.set('proxy_url', proxyUrl);
        return `${API_BASE_URL}/sandbox/test6/proxy-video?${params.toString()}`;
    }, [state.video_uri, apiKey, proxyUrl]);

    /** Скачать видео через прокси */
    const handleDownload = async () => {
        if (!state.video_uri || !apiKey) return;
        setIsDownloading(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test6/proxy-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    video_uri: state.video_uri,
                    proxy_url: proxyUrl || null,
                }),
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.model_id}_video.mp4`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Ошибка скачивания: ${err.message}`);
        }
        setIsDownloading(false);
    };

    return (
        <div className={`border-2 rounded-xl overflow-hidden bg-white ${cfg.border}`}>
            {/* Шапка */}
            <div className={`px-4 py-3 ${cfg.bg} border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl">{cfg.icon}</span>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 text-sm">{state.display_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{state.model_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                        </span>
                        {state.method_used && (
                            <span className="text-xs text-gray-400 font-mono">{state.method_used}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Тело */}
            <div className="p-4">
                {/* Поллинг статус */}
                {state.status === 'polling' && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                            <span className="text-amber-700 font-medium">Генерация видео...</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Проверка #{state.pollCount} · Операция: <span className="font-mono">{state.operation_name?.slice(-20)}...</span>
                        </p>
                    </div>
                )}

                {/* Готово — видео */}
                {state.status === 'done' && (
                    <div className="space-y-3">
                        {state.video_uri ? (
                            <div className="space-y-3">
                                {/* Видеоплеер через прокси */}
                                {proxyVideoUrl && (
                                    <video
                                        controls
                                        className="max-w-full max-h-[300px] mx-auto rounded-lg shadow-md border border-gray-200"
                                    >
                                        <source src={proxyVideoUrl} type="video/mp4" />
                                        Ваш браузер не поддерживает видео
                                    </video>
                                )}

                                {/* Кнопки */}
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isDownloading
                                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                                : 'bg-pink-600 text-white hover:bg-pink-700'
                                        }`}
                                    >
                                        {isDownloading ? '⬇ Скачивание...' : '⬇ Скачать видео'}
                                    </button>
                                </div>

                                {/* URI для справки */}
                                <p className="text-[10px] text-gray-400 font-mono text-center break-all">
                                    URI: {state.video_uri}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <span className="text-green-600 font-medium">✓ Операция завершена</span>
                                <p className="text-xs text-gray-500 mt-1">
                                    Видео URI не найден в ответе — возможно, формат ответа нестандартный
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Ошибка */}
                {state.status === 'error' && (
                    <div className="text-center py-4">
                        <p className="text-red-700 font-medium">{state.error}</p>
                    </div>
                )}

                {/* Запуск... */}
                {state.status === 'starting' && (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                            <span className="text-blue-700">Пробуем API методы...</span>
                        </div>
                    </div>
                )}

                {/* Попытки API методов */}
                {state.attempts.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-1.5">Попытки API методов:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {state.attempts.map((a, idx) => (
                                <AttemptBadge key={idx} attempt={a} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Детали (сырые данные) */}
            {state.startResult && (
                <div className="border-t border-gray-100 px-4 py-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showDetails ? '▲ Скрыть сырой ответ' : '▼ Показать сырой ответ'}
                    </button>
                    {showDetails && (
                        <pre className="mt-2 text-xs text-gray-700 bg-gray-50 rounded p-2 overflow-x-auto max-h-60 border border-gray-200">
                            {JSON.stringify(state.startResult, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Главный компонент ──────────────────────────────────

export const VideoGenerationTest: React.FC = () => {
    const {
        apiKey, setApiKey,
        proxyUrl, setProxyUrl,
        prompt, setPrompt,
        durationSeconds, setDurationSeconds,
        pollIntervalSec, setPollIntervalSec,
        models, modelsLoaded, loadModels,
        modelStates, isRunning, error,
        startSingle, startAll, stopAllPolling,
    } = useVideoGenerationTest();

    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [mode, setMode] = useState<'all' | 'single'>('all');

    // Загружаем модели
    useEffect(() => {
        if (!modelsLoaded) loadModels();
    }, [modelsLoaded, loadModels]);

    useEffect(() => {
        if (models.length > 0 && !selectedModelId) {
            setSelectedModelId(models[0].model_id);
        }
    }, [models, selectedModelId]);

    // Сводка
    const doneCount = modelStates.filter(ms => ms.status === 'done').length;
    const errorCount = modelStates.filter(ms => ms.status === 'error').length;
    const pollingCount = modelStates.filter(ms => ms.status === 'polling').length;
    const hasActivePolling = pollingCount > 0;

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Заголовок */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        🎬 Тест 6: Генерация видео (Veo)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Введите промпт — тестируем генерацию видео через все модели Veo.
                        Основной метод — predictLongRunning. Длительность видео: 4–8 секунд. Генерация асинхронная — результат приходит через поллинг.
                    </p>
                </div>

                {/* Настройки */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-bold text-gray-700">Параметры</h3>

                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Google AI API Key <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-mono"
                        />
                    </div>

                    {/* Прокси */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Прокси (опционально)</label>
                        <input
                            type="text"
                            value={proxyUrl}
                            onChange={e => setProxyUrl(e.target.value)}
                            placeholder="http://user:pass@host:port"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-mono"
                        />
                    </div>

                    {/* Промпт */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Промпт для генерации <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="A panda playing guitar in a park, cinematic lighting"
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                        />
                    </div>

                    {/* Длительность видео */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Длительность: <span className="font-bold text-pink-600">{durationSeconds}с</span>
                            </label>
                            <div className="flex gap-2 mt-1">
                                {[4, 6, 8].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setDurationSeconds(val)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                                            durationSeconds === val
                                                ? 'bg-pink-600 text-white border-pink-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {val}с
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-amber-600 mt-1">⚠ Veo API принимает только 4, 6 или 8 секунд (Veo 2: 5, 6, 8 — бэкенд исправит автоматически)</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Интервал поллинга: <span className="font-bold text-pink-600">{pollIntervalSec}с</span>
                            </label>
                            <input
                                type="range"
                                min={5}
                                max={30}
                                step={5}
                                value={pollIntervalSec}
                                onChange={e => setPollIntervalSec(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>5с</span>
                                <span>10с (рек.)</span>
                                <span>30с</span>
                            </div>
                        </div>
                    </div>

                    {/* Режим */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Режим</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('all')}
                                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                    mode === 'all'
                                        ? 'bg-pink-600 text-white border-pink-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Все модели ({models.length})
                            </button>
                            <button
                                onClick={() => setMode('single')}
                                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                    mode === 'single'
                                        ? 'bg-pink-600 text-white border-pink-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Одна модель
                            </button>
                        </div>
                    </div>

                    {/* Выбор модели (single) */}
                    {mode === 'single' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Модель</label>
                            <select
                                value={selectedModelId}
                                onChange={e => setSelectedModelId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                            >
                                {models.map(m => (
                                    <option key={m.model_id} value={m.model_id}>
                                        {m.display_name} — {m.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex gap-2">
                        <button
                            onClick={mode === 'all' ? startAll : () => startSingle(selectedModelId)}
                            disabled={isRunning || !apiKey.trim() || !prompt.trim()}
                            className={`flex-1 py-3 rounded-lg text-white font-bold text-sm transition-all ${
                                isRunning || !apiKey.trim() || !prompt.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-pink-600 hover:bg-pink-700 shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isRunning
                                ? '🎬 Запуск...'
                                : mode === 'all'
                                    ? `🎬 Запустить генерацию (${models.length} моделей)`
                                    : '🎬 Запустить генерацию'
                            }
                        </button>

                        {hasActivePolling && (
                            <button
                                onClick={stopAllPolling}
                                className="px-4 py-3 rounded-lg border-2 border-red-300 text-red-700 font-bold text-sm hover:bg-red-50 transition-colors"
                            >
                                ⏹ Стоп
                            </button>
                        )}
                    </div>
                </div>

                {/* Ошибка */}
                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
                        <span className="font-bold">Ошибка:</span> {error}
                    </div>
                )}

                {/* Сводка (когда есть результаты) */}
                {modelStates.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Сводка</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-gray-900">{modelStates.length}</p>
                                <p className="text-xs text-gray-500">Всего</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-700">{doneCount}</p>
                                <p className="text-xs text-green-600">Готово ✓</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-amber-700">{pollingCount}</p>
                                <p className="text-xs text-amber-600">Генерация ⏳</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                                <p className="text-xs text-red-600">Ошибка ✗</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Карточки моделей */}
                {modelStates.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">Результаты</h3>
                        {modelStates.map(ms => (
                            <VideoModelCard key={ms.model_id} state={ms} apiKey={apiKey} proxyUrl={proxyUrl} />
                        ))}
                    </div>
                )}

                {/* Список моделей (когда ничего не запущено) */}
                {modelStates.length === 0 && !error && models.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">
                            Модели Veo для генерации видео ({models.length})
                        </h3>
                        <div className="grid gap-2">
                            {models.map(m => (
                                <div key={m.model_id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
                                    <span className="text-pink-500 text-lg">🎬</span>
                                    <span className="text-sm text-gray-800 font-medium">{m.display_name}</span>
                                    <span className="text-xs text-gray-400 font-mono">{m.model_id}</span>
                                    <span className="text-xs text-gray-400 ml-auto">{m.description}</span>
                                </div>
                            ))}
                        </div>

                        {/* Информационная плашка */}
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                            <p className="font-bold mb-1">⚠ Особенности видеогенерации:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Видеогенерация — асинхронный процесс, может занять от 30 секунд до нескольких минут</li>
                                <li>Для каждой модели пробуются 4 API-метода (predictLongRunning → generateVideos → predict → generateContent)</li>
                                <li>Veo на Free Tier может быть ограничен — если все методы возвращают ошибку, модель может требовать billing</li>
                                <li>При успешном запуске запускается автоматический поллинг статуса операции</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
