/**
 * Главная страница статистики сообщений.
 * Кросс-проектный дашборд с четырьмя вкладками:
 *   - «Входящие» — сводка, график, таблица проектов (фокус на входящих)
 *   - «Исходящие» — сводка, график, таблица администраторов + проектов (фокус на исходящих)
 *   - «Подписки» — подписки/отписки (message_allow / message_deny)
 *   - «Сотрудники» — диалоги конкретного сотрудника во всех проектах
 * Шапка, фильтры периода и панель чата — общие для всех вкладок.
 *
 * Hub-файл: импортирует хук и под-компоненты, контракт не изменён.
 */

import React, { useState, useCallback } from 'react';
import { Project } from '../../../../shared/types';
import { useMessageStatsLogic } from './useMessageStatsLogic';
import { MessageStatsSkeleton } from './MessageStatsSkeleton';
import { MonitoringChatPanel, MonitoringChatUser } from './MonitoringChatPanel';
import { MessageStatsHeader } from './MessageStatsHeader';
import { MessageStatsNotifications } from './MessageStatsNotifications';
import { MessageStatsTabBar } from './MessageStatsTabBar';
import { MessageStatsFilters } from './MessageStatsFilters';
import { IncomingStatsTab } from './IncomingStatsTab';
import { OutgoingStatsTab } from './OutgoingStatsTab';
import { SubscriptionsStatsTab } from './SubscriptionsStatsTab';
import { EmployeeStatsTab } from './EmployeeStatsTab';

interface MessageStatsPageProps {
    /** Список всех проектов (для маппинга project_id → название) */
    projects: Project[];
    /** Колбэк перехода в чат с пользователем */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
}

