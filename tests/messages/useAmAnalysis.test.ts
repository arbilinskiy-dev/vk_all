/**
 * Тесты: хук useAmAnalysis.
 * Проверяем:
 * — начальное состояние (isLoading=true)
 * — успешная загрузка данных → data, isLoading=false
 * — ошибка → error, isLoading=false
 * — переключение периода перезагружает данные
 * — refresh вызывает повторную загрузку
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Мокаем API
const mockGetDashboard = vi.fn();
vi.mock('../../services/api/am_analysis.api', () => ({
    getAmAnalysisDashboard: (...args: any[]) => mockGetDashboard(...args),
}));

import { useAmAnalysis } from '../../features/messages/hooks/stats/useAmAnalysis';

/** Фабрика мок-ответа */
function createMockResponse(overrides = {}) {
    return {
        summary: {
            total_actions: 10,
            active_users: 2,
            total_dialogs_read: 5,
            total_messages_sent: 3,
            total_labels_actions: 1,
            total_templates_actions: 1,
            period_days: 30,
        },
        user_stats: [],
        action_distribution: [],
        group_distribution: [],
        daily_chart: [],
        action_type_labels: {},
        ...overrides,
    };
}

describe('useAmAnalysis', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('начинает с isLoading=true', () => {
        mockGetDashboard.mockReturnValue(new Promise(() => {})); // never resolves
        const { result } = renderHook(() => useAmAnalysis());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('загружает данные и устанавливает data', async () => {
        const mockData = createMockResponse();
        mockGetDashboard.mockResolvedValue(mockData);

        const { result } = renderHook(() => useAmAnalysis());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
    });

    it('вызывает API с дефолтным периодом 30 дней', async () => {
        mockGetDashboard.mockResolvedValue(createMockResponse());

        const { result } = renderHook(() => useAmAnalysis());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetDashboard).toHaveBeenCalledWith({ period_days: 30 });
    });

    it('устанавливает error при ошибке', async () => {
        mockGetDashboard.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useAmAnalysis());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network Error');
        expect(result.current.data).toBeNull();
    });

    it('перезагружает при смене periodDays', async () => {
        mockGetDashboard.mockResolvedValue(createMockResponse());

        const { result } = renderHook(() => useAmAnalysis());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetDashboard).toHaveBeenCalledTimes(1);

        // Меняем период
        const mockData7 = createMockResponse({ summary: { ...createMockResponse().summary, period_days: 7 } });
        mockGetDashboard.mockResolvedValue(mockData7);

        act(() => {
            result.current.setPeriodDays(7);
        });

        await waitFor(() => {
            expect(mockGetDashboard).toHaveBeenCalledWith({ period_days: 7 });
        });
    });

    it('periodDays начинается с 30', () => {
        mockGetDashboard.mockReturnValue(new Promise(() => {}));
        const { result } = renderHook(() => useAmAnalysis());
        expect(result.current.periodDays).toBe(30);
    });

    it('refresh перезагружает данные', async () => {
        mockGetDashboard.mockResolvedValue(createMockResponse());

        const { result } = renderHook(() => useAmAnalysis());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetDashboard).toHaveBeenCalledTimes(1);

        // Вызываем refresh
        mockGetDashboard.mockResolvedValue(createMockResponse({ summary: { ...createMockResponse().summary, total_actions: 99 } }));

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.data?.summary.total_actions).toBe(99);
        });
    });
});
