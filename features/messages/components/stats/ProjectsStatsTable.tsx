/**
 * Таблица проектов с раскрываемыми списками пользователей.
 * Поддерживает поиск, раскрытие проектов, фильтры по направлению,
 * ссылки в VK-диалог и переход в локальный чат.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import {
    MessageStatsProjectSummary,
    MessageStatsUserItem,
} from '../../../../services/api/messages_stats.api';
import { DirectionFilter, StatsTab, formatTs } from './messageStatsConstants';
import { ProjectAvatar, UserAvatar } from './MessageStatsHelpers';
import { MonitoringChatUser } from './MonitoringChatPanel';

interface ProjectsStatsTableProps {
    filteredProjectsStats: MessageStatsProjectSummary[];
    projectsMap: Map<string, Project>;
    expandedProjects: Set<string>;
    usersDataMap: Record<string, { users: MessageStatsUserItem[]; total: number; loading: boolean }>;
    selectedProjectId: string | null;
    directionFilter: DirectionFilter;
    projectSearch: string;
    /** Активная вкладка — определяет какие колонки показывать */
    activeTab?: StatsTab;
    toggleProjectExpand: (id: string) => void;
    handleProjectFilter: (id: string) => void;
    setProjectSearch: (s: string) => void;
    filterUsersByDirection: (users: MessageStatsUserItem[]) => MessageStatsUserItem[];
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
    /** Выбор пользователя для просмотра переписки в панели */
    onSelectChatUser?: (user: MonitoringChatUser) => void;
    /** Активный пользователь в панели чата */
    activeChatUser?: MonitoringChatUser | null;
}

