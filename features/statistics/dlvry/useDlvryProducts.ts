/**
 * Хук для вкладки «Товары» — загрузка списка товаров и сводки.
 * Агрегация по dlvry_item_id + name с фильтрацией по дате/проекту/филиалу.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    DlvryProductAnalytics,
    DlvryProductsSummary,
    DlvryProductsFilter,
    fetchDlvryProducts,
    fetchDlvryProductsSummary,
} from '../../../services/api/dlvry.api';

const PAGE_SIZE = 50;

interface UseDlvryProductsParams {
    projectId: string | null;
    affiliateId?: string | null;
    initialDateFrom?: string;
    initialDateTo?: string;
}

interface UseDlvryProductsResult {
    products: DlvryProductAnalytics[];
    summary: DlvryProductsSummary | null;
    total: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    isSummaryLoading: boolean;
    hasMore: boolean;
    error: string | null;
    dateFrom: string;
    dateTo: string;
    search: string;
    sortBy: string;
    sortDir: string;
    setDateFrom: (d: string) => void;
    setDateTo: (d: string) => void;
    setSearch: (s: string) => void;
    setSortBy: (col: string) => void;
    toggleSortDir: () => void;
    refresh: () => void;
    loadMore: () => void;
}

export function useDlvryProducts({
    projectId,
    affiliateId,
    initialDateFrom = '',
    initialDateTo = '',
}: UseDlvryProductsParams): UseDlvryProductsResult {
    const [products, setProducts] = useState<DlvryProductAnalytics[]>([]);
    const [summary, setSummary] = useState<DlvryProductsSummary | null>(null);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [search, setSearch] = useState('');
    const [sortBy, _setSortBy] = useState('total_qty');
    const [sortDir, setSortDir] = useState('desc');

    // При смене колонки — сброс направления на desc (топ первым)
    const setSortBy = useCallback((col: string) => {
        _setSortBy(prev => {
            if (prev !== col) setSortDir('desc');
            return col;
        });
    }, []);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadingMoreRef = useRef(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

    // Дебаунс поиска
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const setSearchDebounced = useCallback((s: string) => {
        setSearch(s);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => setDebouncedSearch(s), 300);
    }, []);

    // Основная загрузка (замена массива)
    useEffect(() => {
        if (!projectId) return;

        const filter: DlvryProductsFilter = {
            project_id: projectId,
            skip: 0,
            limit: PAGE_SIZE,
            sort_by: sortBy,
            sort_dir: sortDir,
        };
        if (affiliateId) filter.affiliate_id = affiliateId;
        if (dateFrom) filter.date_from = dateFrom;
        if (dateTo) filter.date_to = dateTo;
        if (debouncedSearch) filter.search = debouncedSearch;

        setIsLoading(true);
        setError(null);

        fetchDlvryProducts(filter)
            .then(data => {
                setProducts(data.products);
                setTotal(data.total);
            })
            .catch(err => setError(err.message || 'Ошибка загрузки'))
            .finally(() => setIsLoading(false));
    }, [projectId, affiliateId, dateFrom, dateTo, debouncedSearch, sortBy, sortDir, refreshKey]);

    // Загрузка сводки
    useEffect(() => {
        if (!projectId) return;

        setIsSummaryLoading(true);
        const params: Record<string, string> = { project_id: projectId };
        if (affiliateId) params.affiliate_id = affiliateId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        fetchDlvryProductsSummary(params)
            .then(setSummary)
            .catch(() => { /* тихо */ })
            .finally(() => setIsSummaryLoading(false));
    }, [projectId, affiliateId, dateFrom, dateTo, refreshKey]);

    const hasMore = products.length < total;

    // Подгрузка следующей страницы
    const loadMore = useCallback(() => {
        if (!projectId || !hasMore || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);

        const filter: DlvryProductsFilter = {
            project_id: projectId,
            skip: products.length,
            limit: PAGE_SIZE,
            sort_by: sortBy,
            sort_dir: sortDir,
        };
        if (affiliateId) filter.affiliate_id = affiliateId;
        if (dateFrom) filter.date_from = dateFrom;
        if (dateTo) filter.date_to = dateTo;
        if (debouncedSearch) filter.search = debouncedSearch;

        fetchDlvryProducts(filter)
            .then(data => {
                setProducts(prev => [...prev, ...data.products]);
                setTotal(data.total);
            })
            .catch(() => { /* тихо */ })
            .finally(() => {
                loadingMoreRef.current = false;
                setIsLoadingMore(false);
            });
    }, [projectId, affiliateId, dateFrom, dateTo, debouncedSearch, sortBy, sortDir, products.length, hasMore]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const toggleSortDir = useCallback(() => {
        setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    }, []);

    return {
        products,
        summary,
        total,
        isLoading,
        isLoadingMore,
        isSummaryLoading,
        hasMore,
        error,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortDir,
        setDateFrom,
        setDateTo,
        setSearch: setSearchDebounced,
        setSortBy,
        toggleSortDir,
        refresh,
        loadMore,
    };
}
