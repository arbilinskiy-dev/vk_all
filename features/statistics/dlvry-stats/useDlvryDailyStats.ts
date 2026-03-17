/**
 * Хук для загрузки и управления дневной статистикой DLVRY (из БД).
 * Использует данные, синхронизированные через DLVRY API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchDlvryDailyStats,
    fetchAvailableMonths,
    syncDlvryStats,
    syncDlvryStatsFullStream,
    DlvryDayStat,
    DlvryAggregated,
    DlvrySyncResult,
    DlvryFullSyncEvent,
} from '../../../services/api/dlvryStats.api';

interface UseDlvryDailyStatsParams {
    projectId: string | null;
    /** Опциональный ID филиала для drill-down */
    affiliateId?: string | null;
    /** Начальное значение dateFrom (YYYY-MM-DD). Если передано — первый fetch уже с фильтром. */
    initialDateFrom?: string;
    /** Начальное значение dateTo (YYYY-MM-DD). */
    initialDateTo?: string;
}

interface UseDlvryDailyStatsResult {
    /** Дневные записи (от новых к старым) */
    days: DlvryDayStat[];
    /** Агрегированные итоги за выбранный период */
    aggregated: DlvryAggregated | null;
    /** Загрузка данных (первая страница) */
    isLoading: boolean;
    /** Загрузка следующей порции */
    isLoadingMore: boolean;
    /** Есть ещё записи для подгрузки */
    hasMore: boolean;
    /** Общее кол-во записей в БД за период */
    totalCount: number;
    /** Идёт синхронизация с DLVRY API */
    isSyncing: boolean;
    /** Ошибка */
    error: string | null;
    /** Результат последней синхронизации */
    lastSyncResult: DlvrySyncResult | null;
    /** Фильтр: дата начала (YYYY-MM-DD) */
    dateFrom: string;
    /** Фильтр: дата окончания (YYYY-MM-DD) */
    dateTo: string;
    /** Установить начальную дату */
    setDateFrom: (d: string) => void;
    /** Установить конечную дату */
    setDateTo: (d: string) => void;
    /** Загрузить данные из БД (сброс пагинации) */
    refresh: () => void;
    /** Подгрузить следующую порцию записей */
    loadMore: () => void;
    /** Синхронизировать данные из DLVRY API (кнопка «Обновить») */
    syncFromApi: (forceFull?: boolean) => Promise<void>;
    /** Прогресс полной загрузки (null когда не идёт) */
    fullSyncProgress: DlvryFullSyncEvent | null;
    /** Множество год-месяцев, по которым есть данные (ключ "YYYY-M") */
    availableMonths: Set<string>;
}

const PAGE_SIZE = 50;

