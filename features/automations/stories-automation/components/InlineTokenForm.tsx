import React, { useState } from 'react';
import { IntegrationRequirementsActions } from '../hooks/useIntegrationRequirements';
import { Spinner, EyeIcon, EyeOffIcon } from './shared/RequirementIcons';

// ─── Инлайн-форма ввода токена сообщества ─────────────────────────

export const InlineTokenForm: React.FC<{ actions: IntegrationRequirementsActions }> = ({ actions }) => {
    const [tokenValue, setTokenValue] = useState('');
    const [isTokenVisible, setIsTokenVisible] = useState(false);

    // Формирование ссылки на настройки API сообщества
    const apiSettingsLink = actions.projectData?.vkGroupShortName
        ? `https://vk.com/${actions.projectData.vkGroupShortName}?act=tokens`
        : actions.projectData?.vkProjectId
            ? `https://vk.com/club${actions.projectData.vkProjectId}?act=tokens`
            : null;

    return (
        <div className="ml-7 space-y-3">
            {/* Инструкция — дубль из TokensBlock */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">📋 Как получить токен сообщества:</p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>
                        Перейдите в{' '}
                        {apiSettingsLink ? (
                            <a
                                href={apiSettingsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 underline"
                            >
                                настройки API сообщества →
                            </a>
                        ) : (
                            <span className="text-gray-500">настройки сообщества → Работа с API</span>
                        )}
                    </li>
                    <li>Нажмите <strong>«Создать ключ»</strong></li>
                    <li>Выберите <strong>все доступные разрешения</strong> (стена, фото, истории, товары и т.д.)</li>
                    <li>Нажмите <strong>«Создать»</strong></li>
                    <li>Скопируйте полученный токен и вставьте в поле ниже</li>
                </ol>
            </div>

            {/* Поле ввода токена */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Основной токен сообщества</label>
                <div className="relative">
                    <input
                        type={isTokenVisible ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={tokenValue}
                        onChange={(e) => setTokenValue(e.target.value)}
                        disabled={actions.isSavingToken}
                        className="w-full border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 pr-10 font-mono"
                        placeholder="vk1.a. ... "
                    />
                    <button
                        type="button"
                        onClick={() => setIsTokenVisible(prev => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        title={isTokenVisible ? 'Скрыть токен' : 'Показать токен'}
                    >
                        {isTokenVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>

            {/* Кнопка сохранить */}
            <button
                type="button"
                onClick={() => actions.saveToken(tokenValue)}
                disabled={actions.isSavingToken || !tokenValue.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm ${
                    actions.isSavingToken || !tokenValue.trim()
                        ? 'bg-green-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
                {actions.isSavingToken ? (
                    <>
                        <Spinner className="h-4 w-4" />
                        Сохранение...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Сохранить токен
                    </>
                )}
            </button>
        </div>
    );
};
