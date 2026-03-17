/**
 * Тесты для хука useUserActivityDashboard.
 * Проверяет загрузку данных, обработку ошибок, смену периода.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// --- Мок api ---
const mockGetUserActivityDashboard = vi.fn();
vi.mock('../../services/api', () => ({
    getUserActivityDashboard: (...args: any[]) => mockGetUserActivityDashboard(...args),
}));

import { useUserActivityDashboard } from '../../features/users/hooks/useUserActivityDashboard';

// --- Фикстура ---
const MOCK_RESPONSE = {
    summary: {
        total_active_users: 5,
        total_logins: 100,
        total_failed_logins: 2,
        total_timeouts: 3,
        total_force_logouts: 0,
        online_now: 1,
        avg_session_minutes: 30,
        period_days: 30,
    },
    user_stats: [],
    daily_chart: [],
    hourly_chart: [],
    events_chart: [],
    actions_summary: null,
    user_actions_stats: [],
    daily_actions: [],
};

describe('useUserActivityDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('загружает данные при монтировании', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(MOCK_RESPONSE);

        const { result } = renderHook(() => useUserActivityDashboard());

        // Начальное состояние
        expect(result.current.state.isLoading).toBe(true);
        expect(result.current.state.data).toBeNull();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.data).toEqual(MOCK_RESPONSE);
        expect(result.current.state.error).toBeNull();
        expect(mockGetUserActivityDashboard).toHaveBeenCalledWith({ period_days: 30 });
    });

    it('устанавливает ошибку при неудачной загрузке', async () => {
        mockGetUserActivityDashboard.mockRejectedValue(new Error('Сеть недоступна'));

        const { result } = renderHook(() => useUserActivityDashboard());

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.error).toBe('Сеть недоступна');
        expect(result.current.state.data).toBeNull();
    });

    it('обрабатывает non-Error ошибки', async () => {
        mockGetUserActivityDashboard.mockRejectedValue('строка-ошибка');

        const { result } = renderHook(() => useUserActivityDashboard());

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.error).toBe('Ошибка загрузки данных');
    });

    it('начальный periodDays = 30', () => {
        mockGetUserActivityDashboard.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useUserActivityDashboard());

        expect(result.current.state.periodDays).toBe(30);
    });

    it('смена периода перезапрашивает данные', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(MOCK_RESPONSE);

        const { result } = renderHook(() => useUserActivityDashboard());

        // Дождёмся первого вызова
        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(mockGetUserActivityDashboard).toHaveBeenCalledTimes(1);

        // Меняем период на 7 дней
        act(() => {
            result.current.actions.setPeriodDays(7);
        });

        await waitFor(() => {
            expect(mockGetUserActivityDashboard).toHaveBeenCalledTimes(2);
        });

        expect(mockGetUserActivityDashboard).toHaveBeenLastCalledWith({ period_days: 7 });
    });

    it('ручной fetchData перезагружает данные', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(MOCK_RESPONSE);

        const { result } = renderHook(() => useUserActivityDashboard());

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(mockGetUserActivityDashboard).toHaveBeenCalledTimes(1);

        // Ручной рефреш
        await act(async () => {
            await result.current.actions.fetchData();
        });

        expect(mockGetUserActivityDashboard).toHaveBeenCalledTimes(2);
    });

    it('возвращает объект с {state, actions}', () => {
        mockGetUserActivityDashboard.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useUserActivityDashboard());

        // Проверяем структуру
        expect(result.current).toHaveProperty('state');
        expect(result.current).toHaveProperty('actions');
        expect(result.current.state).toHaveProperty('data');
        expect(result.current.state).toHaveProperty('isLoading');
        expect(result.current.state).toHaveProperty('error');
        expect(result.current.state).toHaveProperty('periodDays');
        expect(result.current.actions).toHaveProperty('fetchData');
        expect(result.current.actions).toHaveProperty('setPeriodDays');
    });
});
