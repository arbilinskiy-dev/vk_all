/**
 * Хук синхронизации и сверки статистики сообщений.
 * Управляет: sync из callback-логов (polling), reconcile с VK API (SSE).
 */

import { useState, useCallback } from 'react';
import {
    syncMessageStatsFromLogs,
    getSyncFromLogsStatus,
    reconcileMessageStats,
    ReconcileEvent,
    SyncFromLogsProgress,
} from '../../../../services/api/messages_stats.api';

interface UseSyncLogicParams {
    loadDashboard: () => Promise<void>;
    dateFrom: string;
    dateTo: string;
}

export function useSyncLogic({ loadDashboard, dateFrom, dateTo }: UseSyncLogicParams) {
    // Синхронизация из логов (фоновая задача с прогрессом)
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [syncProgress, setSyncProgress] = useState<SyncFromLogsProgress | null>(null);

    // Сверка с VK API
    const [isReconciling, setIsReconciling] = useState(false);
    const [reconcileResult, setReconcileResult] = useState<string | null>(null);
    const [reconcileProgress, setReconcileProgress] = useState<{
        processed: number;
        total: number;
        percent: number;
    } | null>(null);

    /** Синхронизация статистики из callback-логов (фоновая задача с polling прогресса) */
    const handleSyncFromLogs = useCallback(async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncProgress(null);
        try {
            // 1. Запускаем фоновую задачу
            const { taskId } = await syncMessageStatsFromLogs();
            if (!taskId) throw new Error('Не удалось запустить задачу');
            
            // 2. Polling прогресса каждые 1.5 сек
            await new Promise<void>((resolve, reject) => {
                const intervalId = setInterval(async () => {
                    try {
                        const status = await getSyncFromLogsStatus(taskId);
                        setSyncProgress(status);
                        
                        if (status.status === 'done') {
                            clearInterval(intervalId);
                            setSyncResult(status.message || 'Синхронизация завершена');
                            setSyncProgress(null);
                            resolve();
                        } else if (status.status === 'error') {
                            clearInterval(intervalId);
                            setSyncResult(`Ошибка: ${status.error || 'Неизвестная ошибка'}`);
                            setSyncProgress(null);
                            resolve();
                        }
                    } catch (e) {
                        clearInterval(intervalId);
                        reject(e);
                    }
                }, 1500);
            });
            
            await loadDashboard();
        } catch (e: any) {
            setSyncResult(`Ошибка: ${e.message}`);
            setSyncProgress(null);
        } finally {
            setIsSyncing(false);
        }
    }, [loadDashboard]);

    /** Сверка статистики с VK API (reconciliation) — SSE-стриминг с прогрессом */
    const handleReconcile = useCallback(async () => {
        setIsReconciling(true);
        setReconcileResult(null);
        setReconcileProgress(null);
        try {
            const res = await reconcileMessageStats({
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                onProgress: (event: ReconcileEvent) => {
                    if (event.type === 'start') {
                        setReconcileProgress({
                            processed: 0,
                            total: event.total_dialogs,
                            percent: 0,
                        });
                    } else if (event.type === 'progress') {
                        const percent = event.total > 0 ? Math.round((event.processed / event.total) * 100) : 0;
                        setReconcileProgress({
                            processed: event.processed,
                            total: event.total,
                            percent,
                        });
                    }
                },
            });
            setReconcileResult(res.details);
            setReconcileProgress(null);
            await loadDashboard();
        } catch (e: any) {
            setReconcileResult(`Ошибка: ${e.message}`);
            setReconcileProgress(null);
        } finally {
            setIsReconciling(false);
        }
    }, [loadDashboard, dateFrom, dateTo]);

    return {
        state: {
            isSyncing,
            syncResult,
            syncProgress,
            isReconciling,
            reconcileResult,
            reconcileProgress,
        },
        actions: {
            handleSyncFromLogs,
            setSyncResult,
            handleReconcile,
            setReconcileResult,
        },
    };
}
