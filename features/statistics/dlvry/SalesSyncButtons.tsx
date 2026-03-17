/**
 * Кнопки синхронизации данных DLVRY + индикатор стриминг-прогресса.
 */

import React from 'react';
import { formatMoney, plural } from './dlvryFormatUtils';

interface SalesSyncButtonsProps {
    isSyncing: boolean;
    onSync: () => void;
    onFullSync: () => void;
    fullSyncProgress: {
        done?: boolean;
        chunk?: number;
        synced_days: number;
        total_orders?: number;
        total_revenue?: number;
    } | null;
}

export const SalesSyncButtons: React.FC<SalesSyncButtonsProps> = ({
    isSyncing,
    onSync,
    onFullSync,
    fullSyncProgress,
}) => (
    <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <button
                onClick={onSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Дозапись новых данных из DLVRY"
            >
                <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isSyncing ? 'Синхронизация...' : 'Обновить данные'}
            </button>
            <button
                onClick={onFullSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Полная пересинхронизация за всё время"
            >
                Полная загрузка
            </button>
            {/* ── Прогресс стриминга ── */}
            {fullSyncProgress && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium animate-pulse whitespace-nowrap">
                    {fullSyncProgress.done ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-600">
                                Готово · {fullSyncProgress.synced_days} {plural(fullSyncProgress.synced_days, ['день', 'дня', 'дней'])} · {(fullSyncProgress.total_orders ?? 0).toLocaleString()} заказов · {formatMoney(fullSyncProgress.total_revenue ?? 0)} ₽
                            </span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Чанк {fullSyncProgress.chunk} · {fullSyncProgress.synced_days} дн · {(fullSyncProgress.total_orders ?? 0).toLocaleString()} заказов · {formatMoney(fullSyncProgress.total_revenue ?? 0)} ₽
                        </>
                    )}
                </span>
            )}
        </div>
        <span className="text-xs text-gray-400">Обновляется автоматически раз в сутки</span>
    </div>
);
