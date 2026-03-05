/**
 * Хук для загрузки заказов DLVRY с фильтрацией и пагинацией.
 * Управляет состоянием загрузки, ошибок и данных.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    fetchDlvryOrders,
    fetchDlvryOrdersStats,
    DlvryOrder,
    DlvryOrderStats,
    DlvryOrdersFilter,
} from '../../../services/api/dlvry.api';

interface UseDlvryOrdersParams {
    /** ID проекта для фильтрации */
    projectId: string | null;
}

interface UseDlvryOrdersResult {
    orders: DlvryOrder[];
    stats: DlvryOrderStats | null;
    total: number;
    isLoading: boolean;
    isStatsLoading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    search: string;
    dateFrom: string;
    dateTo: string;
    setPage: (p: number) => void;
    setPageSize: (s: number) => void;
    setSearch: (s: string) => void;
    setDateFrom: (d: string) => void;
    setDateTo: (d: string) => void;
    refresh: () => void;
}

export function useDlvryOrders({ projectId }: UseDlvryOrdersParams): UseDlvryOrdersResult {
    const [orders, setOrders] = useState<DlvryOrder[]>([]);
    const [stats, setStats] = useState<DlvryOrderStats | null>(null);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    // Сброс при смене проекта
    useEffect(() => {
        setPage(0);
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setOrders([]);
        setStats(null);
        setTotal(0);
    }, [projectId]);

    // Загрузка заказов
    useEffect(() => {
        if (!projectId) {
            setOrders([]);
            setTotal(0);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const filter: DlvryOrdersFilter = {
            project_id: projectId,
            skip: page * pageSize,
            limit: pageSize,
        };
        if (search) filter.search = search;
        if (dateFrom) filter.date_from = dateFrom;
        if (dateTo) filter.date_to = dateTo;

        fetchDlvryOrders(filter)
            .then(data => {
                if (cancelled) return;
                setOrders(data.orders);
                setTotal(data.total);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message || 'Ошибка загрузки заказов');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [projectId, page, pageSize, search, dateFrom, dateTo, refreshKey]);

    // Загрузка статистики
    useEffect(() => {
        if (!projectId) {
            setStats(null);
            return;
        }

        let cancelled = false;
        setIsStatsLoading(true);

        const params: { project_id?: string; date_from?: string; date_to?: string } = {
            project_id: projectId,
        };
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
    }, [projectId, dateFrom, dateTo, refreshKey]);

    return {
        orders,
        stats,
        total,
        isLoading,
        isStatsLoading,
        error,
        page,
        pageSize,
        search,
        dateFrom,
        dateTo,
        setPage,
        setPageSize,
        setSearch,
        setDateFrom,
        setDateTo,
        refresh,
    };
}
