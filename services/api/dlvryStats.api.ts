/**
 * API-сервис для дневной статистики DLVRY (данные из DLVRY API, сохранённые в БД).
 * Отдельно от dlvry.api.ts (который про вебхук-заказы).
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

// =============================================================================
// Типы
// =============================================================================

/** Дневная запись статистики */
export interface DlvryDayStat {
    date: string;           // YYYY-MM-DD
    orders_count: number;
    revenue: number;
    first_orders: number;
    avg_check: number;
    // Отмены
    canceled: number;
    canceled_sum: number;
    // Финансы
    cost: number;
    discount: number;
    first_orders_sum: number;
    first_orders_cost: number;
    // Клиенты
    unique_clients: number;
    // Оплата (разбивка)
    sum_cash: number;
    count_payment_cash: number;
    sum_card: number;
    count_payment_card: number;
    count_payment_online: number;
    sum_online_success: number;
    sum_online_fail: number;
    // Источники
    source_site: number;
    sum_source_site: number;
    source_vkapp: number;
    sum_source_vkapp: number;
    source_ios: number;
    sum_source_ios: number;
    source_android: number;
    sum_source_android: number;
    // Доставка
    delivery_self_count: number;
    delivery_self_sum: number;
    delivery_count: number;
    delivery_sum: number;
    // Повторные заказы
    repeat_order_2: number;
    repeat_order_3: number;
    repeat_order_4: number;
    repeat_order_5: number;
}

/** Агрегированные данные за период (полные суммы из БД) */
export interface DlvryAggregated {
    // Базовые
    total_orders: number;
    total_revenue: number;
    total_first_orders: number;
    avg_check: number;
    total_unique_clients: number;
    // Отмены
    total_canceled: number;
    total_canceled_sum: number;
    // Финансы
    total_cost: number;
    total_discount: number;
    total_first_orders_sum: number;
    total_first_orders_cost: number;
    // Оплата
    total_count_payment_cash: number;
    total_sum_cash: number;
    total_count_payment_card: number;
    total_sum_card: number;
    total_count_payment_online: number;
    total_sum_online_success: number;
    total_sum_online_fail: number;
    // Источники
    total_source_vkapp: number;
    total_sum_source_vkapp: number;
    total_source_site: number;
    total_sum_source_site: number;
    total_source_ios: number;
    total_sum_source_ios: number;
    total_source_android: number;
    total_sum_source_android: number;
    // Доставка
    total_delivery_count: number;
    total_delivery_sum: number;
    total_delivery_self_count: number;
    total_delivery_self_sum: number;
    // Повторные заказы
    total_repeat_order_2: number;
    total_repeat_order_3: number;
    total_repeat_order_4: number;
    total_repeat_order_5: number;
}

/** Ответ GET /stats/daily */
export interface DlvryDailyStatsResponse {
    days: DlvryDayStat[];
    total: number;
    total_count: number;
    has_more: boolean;
    aggregated: DlvryAggregated;
}

/** Результат синхронизации */
export interface DlvrySyncResult {
    success: boolean;
    synced_days: number;
    date_from: string;
    date_to: string;
    total_orders?: number;
    total_revenue?: number;
    error?: string | null;
}

/** Результат синхронизации всех проектов */
export interface DlvrySyncAllResult {
    total_projects: number;
    synced: number;
    errors: number;
    details: Array<{
        project_id: string;
        project_name: string;
        affiliate_id: string;
        success: boolean;
        synced_days?: number;
        error?: string | null;
    }>;
}

/** Событие прогресса полной загрузки (чанк) */
export interface DlvryFullSyncEvent {
    chunk: number;
    synced_days: number;
    total_days: number;
    total_orders: number;
    total_revenue: number;
    date_from: string;
    date_to: string;
    done: boolean;
    success?: boolean;
    error?: string | null;
}

// =============================================================================
// API-функции
// =============================================================================

/**
 * Получить дневную статистику из БД.
 */
export async function fetchDlvryDailyStats(params: {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
} = {}): Promise<DlvryDailyStatsResponse> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/stats/daily${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки статистики: ${res.status}`);
    return res.json();
}

/** Месяц, по которому есть данные */
export interface DlvryAvailableMonth {
    year: number;
    month: number;
}

/**
 * Получить список год-месяц, по которым есть хотя бы одна запись.
 */
export async function fetchAvailableMonths(params: {
    project_id?: string;
    affiliate_id?: string;
} = {}): Promise<DlvryAvailableMonth[]> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/stats/available-months${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки доступных месяцев: ${res.status}`);
    const data = await res.json();
    return data.months as DlvryAvailableMonth[];
}

/**
 * Синхронизировать данные из DLVRY API для одного проекта.
 */
export async function syncDlvryStats(params: {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
    force_full?: boolean;
} = {}): Promise<DlvrySyncResult> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.force_full) query.set('force_full', 'true');

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/stats/sync${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка синхронизации: ${res.status}`);
    }
    return res.json();
}

/**
 * Синхронизировать данные для ВСЕХ проектов.
 */
export async function syncAllDlvryStats(): Promise<DlvrySyncAllResult> {
    const url = `${API_BASE_URL}/dlvry/stats/sync-all`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка синхронизации: ${res.status}`);
    }
    return res.json();
}

/**
 * Полная загрузка с SSE-стримингом прогресса.
 * Читает Server-Sent Events, вызывает onProgress на каждый чанк.
 */
export async function syncDlvryStatsFullStream(
    params: { project_id: string },
    onProgress: (event: DlvryFullSyncEvent) => void,
    signal?: AbortSignal,
): Promise<void> {
    const query = new URLSearchParams();
    query.set('project_id', params.project_id);

    const url = `${API_BASE_URL}/dlvry/stats/sync-full-stream?${query}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка полной загрузки: ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
            const line = part.trim();
            if (line.startsWith('data: ')) {
                try {
                    const event: DlvryFullSyncEvent = JSON.parse(line.slice(6));
                    onProgress(event);
                } catch {
                    // skip malformed events
                }
            }
        }
    }

    // Process any remaining data in the buffer
    if (buffer.trim().startsWith('data: ')) {
        try {
            const event: DlvryFullSyncEvent = JSON.parse(buffer.trim().slice(6));
            onProgress(event);
        } catch {
            // skip
        }
    }
}