export function useDlvryDailyStats({ projectId, affiliateId, initialDateFrom, initialDateTo }: UseDlvryDailyStatsParams): UseDlvryDailyStatsResult {
    const [days, setDays] = useState<DlvryDayStat[]>([]);
    const [aggregated, setAggregated] = useState<DlvryAggregated | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSyncResult, setLastSyncResult] = useState<DlvrySyncResult | null>(null);
    const [fullSyncProgress, setFullSyncProgress] = useState<DlvryFullSyncEvent | null>(null);
    const [availableMonths, setAvailableMonths] = useState<Set<string>>(new Set());
    // Начальные даты из параметров — первый fetch сразу с правильным диапазоном
    const [dateFrom, setDateFrom] = useState(initialDateFrom ?? '');
    const [dateTo, setDateTo] = useState(initialDateTo ?? '');
    const [refreshKey, setRefreshKey] = useState(0);

    const abortRef = useRef<AbortController | null>(null);
    const loadingMoreRef = useRef(false); // защита от дублей
    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    // Загрузка доступных месяцев (не зависит от дат — нужно знать все существующие)
    const refreshAvailableMonths = useCallback(() => {
        if (!projectId) { setAvailableMonths(new Set()); return; }
        const params: { project_id: string; affiliate_id?: string } = { project_id: projectId };
        if (affiliateId) params.affiliate_id = affiliateId;
        fetchAvailableMonths(params)
            .then(list => {
                const set = new Set(list.map(m => `${m.year}-${m.month}`));
                setAvailableMonths(set);
            })
            .catch(() => { /* тихо */ });
    }, [projectId, affiliateId]);

    useEffect(() => { refreshAvailableMonths(); }, [refreshAvailableMonths]);

    // Сброс данных при смене проекта или филиала (даты НЕ сбрасываем)
    useEffect(() => {
        setDays([]);
        setAggregated(null);
        setError(null);
        setLastSyncResult(null);
        setHasMore(false);
        setTotalCount(0);
    }, [projectId, affiliateId]);

    // Загрузка первой страницы из БД
    useEffect(() => {
        if (!projectId) {
            setDays([]);
            setAggregated(null);
            setHasMore(false);
            setTotalCount(0);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        fetchDlvryDailyStats({
            project_id: projectId,
            affiliate_id: affiliateId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            limit: PAGE_SIZE,
            offset: 0,
        })
            .then(data => {
                if (cancelled) return;
                setDays(data.days);
                setAggregated(data.aggregated);
                setTotalCount(data.total_count);
                setHasMore(data.has_more);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message || 'Ошибка загрузки статистики');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [projectId, affiliateId, dateFrom, dateTo, refreshKey]);

    // Подгрузка следующей порции
    const loadMore = useCallback(() => {
        if (!projectId || !hasMore || loadingMoreRef.current) return;

        loadingMoreRef.current = true;
        setIsLoadingMore(true);

        fetchDlvryDailyStats({
            project_id: projectId,
            affiliate_id: affiliateId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            limit: PAGE_SIZE,
            offset: days.length,
        })
            .then(data => {
                setDays(prev => [...prev, ...data.days]);
                setHasMore(data.has_more);
                setTotalCount(data.total_count);
            })
            .catch(err => {
                setError(err.message || 'Ошибка загрузки');
            })
            .finally(() => {
                setIsLoadingMore(false);
                loadingMoreRef.current = false;
            });
    }, [projectId, affiliateId, dateFrom, dateTo, days.length, hasMore]);

    // Синхронизация из DLVRY API
    const syncFromApi = useCallback(async (forceFull = false) => {
        if (!projectId) return;

        setIsSyncing(true);
        setError(null);
        setLastSyncResult(null);

        if (forceFull) {
            // ── Полная загрузка — SSE стриминг ──
            setFullSyncProgress(null);
            const ctrl = new AbortController();
            abortRef.current = ctrl;

            try {
                await syncDlvryStatsFullStream(
                    { project_id: projectId },
                    (evt) => {
                        setFullSyncProgress(evt);
                        // После каждого чанка обновляем таблицу из БД
                        if (!evt.done) refresh();
                    },
                    ctrl.signal,
                );
                // Финальный refresh после завершения
                refresh();
                refreshAvailableMonths();
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Ошибка полной синхронизации');
                }
            } finally {
                setIsSyncing(false);
                abortRef.current = null;
                // Через 5 секунд скрываем прогресс
                setTimeout(() => setFullSyncProgress(null), 5000);
            }
        } else {
            // ── Обычная инкрементальная синхронизация ──
            try {
                const params: Parameters<typeof syncDlvryStats>[0] = {
                    project_id: projectId,
                    force_full: false,
                };
                if (dateFrom) params.date_from = dateFrom;
                if (dateTo) params.date_to = dateTo;

                const result = await syncDlvryStats(params);
                setLastSyncResult(result);
                refresh();
                refreshAvailableMonths();
            } catch (err: any) {
                setError(err.message || 'Ошибка синхронизации');
            } finally {
                setIsSyncing(false);
            }
        }
    }, [projectId, affiliateId, dateFrom, dateTo, refresh]);

    return {
        days,
        aggregated,
        isLoading,
        isLoadingMore,
        hasMore,
        totalCount,
        isSyncing,
        error,
        lastSyncResult,
        dateFrom,
        dateTo,
        setDateFrom,
        setDateTo,
        refresh,
        loadMore,
        syncFromApi,
        fullSyncProgress,
        availableMonths,
    };
}
