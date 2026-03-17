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
    // Расширенные поля для переключаемых групп колонок
    cost: number | null;
    discount: number | null;
    delivery_price: number | null;
    subtotal: number | null;
    payment_bonus: number | null;
    markup: number | null;
    vk_platform: string | null;
    vk_user_id: string | null;
    address_city: string | null;
    persons: number | null;
    items_total_qty: number | null;
    promocode: string | null;
    comment: string | null;
    is_preorder: boolean;
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
        // Расширенные поля
        cost: number | null;
        payment_bonus: number | null;
        markup: number | null;
        persons: number | null;
        items_total_qty: number | null;
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

// =============================================================================
// Синхронизация заказов из DLVRY hl-orders API
// =============================================================================

/** Результат инкрементальной синхронизации заказов */
export interface DlvryOrdersSyncResult {
    success: boolean;
    new_orders: number;
    skipped_duplicates: number;
    total_revenue: number;
    date_from: string;
    date_to: string;
    error?: string | null;
}

/** Событие прогресса полной загрузки заказов (чанк) */
export interface DlvryOrdersFullSyncEvent {
    chunk: number;
    new_orders: number;
    total_new: number;
    total_skipped: number;
    total_revenue: number;
    date_from: string;
    date_to: string;
    done: boolean;
    success?: boolean;
    error?: string | null;
}

/**
 * Инкрементальная синхронизация заказов из DLVRY API.
 */
export async function syncDlvryOrders(params: {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
} = {}): Promise<DlvryOrdersSyncResult> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/orders/sync${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка синхронизации заказов: ${res.status}`);
    }
    return res.json();
}

/**
 * Полная загрузка заказов с SSE-стримингом прогресса.
 */
export async function syncDlvryOrdersFullStream(
    params: { project_id: string },
    onProgress: (event: DlvryOrdersFullSyncEvent) => void,
    signal?: AbortSignal,
): Promise<void> {
    const query = new URLSearchParams();
    query.set('project_id', params.project_id);

    const url = `${API_BASE_URL}/dlvry/orders/sync-full-stream?${query}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка полной загрузки заказов: ${res.status}`);
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
                    const event: DlvryOrdersFullSyncEvent = JSON.parse(line.slice(6));
                    onProgress(event);
                } catch {
                    // skip malformed events
                }
            }
        }
    }

    // Остаток буфера
    if (buffer.trim().startsWith('data: ')) {
        try {
            const event: DlvryOrdersFullSyncEvent = JSON.parse(buffer.trim().slice(6));
            onProgress(event);
        } catch {
            // skip
        }
    }
}


// =============================================================================
// Аналитика товаров
// =============================================================================

/** Товар с агрегированной статистикой продаж */
export interface DlvryProductAnalytics {
    dlvry_item_id: string;
    name: string;
    code: string;
    sku_title: string;
    total_qty: number;
    orders_count: number;
    total_revenue: number;
    avg_price: number;
    min_price: number;
    max_price: number;
}

/** Ответ списка товаров */
export interface DlvryProductsListResponse {
    products: DlvryProductAnalytics[];
    total: number;
    skip: number;
    limit: number;
}

/** Сводка по товарам */
export interface DlvryProductsSummary {
    unique_products: number;
    total_qty: number;
    total_revenue: number;
    total_orders: number;
    avg_qty_per_order: number;
    avg_revenue_per_product: number;
}

/** Параметры запроса товаров */
export interface DlvryProductsFilter {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    skip?: number;
    limit?: number;
}

/**
 * Получить список товаров с агрегированной статистикой продаж.
 */
export async function fetchDlvryProducts(filter: DlvryProductsFilter = {}): Promise<DlvryProductsListResponse> {
    const params = new URLSearchParams();
    if (filter.project_id) params.set('project_id', filter.project_id);
    if (filter.affiliate_id) params.set('affiliate_id', filter.affiliate_id);
    if (filter.date_from) params.set('date_from', filter.date_from);
    if (filter.date_to) params.set('date_to', filter.date_to);
    if (filter.search) params.set('search', filter.search);
    if (filter.sort_by) params.set('sort_by', filter.sort_by);
    if (filter.sort_dir) params.set('sort_dir', filter.sort_dir);
    if (filter.skip !== undefined) params.set('skip', String(filter.skip));
    if (filter.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    const url = `${API_BASE_URL}/dlvry/products${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки товаров: ${res.status}`);
    return res.json();
}

/**
 * Получить сводную статистику по товарам.
 */
export async function fetchDlvryProductsSummary(params: {
    project_id?: string;
    affiliate_id?: string;
    date_from?: string;
    date_to?: string;
} = {}): Promise<DlvryProductsSummary> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/products/summary${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки сводки товаров: ${res.status}`);
    return res.json();
}

// ─── Сопутствующие товары (co-occurrence) ─────────────────────────

export interface DlvryRelatedProduct {
    dlvry_item_id: string;
    name: string;
    co_orders: number;
    pct: number;
    avg_qty: number;
}

export interface DlvryProductRelatedResponse {
    target_orders_count: number;
    related: DlvryRelatedProduct[];
}

/**
 * Получить сопутствующие товары — что берут вместе с данным товаром.
 */
export async function fetchDlvryProductRelated(
    itemId: string,
    params: {
        project_id?: string;
        affiliate_id?: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
    } = {},
): Promise<DlvryProductRelatedResponse> {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project_id', params.project_id);
    if (params.affiliate_id) query.set('affiliate_id', params.affiliate_id);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE_URL}/dlvry/products/${encodeURIComponent(itemId)}/related${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки сопутствующих товаров: ${res.status}`);
    return res.json();
}
