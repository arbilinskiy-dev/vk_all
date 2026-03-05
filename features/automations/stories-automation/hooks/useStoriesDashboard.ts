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

            // Функциональный updater: проверяем ref в момент рендера (не диспатча),
            // чтобы stale-ответ от старого проекта не перезаписал данные нового
            if (currentProjectIdRef.current !== pid) return;
            setDashboardStats(prev => currentProjectIdRef.current !== pid ? prev : stats);
        } catch (error) {
            console.error('[STORIES] Ошибка загрузки статистики дашборда:', error);
        } finally {
            if (currentProjectIdRef.current === pid) setIsLoadingDashboard(false);
        }
    }, []); // Стабильная ссылка — projectId читается из ref

    /** Перезапрос дашборда с текущими фильтрами (после обновления статистики) */
    const refreshDashboard = useCallback(() => {
        const { periodType, filterType, customStartDate, customEndDate } = lastParamsRef.current;
        return loadDashboardStats(periodType, filterType, customStartDate, customEndDate);
    }, [loadDashboardStats]);

    // При смене проекта: НЕ сбрасываем dashboardStats в null.
    // Старые данные остаются видимыми пока новые не загрузятся — без мерцания карточек.
    // Перезагрузка запускается из dashboard/useStoriesDashboard через projectId в deps эффекта фильтров.

    return {
        dashboardStats,
        isLoadingDashboard,
        loadDashboardStats,
        refreshDashboard,
    };
};