export const MessageStatsPage: React.FC<MessageStatsPageProps> = ({
    projects,
    onNavigateToChat,
}) => {
    const { state, actions } = useMessageStatsLogic(projects);

    // --- Состояние панели чата справа ---
    const [chatUser, setChatUser] = useState<MonitoringChatUser | null>(null);

    /** Выбрать пользователя для просмотра переписки в панели справа */
    const handleSelectChatUser = useCallback((user: MonitoringChatUser) => {
        setChatUser(prev => {
            // Если тот же пользователь — закрываем панель
            if (prev && prev.vkUserId === user.vkUserId && prev.projectId === user.projectId) {
                return null;
            }
            return user;
        });
    }, []);

    /** Закрыть панель чата */
    const handleCloseChatPanel = useCallback(() => {
        setChatUser(null);
    }, []);

    // --- Рендер: Скелетон ---
    if (state.isLoading && !state.summary) {
        return <MessageStatsSkeleton />;
    }

    // --- Рендер: Ошибка ---
    if (state.error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{state.error}</p>
                    <button
                        onClick={actions.loadDashboard}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Повторить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-gray-50">
            {/* === Основной контент (скроллится) === */}
            <div className={`h-full overflow-y-auto custom-scrollbar flex-1 min-w-0 transition-all duration-300 ${chatUser ? '' : ''}`}>
            <div className="max-w-7xl px-6 py-6 space-y-6">

                {/* === Заголовок + кнопки === */}
                <MessageStatsHeader
                    isReconciling={state.isReconciling}
                    isSyncing={state.isSyncing}
                    onReconcile={actions.handleReconcile}
                    onSyncFromLogs={actions.handleSyncFromLogs}
                    onRefresh={actions.loadDashboard}
                />

                {/* === Уведомления / прогресс-бары === */}
                <MessageStatsNotifications
                    syncProgress={state.syncProgress}
                    isSyncing={state.isSyncing}
                    syncResult={state.syncResult}
                    onClearSyncResult={() => actions.setSyncResult(null)}
                    reconcileProgress={state.reconcileProgress}
                    isReconciling={state.isReconciling}
                    reconcileResult={state.reconcileResult}
                    onClearReconcileResult={() => actions.setReconcileResult(null)}
                />

                {/* === Переключатель вкладок === */}
                <MessageStatsTabBar
                    activeTab={state.activeTab}
                    onTabChange={actions.setActiveTab}
                />

                {/* === Фильтры периода === */}
                <MessageStatsFilters
                    periodType={state.periodType}
                    onPeriodChange={actions.setPeriodType}
                    customStartDate={state.customStartDate}
                    customEndDate={state.customEndDate}
                    onCustomStartDateChange={actions.setCustomStartDate}
                    onCustomEndDateChange={actions.setCustomEndDate}
                    selectedProjectId={state.selectedProjectId}
                    projectsMap={state.projectsMap}
                    onClearProjectFilter={() => actions.setSelectedProjectId(null)}
                />

                {/* === ВКЛАДКА: ВХОДЯЩИЕ === */}
                {state.activeTab === 'incoming' && state.displaySummary && (
                    <IncomingStatsTab
                        displaySummary={state.displaySummary}
                        incomingSubFilter={state.incomingSubFilter}
                        setIncomingSubFilter={actions.setIncomingSubFilter}
                        toggleIncomingSubFilter={actions.toggleIncomingSubFilter}
                        filteredChartData={state.filteredChartData}
                        selectedProjectId={state.selectedProjectId}
                        projectsMap={state.projectsMap}
                        displayProjectsStats={state.displayProjectsStats}
                        expandedProjects={state.expandedProjects}
                        usersDataMap={state.usersDataMap}
                        directionFilter={state.directionFilter}
                        projectSearch={state.projectSearch}
                        activeTab={state.activeTab}
                        toggleProjectExpand={actions.toggleProjectExpand}
                        handleProjectFilter={actions.handleProjectFilter}
                        setProjectSearch={actions.setProjectSearch}
                        filterUsersByDirection={actions.filterUsersByDirection}
                        onNavigateToChat={onNavigateToChat}
                        onSelectChatUser={handleSelectChatUser}
                        activeChatUser={chatUser}
                    />
                )}

                {/* === ВКЛАДКА: ИСХОДЯЩИЕ === */}
                {state.activeTab === 'outgoing' && state.displaySummary && (
                    <OutgoingStatsTab
                        displaySummary={state.displaySummary}
                        chartData={state.chartData}
                        filteredProjectsStats={state.filteredProjectsStats}
                        selectedProjectId={state.selectedProjectId}
                        projectsMap={state.projectsMap}
                        expandedProjects={state.expandedProjects}
                        usersDataMap={state.usersDataMap}
                        directionFilter={state.directionFilter}
                        projectSearch={state.projectSearch}
                        activeTab={state.activeTab}
                        toggleProjectExpand={actions.toggleProjectExpand}
                        handleProjectFilter={actions.handleProjectFilter}
                        setProjectSearch={actions.setProjectSearch}
                        filterUsersByDirection={actions.filterUsersByDirection}
                        adminStats={state.adminStats}
                        expandedAdmins={state.expandedAdmins}
                        adminDialogsMap={state.adminDialogsMap}
                        toggleAdminExpand={actions.toggleAdminExpand}
                        onNavigateToChat={onNavigateToChat}
                        onSelectChatUser={handleSelectChatUser}
                        activeChatUser={chatUser}
                    />
                )}

                {/* === ВКЛАДКА: ПОДПИСКИ / ОТПИСКИ === */}
                {state.activeTab === 'subscriptions' && (
                    <SubscriptionsStatsTab
                        subsLoading={state.subsLoading}
                        subsSummary={state.subsSummary}
                        subsChart={state.subsChart}
                        selectedProjectId={state.selectedProjectId}
                        projectsMap={state.projectsMap}
                        filteredSubsProjects={state.filteredSubsProjects}
                        subsExpandedProjects={state.subsExpandedProjects}
                        subsUsersMap={state.subsUsersMap}
                        projectSearch={state.projectSearch}
                        setProjectSearch={actions.setProjectSearch}
                        toggleSubsProjectExpand={actions.toggleSubsProjectExpand}
                    />
                )}

                {/* === ВКЛАДКА: ДИАЛОГИ СОТРУДНИКОВ === */}
                {state.activeTab === 'employees' && (
                    <EmployeeStatsTab
                        mergedAdminStats={state.mergedAdminStats}
                        selectedEmployeeName={state.selectedEmployeeName}
                        employeeLoading={state.employeeLoading}
                        employeeProjectsGrouped={state.employeeProjectsGrouped}
                        employeeSummary={state.employeeSummary}
                        projectsMap={state.projectsMap}
                        selectEmployee={actions.selectEmployee}
                        onNavigateToChat={onNavigateToChat}
                        onSelectChatUser={handleSelectChatUser}
                        activeChatUser={chatUser}
                    />
                )}
            </div>
            </div>

            {/* === Панель чата справа (read-only превью переписки) === */}
            {chatUser && (
                <div className="w-[420px] h-full flex-shrink-0 border-l border-gray-200 animate-fade-in">
                    <MonitoringChatPanel
                        chatUser={chatUser}
                        projectsMap={state.projectsMap}
                        onClose={handleCloseChatPanel}
                        onNavigateToChat={onNavigateToChat}
                    />
                </div>
            )}
        </div>
    );
};
