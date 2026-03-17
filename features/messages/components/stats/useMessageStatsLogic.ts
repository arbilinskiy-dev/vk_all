/**
 * Хаб-хук бизнес-логики страницы статистики сообщений.
 * Собирает 6 под-хуков и возвращает единый интерфейс { state, actions }.
 */

import { useState, useEffect, useCallback } from 'react';
import { Project } from '../../../../shared/types';
import {
    fetchMessageStatsSummary,
    fetchMessageStatsProjects,
    fetchMessageStatsChart,
    fetchAdminStats,
    MessageStatsGlobalSummary,
    MessageStatsProjectSummary,
    MessageStatsChartPoint,
    AdminStatsItem,
} from '../../../../services/api/messages_stats.api';
import { useStatsFilters } from './useStatsFilters';
import { useProjectUsersLogic } from './useProjectUsersLogic';
import { useSyncLogic } from './useSyncLogic';
import { useAdminsLogic } from './useAdminsLogic';
import { useSubscriptionsLogic } from './useSubscriptionsLogic';
import { useEmployeesLogic } from './useEmployeesLogic';

export function useMessageStatsLogic(projects: Project[]) {
    // --- Основные данные дашборда ---
    const [summary, setSummary] = useState<MessageStatsGlobalSummary | null>(null);
    const [projectsStats, setProjectsStats] = useState<MessageStatsProjectSummary[]>([]);
    const [chartData, setChartData] = useState<MessageStatsChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adminStats, setAdminStats] = useState<AdminStatsItem[]>([]);

    // --- Фильтры и вычисляемые данные ---
    const filters = useStatsFilters({ projects, projectsStats, chartData, summary });
    const { dateFrom, dateTo, selectedProjectId, projectSearch, activeTab, incomingSubFilter, projectsMap, directionFilter } = filters.state;

    // --- Загрузка данных дашборда ---
    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [summaryRes, projectsRes, chartRes, adminsRes] = await Promise.all([
                fetchMessageStatsSummary({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchMessageStatsProjects({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchMessageStatsChart({
                    projectId: selectedProjectId || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchAdminStats({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
            ]);
            setSummary(summaryRes);
            setProjectsStats(projectsRes.projects);
            setChartData(chartRes.chart);
            setAdminStats(adminsRes.admins || []);
        } catch (e: any) {
            setError(e.message || 'Ошибка загрузки статистики');
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, dateFrom, dateTo]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // --- Под-хуки по доменам ---
    const projectUsers = useProjectUsersLogic({ dateFrom, dateTo, activeTab, incomingSubFilter });
    const sync = useSyncLogic({ loadDashboard, dateFrom, dateTo });
    const admins = useAdminsLogic({ dateFrom, dateTo });
    const subscriptions = useSubscriptionsLogic({ dateFrom, dateTo, selectedProjectId, projectSearch, projectsMap, activeTab });
    const employees = useEmployeesLogic({ dateFrom, dateTo, adminStats, projectSearch, projectsMap });

    // --- Внешний контракт: { state, actions } — идентичный набор полей ---
    return {
        state: {
            summary,
            chartData,
            isLoading,
            error,
            periodType: filters.state.periodType,
            customStartDate: filters.state.customStartDate,
            customEndDate: filters.state.customEndDate,
            selectedProjectId,
            projectSearch,
            directionFilter,
            expandedProjects: projectUsers.state.expandedProjects,
            usersDataMap: projectUsers.state.usersDataMap,
            isSyncing: sync.state.isSyncing,
            syncResult: sync.state.syncResult,
            syncProgress: sync.state.syncProgress,
            isReconciling: sync.state.isReconciling,
            reconcileResult: sync.state.reconcileResult,
            reconcileProgress: sync.state.reconcileProgress,
            projectsMap,
            filteredProjectsStats: filters.state.filteredProjectsStats,
            displayProjectsStats: filters.state.displayProjectsStats,
            filteredChartData: filters.state.filteredChartData,
            incomingSubFilter,
            displaySummary: filters.state.displaySummary,
            adminStats,
            expandedAdmins: admins.state.expandedAdmins,
            adminDialogsMap: admins.state.adminDialogsMap,
            activeTab,
            // Подписки
            subsSummary: subscriptions.state.subsSummary,
            subsChart: subscriptions.state.subsChart,
            subsLoading: subscriptions.state.subsLoading,
            subsLoaded: subscriptions.state.subsLoaded,
            filteredSubsProjects: subscriptions.state.filteredSubsProjects,
            subsExpandedProjects: subscriptions.state.subsExpandedProjects,
            subsUsersMap: subscriptions.state.subsUsersMap,
            // Сотрудники
            selectedEmployeeName: employees.state.selectedEmployeeName,
            mergedAdminStats: employees.state.mergedAdminStats,
            employeeDialogs: employees.state.employeeDialogs,
            employeeLoading: employees.state.employeeLoading,
            employeeProjectsGrouped: employees.state.employeeProjectsGrouped,
            employeeSummary: employees.state.employeeSummary,
        },
        actions: {
            loadDashboard,
            setPeriodType: filters.actions.setPeriodType,
            setCustomStartDate: filters.actions.setCustomStartDate,
            setCustomEndDate: filters.actions.setCustomEndDate,
            setSelectedProjectId: filters.actions.setSelectedProjectId,
            setProjectSearch: filters.actions.setProjectSearch,
            toggleProjectExpand: projectUsers.actions.toggleProjectExpand,
            handleProjectFilter: filters.actions.handleProjectFilter,
            handleSyncFromLogs: sync.actions.handleSyncFromLogs,
            setSyncResult: sync.actions.setSyncResult,
            handleReconcile: sync.actions.handleReconcile,
            setReconcileResult: sync.actions.setReconcileResult,
            toggleDirectionFilter: filters.actions.toggleDirectionFilter,
            filterUsersByDirection: filters.actions.filterUsersByDirection,
            toggleAdminExpand: admins.actions.toggleAdminExpand,
            setActiveTab: filters.actions.setActiveTab,
            toggleIncomingSubFilter: filters.actions.toggleIncomingSubFilter,
            setIncomingSubFilter: filters.actions.setIncomingSubFilter,
            // Подписки
            loadSubscriptions: subscriptions.actions.loadSubscriptions,
            toggleSubsProjectExpand: subscriptions.actions.toggleSubsProjectExpand,
            // Сотрудники
            selectEmployee: employees.actions.selectEmployee,
        },
    };
}
