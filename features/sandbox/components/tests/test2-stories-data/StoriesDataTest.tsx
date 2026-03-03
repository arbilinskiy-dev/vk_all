/**
 * Тест 2: Получение данных историй — stories.get / getStats / getViewers.
 *
 * ХАБ-компонент. Вся логика — в useStoriesDataTest, подкомпоненты — в отдельных файлах.
 *
 * Тестирует 4 VK API метода с 4 типами токенов:
 * - User Token (токен пользователя-администратора)
 * - User Non-Admin Token (токен обычного пользователя)
 * - Community Token (токен сообщества)
 * - Service Token (сервисный токен приложения)
 *
 * Два режима:
 * 1. Один метод × все токены — детальный анализ одного метода
 * 2. Все методы × все токены — матрица совместимости
 */

import React from 'react';
import { useStoriesDataTest, type StoryMethod } from './useStoriesDataTest';
import { METHOD_INFO } from './constants';
import { SingleMethodResults } from './SingleMethodResults';
import { FullTestResults } from './FullTestResults';

// ─── Основной компонент теста (хаб) ─────────────────────

export const StoriesDataTest: React.FC = () => {
    const {
        userToken, setUserToken,
        userNonAdminToken, setUserNonAdminToken,
        communityToken, setCommunityToken,
        serviceToken, setServiceToken,
        groupId, setGroupId,
        storyId, setStoryId,
        viewersCount, setViewersCount,
        selectedMethod, setSelectedMethod,
        testMode, setTestMode,
        isLoading,
        singleResult,
        fullResult,
        requestError,
        runTest,
        resetResults,
        resetAll,
    } = useStoriesDataTest();

    // Нужен ли story_id для текущего метода (в режиме single)
    const needsStoryId = testMode === 'single'
        ? METHOD_INFO[selectedMethod].requiresStoryId
        : true; // В полном режиме нужен для getStats и getViewers

    // Достаточно ли данных для запуска
    const hasAnyToken = !!userToken.trim() || !!userNonAdminToken.trim() || !!communityToken.trim() || !!serviceToken.trim();
    const canRun = hasAnyToken && !!groupId.trim();

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Тест 2: Получение данных историй
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Тестирование stories.get / getStats / getViewers / viewers_details с разными типами токенов
                    </p>
                </div>
                <button
                    onClick={resetAll}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Сбросить всё
                </button>
            </div>

            {/* ═══ Блок токенов ═══ */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Токены (укажите один или несколько)
                </h3>

                {/* User Token */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            👤 Токен пользователя (User Token)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={userToken}
                        onChange={(e) => setUserToken(e.target.value)}
                        placeholder="vk1.a.xxx... — токен администратора сообщества"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Implicit Flow / VK ID. Должен быть админом сообщества с правами stories
                    </p>
                </div>

                {/* User Non-Admin Token */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            👥 Токен пользователя НЕ админа (User Non-Admin)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={userNonAdminToken}
                        onChange={(e) => setUserNonAdminToken(e.target.value)}
                        placeholder="vk1.a.xxx... — токен обычного пользователя (не админ сообщества)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Токен пользователя, который НЕ является администратором сообщества
                    </p>
                </div>

                {/* Community Token */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            🏠 Токен сообщества (Community Token)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={communityToken}
                        onChange={(e) => setCommunityToken(e.target.value)}
                        placeholder="Ключ доступа сообщества (Настройки → API)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Настройки сообщества → Работа с API → Ключи доступа
                    </p>
                </div>

                {/* Service Token */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            🔑 Сервисный токен приложения (Service Token)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={serviceToken}
                        onChange={(e) => setServiceToken(e.target.value)}
                        placeholder="Сервисный ключ приложения VK (vk_app → Settings)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        VK Apps → Настройки → Сервисный ключ доступа
                    </p>
                </div>
            </div>

            {/* ═══ Блок параметров ═══ */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Параметры</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            placeholder="123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                    </div>

                    {/* Story ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Story ID
                            {needsStoryId && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                            type="text"
                            value={storyId}
                            onChange={(e) => setStoryId(e.target.value.replace(/\D/g, ''))}
                            placeholder="ID конкретной истории"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Нужен для getStats и getViewers
                        </p>
                    </div>

                    {/* Кол-во зрителей */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Viewers count
                        </label>
                        <input
                            type="text"
                            value={viewersCount}
                            onChange={(e) => setViewersCount(e.target.value.replace(/\D/g, ''))}
                            placeholder="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Только для getViewers
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══ Блок режима ═══ */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Режим запуска</h3>

                {/* Переключатель режима */}
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="testMode"
                            checked={testMode === 'single'}
                            onChange={() => setTestMode('single')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Один метод × все токены</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="testMode"
                            checked={testMode === 'all'}
                            onChange={() => setTestMode('all')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Все методы × все токены (матрица)</span>
                    </label>
                </div>

                {/* Выбор метода (в режиме single) */}
                {testMode === 'single' && (
                    <div className="flex flex-wrap gap-2">
                        {(Object.entries(METHOD_INFO) as [StoryMethod, typeof METHOD_INFO[StoryMethod]][]).map(([method, info]) => (
                            <button
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                                    selectedMethod === method
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                title={info.description}
                            >
                                <span className="font-mono">{info.label}</span>
                                {info.requiresStoryId && (
                                    <span className="ml-1.5 text-xs text-gray-400">(нужен story_id)</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Описание выбранного метода */}
                {testMode === 'single' && (
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                        {METHOD_INFO[selectedMethod].description}
                    </p>
                )}

                {/* Кнопка */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={runTest}
                        disabled={isLoading || !canRun}
                        className={`px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-colors ${
                            isLoading || !canRun
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
                        ) : testMode === 'single' ? (
                            `🚀 Тестировать ${selectedMethod}`
                        ) : (
                            '🚀 Запустить полный тест (4 метода × все токены)'
                        )}
                    </button>
                    {(singleResult || fullResult) && (
                        <button
                            onClick={resetResults}
                            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Очистить результат
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ Ошибка ═══ */}
            {requestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Ошибка: {requestError}</p>
                </div>
            )}

            {/* ═══ Результаты: один метод ═══ */}
            {singleResult && (
                <div className="space-y-4">
                    <SingleMethodResults result={singleResult} />

                    {/* Полный JSON */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Полный JSON ответа
                        </h3>
                        <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(singleResult, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* ═══ Результаты: полный тест ═══ */}
            {fullResult && (
                <div className="space-y-4">
                    <FullTestResults result={fullResult} />

                    {/* Полный JSON */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Полный JSON ответа
                        </h3>
                        <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(fullResult, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
