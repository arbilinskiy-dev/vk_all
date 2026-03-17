/**
 * Вкладка «Исходящие» — сводка, детализация, график,
 * таблица администраторов, таблица проектов.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import {
    MessageStatsGlobalSummary,
    MessageStatsChartPoint,
    MessageStatsProjectSummary,
    MessageStatsUserItem,
    AdminStatsItem,
    AdminDialogItem,
} from '../../../../services/api/messages_stats.api';
import { SummaryCard } from './MessageStatsHelpers';
import { MessageStatsChart } from './MessageStatsChart';
import { ProjectsStatsTable } from './ProjectsStatsTable';
import { AdminStatsTable } from './AdminStatsTable';
import { MonitoringChatUser } from './MonitoringChatPanel';
import type { DirectionFilter, StatsTab } from './messageStatsConstants';

interface OutgoingStatsTabProps {
    /** Отображаемая сводка */
    displaySummary: MessageStatsGlobalSummary;
    /** Данные графика */
    chartData: MessageStatsChartPoint[];
    /** Отфильтрованная статистика по проектам */
    filteredProjectsStats: MessageStatsProjectSummary[];
    /** ID выбранного проекта */
    selectedProjectId: string | null;
    /** Маппинг проектов */
    projectsMap: Map<string, Project>;
    /** Раскрытые проекты */
    expandedProjects: Set<string>;
    /** Данные пользователей */
    usersDataMap: Record<string, { users: MessageStatsUserItem[]; total: number; loading: boolean }>;
    /** Фильтр направления */
    directionFilter: DirectionFilter;
    /** Поиск по проектам */
    projectSearch: string;
    /** Активная вкладка */
    activeTab: StatsTab;
    /** Раскрыть/свернуть проект */
    toggleProjectExpand: (projectId: string) => void;
    /** Фильтр по проекту */
    handleProjectFilter: (projectId: string) => void;
    /** Поиск */
    setProjectSearch: (value: string) => void;
    /** Фильтрация пользователей по направлению */
    filterUsersByDirection: (users: MessageStatsUserItem[]) => MessageStatsUserItem[];
    /** Статистика администраторов */
    adminStats: AdminStatsItem[];
    /** Раскрытые администраторы */
    expandedAdmins: Set<string>;
    /** Диалоги администраторов */
    adminDialogsMap: Record<string, { dialogs: AdminDialogItem[]; loading: boolean }>;
    /** Раскрыть/свернуть администратора */
    toggleAdminExpand: (senderId: string) => void;
    /** Навигация в чат */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
    /** Выбор пользователя для панели чата */
    onSelectChatUser: (user: MonitoringChatUser) => void;
    /** Текущий пользователь в панели чата */
    activeChatUser: MonitoringChatUser | null;
}

export const OutgoingStatsTab: React.FC<OutgoingStatsTabProps> = ({
    displaySummary,
    chartData,
    filteredProjectsStats,
    selectedProjectId,
    projectsMap,
    expandedProjects,
    usersDataMap,
    directionFilter,
    projectSearch,
    activeTab,
    toggleProjectExpand,
    handleProjectFilter,
    setProjectSearch,
    filterUsersByDirection,
    adminStats,
    expandedAdmins,
    adminDialogsMap,
    toggleAdminExpand,
    onNavigateToChat,
    onSelectChatUser,
    activeChatUser,
}) => (
    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {/* --- Сводка исходящих --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Исходящих всего" value={displaySummary.total_outgoing} color="orange" />
            <SummaryCard label="Администратор" value={displaySummary.outgoing_system ?? 0} color="orange" />
            <SummaryCard label="Бот / рассылка" value={displaySummary.outgoing_bot ?? 0} color="indigo" />
            <SummaryCard label="Получателей" value={displaySummary.outgoing_recipients ?? 0} color="purple" />
        </div>

        {/* --- Детализация исходящих --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Уник. пользователей (исх.)</p>
                <p className="text-2xl font-bold text-orange-700">{(displaySummary.outgoing_users ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Уник. диалогов</p>
                <p className="text-2xl font-bold text-purple-600">{(displaySummary.unique_dialogs ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Проектов с исходящими</p>
                <p className="text-2xl font-bold text-indigo-600">{filteredProjectsStats.filter(p => p.total_outgoing > 0).length}</p>
            </div>
        </div>

        {/* --- График (только исходящие) --- */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                График исходящих
                {selectedProjectId && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        — {projectsMap.get(selectedProjectId)?.name || selectedProjectId}
                    </span>
                )}
            </h2>
            <MessageStatsChart
                data={chartData}
                visibleLines="outgoing"
                overlayMetrics={[
                    // Исходящие: детализация
                    { key: 'outgoing_system', label: 'Админ', total: displaySummary.outgoing_system ?? 0 },
                    { key: 'outgoing_bot', label: 'Бот/рассылка', total: displaySummary.outgoing_bot ?? 0 },
                    { key: 'outgoing_recipients', label: 'Получателей', total: displaySummary.outgoing_recipients ?? 0 },
                ]}
            />
        </div>

        {/* --- Таблица администраторов --- */}
        <AdminStatsTable
            adminStats={adminStats}
            expandedAdmins={expandedAdmins}
            adminDialogsMap={adminDialogsMap}
            projectsMap={projectsMap}
            toggleAdminExpand={toggleAdminExpand}
            onNavigateToChat={onNavigateToChat}
            onSelectChatUser={onSelectChatUser}
            activeChatUser={activeChatUser}
        />

        {/* --- Таблица проектов (акцент на исходящих) --- */}
        <ProjectsStatsTable
            filteredProjectsStats={filteredProjectsStats}
            projectsMap={projectsMap}
            expandedProjects={expandedProjects}
            usersDataMap={usersDataMap}
            selectedProjectId={selectedProjectId}
            directionFilter={directionFilter}
            projectSearch={projectSearch}
            activeTab={activeTab}
            toggleProjectExpand={toggleProjectExpand}
            handleProjectFilter={handleProjectFilter}
            setProjectSearch={setProjectSearch}
            filterUsersByDirection={filterUsersByDirection}
            onNavigateToChat={onNavigateToChat}
            onSelectChatUser={onSelectChatUser}
            activeChatUser={activeChatUser}
        />
    </div>
);
