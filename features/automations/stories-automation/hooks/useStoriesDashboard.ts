import { useState, useCallback, useRef } from 'react';
import { callApi } from '../../../../shared/utils/apiClient';
import { DashboardStats, ChartDataPoint, ViewersStats } from '../components/dashboard/types';

// Ответ от бэкенда для дашборда (включая демографию зрителей)
interface ServerDashboardStats extends DashboardStats {
    history: ChartDataPoint[];
    demographics?: ViewersStats;
}

/**
 * Хук загрузки агрегированной статистики для дашборда.
 */
export const useStoriesDashboard = (projectId?: string) => {
    const [dashboardStats, setDashboardStats] = useState<ServerDashboardStats | null>(null);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

    // Ref для отслеживания текущего projectId
    const currentProjectIdRef = useRef<string | undefined>(projectId);
    if (projectId !== currentProjectIdRef.current) {
        currentProjectIdRef.current = projectId;
    }

    // Ref для запоминания последних параметров фильтров (для refreshDashboard)
    const lastParamsRef = useRef<{ periodType: string; filterType: string; customStartDate?: string; customEndDate?: string }>({
        periodType: 'all',
        filterType: 'all',
    });

    /** Загрузка статистики дашборда с фильтрами */
    const loadDashboardStats = useCallback(async (
        periodType: string = 'all',
        filterType: string = 'all',
        customStartDate?: string,
        customEndDate?: string
    ) => {
        const pid = currentProjectIdRef.current;
        if (!pid) return;

        // Запоминаем последние параметры для refreshDashboard
        lastParamsRef.current = { periodType, filterType, customStartDate, customEndDate };

        setIsLoadingDashboard(true);
        try {
            const stats = await callApi<ServerDashboardStats>('getStoriesDashboardStats', {
                projectId: pid,
                periodType,
                filterType,
                customStartDate: customStartDate || undefined,
                customEndDate: customEndDate || undefined,
            });

            if (currentProjectIdRef.current !== pid) return;

            setDashboardStats(stats);
        } catch (error) {
            console.error('[STORIES] Ошибка загрузки статистики дашборда:', error);
        } finally {
            setIsLoadingDashboard(false);
        }
    }, []); // Стабильная ссылка — projectId читается из ref

    /** Перезапрос дашборда с текущими фильтрами (после обновления статистики) */
    const refreshDashboard = useCallback(() => {
        const { periodType, filterType, customStartDate, customEndDate } = lastParamsRef.current;
        return loadDashboardStats(periodType, filterType, customStartDate, customEndDate);
    }, [loadDashboardStats]);

    return {
        dashboardStats,
        isLoadingDashboard,
        loadDashboardStats,
        refreshDashboard,
    };
};
