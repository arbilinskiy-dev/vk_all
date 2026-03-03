import React from 'react';
import { useStoriesDashboard } from './useStoriesDashboard';
import { DashboardFilters } from './DashboardFilters';
import { ViewsCard } from './ViewsCard';
import { BudgetCard } from './BudgetCard';
import { ClicksCard } from './ClicksCard';
import { ActivityCard } from './ActivityCard';
import { StoriesCountCard } from './StoriesCountCard';
import { ERViewCard } from './ERViewCard';
import { AveragesCard } from './AveragesCard';
import { DemographicsCard } from './DemographicsCard';
import { DashboardStats, ChartDataPoint, ViewersStats } from './types';

// Серверная статистика дашборда (включая демографию)
interface ServerDashboardStats extends DashboardStats {
    history: ChartDataPoint[];
    demographics?: ViewersStats;
}

interface StoriesDashboardProps {
    // Серверная агрегированная статистика
    dashboardStats: ServerDashboardStats | null;
    isLoadingDashboard: boolean;
    loadDashboardStats: (periodType?: string, filterType?: string, customStartDate?: string, customEndDate?: string) => void;
}

export const StoriesDashboard: React.FC<StoriesDashboardProps> = ({ 
    dashboardStats, isLoadingDashboard, loadDashboardStats
}) => {
    const {
        filterType, setFilterType,
        periodType, setPeriodType,
        customStartDate, setCustomStartDate,
        customEndDate, setCustomEndDate,
        viewersStats,
        getCardAnimationClass, getCardAnimationStyle,
    } = useStoriesDashboard({ demographics: dashboardStats?.demographics ?? null, loadDashboardStats });

    // Используем серверные данные для основной статистики
    const stats: DashboardStats = dashboardStats || {
        count: 0, views: 0, likes: 0, replies: 0, clicks: 0,
        shares: 0, subscribers: 0, hides: 0, msg: 0, ctr: 0, er: 0, moneySaved: 0,
        avgViews: 0, avgViewers: 0, minViewers: 0, maxViewers: 0
    };
    const history: ChartDataPoint[] = dashboardStats?.history || [];

    return (
        <div className="flex flex-col gap-6 mb-8">
            {/* Заголовок и Фильтры */}
            <DashboardFilters
                periodType={periodType}
                setPeriodType={setPeriodType}
                filterType={filterType}
                setFilterType={setFilterType}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />

            {/* БЕНТО-СЕТКА ГРАФИКОВ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. Сумма показов */}
                <ViewsCard stats={stats} history={history} animationClass={getCardAnimationClass(0)} animationStyle={getCardAnimationStyle(0)} />
                {/* 2. Эквивалент в рекламе */}
                <BudgetCard stats={stats} animationClass={getCardAnimationClass(100)} animationStyle={getCardAnimationStyle(100)} />
                {/* 3. Клики и CTR */}
                <ClicksCard stats={stats} history={history} animationClass={getCardAnimationClass(200)} animationStyle={getCardAnimationStyle(200)} />
                {/* 4. Активность */}
                <ActivityCard stats={stats} animationClass={getCardAnimationClass(300)} animationStyle={getCardAnimationStyle(300)} />
                {/* 5. Количество историй + Подписки/Скрытия */}
                <StoriesCountCard stats={stats} animationClass={getCardAnimationClass(350)} animationStyle={getCardAnimationStyle(350)} />
                {/* 6. Среднее просмотров/зрителей, мин/макс */}
                <AveragesCard stats={stats} animationClass={getCardAnimationClass(375)} animationStyle={getCardAnimationStyle(375)} />
                {/* 7. ER View */}
                <ERViewCard stats={stats} animationClass={getCardAnimationClass(425)} animationStyle={getCardAnimationStyle(425)} />
                {/* 8. Демография зрителей */}
                <DemographicsCard viewersStats={viewersStats} animationClass={getCardAnimationClass(475)} animationStyle={getCardAnimationStyle(475)} />
            </div>
        </div>
    );
};
