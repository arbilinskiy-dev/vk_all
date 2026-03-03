import React from 'react';
import { Project } from '../../../../../shared/types';

// ─── Иконки видимости токена ──────────────────────────────────
const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" /></svg>
);
const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.572 4.293m-5.466-4.293a3 3 0 01-4.242-4.242" /></svg>
);

interface TokensBlockProps {
    formData: Project;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isSaving: boolean;
    isTokenVisible: boolean;
    setIsTokenVisible: React.Dispatch<React.SetStateAction<boolean>>;
    additionalTokens: string[];
    handleAdditionalTokenChange: (index: number, value: string) => void;
    handleAddAdditionalToken: () => void;
    handleRemoveAdditionalToken: (index: number) => void;
}

export const TokensBlock: React.FC<TokensBlockProps> = ({
    formData,
    handleFormChange,
    isSaving,
    isTokenVisible,
    setIsTokenVisible,
    additionalTokens,
    handleAdditionalTokenChange,
    handleAddAdditionalToken,
    handleRemoveAdditionalToken,
}) => {
    return (
        <>
            {/* ─── Основной токен сообщества ──────────────────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Основной токен сообщества</label>
                <p className="text-xs text-gray-500 mb-2">Ключ доступа сообщества, необходим для публикации от имени группы и чтения сообщений.</p>
                
                {/* Инструкция по получению токена */}
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">📋 Как получить токен сообщества:</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                        <li>
                            Перейдите в{' '}
                            {formData.vkGroupShortName ? (
                                <a 
                                    href={`https://vk.com/${formData.vkGroupShortName}?act=tokens`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:text-blue-800 underline"
                                >
                                    настройки API сообщества →
                                </a>
                            ) : formData.vkProjectId ? (
                                <a 
                                    href={`https://vk.com/club${formData.vkProjectId}?act=tokens`}
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

                <div className="relative">
                    <input
                        type={isTokenVisible ? 'text' : 'password'}
                        name="communityToken"
                        autoComplete="new-password"
                        value={formData.communityToken || ''}
                        onChange={handleFormChange}
                        disabled={isSaving}
                        className="mt-1 w-full border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 pr-10 font-mono"
                        placeholder="vk1.a. ... "
                    />
                    <button
                        type="button"
                        onClick={() => setIsTokenVisible(prev => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        title={isTokenVisible ? "Скрыть токен" : "Показать токен"}
                    >
                        {isTokenVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>

            {/* ─── Дополнительные токены ──────────────────────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные токены сообщества</label>
                <p className="text-xs text-gray-500 mb-2">Добавьте дополнительные токены для ускорения сбора сообщений (параллельная работа).</p>
                
                <div className="space-y-2">
                    {additionalTokens.map((token, index) => (
                        <div key={index} className="flex items-center gap-2 animate-fade-in-up">
                            <input
                                type="text"
                                autoComplete="off"
                                value={token}
                                onChange={(e) => handleAdditionalTokenChange(index, e.target.value)}
                                disabled={isSaving}
                                className="flex-grow border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 font-mono"
                                placeholder="vk1.a..."
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveAdditionalToken(index)}
                                disabled={isSaving}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                title="Удалить токен"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {additionalTokens.length === 0 && (
                        <p className="text-sm text-center text-gray-400 py-2 italic border border-dashed border-gray-200 rounded-md">Нет дополнительных токенов</p>
                    )}
                </div>
                
                <button
                    type="button"
                    onClick={handleAddAdditionalToken}
                    disabled={isSaving}
                    className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                    + Добавить токен
                </button>
            </div>
        </>
    );
};
