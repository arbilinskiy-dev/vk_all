import React, { useCallback } from 'react';
import { UnifiedStory } from '../types';
import { StoriesDashboard } from './dashboard/StoriesDashboard';
import { StoriesTable, UpdateMode } from './table/StoriesTable';
import { DashboardStats, ChartDataPoint, ViewersStats } from './dashboard/types';

// Серверная статистика дашборда (включая демографию)
interface ServerDashboardStats extends DashboardStats {
    history: ChartDataPoint[];
    demographics?: ViewersStats;
}

interface StoriesStatsViewProps {
    handleUpdateStats: (mode: 'single' | 'last_n' | 'period', params: any) => void;
    handleUpdateViewers: (mode: 'single' | 'last_n' | 'period', params: any) => void;
    handleUpdateAll: (mode: 'single' | 'last_n' | 'period', params: any) => void;
    updatingStatsId: string | null;
    loadStories: () => void;
    isLoadingStories: boolean;
    stories: UnifiedStory[];
    // Пагинация
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMoreStories: () => void;
    totalStories: number;
    // Дашборд с бэкенда
    dashboardStats: ServerDashboardStats | null;
    isLoadingDashboard: boolean;
    loadDashboardStats: (periodType?: string, filterType?: string, customStartDate?: string, customEndDate?: string) => void;
}

export const StoriesStatsView: React.FC<StoriesStatsViewProps> = ({
    handleUpdateStats, handleUpdateViewers, handleUpdateAll, updatingStatsId,
    loadStories, isLoadingStories,
    stories,
    hasMore, isLoadingMore, loadMoreStories, totalStories,
    dashboardStats, isLoadingDashboard, loadDashboardStats
}) => {
    // Обработчик пакетного обновления с учётом режима
    const handleBatchUpdate = useCallback((mode: 'last_n' | 'period', params: any, updateType?: UpdateMode) => {
        switch(updateType) {
            case 'viewers':
                handleUpdateViewers(mode, params);
                break;
            case 'all':
                handleUpdateAll(mode, params);
                break;
            default:
                handleUpdateStats(mode, params);
        }
    }, [handleUpdateStats, handleUpdateViewers, handleUpdateAll]);
    
    return (
        <div className="space-y-6">
            <StoriesDashboard 
                dashboardStats={dashboardStats}
                isLoadingDashboard={isLoadingDashboard}
                loadDashboardStats={loadDashboardStats}
            />
            <StoriesTable 
                stories={stories} 
                isLoading={isLoadingStories}
                updatingStatsId={updatingStatsId}
                onUpdateStats={handleUpdateStats}
                onUpdateViewers={handleUpdateViewers}
                onUpdateAll={handleUpdateAll}
                onLoadStories={loadStories}
                onBatchUpdate={handleBatchUpdate}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMoreStories}
                totalStories={totalStories}
            />
        </div>
    );
};
