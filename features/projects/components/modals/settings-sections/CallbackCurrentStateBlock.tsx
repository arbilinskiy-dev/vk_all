import React from 'react';
import { CallbackCurrentStateResponse } from '../../../../../services/api/vk.api';
import { ALL_EVENT_KEYS } from '../../../../../shared/utils/callbackEvents';

interface CallbackCurrentStateBlockProps {
    currentState: CallbackCurrentStateResponse | null;
    isLoadingCurrent: boolean;
    loadCurrentError: string | null;
    onLoadCurrentSettings: () => void;
}

export const CallbackCurrentStateBlock: React.FC<CallbackCurrentStateBlockProps> = ({
    currentState,
    isLoadingCurrent,
    loadCurrentError,
    onLoadCurrentSettings,
}) => {
    return (
        <div className="mt-3 border-t border-indigo-100 pt-3">
            <div className="flex items-center gap-2 mb-2">
                <button
                    type="button"
                    onClick={onLoadCurrentSettings}
                    disabled={isLoadingCurrent}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                >
                    {isLoadingCurrent ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Загрузка...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Загрузить текущие настройки из VK
                        </>
                    )}
                </button>
            </div>

            {/* Результат загрузки текущих настроек */}
            {currentState && (
                <div className={`p-3 rounded-lg text-xs ${
                    currentState.found
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'bg-gray-50 border border-gray-200 text-gray-600'
                }`}>
                    {currentState.found && currentState.server ? (
                        <div className="space-y-1.5">
                            <p className="font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                Сервер «{currentState.server.title}»
                                <span className={`inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    currentState.server.status === 'ok' ? 'bg-green-100 text-green-700' :
                                    currentState.server.status === 'wait' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                        currentState.server.status === 'ok' ? 'bg-green-500' :
                                        currentState.server.status === 'wait' ? 'bg-yellow-500' :
                                        'bg-red-400'
                                    }`} />
                                    {currentState.server.status}
                                </span>
                            </p>
                            <p>URL: <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px]">{currentState.server.url}</code></p>
                            <p>
                                Включено событий: <strong>{currentState.enabled_count}</strong> из {ALL_EVENT_KEYS.length}
                                {currentState.enabled_count > 0 && (
                                    <span className="text-blue-600 ml-1">(чекбоксы ниже обновлены)</span>
                                )}
                            </p>
                        </div>
                    ) : (
                        <p className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                            Наш callback-сервер (smmit / smmitloc) не найден в этой группе. Нажмите «Настроить автоматически» для создания.
                        </p>
                    )}
                </div>
            )}

            {/* Ошибка загрузки */}
            {loadCurrentError && (
                <div className="p-2 rounded-lg text-xs bg-red-50 border border-red-200 text-red-700">
                    {loadCurrentError}
                </div>
            )}
        </div>
    );
};
