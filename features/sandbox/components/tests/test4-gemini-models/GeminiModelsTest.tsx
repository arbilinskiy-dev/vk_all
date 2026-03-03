/**
 * Тест 4: Проверка доступности моделей Google AI (Gemini / Imagen / Gemma).
 *
 * Тестирует доступность каждой модели из списка путём отправки
 * минимального запроса к Google Generative AI API.
 *
 * Два режима:
 * 1. Одна модель — детальный анализ конкретной модели
 * 2. Все модели — полная матрица доступности с прогресс-баром
 */

import React, { useEffect, useState } from 'react';
import {
    useGeminiModelsTest,
    SingleModelResult,
    ModelTestStatus,
    AllModelsResult,
} from './useGeminiModelsTest';

// ─── Цвета категорий ───────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
    'Gemini — Flagship': { bg: 'bg-blue-100', text: 'text-blue-800', emoji: '🌟' },
    'Gemini 3 — Preview': { bg: 'bg-indigo-100', text: 'text-indigo-800', emoji: '🚀' },
    'Gemini 2.5 — Previews': { bg: 'bg-sky-100', text: 'text-sky-800', emoji: '🔬' },
    'Image Generation': { bg: 'bg-purple-100', text: 'text-purple-800', emoji: '🎨' },
    'Video Generation': { bg: 'bg-pink-100', text: 'text-pink-800', emoji: '🎬' },
    'Audio / TTS': { bg: 'bg-rose-100', text: 'text-rose-800', emoji: '🎙' },
    'Agents': { bg: 'bg-orange-100', text: 'text-orange-800', emoji: '🤖' },
    'Specialized': { bg: 'bg-amber-100', text: 'text-amber-800', emoji: '🔧' },
    'Gemma (Open)': { bg: 'bg-teal-100', text: 'text-teal-800', emoji: '💎' },
    'Embedding': { bg: 'bg-green-100', text: 'text-green-800', emoji: '📐' },
};

const DEFAULT_CAT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-800', emoji: '⚙' };

const TEST_TYPE_LABELS: Record<string, string> = {
    generate: 'generateContent',
    embed: 'embedContent',
    imagen: 'predict (Image)',
    model_info: 'models.get (info)',
};

// ─── Компонент: Сводка результатов ──────────────────────

const ResultsSummary: React.FC<{ results: AllModelsResult }> = ({ results }) => {
    const successPercent = results.total_models > 0
        ? Math.round((results.success_count / results.total_models) * 100)
        : 0;
    const quotaPercent = results.total_models > 0
        ? Math.round((results.quota_exhausted_count / results.total_models) * 100)
        : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Сводка</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{results.total_models}</p>
                    <p className="text-xs text-gray-500">Всего моделей</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{results.success_count}</p>
                    <p className="text-xs text-green-600">Доступны ✓</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700">{results.quota_exhausted_count}</p>
                    <p className="text-xs text-yellow-600">Квота ∱ 429</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{results.fail_count}</p>
                    <p className="text-xs text-red-600">Недоступны ✗</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{(results.total_elapsed_ms / 1000).toFixed(1)}с</p>
                    <p className="text-xs text-blue-600">Общее время</p>
                </div>
            </div>
            {/* Прогресс-бар */}
            <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Доступность</span>
                    <span className="text-xs font-medium text-gray-700">{successPercent}% ✓   {quotaPercent}% ⏳</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 flex overflow-hidden">
                    <div
                        className="bg-green-500 h-2.5 transition-all duration-500"
                        style={{ width: `${successPercent}%` }}
                    />
                    <div
                        className="bg-yellow-400 h-2.5 transition-all duration-500"
                        style={{ width: `${quotaPercent}%` }}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    🟢 Доступны    🟡 Квота исчерпана (доступны, но нужно подождать)    🔴 Недоступны
                </p>
            </div>
        </div>
    );
};

// ─── Компонент: Прогресс тестирования ───────────────────

