/**
 * Хук подготовки данных для графика продаж.
 * Загружает ВСЕ дневные данные за период (без пагинации),
 * группирует по нужной гранулярности (день / неделя / месяц).
 */

import { useState, useEffect, useMemo } from 'react';
import { fetchDlvryDailyStats, DlvryDayStat } from '../../../services/api/dlvryStats.api';
import { PeriodPreset } from './salesTabConstants';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type ChartMetric =
    | 'revenue'
    | 'orders'
    | 'avg_check'
    | 'canceled'
    | 'canceled_sum'
    | 'delivery_orders'
    | 'pickup_orders'
    | 'delivery_revenue'
    | 'pickup_revenue';

export interface ChartDataPoint {
    label: string;         // метка оси X (дата / неделя / месяц)
    sortKey: string;       // для сортировки (YYYY-MM-DD / YYYY-Wxx / YYYY-MM)
    revenue: number;
    orders: number;
    avg_check: number;
    canceled: number;
    canceled_sum: number;
    delivery_orders: number;
    pickup_orders: number;
    delivery_revenue: number;
    pickup_revenue: number;
}

export type ChartGranularity = 'daily' | 'weekly' | 'monthly';

export const CHART_METRIC_LABELS: Record<ChartMetric, string> = {
    revenue: 'Выручка',
    orders: 'Заказы',
    avg_check: 'Средний чек',
    canceled: 'Отмены (заказы)',
    canceled_sum: 'Отмены (выручка)',
    delivery_orders: 'Доставка (заказы)',
    pickup_orders: 'Самовывоз (заказы)',
    delivery_revenue: 'Доставка (выручка)',
    pickup_revenue: 'Самовывоз (выручка)',
};

export const CHART_METRIC_COLORS: Record<ChartMetric, { stroke: string; fill: string }> = {
    revenue:          { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.1)' },
    orders:           { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
    avg_check:        { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' },
    canceled:         { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.1)' },
    canceled_sum:     { stroke: '#dc2626', fill: 'rgba(220, 38, 38, 0.1)' },
    delivery_orders:  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
    pickup_orders:    { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)' },
    delivery_revenue: { stroke: '#059669', fill: 'rgba(5, 150, 105, 0.1)' },
    pickup_revenue:   { stroke: '#7c3aed', fill: 'rgba(124, 58, 237, 0.1)' },
};

// ─── Гранулярность ───────────────────────────────────────────────────────────

function diffDays(from: string, to: string): number {
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
}

export function getChartGranularity(preset: PeriodPreset, dateFrom: string, dateTo: string): ChartGranularity {
    switch (preset) {
        case 'today':
        case 'yesterday':
            return 'daily';
        case 'this_week':
        case 'last_week':
        case 'this_month':
        case 'last_month':
        case 'year_month':
            return 'daily';
        case 'this_quarter':
        case 'last_quarter':
            return 'weekly';
        case 'this_year':
        case 'last_year':
            return 'monthly';
        case 'custom': {
            if (!dateFrom || !dateTo) return 'daily';
            const d = diffDays(dateFrom, dateTo);
            if (d <= 1) return 'daily';
            if (d <= 62) return 'daily';
            if (d <= 180) return 'weekly';
            return 'monthly';
        }
        case null: // Всё время
            return 'monthly';
        default:
            return 'daily';
    }
}

// ─── Группировка ─────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

/** ISO-неделя: возвращает "YYYY-Wxx" */
function getISOWeek(dateStr: string): string {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(dateStr: string): string {
    return dateStr.slice(0, 7); // "YYYY-MM"
}

function formatWeekLabel(weekKey: string): string {
    // "2026-W03" → "3 нед."
    const num = parseInt(weekKey.split('-W')[1], 10);
    return `${num} нед.`;
}

function formatMonthLabel(monthKey: string): string {
    // "2026-03" → "Мар 26"
    const [y, m] = monthKey.split('-');
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/** Группирует массив дневных записей по гранулярности */
function groupDays(days: DlvryDayStat[], granularity: ChartGranularity): ChartDataPoint[] {
    // Сортируем по дате (ASC — слева направо)
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

    if (granularity === 'daily') {
        return sorted.map(d => ({
            label: formatDayLabel(d.date),
            sortKey: d.date,
            revenue: d.revenue,
            orders: d.orders_count,
            avg_check: d.avg_check,
            canceled: d.canceled,
            canceled_sum: d.canceled_sum,
            delivery_orders: d.delivery_count,
            pickup_orders: d.delivery_self_count,
            delivery_revenue: d.delivery_sum,
            pickup_revenue: d.delivery_self_sum,
        }));
    }

    // Группировка по ключу (неделя или месяц)
    const getKey = granularity === 'weekly' ? (d: DlvryDayStat) => getISOWeek(d.date) : (d: DlvryDayStat) => getMonthKey(d.date);
    const formatLabel = granularity === 'weekly' ? formatWeekLabel : formatMonthLabel;

    const groups = new Map<string, DlvryDayStat[]>();
    for (const day of sorted) {
        const key = getKey(day);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(day);
    }

    const result: ChartDataPoint[] = [];
    for (const [key, items] of groups) {
        const totalOrders = items.reduce((s, d) => s + d.orders_count, 0);
        const totalRevenue = items.reduce((s, d) => s + d.revenue, 0);
        result.push({
            label: formatLabel(key),
            sortKey: key,
            revenue: totalRevenue,
            orders: totalOrders,
            avg_check: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            canceled: items.reduce((s, d) => s + d.canceled, 0),
            canceled_sum: items.reduce((s, d) => s + d.canceled_sum, 0),
            delivery_orders: items.reduce((s, d) => s + d.delivery_count, 0),
            pickup_orders: items.reduce((s, d) => s + d.delivery_self_count, 0),
            delivery_revenue: items.reduce((s, d) => s + d.delivery_sum, 0),
            pickup_revenue: items.reduce((s, d) => s + d.delivery_self_sum, 0),
        });
    }

    return result;
}

// ─── Хук ─────────────────────────────────────────────────────────────────────

interface UseSalesChartDataParams {
    projectId: string | null;
    affiliateId?: string | null;
    dateFrom: string;
    dateTo: string;
    activePreset: PeriodPreset;
}

interface UseSalesChartDataResult {
    chartData: ChartDataPoint[];
    granularity: ChartGranularity;
    isLoading: boolean;
}

export function useSalesChartData({ projectId, affiliateId, dateFrom, dateTo, activePreset }: UseSalesChartDataParams): UseSalesChartDataResult {
    const [rawDays, setRawDays] = useState<DlvryDayStat[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const granularity = useMemo(() => getChartGranularity(activePreset, dateFrom, dateTo), [activePreset, dateFrom, dateTo]);

    // Загружаем ВСЕ дни за период (без пагинации) — отдельный запрос для графика
    useEffect(() => {
        if (!projectId) { setRawDays([]); return; }

        let cancelled = false;
        setIsLoading(true);

        fetchDlvryDailyStats({
            project_id: projectId,
            affiliate_id: affiliateId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            // limit не передаём — бэкенд вернёт все записи
        })
            .then(data => {
                if (!cancelled) setRawDays(data.days);
            })
            .catch(() => {
                if (!cancelled) setRawDays([]);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [projectId, affiliateId, dateFrom, dateTo]);

    const chartData = useMemo(() => groupDays(rawDays, granularity), [rawDays, granularity]);

    return { chartData, granularity, isLoading };
}