export const ProjectsStatsTable: React.FC<ProjectsStatsTableProps> = ({
    filteredProjectsStats,
    projectsMap,
    expandedProjects,
    usersDataMap,
    selectedProjectId,
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
}) => {
    // Определяем видимость колонок по активной вкладке
    const showIncoming = activeTab !== 'outgoing';
    const showOutgoing = activeTab !== 'incoming';
    // Количество колонок для colSpan (базовых 3: стрелка, проект, диалоги, графика + видимые направления)
    const totalCols = 4 + (showIncoming ? 1 : 0) + (showOutgoing ? 1 : 0);
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Заголовок + поиск */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                    Проекты — {filteredProjectsStats.length}
                </h2>
                {/* Поле поиска по проектам */}
                <div className="relative w-full max-w-xs">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Поиск по проектам..."
                        className="w-full pl-9 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {projectSearch && (
                        <button
                            onClick={() => setProjectSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Очистить"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3 w-8"></th>
                            <th className="px-6 py-3">Проект</th>
                            {showIncoming && <th className="px-4 py-3 text-right">Входящих</th>}
                            {showOutgoing && <th className="px-4 py-3 text-right">Исходящих</th>}
                            <th className="px-4 py-3 text-right">Диалогов</th>
                            <th className="px-4 py-3 text-right">Графика</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredProjectsStats.length === 0 ? (
                            <tr>
                                <td colSpan={totalCols} className="px-6 py-8 text-center text-gray-400">
                                    {projectSearch ? 'Нет проектов по запросу' : 'Нет данных. Статистика начнёт собираться при получении сообщений.'}
                                </td>
                            </tr>
                        ) : (
                            filteredProjectsStats.map((ps, idx) => {
                                const proj = projectsMap.get(ps.project_id);
                                const isExpanded = expandedProjects.has(ps.project_id);
                                const isFiltered = selectedProjectId === ps.project_id;
                                const ud = usersDataMap[ps.project_id];

                                return (
                                    <React.Fragment key={ps.project_id}>
                                        {/* Строка проекта */}
                                        <tr
                                            className={`transition-colors opacity-0 animate-fade-in-up ${
                                                isExpanded ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                            }`}
                                            style={{ animationDelay: `${idx * 30}ms` }}
                                        >
                                            {/* Стрелка раскрытия */}
                                            <td className="px-3 py-4 w-8">
                                                <button
                                                    onClick={() => toggleProjectExpand(ps.project_id)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-transform duration-200"
                                                    title={isExpanded ? 'Свернуть' : 'Показать пользователей'}
                                                >
                                                    <svg
                                                        className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </td>
                                            {/* Название проекта */}
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => toggleProjectExpand(ps.project_id)}>
                                                <div className="flex items-center gap-3">
                                                    {proj?.avatar_url ? (
                                                        <ProjectAvatar url={proj.avatar_url} name={proj.name || ps.project_id} />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                                                            {(proj?.name || ps.project_id).slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {proj?.name || `Проект ${ps.project_id}`}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">ID: {ps.project_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {showIncoming && (
                                                <td className="px-4 py-4 text-right">
                                                    <p className="text-sm text-green-600 font-medium">{ps.total_incoming.toLocaleString()}</p>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                                                        <span title="Живые">{(ps.incoming_text ?? 0).toLocaleString()} жив.</span>
                                                        {' / '}
                                                        <span title="Кнопки">{(ps.incoming_payload ?? 0).toLocaleString()} кн.</span>
                                                    </div>
                                                </td>
                                            )}
                                            {showOutgoing && (
                                                <td className="px-4 py-4 text-right">
                                                    <p className="text-sm text-orange-600 font-medium">{ps.total_outgoing.toLocaleString()}</p>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                                                        <span title="Админ">{(ps.outgoing_system ?? 0).toLocaleString()} адм.</span>
                                                        {' / '}
                                                        <span title="Бот">{(ps.outgoing_bot ?? 0).toLocaleString()} бот</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-4 text-right text-sm text-indigo-600 font-medium">
                                                {(activeTab === 'incoming'
                                                    ? (ps.incoming_dialogs ?? 0)
                                                    : activeTab === 'outgoing'
                                                        ? (ps.unique_dialogs ?? 0)
                                                        : (ps.unique_dialogs ?? ps.unique_users ?? 0)
                                                ).toLocaleString()}
                                            </td>
                                            {/* Кнопка фильтрации графика */}
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() => handleProjectFilter(ps.project_id)}
                                                    className={`p-1 rounded transition-colors ${
                                                        isFiltered
                                                            ? 'text-indigo-600 bg-indigo-100'
                                                            : 'text-gray-400 hover:text-indigo-600'
                                                    }`}
                                                    title={isFiltered ? 'Убрать фильтр графика' : 'Фильтровать график по проекту'}
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Раскрытая панель пользователей */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={totalCols} className="p-0">
                                                    <div className="bg-gray-50 border-t border-gray-200 animate-expand-down">
                                                        {ud?.loading ? (
                                                            <div className="px-12 py-6 space-y-2">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                                                                ))}
                                                            </div>
                                                        ) : ud?.users.length === 0 ? (
                                                            <div className="px-12 py-6 text-center text-gray-400 text-sm">
                                                                Нет данных о пользователях
                                                            </div>
                                                        ) : (
                                                            <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-100">
                                                                            <th className="px-12 py-2 text-left">Пользователь</th>
                                                                            {showIncoming && <th className="px-4 py-2 text-right">Входящих</th>}
                                                                            {showOutgoing && <th className="px-4 py-2 text-right">Исходящих</th>}
                                                                            <th className="px-4 py-2 text-right">Последнее</th>
                                                                            <th className="px-6 py-2 text-right">Действия</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200">
                                                                        {filterUsersByDirection(ud?.users || []).filter((u, i, arr) => {
                                                                            // Дедупликация по vk_user_id (safety net)
                                                                            if (arr.findIndex(x => x.vk_user_id === u.vk_user_id) !== i) return false;
                                                                            // Фильтруем пользователей по активной вкладке:
                                                                            // на вкладке «Входящие» скрываем юзеров с 0 входящими
                                                                            // на вкладке «Исходящие» скрываем юзеров с 0 исходящими
                                                                            if (activeTab === 'incoming' && u.incoming_count === 0) return false;
                                                                            if (activeTab === 'outgoing' && u.outgoing_count === 0) return false;
                                                                            return true;
                                                                        }).map((u, uIdx) => (
                                                                            <tr
                                                                                key={u.vk_user_id}
                                                                                className="hover:bg-white transition-colors opacity-0 animate-fade-in-up"
                                                                                style={{ animationDelay: `${uIdx * 20}ms` }}
                                                                            >
                                                                                <td className="px-12 py-2.5">
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        {u.photo_url ? (
                                                                                            <UserAvatar url={u.photo_url} name={u.first_name || String(u.vk_user_id)} />
                                                                                        ) : (
                                                                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                                </svg>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="min-w-0">
                                                                                            <a
                                                                                                href={`https://vk.com/id${u.vk_user_id}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline truncate block"
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            >
                                                                                                {u.first_name || u.last_name
                                                                                                    ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                                                                                    : `id${u.vk_user_id}`
                                                                                                }
                                                                                            </a>
                                                                                            {(u.first_name || u.last_name) && (
                                                                                                <p className="text-xs text-gray-400 truncate">id{u.vk_user_id}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                {showIncoming && (
                                                                                    <td className="px-4 py-2.5 text-right text-sm text-green-600">
                                                                                        {u.incoming_count}
                                                                                    </td>
                                                                                )}
                                                                                {showOutgoing && (
                                                                                    <td className="px-4 py-2.5 text-right text-sm text-orange-600">
                                                                                        {u.outgoing_count}
                                                                                    </td>
                                                                                )}
                                                                                <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                                                                                    {formatTs(u.last_message_at)}
                                                                                </td>
                                                                                <td className="px-6 py-2.5 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        {/* Открыть диалог в VK (новая вкладка) */}
                                                                                        <a
                                                                                            href={`https://vk.com/gim${proj?.vkProjectId || ''}?sel=${u.vk_user_id}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-gray-400 hover:text-blue-600"
                                                                                            title="Открыть диалог в VK"
                                                                                            onClick={e => e.stopPropagation()}
                                                                                        >
                                                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                                            </svg>
                                                                                        </a>
                                                                                        {/* Посмотреть переписку в панели */}
                                                                                        {onSelectChatUser && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    onSelectChatUser({
                                                                                                        vkUserId: u.vk_user_id,
                                                                                                        projectId: ps.project_id,
                                                                                                        firstName: u.first_name,
                                                                                                        lastName: u.last_name,
                                                                                                        photoUrl: u.photo_url,
                                                                                                        groupId: proj?.vkProjectId || null,
                                                                                                    });
                                                                                                }}
                                                                                                className={`transition-colors ${
                                                                                                    activeChatUser?.vkUserId === u.vk_user_id && activeChatUser?.projectId === ps.project_id
                                                                                                        ? 'text-indigo-600'
                                                                                                        : 'text-gray-400 hover:text-indigo-600'
                                                                                                }`}
                                                                                                title="Посмотреть переписку"
                                                                                            >
                                                                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                                                </svg>
                                                                                            </button>
                                                                                        )}
                                                                                        {/* Перейти в полный чат (модуль сообщений) */}
                                                                                        {onNavigateToChat && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    onNavigateToChat(ps.project_id, u.vk_user_id);
                                                                                                }}
                                                                                                className="text-gray-400 hover:text-indigo-600"
                                                                                                title="Перейти в чат (полный интерфейс)"
                                                                                            >
                                                                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                                                </svg>
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                {/* Итого */}
                                                                {ud && ud.total > 50 && (
                                                                    <div className="px-12 py-2 text-xs text-gray-400 border-t border-gray-200">
                                                                        Показаны первые 50 из {ud.total} пользователей
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
