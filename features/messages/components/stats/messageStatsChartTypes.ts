/**
 * Типы для компонента MessageStatsChart.
 */

import { MessageStatsChartPoint } from '../../../../services/api/messages_stats.api';

export type ChartGranularity = 'hours' | 'days';

// ─── Типы метрик ────────────────────────────────────────────────────────

export type MetricKey = 'incoming' | 'outgoing';

export interface NormalizedPoint {
    slot: string;           // ключ слота ("2026-02-20T09" или "2026-02-20")
    incoming: number;
    outgoing: number;
    total: number;
    unique_users: number;
    // Детализация из бэкенда (часовые поля)
    incoming_payload: number;
    incoming_text: number;
    outgoing_system: number;
    outgoing_bot: number;
    incoming_dialogs: number;
    unique_text_users: number;
    unique_payload_users: number;
    outgoing_recipients: number;
    labelDate: string;      // "20.02"
    labelTime: string;      // "09:00 (MSK)" или ""
    /** Доступ по строковому ключу для оверлейных линий */
    [key: string]: string | number;
}

// ─── Типы для оверлейных метрик (кликабельные линии на графике) ───

/** Метрика-оверлей: показывает часовые данные как дополнительную линию */
export interface ChartOverlayMetric {
    /** Ключ поля в NormalizedPoint (incoming_payload, incoming_text и т.д.) */
    key: string;
    /** Человекочитаемая подпись */
    label: string;
    /** Итоговое значение за период (из сводки дашборда, для отображения в бейдже) */
    total: number;
}

export interface MessageStatsChartProps {
    data: MessageStatsChartPoint[];
    /** Какие линии показывать: 'both', 'incoming' или 'outgoing' */
    visibleLines?: 'both' | 'incoming' | 'outgoing';
    /** Метрики для наложения на график (кликабельные линии с часовыми данными) */
    overlayMetrics?: ChartOverlayMetric[];
}
