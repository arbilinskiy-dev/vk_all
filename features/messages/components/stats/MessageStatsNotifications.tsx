/**
 * Блок уведомлений / прогресс-баров на странице мониторинга сообщений.
 * Отображает: прогресс синхронизации, результат синхронизации,
 * прогресс сверки и результат сверки.
 */

import React from 'react';
import { SyncFromLogsProgress } from '../../../../services/api/messages_stats.api';

interface ReconcileProgress {
    processed: number;
    total: number;
    percent: number;
}

interface MessageStatsNotificationsProps {
    /** Прогресс синхронизации из логов */
    syncProgress: SyncFromLogsProgress | null;
    /** Идёт ли синхронизация */
    isSyncing: boolean;
    /** Результат синхронизации (текст) */
    syncResult: string | null;
    /** Сбросить результат синхронизации */
    onClearSyncResult: () => void;
    /** Прогресс сверки */
    reconcileProgress: ReconcileProgress | null;
    /** Идёт ли сверка */
    isReconciling: boolean;
    /** Результат сверки (текст) */
    reconcileResult: string | null;
    /** Сбросить результат сверки */
    onClearReconcileResult: () => void;
}

export const MessageStatsNotifications: React.FC<MessageStatsNotificationsProps> = ({
    syncProgress,
    isSyncing,
    syncResult,
    onClearSyncResult,
    reconcileProgress,
    isReconciling,
    reconcileResult,
    onClearReconcileResult,
}) => (
    <>
        {/* Прогресс синхронизации из логов */}
        {syncProgress && isSyncing && (
            <div className="rounded-md px-4 py-3 text-sm bg-blue-50 text-blue-700 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                        {syncProgress.message || 'Синхронизация...'}
                    </span>
                    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                {/* Основной прогресс — чтение логов */}
                {(syncProgress.total ?? 0) > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(((syncProgress.loaded ?? 0) / (syncProgress.total ?? 1)) * 100)}%` }}
                        />
                    </div>
                )}
                {/* Вложенный прогресс — фаза сохранения */}
                {syncProgress.sub_message && (
                    <div className="mt-1">
                        <span className="text-xs text-blue-600">{syncProgress.sub_message}</span>
                        {(syncProgress.sub_total ?? 0) > 0 && (
                            <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                                <div
                                    className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.round(((syncProgress.sub_loaded ?? 0) / (syncProgress.sub_total ?? 1)) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Результат синхронизации */}
        {syncResult && !isSyncing && (
            <div className={`rounded-md px-4 py-3 text-sm flex items-center justify-between ${syncResult.startsWith('Ошибка') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                <span>{syncResult}</span>
                <button onClick={onClearSyncResult} className="text-gray-400 hover:text-gray-600 ml-3" title="Закрыть">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}

        {/* Прогресс сверки */}
        {reconcileProgress && isReconciling && (
            <div className="rounded-md px-4 py-3 text-sm bg-amber-50 text-amber-700 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                        Сверка: {reconcileProgress.processed} / {reconcileProgress.total} диалогов ({reconcileProgress.percent}%)
                    </span>
                    <svg className="w-4 h-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                    <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${reconcileProgress.percent}%` }}
                    />
                </div>
            </div>
        )}

        {/* Результат сверки */}
        {reconcileResult && !isReconciling && (
            <div className={`rounded-md px-4 py-3 text-sm flex items-center justify-between ${reconcileResult.startsWith('Ошибка') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                <span>{reconcileResult}</span>
                <button onClick={onClearReconcileResult} className="text-gray-400 hover:text-gray-600 ml-3" title="Закрыть">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}
    </>
);
