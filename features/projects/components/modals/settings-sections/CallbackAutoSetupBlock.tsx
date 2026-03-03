import React from 'react';
import { ALL_EVENT_KEYS } from '../../../../../shared/utils/callbackEvents';
import { TunnelMode } from '../../../hooks/useIntegrationsSectionLogic';

interface CallbackAutoSetupBlockProps {
    // Состояние
    isLocal: boolean;
    tunnelMode: TunnelMode;
    tunnelStatus: { checked: boolean; active: boolean; message?: string };
    isCheckingTunnel: boolean;
    canAutoSetup: boolean;
    isSettingUp: boolean;
    hasToken: boolean;
    hasGroupId: boolean;
    allSelected: boolean;
    selectedEventsCount: number;
    // Данные проекта
    vkGroupShortName?: string;
    vkProjectId?: string | number;
    // Действия
    onAutoSetup: () => void;
    onTunnelModeChange: (mode: TunnelMode) => void;
    onCheckTunnel: () => void;
}

export const CallbackAutoSetupBlock: React.FC<CallbackAutoSetupBlockProps> = ({
    isLocal,
    tunnelMode,
    tunnelStatus,
    isCheckingTunnel,
    canAutoSetup,
    isSettingUp,
    hasToken,
    hasGroupId,
    allSelected,
    selectedEventsCount,
    vkGroupShortName,
    vkProjectId,
    onAutoSetup,
    onTunnelModeChange,
    onCheckTunnel,
}) => {
    return (
        <>
            {/* Заголовок и кнопка автонастройки */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Автонастройка Callback-сервера
                    </h4>
                    <p className="text-xs text-indigo-600 mt-0.5">
                        {isLocal ? (
                            <>Режим: <span className="font-medium">локальная разработка</span> — {tunnelMode === 'ssh-tunnel' ? 'SSH tunnel через VM' : 'ngrok'}</>
                        ) : (
                            <>Режим: <span className="font-medium">сервер</span> — будет настроен api.dosmmit.ru</>
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAutoSetup}
                    disabled={!canAutoSetup}
                    className={`
                        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                        ${canAutoSetup 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md active:scale-[0.98]' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                    `}
                >
                    {isSettingUp ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Настройка...
                        </span>
                    ) : (
                        <>Настроить автоматически</>
                    )}
                </button>
            </div>

            {/* ─── Переключатель режима для локалки ─────────── */}
            {isLocal && (
                <div className="mb-3 p-3 bg-white/70 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Способ проброса на локалку:</p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onTunnelModeChange('ssh-tunnel')}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                                tunnelMode === 'ssh-tunnel'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                SSH Tunnel
                            </span>
                            <span className="block text-[10px] mt-0.5 opacity-75">через VM (api.dosmmit.ru)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onTunnelModeChange('ngrok')}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                                tunnelMode === 'ngrok'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                                </svg>
                                Ngrok
                            </span>
                            <span className="block text-[10px] mt-0.5 opacity-75">внешний сервис</span>
                        </button>
                    </div>

                    {/* Статус SSH tunnel */}
                    {tunnelMode === 'ssh-tunnel' && (
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onCheckTunnel}
                                disabled={isCheckingTunnel}
                                className="text-xs text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                            >
                                {isCheckingTunnel ? 'Проверка...' : 'Проверить tunnel'}
                            </button>
                            {tunnelStatus.checked && (
                                <span className={`text-xs flex items-center gap-1 ${tunnelStatus.active ? 'text-green-600' : 'text-red-500'}`}>
                                    <span className={`inline-block h-2 w-2 rounded-full ${tunnelStatus.active ? 'bg-green-500' : 'bg-red-400'}`} />
                                    {tunnelStatus.active ? 'Tunnel активен' : (tunnelStatus.message || 'Tunnel не найден')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Подсказки по условиям */}
            {!hasToken && (
                <p className="text-xs text-amber-600 mt-2">
                    Для автонастройки сначала укажите токен сообщества ниже.
                </p>
            )}
            {!hasGroupId && (
                <p className="text-xs text-amber-600 mt-2">
                    У проекта не задан ID группы VK.
                </p>
            )}

            {/* Описание: что именно произойдёт */}
            <div className="mt-2 text-xs text-indigo-700 space-y-0.5">
                <p>При нажатии:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Получит код подтверждения через VK API</li>
                    <li>
                        {isLocal 
                            ? tunnelMode === 'ssh-tunnel'
                                ? <>Использует SSH tunnel и создаст/обновит сервер <strong>«smmitloc»</strong></>
                                : <>Определит ngrok URL и создаст/обновит сервер <strong>«smmitloc»</strong></>
                            : <>Создаст/обновит сервер <strong>«smmit»</strong> на api.dosmmit.ru</>
                        }
                    </li>
                    <li>
                        Подпишет на{' '}
                        {allSelected
                            ? <strong>все {ALL_EVENT_KEYS.length} событий</strong>
                            : <strong>{selectedEventsCount} из {ALL_EVENT_KEYS.length} событий</strong>
                        }
                    </li>
                    <li>Автоматически сохранит confirmation code</li>
                </ul>

                {/* Ссылка на ручные настройки Callback API в VK */}
                {(vkGroupShortName || vkProjectId) && (
                    <div className="mt-2 pt-2 border-t border-indigo-100">
                        <a
                            href={
                                vkGroupShortName
                                    ? `https://vk.com/${vkGroupShortName}?act=api`
                                    : `https://vk.com/club${vkProjectId}?act=api`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Настройки Callback API в VK (ручная настройка)
                        </a>
                    </div>
                )}
            </div>
        </>
    );
};