const TestProgress: React.FC<{ progress: ModelTestStatus[]; models: { display_name: string; model_id: string }[]; delayMs: number }> = ({ progress, models, delayMs }) => {
    const tested = progress.filter(p => p.status === 'done').length;
    const total = progress.length;
    const current = progress.find(p => p.status === 'testing');
    const currentModel = current ? models.find(m => m.model_id === current.model_id) : null;
    const remaining = total - tested;
    // Примерное время на модель: ~2с запрос + задержка
    const etaSec = Math.round(remaining * (2 + delayMs / 1000));

    if (total === 0) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                    Тестирование: {tested} / {total}
                </span>
                <span className="text-xs text-blue-600">
                    {Math.round((tested / total) * 100)}% · ~{etaSec}с осталось
                </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tested / total) * 100}%` }}
                />
            </div>
            {currentModel && (
                <p className="text-xs text-blue-600 animate-pulse">
                    Тестируем: {currentModel.display_name}...
                </p>
            )}
        </div>
    );
};

// ─── Компонент: Карточка результата модели ───────────────

const ModelResultCard: React.FC<{ result: SingleModelResult }> = ({ result }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { result: testResult } = result;
    const catColor = CATEGORY_COLORS[result.category] || DEFAULT_CAT_COLOR;

    // Определяем статус: success / quota_exhausted / fail
    const isQuotaExhausted = !testResult.success && testResult.http_status === 429;
    const borderColor = testResult.success
        ? 'border-green-300 bg-green-50'
        : isQuotaExhausted
            ? 'border-yellow-300 bg-yellow-50'
            : 'border-red-300 bg-red-50';
    const iconBg = testResult.success
        ? 'bg-green-200 text-green-700'
        : isQuotaExhausted
            ? 'bg-yellow-200 text-yellow-700'
            : 'bg-red-200 text-red-700';
    const icon = testResult.success ? '✓' : isQuotaExhausted ? '⏳' : '✗';

    return (
        <div className={`border rounded-lg overflow-hidden transition-all ${borderColor}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-80 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${iconBg}`}>
                        {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm truncate">{result.display_name}</p>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor.bg} ${catColor.text}`}>
                                {catColor.emoji} {result.category}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{result.model_id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-400 hidden sm:inline">
                        {TEST_TYPE_LABELS[result.test_type] || result.test_type}
                    </span>
                    <span className="text-xs text-gray-500">{testResult.elapsed_ms}ms</span>
                    {testResult.http_status && (
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            testResult.http_status === 200
                                ? 'bg-green-200 text-green-800'
                                : testResult.http_status === 429
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-red-200 text-red-800'
                        }`}>
                            {testResult.http_status}
                        </span>
                    )}
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-3 space-y-3">
                    {/* Ответ */}
                    {testResult.response_text && (
                        <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Ответ:</p>
                            <p className="text-sm text-gray-800 bg-white rounded p-2 border border-gray-100">
                                {testResult.response_text}
                            </p>
                        </div>
                    )}

                    {/* Ошибка */}
                    {testResult.error && (
                        <div>
                            <p className="text-xs font-medium text-red-600 mb-1">Ошибка:</p>
                            <div className="text-sm text-red-800 bg-red-100 rounded p-2 border border-red-200 space-y-1">
                                {testResult.error.code && (
                                    <p><span className="font-medium">Код:</span> {testResult.error.code}</p>
                                )}
                                <p><span className="font-medium">Сообщение:</span> {testResult.error.message}</p>
                                {testResult.error.status && (
                                    <p><span className="font-medium">Статус:</span> {testResult.error.status}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Raw response */}
                    {testResult.raw_response && (
                        <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Raw Response:</p>
                            <pre className="text-xs text-gray-700 bg-gray-100 rounded p-2 overflow-x-auto max-h-60 border border-gray-200">
                                {JSON.stringify(testResult.raw_response, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Компонент: Таблица результатов по категориям ────────

const ResultsByCategory: React.FC<{ results: SingleModelResult[] }> = ({ results }) => {
    // Группируем по категории
    const categories = new Map<string, SingleModelResult[]>();
    for (const r of results) {
        const cat = r.category;
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat)!.push(r);
    }

    return (
        <div className="space-y-4">
            {Array.from(categories.entries()).map(([category, catResults]) => {
                const catColor = CATEGORY_COLORS[category] || DEFAULT_CAT_COLOR;
                const successInCat = catResults.filter(r => r.result.success).length;
                const quotaInCat = catResults.filter(r => !r.result.success && r.result.http_status === 429).length;

                return (
                    <div key={category}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${catColor.bg} ${catColor.text}`}>
                                {catColor.emoji} {category}
                            </span>
                            <span className="text-xs text-gray-500">
                                {successInCat}/{catResults.length} доступны
                                {quotaInCat > 0 && <span className="text-yellow-600 ml-1">· {quotaInCat} квота</span>}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {catResults.map((r) => (
                                <ModelResultCard key={r.model_id} result={r} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Главный компонент теста ─────────────────────────────

export const GeminiModelsTest: React.FC = () => {
    const {
        apiKey, setApiKey,
        proxyUrl, setProxyUrl,
        delayMs, setDelayMs,
        testMode, setTestMode,
        selectedModelId, setSelectedModelId,
        models, modelsLoaded, loadModels,
        isLoading, progress,
        allResults, singleResult,
        requestError,
        runSingleModelTest,
        runAllModelsTest,
    } = useGeminiModelsTest();

    // Загружаем модели при монтировании
    useEffect(() => {
        if (!modelsLoaded) {
            loadModels();
        }
    }, [modelsLoaded, loadModels]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Заголовок */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        🧠 Тест 4: Доступность моделей Google AI
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Проверка доступности Gemini, Imagen, Gemma и других моделей по API ключу.
                        Для текстовых моделей — генерация минимального промпта, для остальных — проверка метаинформации.
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
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                    </div>

                    {/* Proxy (опционально) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Прокси (опционально)
                        </label>
                        <input
                            type="text"
                            value={proxyUrl}
                            onChange={e => setProxyUrl(e.target.value)}
                            placeholder="http://user:pass@host:port"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                    </div>

                    {/* Режим */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Режим тестирования</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTestMode('all')}
                                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                    testMode === 'all'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Все модели ({models.length})
                            </button>
                            <button
                                onClick={() => setTestMode('single')}
                                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                                    testMode === 'single'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Одна модель
                            </button>
                        </div>
                    </div>

                    {/* Задержка между запросами (rate limit) */}
                    {testMode === 'all' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Задержка между запросами: <span className="font-bold text-indigo-600">{(delayMs / 1000).toFixed(1)}с</span>
                                <span className="text-gray-400 ml-1">
                                    (≈{Math.round(models.length * (2 + delayMs / 1000))}с на весь тест)
                                </span>
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={10000}
                                step={500}
                                value={delayMs}
                                onChange={e => setDelayMs(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>0с (без паузы)</span>
                                <span>3с (рекоменд.)</span>
                                <span>10с (безопасно)</span>
                            </div>
                        </div>
                    )}

                    {/* Выбор модели (для single mode) */}
                    {testMode === 'single' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Модель</label>
                            <select
                                value={selectedModelId}
                                onChange={e => setSelectedModelId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {models.map(m => (
                                    <option key={m.model_id} value={m.model_id}>
                                        {m.display_name} ({m.category})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Кнопка запуска */}
                    <button
                        onClick={testMode === 'all' ? runAllModelsTest : runSingleModelTest}
                        disabled={isLoading || !apiKey.trim()}
                        className={`w-full py-3 rounded-lg text-white font-bold text-sm transition-all ${
                            isLoading || !apiKey.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isLoading
                            ? 'Тестирование...'
                            : testMode === 'all'
                                ? `Запустить тест всех ${models.length} моделей`
                                : 'Протестировать модель'
                        }
                    </button>
                </div>

                {/* Ошибка */}
                {requestError && (
                    <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
                        <span className="font-bold">Ошибка:</span> {requestError}
                    </div>
                )}

                {/* Прогресс тестирования */}
                {isLoading && progress.length > 0 && (
                    <TestProgress progress={progress} models={models} delayMs={delayMs} />
                )}

                {/* Результаты — Все модели */}
                {allResults && (
                    <>
                        <ResultsSummary results={allResults} />
                        <ResultsByCategory results={allResults.results} />
                    </>
                )}

                {/* Результаты — Одна модель */}
                {singleResult && !allResults && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">Результат</h3>
                        <ModelResultCard result={singleResult} />
                    </div>
                )}

                {/* Информация о моделях, если ничего ещё не запущено */}
                {!isLoading && !allResults && !singleResult && !requestError && models.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Модели для тестирования ({models.length})</h3>
                        <div className="grid gap-1.5">
                            {models.map(m => {
                                const catColor = CATEGORY_COLORS[m.category] || DEFAULT_CAT_COLOR;
                                return (
                                    <div key={m.model_id} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded border border-gray-100">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor.bg} ${catColor.text}`}>
                                            {catColor.emoji}
                                        </span>
                                        <span className="text-sm text-gray-800">{m.display_name}</span>
                                        <span className="text-xs text-gray-400 font-mono ml-auto">{m.model_id}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
