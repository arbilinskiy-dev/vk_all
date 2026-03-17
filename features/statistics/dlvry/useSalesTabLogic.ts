/**
 * Хук логики таба «Статистика продаж».
 * Стейт пресетов, управление колонками, infinite scroll, синхронизация, totals.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDlvryDailyStats } from '../dlvry-stats/useDlvryDailyStats';
import { ColGroup, PeriodPreset, localDateStr } from './salesTabConstants';

interface UseSalesTabLogicProps {
    projectId: string | null;
    affiliateId?: string | null;
}

export function useSalesTabLogic({ projectId, affiliateId }: UseSalesTabLogicProps) {
    // ─── Начальные даты «Этот месяц» (синхронно, чтобы первый fetch с фильтром) ──
    const [initialDates] = useState(() => {
        const now = new Date();
        return {
            from: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
            to: localDateStr(now),
        };
    });

    const {
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
        syncFromApi,
        loadMore,
        fullSyncProgress,
        availableMonths,
    } = useDlvryDailyStats({
        projectId,
        affiliateId,
        initialDateFrom: initialDates.from,
        initialDateTo: initialDates.to,
    });

    const tableScrollRef = useRef<HTMLDivElement>(null);

    // ─── Infinite scroll: подгрузка при скролле к низу таблицы ──────────
    useEffect(() => {
        const container = tableScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!hasMore || isLoadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Подгружаем когда до конца осталось < 200px
            if (scrollHeight - scrollTop - clientHeight < 200) {
                loadMore();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, loadMore]);

    // ─── Пресеты периодов ───────────────────────────────────────────────
    const [activePreset, setActivePreset] = useState<PeriodPreset>('this_month');
    // Стейт для режима «По месяцам»
    const [ymYear, setYmYear] = useState(() => new Date().getFullYear());
    const [ymMonth, setYmMonth] = useState(() => new Date().getMonth()); // 0-based
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    // Закрытие кастомного дропдауна года при клике вне
    useEffect(() => {
        if (!yearDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
                setYearDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [yearDropdownOpen]);

    /** Применяет диапазон дат для выбранного года+месяца */
    const applyYearMonth = useCallback((year: number, month: number) => {
        const today = new Date();
        const from = new Date(year, month, 1);
        // Если текущий месяц текущего года — до сегодня, иначе до конца месяца
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const to = isCurrentMonth ? today : new Date(year, month + 1, 0);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo]);

    /** Вычисляет даты для пресета и применяет */
    const applyPreset = useCallback((preset: PeriodPreset) => {
        if (preset === 'custom' || preset === null || preset === 'year_month') {
            setActivePreset(preset);
            if (preset === null) { setDateFrom(''); setDateTo(''); }
            if (preset === 'year_month') {
                // При переключении на «По месяцам» — применяем текущий выбранный год+месяц
                applyYearMonth(ymYear, ymMonth);
            }
            return;
        }
        const today = new Date();
        let from: Date;
        let to: Date = today;

        switch (preset) {
            case 'today':
                from = today;
                break;
            case 'yesterday': {
                const y = new Date(today); y.setDate(y.getDate() - 1);
                from = y; to = y;
                break;
            }
            case 'this_week': {
                const dow = today.getDay() || 7;
                from = new Date(today); from.setDate(today.getDate() - dow + 1);
                break;
            }
            case 'last_week': {
                const dow = today.getDay() || 7;
                to = new Date(today); to.setDate(today.getDate() - dow);
                from = new Date(to); from.setDate(to.getDate() - 6);
                break;
            }
            case 'this_month':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'this_quarter': {
                const qm = Math.floor(today.getMonth() / 3) * 3;
                from = new Date(today.getFullYear(), qm, 1);
                break;
            }
            case 'last_quarter': {
                const qm = Math.floor(today.getMonth() / 3) * 3;
                from = new Date(today.getFullYear(), qm - 3, 1);
                to = new Date(today.getFullYear(), qm, 0);
                break;
            }
            case 'this_year':
                from = new Date(today.getFullYear(), 0, 1);
                break;
            case 'last_year':
                from = new Date(today.getFullYear() - 1, 0, 1);
                to = new Date(today.getFullYear() - 1, 11, 31);
                break;
            default:
                from = today;
        }
        setActivePreset(preset);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo, applyYearMonth, ymYear, ymMonth]);

    // При первом рендере применяем пресет «Этот месяц»
    useEffect(() => {
        applyPreset('this_month');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Чипы управления колонками ────────────────────────────────────
    const [activeGroups, setActiveGroups] = useState<Set<ColGroup>>(new Set(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat']));

    const toggleGroup = useCallback((g: ColGroup) => {
        setActiveGroups(prev => {
            const next = new Set(prev);
            if (next.has(g)) next.delete(g);
            else next.add(g);
            // «Основное» всегда включена
            next.add('main');
            return next;
        });
    }, []);

    // ─── Подсчёт итогов из aggregated (полные данные из БД) ────────────
    const totals = useMemo(() => {
        if (!aggregated) return null;
        const a = aggregated;
        return {
            orders: a.total_orders,
            revenue: a.total_revenue,
            avg_check: a.avg_check,
            first_orders: a.total_first_orders,
            unique_clients: a.total_unique_clients ?? 0,
            canceled: a.total_canceled ?? 0,
            canceled_sum: a.total_canceled_sum ?? 0,
            cost: a.total_cost ?? 0,
            discount: a.total_discount ?? 0,
            first_orders_sum: a.total_first_orders_sum ?? 0,
            first_orders_cost: a.total_first_orders_cost ?? 0,
            count_payment_cash: a.total_count_payment_cash ?? 0,
            sum_cash: a.total_sum_cash ?? 0,
            count_payment_card: a.total_count_payment_card ?? 0,
            sum_card: a.total_sum_card ?? 0,
            count_payment_online: a.total_count_payment_online ?? 0,
            sum_online_success: a.total_sum_online_success ?? 0,
            sum_online_fail: a.total_sum_online_fail ?? 0,
            source_vkapp: a.total_source_vkapp ?? 0,
            sum_source_vkapp: a.total_sum_source_vkapp ?? 0,
            source_site: a.total_source_site ?? 0,
            sum_source_site: a.total_sum_source_site ?? 0,
            source_ios: a.total_source_ios ?? 0,
            sum_source_ios: a.total_sum_source_ios ?? 0,
            source_android: a.total_source_android ?? 0,
            sum_source_android: a.total_sum_source_android ?? 0,
            delivery_count: a.total_delivery_count ?? 0,
            delivery_sum: a.total_delivery_sum ?? 0,
            delivery_self_count: a.total_delivery_self_count ?? 0,
            delivery_self_sum: a.total_delivery_self_sum ?? 0,
            repeat_order_2: a.total_repeat_order_2 ?? 0,
            repeat_order_3: a.total_repeat_order_3 ?? 0,
            repeat_order_4: a.total_repeat_order_4 ?? 0,
            repeat_order_5: a.total_repeat_order_5 ?? 0,
        };
    }, [aggregated]);

    // ─── Обработчики синхронизации ──────────────────────────────────────
    const handleSync = useCallback(async () => {
        await syncFromApi(false);
    }, [syncFromApi]);

    const handleFullSync = useCallback(async () => {
        await syncFromApi(true);
        // Прогресс и данные обновляются потоково через fullSyncProgress
    }, [syncFromApi]);

    return {
        state: {
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
            fullSyncProgress,
            availableMonths,
            activePreset,
            ymYear,
            ymMonth,
            yearDropdownOpen,
            activeGroups,
            totals,
            tableScrollRef,
            yearDropdownRef,
        },
        actions: {
            setDateFrom,
            setDateTo,
            loadMore,
            applyPreset,
            applyYearMonth,
            setYmYear,
            setYmMonth,
            setYearDropdownOpen,
            toggleGroup,
            handleSync,
            handleFullSync,
        },
    };
}
