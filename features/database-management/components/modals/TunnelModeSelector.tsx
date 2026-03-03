import React from 'react';
import { TunnelMode, TunnelStatus } from './types';

// ─── Типы ─────────────────────────────────────────────────────────

interface TunnelModeSelectorProps {
    tunnelMode: TunnelMode;
    tunnelStatus: TunnelStatus;
    isCheckingTunnel: boolean;
    onModeChange: (mode: TunnelMode) => void;
    onCheckTunnel: () => void;
}

// ─── Компонент ────────────────────────────────────────────────────

export const TunnelModeSelector: React.FC<TunnelModeSelectorProps> = ({
    tunnelMode,
    tunnelStatus,
    isCheckingTunnel,
    onModeChange,
    onCheckTunnel,
}) => {
    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Способ проброса на локалку:</p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onModeChange('ssh-tunnel')}
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
                    onClick={() => onModeChange('ngrok')}
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
    );
};
