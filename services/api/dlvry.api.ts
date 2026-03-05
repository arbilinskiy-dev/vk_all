/**
 * API-сервис для DLVRY интеграции.
 * Заказы, статистика, журнал вебхуков.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

// =============================================================================
// Типы
// =============================================================================

/** Заказ DLVRY (краткая карточка для списка) */
export interface DlvryOrder {
    id: number;
    dlvry_order_id: string;
    affiliate_id: string;
    order_date: string | null;
    client_name: string | null;
    client_phone: string | null;
    total: number | null;
    payment_type: string | null;
    delivery_type: string | null;
    source_name: string | null;
    status: string | null;
    items_count: number | null;
    created_at: string | null;
}

/** Позиция заказа */
export interface DlvryOrderItem {
    id: number;
    name: string | null;
    price: number | null;
    quantity: number | null;
    total: number | null;
    code: string | null;
    weight: string | null;
    options: string | null;
}

/** Полная информация о заказе */
export interface DlvryOrderDetail {
    order: {
        id: number;
        dlvry_order_id: string;
        affiliate_id: string;
        order_date: string | null;
        client_name: string | null;
        client_phone: string | null;
        client_email: string | null;
        client_birthday: string | null;
        vk_user_id: string | null;
        vk_group_id: string | null;
        vk_platform: string | null;
        address_full: string | null;
        address_city: string | null;
        address_street: string | null;
        address_house: string | null;
        address_flat: string | null;
        total: number | null;
        subtotal: number | null;
        discount: number | null;
        delivery_price: number | null;
        payment_type: string | null;
        payment_code: string | null;
        delivery_type: string | null;
        delivery_code: string | null;
        source_name: string | null;
        source_code: string | null;
        pickup_point_name: string | null;
        promocode: string | null;
        comment: string | null;
        preorder: boolean | null;
        status: string | null;
        items_count: number | null;
        items_json: string | null;
        raw_json: string | null;
        created_at: string | null;
    };
    items: DlvryOrderItem[];
}

/** Ответ списка заказов */
export interface DlvryOrdersListResponse {
    orders: DlvryOrder[];
    total: number;
    skip: number;
    limit: number;
}

/** Агрегированная статистика */
export interface DlvryOrderStats {
    total_orders: number;
    total_revenue: number;
    avg_check: number;
    orders_today: number;
    revenue_today: number;
    orders_this_week: number;
    revenue_this_week: number;
    orders_this_month: number;
    revenue_this_month: number;
    top_sources: Record<string, number>;
    top_payment_types: Record<string, number>;
    top_delivery_types: Record<string, number>;
}

/** Запись из журнала вебхуков */
export interface DlvryWebhookLog {
    id: number;
    ip: string | null;
    affiliate_id: string | null;
    dlvry_order_id: string | null;
    result: string | null;
    error_message: string | null;
    created_at: string | null;
}

/** Параметры фильтрации заказов */
export interface DlvryOrdersFilter {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    skip?: number;
    limit?: number;
}

// =============================================================================
// API-функции
// =============================================================================

/**
 * Получить список заказов DLVRY с фильтрацией и пагинацией.
 */
export async function fetchDlvryOrders(filter: DlvryOrdersFilter = {}): Promise<DlvryOrdersListResponse> {
    const params = new URLSearchParams();
    if (filter.project_id) params.set('project_id', filter.project_id);
    if (filter.affiliate_id) params.set('affiliate_id', filter.affiliate_id);
    if (filter.date_from) params.set('date_from', filter.date_from);
    if (filter.date_to) params.set('date_to', filter.date_to);
    if (filter.search) params.set('search', filter.search);
    if (filter.skip !== undefined) params.set('skip', String(filter.skip));
    if (filter.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    const url = `${API_BASE_URL}/dlvry/orders${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки заказов: ${res.status}`);
    return res.json();
}

/**
 * Получить детали заказа по ID.
 */
export async function fetchDlvryOrderDetail(orderId: number): Promise<DlvryOrderDetail> {
    const url = `${API_BASE_URL}/dlvry/orders/${orderId}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки заказа: ${res.status}`);
    return res.json();
}

/**
 * Получить агрегированную статистику по заказам.
 */
export async function fetchDlvryOrdersStats(params: {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
} = {}): Promise<DlvryOrderStats> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/orders/stats${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки статистики: ${res.status}`);
    return res.json();
}

/**
 * Получить журнал вебхуков.
 */
export async function fetchDlvryWebhookLogs(skip = 0, limit = 100): Promise<{
    logs: DlvryWebhookLog[];
    total: number;
}> {
    const url = `${API_BASE_URL}/dlvry/webhook-logs?skip=${skip}&limit=${limit}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки логов: ${res.status}`);
    return res.json();
}

/**
 * Очистить журнал вебхуков.
 */
export async function clearDlvryWebhookLogs(): Promise<{ deleted: number }> {
    const url = `${API_BASE_URL}/dlvry/webhook-logs`;
    const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка очистки логов: ${res.status}`);
    return res.json();
}
