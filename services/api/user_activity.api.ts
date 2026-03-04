import { callApi } from '../../shared/utils/apiClient';

// --- Типы ---

/** Параметры запроса дашборда */
export interface UserActivityPayload {
    period_days?: number; // 7, 14, 30, 90
}

/** Общие метрики (KPI-карточки) */
export interface ActivitySummary {
    total_active_users: number;
    total_logins: number;
    total_failed_logins: number;
    total_timeouts: number;
    total_force_logouts: number;
    online_now: number;
    avg_session_minutes: number;
    period_days: number;
}

/** Статистика по одному пользователю */
export interface UserActivityStat {
    user_id: string;
    username: string;
    full_name: string | null;
    is_online: boolean;
    login_count: number;
    failed_count: number;
    logout_count: number;
    timeout_count: number;
    force_logout_count: number;
    last_event_at: string | null;
    avg_session_minutes: number;
    total_time_minutes: number;
    session_count: number;
}

/** Точка графика активности по дням */
export interface DailyActivityPoint {
    date: string;
    logins: number;
    logouts: number;
    timeouts: number;
    failed: number;
    unique_users: number;
}

/** Точка тепловой карты по часам */
export interface HourlyPoint {
    hour: number;
    count: number;
}

/** Распределение событий */
export interface EventDistribution {
    event_type: string;
    count: number;
}

// --- Типы бизнес-действий ---

/** Сводка по бизнес-действиям */
export interface ActionsSummary {
    total_actions: number;
    active_doers: number;
    top_categories: Array<{ category: string; count: number }> | null;
    top_actions: Array<{ action_type: string; count: number }> | null;
}

/** Категория действий пользователя */
export interface UserActionCategory {
    category: string;
    count: number;
}

/** Статистика действий одного пользователя */
export interface UserActionStat {
    user_id: string;
    username: string;
    full_name: string | null;
    role_name: string | null;
    role_color: string | null;
    total_actions: number;
    categories: UserActionCategory[];
    last_action_at: string | null;
}

/** Точка графика действий по дням */
export interface DailyActionPoint {
    date: string;
    total: number;
    posts: number;
    messages: number;
    ai: number;
    market: number;
    unique_users: number;
}

/** Полный ответ дашборда */
export interface ActivityDashboardResponse {
    summary: ActivitySummary;
    user_stats: UserActivityStat[];
    daily_chart: DailyActivityPoint[];
    hourly_chart: HourlyPoint[];
    events_chart: EventDistribution[];
    // Бизнес-действия (могут отсутствовать, если данных ещё нет)
    actions_summary?: ActionsSummary;
    user_actions_stats?: UserActionStat[];
    daily_actions?: DailyActionPoint[];
}

// --- API-функции ---

/** Получить полный дашборд активности пользователей */
export const getUserActivityDashboard = async (
    payload: UserActivityPayload = {}
): Promise<ActivityDashboardResponse> => {
    return callApi('user-activity/dashboard', {
        period_days: payload.period_days ?? 30,
    });
};
