/**
 * API-сервис для АМ-аналитики — анализ действий сотрудников в модуле Сообщений.
 * Эндпоинт: POST /messages/actions-analysis/dashboard
 */

import { callApi } from '../../shared/utils/apiClient';

// ─── Типы ответа ────────────────────────────────────────────────

/** Параметры запроса */
export interface AmAnalysisPayload {
    period_days?: number; // 7, 14, 30, 90
}

/** Сводка KPI */
export interface AmAnalysisSummary {
    total_actions: number;
    active_users: number;
    total_dialogs_read: number;
    total_unread_dialogs_read: number;
    total_messages_sent: number;
    total_labels_actions: number;
    total_templates_actions: number;
    period_days: number;
}

/** Статистика одного сотрудника */
export interface AmUserStat {
    user_id: string;
    username: string;
    full_name: string | null;
    role_name: string | null;
    role_color: string | null;
    total_actions: number;
    dialogs_read: number;
    unread_dialogs_read: number;
    messages_sent: number;
    mark_unread: number;
    toggle_important: number;
    labels: number;
    templates: number;
    promocodes: number;
    last_action_at: string | null;
}

/** Распределение по типам действий */
export interface AmActionDistribution {
    action_type: string;
    label: string;
    count: number;
}

/** Распределение по группам действий */
export interface AmGroupDistribution {
    group: string;
    label: string;
    count: number;
}

/** Точка графика по дням */
export interface AmDailyPoint {
    date: string;
    total: number;
    dialogs_read: number;
    unread_dialogs_read: number;
    messages_sent: number;
    labels: number;
    templates: number;
    unique_users: number;
}

/** Полный ответ дашборда */
export interface AmAnalysisResponse {
    summary: AmAnalysisSummary;
    user_stats: AmUserStat[];
    action_distribution: AmActionDistribution[];
    group_distribution: AmGroupDistribution[];
    daily_chart: AmDailyPoint[];
    action_type_labels: Record<string, string>;
}

// ─── API-функция ────────────────────────────────────────────────

/** Получить дашборд АМ-аналитики */
export const getAmAnalysisDashboard = async (
    payload: AmAnalysisPayload = {}
): Promise<AmAnalysisResponse> => {
    return callApi('messages/actions-analysis/dashboard', {
        period_days: payload.period_days ?? 30,
    });
};
