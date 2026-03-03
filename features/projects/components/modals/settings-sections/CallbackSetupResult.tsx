import React from 'react';
import { CallbackSetupResponse } from '../../../../../services/api/vk.api';

interface CallbackSetupResultProps {
    setupResult: CallbackSetupResponse | null;
    setupError: string | null;
    vkGroupShortName?: string;
    vkProjectId?: string | number;
}

export const CallbackSetupResult: React.FC<CallbackSetupResultProps> = ({
    setupResult,
    setupError,
    vkGroupShortName,
    vkProjectId,
}) => {
    return (
        <>
            {/* Результат автонастройки */}
            {setupResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                    setupResult.success 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : setupResult.error_code === 2000
                            ? 'bg-amber-50 border border-amber-200 text-amber-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {setupResult.success ? (
                        <div>
                            <p className="font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {setupResult.message}
                            </p>
                            <div className="mt-2 text-xs space-y-1 text-green-700">
                                <p>Сервер: <strong>{setupResult.server_name}</strong> (ID: {setupResult.server_id})</p>
                                <p>URL: <code className="bg-green-100 px-1 py-0.5 rounded">{setupResult.callback_url}</code></p>
                                <p>Код подтверждения: <code className="bg-green-100 px-1 py-0.5 rounded">{setupResult.confirmation_code}</code></p>
                                {setupResult.ngrok_url && (
                                    <p>Ngrok: <code className="bg-green-100 px-1 py-0.5 rounded">{setupResult.ngrok_url}</code></p>
                                )}
                            </div>
                        </div>
                    ) : setupResult.error_code === 2000 ? (
                        <div>
                            <p className="font-medium flex items-center gap-1 text-amber-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Достигнут лимит Callback-серверов
                            </p>
                            <p className="mt-1.5 text-xs text-amber-700">
                                ВКонтакте разрешает максимум <strong>10 Callback-серверов</strong> на сообщество. 
                                Удалите неиспользуемые серверы в настройках API сообщества и повторите попытку.
                            </p>
                            <a
                                href={
                                    setupResult.vk_group_short_name
                                        ? `https://vk.com/${setupResult.vk_group_short_name}?act=api`
                                        : vkGroupShortName
                                            ? `https://vk.com/${vkGroupShortName}?act=api`
                                            : vkProjectId
                                                ? `https://vk.com/club${vkProjectId}?act=api`
                                                : '#'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Открыть настройки API сообщества
                            </a>
                        </div>
                    ) : (
                        <p className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {setupResult.message}
                        </p>
                    )}
                </div>
            )}

            {/* Ошибка сети */}
            {setupError && (
                <div className="mt-3 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-800">
                    <p className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {setupError}
                    </p>
                </div>
            )}
        </>
    );
};
