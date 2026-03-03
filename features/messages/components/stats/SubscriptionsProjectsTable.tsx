/**
 * Таблица проектов с подписками/отписками.
 * Раскрывающиеся строки с ленивой загрузкой пользователей.
 * Переиспользует визуальный паттерн ProjectsStatsTable.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import { SubscriptionsProjectItem, SubscriptionUserItem } from '../../../../services/api/message_subscriptions.api';
import { formatTs } from './messageStatsConstants';

interface SubscriptionsProjectsTableProps {
    projects: SubscriptionsProjectItem[];
    projectsMap: Map<string, Project>;
    expandedProjects: Set<string>;
    usersMap: Record<string, { users: SubscriptionUserItem[]; total: number; loading: boolean }>;
    projectSearch: string;
    setProjectSearch: (v: string) => void;
    toggleExpand: (projectId: string) => void;
}

export const SubscriptionsProjectsTable: React.FC<SubscriptionsProjectsTableProps> = ({
    projects,
    projectsMap,
    expandedProjects,
    usersMap,
    projectSearch,
    setProjectSearch,
    toggleExpand,
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Заголовок + поиск */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                    По проектам
                    <span className="text-sm font-normal text-gray-400 ml-2">
                        ({projects.length})
                    </span>
                </h3>
                <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Поиск проекта..."
                    className="w-full sm:w-56 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
            </div>

            {/* Шапка таблицы */}
            <div className="grid grid-cols-[1fr_100px_100px_80px] gap-2 px-5 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <div>Проект</div>
                <div className="text-center">Подписок</div>
                <div className="text-center">Отписок</div>
                <div className="text-center">Юзеров</div>
            </div>

            {/* Строки */}
            {projects.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                    Нет данных за выбранный период
                </div>
            )}
            
            {projects.map(ps => {
                const proj = projectsMap.get(ps.project_id);
                const isExpanded = expandedProjects.has(ps.project_id);
                const userData = usersMap[ps.project_id];

                return (
                    <div key={ps.project_id} className="border-b border-gray-50 last:border-b-0">
                        {/* Строка проекта */}
                        <div
                            className="grid grid-cols-[1fr_100px_100px_80px] gap-2 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                            onClick={() => toggleExpand(ps.project_id)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Стрелка раскрытия */}
                                <svg
                                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {proj?.name || ps.project_id}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        всего: {ps.total}
                                    </p>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-semibold text-green-600">
                                    +{ps.allow_count}
                                </span>
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-semibold text-red-600">
                                    −{ps.deny_count}
                                </span>
                            </div>
                            <div className="text-center text-sm text-gray-600">
                                {ps.unique_users}
                            </div>
                        </div>

                        {/* Раскрытый список пользователей */}
                        {isExpanded && (
                            <div className="bg-blue-50/30 border-t border-blue-100">
                                {userData?.loading && (
                                    <div className="px-8 py-4 text-sm text-gray-400 animate-pulse">
                                        Загрузка пользователей...
                                    </div>
                                )}
                                {userData && !userData.loading && userData.users.length === 0 && (
                                    <div className="px-8 py-4 text-sm text-gray-400">
                                        Нет данных о пользователях
                                    </div>
                                )}
                                {userData && !userData.loading && userData.users.length > 0 && (
                                    <div className="px-8 py-2">
                                        {/* Шапка подтаблицы */}
                                        <div className="grid grid-cols-[1fr_80px_80px_120px_90px] gap-2 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            <div>Пользователь</div>
                                            <div className="text-center">Подпис.</div>
                                            <div className="text-center">Отпис.</div>
                                            <div className="text-center">Посл. событие</div>
                                            <div className="text-center">Статус</div>
                                        </div>
                                        {userData.users.map(user => (
                                            <div
                                                key={user.vk_user_id}
                                                className="grid grid-cols-[1fr_80px_80px_120px_90px] gap-2 py-2 border-t border-blue-100/50 items-center"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <a
                                                        href={`https://vk.com/id${user.vk_user_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline truncate"
                                                        title={`VK ID: ${user.vk_user_id}`}
                                                    >
                                                        id{user.vk_user_id}
                                                    </a>
                                                </div>
                                                <div className="text-center text-sm font-medium text-green-600">
                                                    {user.allow_count > 0 ? `+${user.allow_count}` : '—'}
                                                </div>
                                                <div className="text-center text-sm font-medium text-red-600">
                                                    {user.deny_count > 0 ? `−${user.deny_count}` : '—'}
                                                </div>
                                                <div className="text-center text-xs text-gray-500">
                                                    {formatTs(user.last_event_at)}
                                                </div>
                                                <div className="text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        user.last_event_type === 'allow'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            user.last_event_type === 'allow' ? 'bg-green-500' : 'bg-red-500'
                                                        }`} />
                                                        {user.last_event_type === 'allow' ? 'Подписан' : 'Отписан'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {userData.total > userData.users.length && (
                                            <div className="py-2 text-center text-xs text-gray-400">
                                                Показано {userData.users.length} из {userData.total}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
