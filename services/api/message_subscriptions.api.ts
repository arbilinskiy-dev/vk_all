/**
 * API-сервис для статистики подписок/отписок на сообщения сообщества.
 * События message_allow / message_deny из VK Callback.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

// =============================================================================
// Типы ответов API
// =============================================================================

/** Глобальная сводка подписок/отписок */
export interface SubscriptionsSummary {
    success: boolean;
    total_events: number;
    total_allow: number;
    total_deny: number;
    unique_users_allow: number;
    unique_users_deny: number;
    projects_count: number;
}

/** Точка на графике подписок (часовой слот) */
export interface SubscriptionsChartPoint {
    hour_slot: string;
    allow: number;
    deny: number;
    total: number;
}

/** Ответ: данные графика */
export interface SubscriptionsChartResponse {
    success: boolean;
    chart: SubscriptionsChartPoint[];
}

/** Сводка по одному проекту */
export interface SubscriptionsProjectItem {
    project_id: string;
    allow_count: number;
    deny_count: number;
    total: number;
    unique_users: number;
}

/** Ответ: проекты */
export interface SubscriptionsProjectsResponse {
    success: boolean;
    projects: SubscriptionsProjectItem[];
}

/** Пользователь проекта (агрегация подписок) */
export interface SubscriptionUserItem {
    vk_user_id: number;
    allow_count: number;
    deny_count: number;
    last_event_at: number | null;
    last_event_type: string;
}

/** Ответ: пользователи проекта */
export interface SubscriptionUsersResponse {
    success: boolean;
    total_count: number;
    users: SubscriptionUserItem[];
}

/** Отдельное событие подписки */
export interface SubscriptionEventItem {
    id: number;
    project_id: string;
    vk_user_id: number;
    event_type: string;
    event_at: number;
    event_date: string;
}

/** Ответ: лента событий */
export interface SubscriptionEventsResponse {
    success: boolean;
    total_count: number;
    events: SubscriptionEventItem[];
}

// =============================================================================
// API-функции
// =============================================================================

/** Получить глобальную сводку подписок */
export async function fetchSubscriptionsSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<SubscriptionsSummary> {
    const sp = new URLSearchParams();
    if (params?.dateFrom) sp.set('date_from', params.dateFrom);
    if (params?.dateTo) sp.set('date_to', params.dateTo);
    const qs = sp.toString();
    const url = `${API_BASE_URL}/messages/subscriptions/summary${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки сводки подписок: ${res.status}`);
    return res.json();
}

/** Получить данные графика подписок */
export async function fetchSubscriptionsChart(params?: {
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
}): Promise<SubscriptionsChartResponse> {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set('project_id', params.projectId);
    if (params?.dateFrom) sp.set('date_from', params.dateFrom);
    if (params?.dateTo) sp.set('date_to', params.dateTo);
    const qs = sp.toString();
    const url = `${API_BASE_URL}/messages/subscriptions/chart${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки графика подписок: ${res.status}`);
    return res.json();
}

/** Получить сводку по проектам */
export async function fetchSubscriptionsProjects(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<SubscriptionsProjectsResponse> {
    const sp = new URLSearchParams();
    if (params?.dateFrom) sp.set('date_from', params.dateFrom);
    if (params?.dateTo) sp.set('date_to', params.dateTo);
    const qs = sp.toString();
    const url = `${API_BASE_URL}/messages/subscriptions/projects${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки проектов подписок: ${res.status}`);
    return res.json();
}

/** Получить пользователей проекта (подписки/отписки) */
export async function fetchSubscriptionsProjectUsers(
    projectId: string,
    params?: {
        eventType?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
    },
): Promise<SubscriptionUsersResponse> {
    const sp = new URLSearchParams();
    if (params?.eventType) sp.set('event_type', params.eventType);
    if (params?.dateFrom) sp.set('date_from', params.dateFrom);
    if (params?.dateTo) sp.set('date_to', params.dateTo);
    if (params?.limit) sp.set('limit', params.limit.toString());
    if (params?.offset) sp.set('offset', params.offset.toString());
    const qs = sp.toString();
    const url = `${API_BASE_URL}/messages/subscriptions/project/${projectId}/users${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки пользователей подписок: ${res.status}`);
    return res.json();
}

/** Получить ленту событий */
export async function fetchSubscriptionsEvents(params?: {
    projectId?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}): Promise<SubscriptionEventsResponse> {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set('project_id', params.projectId);
    if (params?.eventType) sp.set('event_type', params.eventType);
    if (params?.dateFrom) sp.set('date_from', params.dateFrom);
    if (params?.dateTo) sp.set('date_to', params.dateTo);
    if (params?.limit) sp.set('limit', params.limit.toString());
    if (params?.offset) sp.set('offset', params.offset.toString());
    const qs = sp.toString();
    const url = `${API_BASE_URL}/messages/subscriptions/events${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки событий подписок: ${res.status}`);
    return res.json();
}
