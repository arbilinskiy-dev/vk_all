/**
 * Тест 1: Загрузка фото + публикация истории (Story).
 * 
 * Показывает полную цепочку VK API вызовов:
 * 1. stories.getPhotoUploadServer — получение URL для загрузки (user token)
 * 2. POST на upload_url — загрузка файла
 * 3. stories.save — публикация истории (community token)
 * 
 * Каждый шаг отображает JSON запроса и ответа.
 */

import React, { useRef } from 'react';
import { usePhotoUploadTest, StepLog } from './usePhotoUploadTest';

// ─── Компонент отображения одного шага ──────────────────

const StepCard: React.FC<{ step: StepLog }> = ({ step }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className={`border rounded-lg overflow-hidden ${
            step.success 
                ? 'border-green-300 bg-green-50' 
                : 'border-red-300 bg-red-50'
        }`}>
            {/* Заголовок шага */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        step.success 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                    }`}>
                        {step.step}
                    </span>
                    <div>
                        <p className="font-semibold text-gray-900">{step.name}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{step.elapsed_ms}ms</span>
                    {step.success ? (
                        <span className="text-green-600 text-sm font-medium">✓ OK</span>
                    ) : (
                        <span className="text-red-600 text-sm font-medium">✗ Ошибка</span>
                    )}
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Детали (JSON) */}
            {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-3 space-y-3">
                    {/* Запрос */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">→ Запрос (Request)</p>
                        <pre className="bg-gray-900 text-green-300 p-3 rounded-md text-xs overflow-x-auto max-h-60 overflow-y-auto">
                            {JSON.stringify(step.request, null, 2)}
                        </pre>
                    </div>

                    {/* Ответ */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">← Ответ (Response)</p>
                        <pre className={`p-3 rounded-md text-xs overflow-x-auto max-h-80 overflow-y-auto ${
                            step.success 
                                ? 'bg-gray-900 text-blue-300' 
                                : 'bg-gray-900 text-red-300'
                        }`}>
                            {step.response 
                                ? JSON.stringify(step.response, null, 2) 
                                : 'null (нет ответа)'}
                        </pre>
                    </div>

                    {/* Ошибка (если есть) */}
                    {step.error && (
                        <div>
                            <p className="text-xs font-bold text-red-500 uppercase mb-1">⚠ Ошибка</p>
                            <pre className="bg-red-900 text-red-200 p-3 rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(step.error, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Основной компонент теста ──────────────────────────

export const PhotoUploadTest: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        communityToken,
        userToken,
        groupId,
        selectedFile,
        filePreview,
        mode,
        isLoading,
        result,
        requestError,
        setCommunityToken,
        setUserToken,
        setGroupId,
        setMode,
        handleFileSelect,
        runTest,
        resetResults,
        resetAll,
    } = usePhotoUploadTest();

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Тест 1: Загрузка фото + публикация истории
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Цепочка VK API: stories.getPhotoUploadServer (узер) → upload → stories.save (сообщество)
                    </p>
                </div>
                <button
                    onClick={resetAll}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Сбросить всё
                </button>
            </div>

            {/* Форма ввода */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Параметры</h3>

                {/* Токен сообщества */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Токен сообщества (Community Token)
                        <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                        type="text"
                        value={communityToken}
                        onChange={(e) => setCommunityToken(e.target.value)}
                        placeholder="Вставьте токен сообщества (community token)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Используется для публикации истории (stories.save). Настройки сообщества → Работа с API → Ключи доступа
                    </p>
                </div>

                {/* Токен пользователя */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Токен пользователя (User Token)
                        <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                        type="text"
                        value={userToken}
                        onChange={(e) => setUserToken(e.target.value)}
                        placeholder="Вставьте токен пользователя (user token)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Используется для загрузки фото (stories.getPhotoUploadServer). Токен админа сообщества
                    </p>
                </div>

                {/* ID группы */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID группы (без минуса)
                        <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                        type="text"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value.replace(/\D/g, ''))}
                        placeholder="Например: 123456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                </div>

                {/* Выбор файла */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Фотография
                        <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {selectedFile ? 'Заменить файл' : 'Выбрать файл'}
                        </button>
                        {selectedFile && (
                            <span className="text-sm text-gray-600">
                                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} КБ)
                            </span>
                        )}
                    </div>
                    {/* Превью */}
                    {filePreview && (
                        <div className="mt-3">
                            <img 
                                src={filePreview} 
                                alt="Превью" 
                                className="max-w-xs max-h-40 rounded-md border border-gray-200 shadow-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Режим */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Режим</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'upload-and-publish'}
                                onChange={() => setMode('upload-and-publish')}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Загрузка + публикация истории</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'upload-only'}
                                onChange={() => setMode('upload-only')}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Только загрузка фото</span>
                        </label>
                    </div>
                </div>

                {/* Кнопка запуска */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={runTest}
                        disabled={isLoading || !communityToken || !userToken || !groupId || !selectedFile}
                        className={`px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-colors ${
                            isLoading || !communityToken || !userToken || !groupId || !selectedFile
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Выполняется...
                            </span>
                        ) : (
                            `🚀 Запустить тест`
                        )}
                    </button>
                    {result && (
                        <button
                            onClick={resetResults}
                            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Очистить результат
                        </button>
                    )}
                </div>
            </div>

            {/* Ошибка запроса */}
            {requestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Ошибка: {requestError}</p>
                </div>
            )}

            {/* Результаты */}
            {result && (
                <div className="space-y-4">
                    {/* Общий статус */}
                    <div className={`border rounded-lg p-4 ${
                        result.overall_success 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-red-50 border-red-300'
                    }`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{result.overall_success ? '✅' : '❌'}</span>
                            <div>
                                <p className={`font-bold ${result.overall_success ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.overall_success 
                                        ? 'Тест пройден успешно!' 
                                        : `Тест провален на шаге ${result.failed_at_step}`}
                                </p>
                                {result.result?.story_url && (
                                    <a 
                                        href={result.result.story_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Открыть историю: {result.result.story_url}
                                    </a>
                                )}
                                {result.result?.story_id && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Story ID: <code className="bg-gray-200 px-1 rounded">{result.result.story_id}</code>
                                        {result.result.owner_id && (
                                            <span className="ml-2">Owner ID: <code className="bg-gray-200 px-1 rounded">{result.result.owner_id}</code></span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Цепочка шагов */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Цепочка VK API вызовов ({result.steps.length} шагов)
                        </h3>
                        <div className="space-y-3">
                            {result.steps.map((step) => (
                                <StepCard key={step.step} step={step} />
                            ))}
                        </div>
                    </div>

                    {/* Итоговый JSON */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Полный JSON ответа
                        </h3>
                        <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
