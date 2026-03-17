import { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
import { ActivityDashboardResponse } from '../../../services/api/user_activity.api';

/**
 * Хук управления состоянием дашборда активности пользователей.
 * Паттерн { state, actions }.
 */
export function useUserActivityDashboard() {
    const [data, setData] = useState<ActivityDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [periodDays, setPeriodDays] = useState(30);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getUserActivityDashboard({ period_days: periodDays });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
        }
    }, [periodDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        state: { data, isLoading, error, periodDays },
        actions: { fetchData, setPeriodDays },
    };
}
