/**
 * Тесты для API-слоя DLVRY (services/api/dlvry.api.ts).
 * Проверяем: формирование URL, передачу параметров, обработку ошибок.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мокаем конфиг и auth-заголовки
vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://test-api/api',
}));
vi.mock('../../shared/utils/apiClient', () => ({
    getAuthHeaders: () => ({ 'Content-Type': 'application/json', 'X-Session-Token': 'test-token' }),
}));

// Мокаем глобальный fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
    fetchDlvryOrders,
    fetchDlvryOrderDetail,
    fetchDlvryOrdersStats,
    fetchDlvryWebhookLogs,
    clearDlvryWebhookLogs,
} from '../../services/api/dlvry.api';

// =============================================================================
// Фикстуры
// =============================================================================

function createMockOrdersResponse() {
    return {
        orders: [
            {
                id: 1,
                dlvry_order_id: '12345',
                affiliate_id: 'aff-1',
                order_date: '2026-03-01T10:00:00',
                client_name: 'Иван Иванов',
                client_phone: '+79001234567',
                total: 1500.5,
                payment_type: 'Онлайн',
                delivery_type: 'Доставка',
                source_name: 'VK Mini App',
                status: 'new',
                items_count: 3,
                created_at: '2026-03-01T10:00:00',
                // Расширенные поля для переключаемых групп колонок
                cost: 750.0,
                discount: 100.0,
                delivery_price: 150.0,
                subtotal: 1700.5,
                payment_bonus: 50.0,
                markup: 30.0,
                vk_platform: 'desktop_web',
                vk_user_id: '789',
                address_city: 'Москва',
                persons: 2,
                items_total_qty: 5,
                promocode: 'СКИДКА10',
                comment: 'Тестовый заказ',
                is_preorder: false,
            },
        ],
        total: 1,
        skip: 0,
        limit: 25,
    };
}

function createMockStatsResponse() {
    return {
        total_orders: 42,
        total_revenue: 63000,
        avg_check: 1500,
        orders_today: 3,
        revenue_today: 4500,
        orders_this_week: 15,
        revenue_this_week: 22500,
        orders_this_month: 42,
        revenue_this_month: 63000,
        top_sources: { 'VK Mini App': 30, 'Сайт': 12 },
        top_payment_types: { 'Онлайн': 35, 'Наличные': 7 },
        top_delivery_types: { 'Доставка': 25, 'Самовывоз': 17 },
    };
}

function mockOkResponse(data: any) {
    return { ok: true, status: 200, json: () => Promise.resolve(data) };
}

function mockErrorResponse(status: number) {
    return { ok: false, status, json: () => Promise.resolve({ detail: 'Error' }) };
}

// =============================================================================
// Тесты
// =============================================================================

describe('dlvry.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─────────────────────────────────────────────────────────────────────
    // fetchDlvryOrders
    // ─────────────────────────────────────────────────────────────────────

    describe('fetchDlvryOrders', () => {
        it('вызывает fetch с правильным URL без фильтров', async () => {
            mockFetch.mockResolvedValue(mockOkResponse(createMockOrdersResponse()));

            await fetchDlvryOrders();

            expect(mockFetch).toHaveBeenCalledOnce();
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toBe('http://test-api/api/dlvry/orders');
            expect(options.headers).toHaveProperty('X-Session-Token', 'test-token');
        });

        it('формирует query string из фильтров', async () => {
            mockFetch.mockResolvedValue(mockOkResponse(createMockOrdersResponse()));

            await fetchDlvryOrders({
                project_id: 'proj-1',
                date_from: '2026-01-01',
                date_to: '2026-03-01',
                search: 'Иван',
                skip: 10,
                limit: 50,
            });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('project_id=proj-1');
            expect(url).toContain('date_from=2026-01-01');
            expect(url).toContain('date_to=2026-03-01');
            expect(url).toContain('search=');
            expect(url).toContain('skip=10');
            expect(url).toContain('limit=50');
        });

        it('не добавляет пустые фильтры в query string', async () => {
            mockFetch.mockResolvedValue(mockOkResponse(createMockOrdersResponse()));

            await fetchDlvryOrders({ project_id: 'proj-1' });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('project_id=proj-1');
            expect(url).not.toContain('date_from');
            expect(url).not.toContain('search');
        });

        it('возвращает данные заказов', async () => {
            const mockData = createMockOrdersResponse();
            mockFetch.mockResolvedValue(mockOkResponse(mockData));

            const result = await fetchDlvryOrders();

            expect(result.orders).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.orders[0].client_name).toBe('Иван Иванов');
        });

        it('возвращает расширенные поля заказа', async () => {
            const mockData = createMockOrdersResponse();
            mockFetch.mockResolvedValue(mockOkResponse(mockData));

            const result = await fetchDlvryOrders();
            const order = result.orders[0];

            expect(order.cost).toBe(750.0);
            expect(order.discount).toBe(100.0);
            expect(order.delivery_price).toBe(150.0);
            expect(order.subtotal).toBe(1700.5);
            expect(order.payment_bonus).toBe(50.0);
            expect(order.markup).toBe(30.0);
            expect(order.vk_platform).toBe('desktop_web');
            expect(order.vk_user_id).toBe('789');
            expect(order.address_city).toBe('Москва');
            expect(order.persons).toBe(2);
            expect(order.items_total_qty).toBe(5);
            expect(order.promocode).toBe('СКИДКА10');
            expect(order.comment).toBe('Тестовый заказ');
            expect(order.is_preorder).toBe(false);
        });

        it('выбрасывает ошибку при non-ok ответе', async () => {
            mockFetch.mockResolvedValue(mockErrorResponse(500));

            await expect(fetchDlvryOrders()).rejects.toThrow('Ошибка загрузки заказов: 500');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // fetchDlvryOrderDetail
    // ─────────────────────────────────────────────────────────────────────

    describe('fetchDlvryOrderDetail', () => {
        it('вызывает правильный URL с orderId', async () => {
            const mockDetail = { order: { id: 42 }, items: [] };
            mockFetch.mockResolvedValue(mockOkResponse(mockDetail));

            await fetchDlvryOrderDetail(42);

            expect(mockFetch.mock.calls[0][0]).toBe('http://test-api/api/dlvry/orders/42');
        });

        it('возвращает детали заказа', async () => {
            const mockDetail = {
                order: { id: 1, dlvry_order_id: '100', client_name: 'Тест' },
                items: [{ id: 1, name: 'Пицца', price: 500, quantity: 2, total: 1000 }],
            };
            mockFetch.mockResolvedValue(mockOkResponse(mockDetail));

            const result = await fetchDlvryOrderDetail(1);

            expect(result.order.client_name).toBe('Тест');
            expect(result.items).toHaveLength(1);
            expect(result.items[0].name).toBe('Пицца');
        });

        it('выбрасывает ошибку при 404', async () => {
            mockFetch.mockResolvedValue(mockErrorResponse(404));

            await expect(fetchDlvryOrderDetail(999)).rejects.toThrow('Ошибка загрузки заказа: 404');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // fetchDlvryOrdersStats
    // ─────────────────────────────────────────────────────────────────────

    describe('fetchDlvryOrdersStats', () => {
        it('вызывает /orders/stats с параметрами', async () => {
            mockFetch.mockResolvedValue(mockOkResponse(createMockStatsResponse()));

            await fetchDlvryOrdersStats({ project_id: 'proj-1' });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('/dlvry/orders/stats');
            expect(url).toContain('project_id=proj-1');
        });

        it('возвращает статистику', async () => {
            mockFetch.mockResolvedValue(mockOkResponse(createMockStatsResponse()));

            const result = await fetchDlvryOrdersStats();

            expect(result.total_orders).toBe(42);
            expect(result.avg_check).toBe(1500);
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(mockErrorResponse(503));

            await expect(fetchDlvryOrdersStats()).rejects.toThrow('Ошибка загрузки статистики: 503');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // fetchDlvryWebhookLogs
    // ─────────────────────────────────────────────────────────────────────

    describe('fetchDlvryWebhookLogs', () => {
        it('вызывает /webhook-logs с пагинацией', async () => {
            mockFetch.mockResolvedValue(mockOkResponse({ logs: [], total: 0 }));

            await fetchDlvryWebhookLogs(10, 50);

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('skip=10');
            expect(url).toContain('limit=50');
        });

        it('использует дефолтные значения пагинации', async () => {
            mockFetch.mockResolvedValue(mockOkResponse({ logs: [], total: 0 }));

            await fetchDlvryWebhookLogs();

            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('skip=0');
            expect(url).toContain('limit=100');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // clearDlvryWebhookLogs
    // ─────────────────────────────────────────────────────────────────────

    describe('clearDlvryWebhookLogs', () => {
        it('вызывает DELETE /webhook-logs', async () => {
            mockFetch.mockResolvedValue(mockOkResponse({ deleted: 5 }));

            const result = await clearDlvryWebhookLogs();

            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('/dlvry/webhook-logs');
            expect(options.method).toBe('DELETE');
            expect(result.deleted).toBe(5);
        });

        it('выбрасывает ошибку при сбое', async () => {
            mockFetch.mockResolvedValue(mockErrorResponse(403));

            await expect(clearDlvryWebhookLogs()).rejects.toThrow('Ошибка очистки логов: 403');
        });
    });
});
