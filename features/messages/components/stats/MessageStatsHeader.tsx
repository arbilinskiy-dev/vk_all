/**
 * Шапка страницы мониторинга сообщений.
 * Заголовок + кнопки: Сверка / Синхр. из логов / Обновить.
 */

import React from 'react';

interface MessageStatsHeaderProps {
    /** Идёт ли процесс сверки */
    isReconciling: boolean;
    /** Идёт ли процесс синхронизации */
    isSyncing: boolean;
    /** Обработчик кнопки «Сверка» */
    onReconcile: () => void;
    /** Обработчик кнопки «Синхр. из логов» */
    onSyncFromLogs: () => void;
    /** Обработчик кнопки «Обновить» */
    onRefresh: () => void;
}

export const MessageStatsHeader: React.FC<MessageStatsHeaderProps> = ({
    isReconciling,
    isSyncing,
    onReconcile,
    onSyncFromLogs,
    onRefresh,
}) => (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Мониторинг сообщений</h1>
            <p className="text-sm text-gray-500">Нагрузка по всем проектам</p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onReconcile}
                disabled={isReconciling}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-50 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Сверить статистику с реальными данными VK API (messages.getHistory)"
            >
                <svg className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {isReconciling ? 'Сверка...' : 'Сверка'}
            </button>
            <button
                onClick={onSyncFromLogs}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Заполнить статистику из существующих callback-логов"
            >
                <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {isSyncing ? 'Синхронизация...' : 'Синхр. из логов'}
            </button>
            <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Обновить данные"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Обновить
            </button>
        </div>
    </div>
);
