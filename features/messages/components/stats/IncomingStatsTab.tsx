/**
 * Вкладка «Входящие» — сводка (сообщения / диалоги / юзеры),
 * график входящих, таблица проектов.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import {
    MessageStatsGlobalSummary,
    MessageStatsChartPoint,
    MessageStatsProjectSummary,
    MessageStatsUserItem,
} from '../../../../services/api/messages_stats.api';
import { SummaryCard } from './MessageStatsHelpers';
import { MessageStatsChart } from './MessageStatsChart';
import { ProjectsStatsTable } from './ProjectsStatsTable';
import { MonitoringChatUser } from './MonitoringChatPanel';
import type { IncomingSubFilter, DirectionFilter, StatsTab } from './messageStatsConstants';

interface IncomingStatsTabProps {
    /** Отображаемая сводка (с учётом фильтров) */
    displaySummary: MessageStatsGlobalSummary;
    /** Текущий суб-фильтр (all / text / payload) */
    incomingSubFilter: IncomingSubFilter;
    /** Установить суб-фильтр */
    setIncomingSubFilter: (value: IncomingSubFilter) => void;
    /** Переключить суб-фильтр */
    toggleIncomingSubFilter: (value: IncomingSubFilter) => void;
    /** Данные графика (отфильтрованные) */
    filteredChartData: MessageStatsChartPoint[];
    /** ID выбранного проекта */
    selectedProjectId: string | null;
    /** Маппинг проектов */
    projectsMap: Map<string, Project>;
    /** Статистика проектов для таблицы */
    displayProjectsStats: MessageStatsProjectSummary[];
    /** Раскрытые проекты */
    expandedProjects: Set<string>;
    /** Данные пользователей по проектам */
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
    /** Навигация в чат */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
    /** Выбор пользователя для панели чата */
    onSelectChatUser: (user: MonitoringChatUser) => void;
    /** Текущий пользователь в панели чата */
    activeChatUser: MonitoringChatUser | null;
}

export const IncomingStatsTab: React.FC<IncomingStatsTabProps> = ({
    displaySummary,
    incomingSubFilter,
    setIncomingSubFilter,
    toggleIncomingSubFilter,
    filteredChartData,
    selectedProjectId,
    projectsMap,
    displayProjectsStats,
    expandedProjects,
    usersDataMap,
    directionFilter,
    projectSearch,
    activeTab,
    toggleProjectExpand,
    handleProjectFilter,
    setProjectSearch,
    filterUsersByDirection,
    onNavigateToChat,
    onSelectChatUser,
    activeChatUser,
}) => (
    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {/* --- Блок 1: Сообщения --- */}
        <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Сообщения</h3>
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Всего входящих" value={displaySummary.total_incoming} color="green"
                    onClick={() => setIncomingSubFilter('all')} />
                <SummaryCard label="По кнопке / бот" value={displaySummary.incoming_payload ?? 0} color="indigo"
                    active={incomingSubFilter === 'payload'}
                    onClick={() => toggleIncomingSubFilter('payload')} />
                <SummaryCard label="Реальные (набранные)" value={(displaySummary as any).filtered_incoming_text ?? displaySummary.incoming_text ?? 0} color="green"
                    active={incomingSubFilter === 'text'}
                    onClick={() => toggleIncomingSubFilter('text')} />
            </div>
        </div>

        {/* --- Блок 2: Диалоги --- */}
        <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Диалоги</h3>
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Всего диалогов" value={displaySummary.incoming_dialogs ?? displaySummary.unique_dialogs ?? 0} color="purple"
                    onClick={() => setIncomingSubFilter('all')} />
                <SummaryCard label="С нажатием кнопки" value={displaySummary.dialogs_with_payload ?? 0} color="indigo"
                    active={incomingSubFilter === 'payload'}
                    onClick={() => toggleIncomingSubFilter('payload')} />
                <SummaryCard label="С реальными сообщ." value={displaySummary.dialogs_with_text ?? 0} color="green"
                    active={incomingSubFilter === 'text'}
                    onClick={() => toggleIncomingSubFilter('text')} />
            </div>
        </div>

        {/* --- Блок 3: Юзеры --- */}
        <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Пользователи</h3>
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Уник. юзеров всего" value={displaySummary.incoming_users ?? 0} color="purple"
                    onClick={() => setIncomingSubFilter('all')} />
                <SummaryCard label="Нажимали кнопки" value={displaySummary.unique_payload_users ?? 0} color="indigo"
                    active={incomingSubFilter === 'payload'}
                    onClick={() => toggleIncomingSubFilter('payload')} />
                <SummaryCard label="Отправляли сообщ." value={displaySummary.unique_text_users ?? 0} color="green"
                    active={incomingSubFilter === 'text'}
                    onClick={() => toggleIncomingSubFilter('text')} />
            </div>
        </div>

        {/* --- График (только входящие) --- */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                График входящих
                {incomingSubFilter !== 'all' && (
                    <span className="text-sm font-normal text-indigo-500 ml-2">
                        — {incomingSubFilter === 'text' ? 'реальные (набранные)' : 'по кнопке / бот'}
                    </span>
                )}
                {selectedProjectId && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        — {projectsMap.get(selectedProjectId)?.name || selectedProjectId}
                    </span>
                )}
            </h2>
            <MessageStatsChart
                data={filteredChartData}
                visibleLines="incoming"
                overlayMetrics={[
                    // Сообщения
                    { key: 'incoming_payload', label: 'Кнопка/бот', total: displaySummary.incoming_payload ?? 0 },
                    { key: 'incoming_text', label: 'Реальные', total: displaySummary.incoming_text ?? 0 },
                    // Диалоги
                    { key: 'incoming_dialogs', label: 'Диалогов', total: displaySummary.incoming_dialogs ?? displaySummary.unique_dialogs ?? 0 },
                    // Пользователи
                    { key: 'unique_users', label: 'Юзеров всего', total: displaySummary.incoming_users ?? 0 },
                    { key: 'unique_payload_users', label: 'Нажимали кнопки', total: displaySummary.unique_payload_users ?? 0 },
                    { key: 'unique_text_users', label: 'Отправляли сообщ.', total: displaySummary.unique_text_users ?? 0 },
                ]}
            />
        </div>

        {/* --- Таблица проектов (акцент на входящих) --- */}
        <ProjectsStatsTable
            filteredProjectsStats={displayProjectsStats}
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
