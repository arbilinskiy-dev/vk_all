/**
 * Тесты хука useDlvryOrders.
 * Проверяем: начальное состояние, загрузку данных, ошибки,
 * сброс при смене проекта, пагинацию, фильтрацию.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Моки API
const mockFetchOrders = vi.fn();
const mockFetchStats = vi.fn();

vi.mock('../../services/api/dlvry.api', () => ({
    fetchDlvryOrders: (...args: any[]) => mockFetchOrders(...args),
    fetchDlvryOrdersStats: (...args: any[]) => mockFetchStats(...args),
}));

import { useDlvryOrders } from '../../features/statistics/dlvry/useDlvryOrders';

// =============================================================================
// Фикстуры
// =============================================================================

function createMockOrdersResponse(overrides: any = {}) {
    return {
        orders: [
            {
                id: 1,
                dlvry_order_id: '100',
                affiliate_id: 'aff-1',
                order_date: '2026-03-01T10:00:00',
                client_name: 'Иван Иванов',
                client_phone: '+79001234567',
                total: 1500,
                payment_type: 'Онлайн',
                delivery_type: 'Доставка',
                source_name: 'VK Mini App',
                status: 'new',
                items_count: 3,
                created_at: '2026-03-01T10:00:00',
            },
        ],
        total: 1,
        skip: 0,
        limit: 25,
        ...overrides,
    };
}

function createMockStatsResponse(overrides: any = {}) {
    return {
        total_orders: 10,
        total_revenue: 15000,
        avg_check: 1500,
        orders_today: 2,
        revenue_today: 3000,
        orders_this_week: 7,
        revenue_this_week: 10500,
        orders_this_month: 10,
        revenue_this_month: 15000,
        top_sources: {},
        top_payment_types: {},
        top_delivery_types: {},
        ...overrides,
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('useDlvryOrders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Дефолтные успешные ответы
        mockFetchOrders.mockResolvedValue(createMockOrdersResponse());
        mockFetchStats.mockResolvedValue(createMockStatsResponse());
    });

    // ─────────────────────────────────────────────────────────────────────
    // Начальное состояние
    // ─────────────────────────────────────────────────────────────────────

    it('возвращает начальное состояние без projectId', () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: null }));

        expect(result.current.orders).toEqual([]);
        expect(result.current.stats).toBeNull();
        expect(result.current.total).toBe(0);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.page).toBe(0);
        expect(result.current.pageSize).toBe(25);
        expect(result.current.search).toBe('');
    });

    it('не вызывает API без projectId', () => {
        renderHook(() => useDlvryOrders({ projectId: null }));

        expect(mockFetchOrders).not.toHaveBeenCalled();
        expect(mockFetchStats).not.toHaveBeenCalled();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Загрузка данных
    // ─────────────────────────────────────────────────────────────────────

    it('загружает заказы при наличии projectId', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        // Начальное состояние — загрузка
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.orders).toHaveLength(1);
        expect(result.current.orders[0].client_name).toBe('Иван Иванов');
        expect(result.current.total).toBe(1);
    });

    it('загружает статистику при наличии projectId', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isStatsLoading).toBe(false);
        });

        expect(result.current.stats).not.toBeNull();
        expect(result.current.stats!.total_orders).toBe(10);
        expect(result.current.stats!.avg_check).toBe(1500);
    });

    it('передаёт project_id в фильтры API', async () => {
        renderHook(() => useDlvryOrders({ projectId: 'proj-42' }));

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalled();
        });

        const orderFilter = mockFetchOrders.mock.calls[0][0];
        expect(orderFilter.project_id).toBe('proj-42');
        expect(orderFilter.skip).toBe(0);
        expect(orderFilter.limit).toBe(25);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Обработка ошибок
    // ─────────────────────────────────────────────────────────────────────

    it('устанавливает ошибку при сбое загрузки заказов', async () => {
        mockFetchOrders.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.orders).toEqual([]);
    });

    it('обнуляет stats при сбое загрузки статистики', async () => {
        mockFetchStats.mockRejectedValue(new Error('Stats fail'));

        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isStatsLoading).toBe(false);
        });

        expect(result.current.stats).toBeNull();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Сброс при смене проекта
    // ─────────────────────────────────────────────────────────────────────

    it('сбрасывает состояние при смене проекта', async () => {
        const { result, rerender } = renderHook(
            ({ projectId }) => useDlvryOrders({ projectId }),
            { initialProps: { projectId: 'proj-1' as string | null } }
        );

        // Ждём загрузку данных
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.orders).toHaveLength(1);

        // Переключаемся на другой проект
        rerender({ projectId: 'proj-2' });

        // Данные должны сброситься
        // (сначала сработает useEffect сброса, потом загрузка новых)
        expect(result.current.page).toBe(0);
        expect(result.current.search).toBe('');
        expect(result.current.dateFrom).toBe('');
        expect(result.current.dateTo).toBe('');
    });

    it('очищает заказы при projectId = null', async () => {
        const { result, rerender } = renderHook(
            ({ projectId }) => useDlvryOrders({ projectId }),
            { initialProps: { projectId: 'proj-1' as string | null } }
        );

        await waitFor(() => {
            expect(result.current.orders).toHaveLength(1);
        });

        // Убираем проект
        rerender({ projectId: null });

        expect(result.current.orders).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Пагинация
    // ─────────────────────────────────────────────────────────────────────

    it('вызывает API с обновлённой страницей при setPage', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Меняем страницу
        act(() => {
            result.current.setPage(2);
        });

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalledTimes(2);
        });

        const lastCall = mockFetchOrders.mock.calls[1][0];
        expect(lastCall.skip).toBe(50); // page=2, pageSize=25 → skip=50
    });

    // ─────────────────────────────────────────────────────────────────────
    // Обновление (refresh)
    // ─────────────────────────────────────────────────────────────────────

    it('перезагружает данные при вызове refresh', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetchOrders).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalledTimes(2);
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Фильтрация
    // ─────────────────────────────────────────────────────────────────────

    it('передаёт search в фильтр API при setSearch', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.setSearch('Иванов');
        });

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalledTimes(2);
        });

        const lastCall = mockFetchOrders.mock.calls[1][0];
        expect(lastCall.search).toBe('Иванов');
    });

    it('передаёт даты в фильтры API', async () => {
        const { result } = renderHook(() => useDlvryOrders({ projectId: 'proj-1' }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.setDateFrom('2026-01-01');
            result.current.setDateTo('2026-03-01');
        });

        await waitFor(() => {
            // Минимум 2 дополнительных вызова (один на каждый setDate)
            expect(mockFetchOrders.mock.calls.length).toBeGreaterThanOrEqual(2);
        });

        const lastOrdersCall = mockFetchOrders.mock.calls[mockFetchOrders.mock.calls.length - 1][0];
        expect(lastOrdersCall.date_from).toBe('2026-01-01');
        expect(lastOrdersCall.date_to).toBe('2026-03-01');

        // Статистика тоже перезагружается с датами
        const lastStatsCall = mockFetchStats.mock.calls[mockFetchStats.mock.calls.length - 1][0];
        expect(lastStatsCall.date_from).toBe('2026-01-01');
        expect(lastStatsCall.date_to).toBe('2026-03-01');
    });
});
