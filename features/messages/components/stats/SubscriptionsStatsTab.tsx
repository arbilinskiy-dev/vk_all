/**
 * Вкладка «Подписки / Отписки» — лоадер, сводка,
 * график подписок/отписок, таблица проектов.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import {
    SubscriptionsSummary,
    SubscriptionsChartPoint,
    SubscriptionsProjectItem,
    SubscriptionUserItem,
} from '../../../../services/api/message_subscriptions.api';
import { SummaryCard } from './MessageStatsHelpers';
import { SubscriptionsChart } from './SubscriptionsChart';
import { SubscriptionsProjectsTable } from './SubscriptionsProjectsTable';

interface SubscriptionsStatsTabProps {
    /** Идёт загрузка данных подписок */
    subsLoading: boolean;
    /** Сводка подписок */
    subsSummary: SubscriptionsSummary | null;
    /** Данные графика подписок */
    subsChart: SubscriptionsChartPoint[];
    /** ID выбранного проекта */
    selectedProjectId: string | null;
    /** Маппинг проектов */
    projectsMap: Map<string, Project>;
    /** Отфильтрованные проекты подписок */
    filteredSubsProjects: SubscriptionsProjectItem[];
    /** Раскрытые проекты подписок */
    subsExpandedProjects: Set<string>;
    /** Пользователи подписок по проектам */
    subsUsersMap: Record<string, { users: SubscriptionUserItem[]; total: number; loading: boolean }>;
    /** Поиск по проектам */
    projectSearch: string;
    /** Установить поиск */
    setProjectSearch: (value: string) => void;
    /** Раскрыть/свернуть проект */
    toggleSubsProjectExpand: (projectId: string) => void;
}

export const SubscriptionsStatsTab: React.FC<SubscriptionsStatsTabProps> = ({
    subsLoading,
    subsSummary,
    subsChart,
    selectedProjectId,
    projectsMap,
    filteredSubsProjects,
    subsExpandedProjects,
    subsUsersMap,
    projectSearch,
    setProjectSearch,
    toggleSubsProjectExpand,
}) => (
    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {/* --- Лоадер ленивой загрузки --- */}
        {subsLoading && !subsSummary && (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm">Загрузка данных подписок...</span>
                </div>
            </div>
        )}

        {/* --- Сводка подписок --- */}
        {subsSummary && (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <SummaryCard label="Подписок (allow)" value={subsSummary.total_allow} color="green" />
                    <SummaryCard label="Отписок (deny)" value={subsSummary.total_deny} color="red" />
                </div>

                {/* --- График подписок/отписок --- */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        График подписок / отписок
                        {selectedProjectId && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                — {projectsMap.get(selectedProjectId)?.name || selectedProjectId}
                            </span>
                        )}
                    </h2>
                    <SubscriptionsChart data={subsChart} />
                </div>

                {/* --- Таблица проектов подписок --- */}
                <SubscriptionsProjectsTable
                    projects={filteredSubsProjects}
                    projectsMap={projectsMap}
                    expandedProjects={subsExpandedProjects}
                    usersMap={subsUsersMap}
                    projectSearch={projectSearch}
                    setProjectSearch={setProjectSearch}
                    toggleExpand={toggleSubsProjectExpand}
                />
            </>
        )}
    </div>
);
