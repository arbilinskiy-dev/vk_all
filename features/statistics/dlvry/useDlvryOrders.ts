/**
 * Хук для загрузки заказов DLVRY с фильтрацией, infinite scroll и синхронизацией.
 * Аналогичен useDlvryDailyStats — первый запрос заменяет массив, loadMore аппендит.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchDlvryOrders,
    fetchDlvryOrdersStats,
    syncDlvryOrders,
    syncDlvryOrdersFullStream,
    DlvryOrder,
    DlvryOrderStats,
    DlvryOrdersFilter,
    DlvryOrdersFullSyncEvent,
} from '../../../services/api/dlvry.api';

const PAGE_SIZE = 50;

interface UseDlvryOrdersParams {
    /** ID проекта для фильтрации */
    projectId: string | null;
    /** Опциональный ID филиала для drill-down */
    affiliateId?: string | null;
    /** Начальная дата «от» (YYYY-MM-DD), по умолчанию пусто = без фильтра */
    initialDateFrom?: string;
    /** Начальная дата «до» (YYYY-MM-DD), по умолчанию пусто = без фильтра */
    initialDateTo?: string;
}

interface UseDlvryOrdersResult {
    orders: DlvryOrder[];
    stats: DlvryOrderStats | null;
    total: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    isStatsLoading: boolean;
    error: string | null;
    search: string;
    dateFrom: string;
    dateTo: string;
    setSearch: (s: string) => void;
    setDateFrom: (d: string) => void;
    setDateTo: (d: string) => void;
    refresh: () => void;
    loadMore: () => void;
    // Синхронизация
    isSyncing: boolean;
    fullSyncProgress: DlvryOrdersFullSyncEvent | null;
    handleSync: () => void;
    handleFullSync: () => void;
}

export function useDlvryOrders({ projectId, affiliateId, initialDateFrom = '', initialDateTo = '' }: UseDlvryOrdersParams): UseDlvryOrdersResult {
    const [orders, setOrders] = useState<DlvryOrder[]>([]);
    const [stats, setStats] = useState<DlvryOrderStats | null>(null);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [refreshKey, setRefreshKey] = useState(0);

    // Синхронизация
    const [isSyncing, setIsSyncing] = useState(false);
    const [fullSyncProgress, setFullSyncProgress] = useState<DlvryOrdersFullSyncEvent | null>(null);
    const loadingMoreRef = useRef(false);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    // Сброс при смене проекта или филиала
    useEffect(() => {
        setSearch('');
        setDateFrom(initialDateFrom);
        setDateTo(initialDateTo);
        setOrders([]);
        setStats(null);
        setTotal(0);
        setHasMore(false);
    }, [projectId, affiliateId]);

    // Загрузка первой страницы заказов (замена массива)
    useEffect(() => {
        if (!projectId) {
            setOrders([]);
            setTotal(0);
            setHasMore(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const filter: DlvryOrdersFilter = {
            project_id: projectId,
            skip: 0,
            limit: PAGE_SIZE,
        };
        if (affiliateId) filter.affiliate_id = affiliateId;
        if (search) filter.search = search;
        if (dateFrom) filter.date_from = dateFrom;
        if (dateTo) filter.date_to = dateTo;

        fetchDlvryOrders(filter)
            .then(data => {
                if (cancelled) return;
                setOrders(data.orders);
                setTotal(data.total);
                setHasMore(data.total > data.orders.length);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message || 'Ошибка загрузки заказов');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [projectId, affiliateId, search, dateFrom, dateTo, refreshKey]);

    // loadMore — аппенд следующей порции
    const loadMore = useCallback(() => {
        if (!projectId || !hasMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);

        const filter: DlvryOrdersFilter = {
            project_id: projectId,
            skip: orders.length,
            limit: PAGE_SIZE,
        };
        if (affiliateId) filter.affiliate_id = affiliateId;
        if (search) filter.search = search;
        if (dateFrom) filter.date_from = dateFrom;
        if (dateTo) filter.date_to = dateTo;

        fetchDlvryOrders(filter)
            .then(data => {
                setOrders(prev => [...prev, ...data.orders]);
                setTotal(data.total);
                setHasMore(orders.length + data.orders.length < data.total);
            })
            .catch(() => {})
            .finally(() => {
                setIsLoadingMore(false);
                loadingMoreRef.current = false;
            });
    }, [projectId, affiliateId, search, dateFrom, dateTo, orders.length, hasMore]);

    // Загрузка статистики
    useEffect(() => {
        if (!projectId) {
            setStats(null);
            return;
        }

        let cancelled = false;
        setIsStatsLoading(true);

        const params: { project_id?: string; affiliate_id?: string; date_from?: string; date_to?: string } = {
            project_id: projectId,
        };
        if (affiliateId) params.affiliate_id = affiliateId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        fetchDlvryOrdersStats(params)
            .then(data => {
                if (cancelled) return;
                setStats(data);
            })
            .catch(() => {
                if (!cancelled) setStats(null);
            })
            .finally(() => {
                if (!cancelled) setIsStatsLoading(false);
            });

        return () => { cancelled = true; };
    }, [projectId, affiliateId, dateFrom, dateTo, refreshKey]);

    // Инкрементальная синхронизация (с учётом выбранного периода)
    const handleSync = useCallback(async () => {
        if (!projectId || isSyncing) return;
        setIsSyncing(true);
        setError(null);
        try {
            const params: { project_id: string; date_from?: string; date_to?: string } = { project_id: projectId };
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            await syncDlvryOrders(params);
            refresh();
        } catch (err: any) {
            setError(err.message || 'Ошибка синхронизации');
        } finally {
            setIsSyncing(false);
        }
    }, [projectId, isSyncing, dateFrom, dateTo, refresh]);

    // Полная загрузка со стримингом
    const handleFullSync = useCallback(async () => {
        if (!projectId || isSyncing) return;
        setIsSyncing(true);
        setError(null);
        setFullSyncProgress(null);
        try {
            await syncDlvryOrdersFullStream(
                { project_id: projectId },
                (event) => {
                    setFullSyncProgress(event);
                    if (event.done) {
                        // Обновляем данные после завершения
                        refresh();
                        // Скрываем прогресс через 5 секунд
                        setTimeout(() => setFullSyncProgress(null), 5000);
                    }
                },
            );
        } catch (err: any) {
            setError(err.message || 'Ошибка полной загрузки');
        } finally {
            setIsSyncing(false);
        }
    }, [projectId, isSyncing, refresh]);

    return {
        orders,
        stats,
        total,
        isLoading,
        isLoadingMore,
        hasMore,
        isStatsLoading,
        error,
        search,
        dateFrom,
        dateTo,
        setSearch,
        setDateFrom,
        setDateTo,
        refresh,
        loadMore,
        isSyncing,
        fullSyncProgress,
        handleSync,
        handleFullSync,
    };
}
