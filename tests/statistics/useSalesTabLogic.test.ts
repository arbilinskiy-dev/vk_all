/**
 * Тесты useSalesTabLogic — хук логики таба «Статистика продаж».
 * Мокаем useDlvryDailyStats и проверяем: пресеты, апплай дат,
 * тоглы колонок, подсчёт итогов, синхронизация.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Мок useDlvryDailyStats ─────────────────────────────────────────────────
const mockSetDateFrom = vi.fn();
const mockSetDateTo = vi.fn();
const mockSyncFromApi = vi.fn().mockResolvedValue(undefined);
const mockLoadMore = vi.fn();

const baseDlvryResult = {
    days: [],
    aggregated: null,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    totalCount: 0,
    isSyncing: false,
    error: null,
    lastSyncResult: null,
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    setDateFrom: mockSetDateFrom,
    setDateTo: mockSetDateTo,
    refresh: vi.fn(),
    loadMore: mockLoadMore,
    syncFromApi: mockSyncFromApi,
    fullSyncProgress: null,
    availableMonths: new Set<string>(),
};

const mockUseDlvryDailyStats = vi.fn(() => ({ ...baseDlvryResult }));

vi.mock('../../features/statistics/dlvry-stats/useDlvryDailyStats', () => ({
    useDlvryDailyStats: (...args: any[]) => mockUseDlvryDailyStats(...args),
}));

import { useSalesTabLogic } from '../../features/statistics/dlvry/useSalesTabLogic';

// =============================================================================
// Хелперы
// =============================================================================

function createAggregated(overrides = {}) {
    return {
        total_orders: 100,
        total_revenue: 50000,
        avg_check: 500,
        total_first_orders: 20,
        total_unique_clients: 50,
        total_canceled: 5,
        total_canceled_sum: 2000,
        total_cost: 10000,
        total_discount: 1000,
        total_first_orders_sum: 8000,
        total_first_orders_cost: 3000,
        total_count_payment_cash: 30,
        total_sum_cash: 15000,
        total_count_payment_card: 40,
        total_sum_card: 20000,
        total_count_payment_online: 30,
        total_sum_online_success: 14000,
        total_sum_online_fail: 1000,
        total_source_vkapp: 20,
        total_sum_source_vkapp: 10000,
        total_source_site: 30,
        total_sum_source_site: 15000,
        total_source_ios: 10,
        total_sum_source_ios: 5000,
        total_source_android: 15,
        total_sum_source_android: 7500,
        total_delivery_count: 50,
        total_delivery_sum: 5000,
        total_delivery_self_count: 25,
        total_delivery_self_sum: 0,
        total_repeat_order_2: 10,
        total_repeat_order_3: 5,
        total_repeat_order_4: 3,
        total_repeat_order_5: 1,
        ...overrides,
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('useSalesTabLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseDlvryDailyStats.mockReturnValue({ ...baseDlvryResult });
    });

    // ─── Инициализация ──────────────────────────────────────────────────
    it('вызывает useDlvryDailyStats с projectId и начальными датами', () => {
        renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(mockUseDlvryDailyStats).toHaveBeenCalledWith(
            expect.objectContaining({ projectId: 'proj-1' }),
        );
        // Начальные даты «Этот месяц»
        const args = mockUseDlvryDailyStats.mock.calls[0][0];
        expect(args.initialDateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(args.initialDateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('стартует с activePreset = this_month', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.activePreset).toBe('this_month');
    });

    it('стартует со всеми группами колонок включёнными', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        const groups = result.current.state.activeGroups;
        expect(groups.has('main')).toBe(true);
        expect(groups.has('finance')).toBe(true);
        expect(groups.has('payment')).toBe(true);
        expect(groups.has('sources')).toBe(true);
        expect(groups.has('delivery')).toBe(true);
        expect(groups.has('repeat')).toBe(true);
    });

    // ─── applyPreset ────────────────────────────────────────────────────
    it('applyPreset(today) ставит даты на сегодня', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        act(() => result.current.actions.applyPreset('today'));

        expect(result.current.state.activePreset).toBe('today');
        expect(mockSetDateFrom).toHaveBeenCalled();
        expect(mockSetDateTo).toHaveBeenCalled();
    });

    it('applyPreset(yesterday) ставит вчерашнюю дату', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        act(() => result.current.actions.applyPreset('yesterday'));

        expect(result.current.state.activePreset).toBe('yesterday');
        expect(mockSetDateFrom).toHaveBeenCalled();
    });

    it('applyPreset(null) сбрасывает даты', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        act(() => result.current.actions.applyPreset(null));

        expect(result.current.state.activePreset).toBeNull();
        expect(mockSetDateFrom).toHaveBeenCalledWith('');
        expect(mockSetDateTo).toHaveBeenCalledWith('');
    });

    it('applyPreset(custom) просто ставит пресет без изменения дат', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        // Сбрасываем моки после initial preset
        vi.clearAllMocks();

        act(() => result.current.actions.applyPreset('custom'));
        expect(result.current.state.activePreset).toBe('custom');
        // Даты не трогаются при custom
        expect(mockSetDateFrom).not.toHaveBeenCalled();
        expect(mockSetDateTo).not.toHaveBeenCalled();
    });

    it('applyPreset(year_month) вызывает applyYearMonth', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        vi.clearAllMocks();

        act(() => result.current.actions.applyPreset('year_month'));
        expect(result.current.state.activePreset).toBe('year_month');
        // При year_month должны вызваться setDateFrom/setDateTo для текущего года/месяца
        expect(mockSetDateFrom).toHaveBeenCalled();
        expect(mockSetDateTo).toHaveBeenCalled();
    });

    it('applyPreset(this_week) устанавливает диапазон от понедельника до сегодня', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        vi.clearAllMocks();

        act(() => result.current.actions.applyPreset('this_week'));
        expect(result.current.state.activePreset).toBe('this_week');
        expect(mockSetDateFrom).toHaveBeenCalled();
        expect(mockSetDateTo).toHaveBeenCalled();
    });

    it('applyPreset(this_year) устанавливает диапазон от 1 января до сегодня', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        vi.clearAllMocks();

        act(() => result.current.actions.applyPreset('this_year'));
        expect(result.current.state.activePreset).toBe('this_year');
        // Проверяем что dateFrom = YYYY-01-01
        const fromCall = mockSetDateFrom.mock.calls[0][0];
        expect(fromCall).toMatch(/-01-01$/);
    });

    // ─── toggleGroup ────────────────────────────────────────────────────
    it('toggleGroup выключает группу', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));

        act(() => result.current.actions.toggleGroup('finance'));
        expect(result.current.state.activeGroups.has('finance')).toBe(false);
    });

    it('toggleGroup включает группу обратно', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));

        act(() => result.current.actions.toggleGroup('finance')); // выкл
        act(() => result.current.actions.toggleGroup('finance')); // вкл
        expect(result.current.state.activeGroups.has('finance')).toBe(true);
    });

    it('toggleGroup не может выключить «main»', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));

        act(() => result.current.actions.toggleGroup('main'));
        // main всегда остаётся
        expect(result.current.state.activeGroups.has('main')).toBe(true);
    });

    // ─── totals ─────────────────────────────────────────────────────────
    it('totals = null если aggregated = null', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.totals).toBeNull();
    });

    it('totals вычисляет значения из aggregated', () => {
        mockUseDlvryDailyStats.mockReturnValue({
            ...baseDlvryResult,
            aggregated: createAggregated(),
        });
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));

        expect(result.current.state.totals).not.toBeNull();
        const t = result.current.state.totals!;
        expect(t.orders).toBe(100);
        expect(t.revenue).toBe(50000);
        expect(t.avg_check).toBe(500);
        expect(t.first_orders).toBe(20);
        expect(t.unique_clients).toBe(50);
        expect(t.canceled).toBe(5);
        expect(t.source_vkapp).toBe(20);
        expect(t.delivery_count).toBe(50);
        expect(t.repeat_order_2).toBe(10);
    });

    it('totals заменяет null-значения на 0', () => {
        mockUseDlvryDailyStats.mockReturnValue({
            ...baseDlvryResult,
            aggregated: createAggregated({ total_unique_clients: null, total_canceled: null }),
        });
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        const t = result.current.state.totals!;
        expect(t.unique_clients).toBe(0);
        expect(t.canceled).toBe(0);
    });

    // ─── handleSync / handleFullSync ────────────────────────────────────
    it('handleSync вызывает syncFromApi(false)', async () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        await act(async () => {
            await result.current.actions.handleSync();
        });
        expect(mockSyncFromApi).toHaveBeenCalledWith(false);
    });

    it('handleFullSync вызывает syncFromApi(true)', async () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        await act(async () => {
            await result.current.actions.handleFullSync();
        });
        expect(mockSyncFromApi).toHaveBeenCalledWith(true);
    });

    // ─── Прокидка стейта из useDlvryDailyStats ──────────────────────────
    it('прокидывает days из useDlvryDailyStats', () => {
        const mockDays = [{ date: '2026-01-01', orders_count: 5, revenue: 1000 }];
        mockUseDlvryDailyStats.mockReturnValue({ ...baseDlvryResult, days: mockDays });
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.days).toBe(mockDays);
    });

    it('прокидывает isLoading и error из useDlvryDailyStats', () => {
        mockUseDlvryDailyStats.mockReturnValue({
            ...baseDlvryResult,
            isLoading: true,
            error: 'Сетевая ошибка',
        });
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.isLoading).toBe(true);
        expect(result.current.state.error).toBe('Сетевая ошибка');
    });

    // ─── applyYearMonth ─────────────────────────────────────────────────
    it('applyYearMonth устанавливает даты для конкретного месяца', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        vi.clearAllMocks();

        act(() => result.current.actions.applyYearMonth(2025, 5)); // Июнь 2025
        expect(mockSetDateFrom).toHaveBeenCalledWith('2025-06-01');
        // to = конец июня (30 дней)
        expect(mockSetDateTo).toHaveBeenCalledWith('2025-06-30');
    });

    // ─── ymYear/ymMonth setters ─────────────────────────────────────────
    it('setYmYear обновляет год в стейте', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        act(() => result.current.actions.setYmYear(2024));
        expect(result.current.state.ymYear).toBe(2024);
    });

    it('setYmMonth обновляет месяц в стейте', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        act(() => result.current.actions.setYmMonth(11));
        expect(result.current.state.ymMonth).toBe(11);
    });

    // ─── yearDropdownOpen ───────────────────────────────────────────────
    it('setYearDropdownOpen переключает стейт дропдауна', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.yearDropdownOpen).toBe(false);

        act(() => result.current.actions.setYearDropdownOpen(true));
        expect(result.current.state.yearDropdownOpen).toBe(true);

        act(() => result.current.actions.setYearDropdownOpen(false));
        expect(result.current.state.yearDropdownOpen).toBe(false);
    });

    // ─── Рефы ───────────────────────────────────────────────────────────
    it('возвращает tableScrollRef и yearDropdownRef', () => {
        const { result } = renderHook(() => useSalesTabLogic({ projectId: 'proj-1' }));
        expect(result.current.state.tableScrollRef).toBeDefined();
        expect(result.current.state.yearDropdownRef).toBeDefined();
    });
});
