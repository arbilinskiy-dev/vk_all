/**
 * Константы для компонента MessageStatsChart.
 */

import { MetricKey } from './messageStatsChartTypes';

/** Палитра цветов для линий */
export const METRIC_COLORS: Record<MetricKey, { stroke: string; fill: string }> = {
    incoming: { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.08)' },
    outgoing: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.08)' },
};

/** Палитра цветов для горизонтальных линий-референсов из бейджей */
export const BADGE_LINE_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#ef4444', // red
];

/** Человекочитаемые подписи */
export const METRIC_LABELS: Record<MetricKey, string> = {
    incoming: 'Входящие',
    outgoing: 'Исходящие',
};

// ─── Московское смещение: UTC+3 = +180 минут ───────────────────────────
export const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
