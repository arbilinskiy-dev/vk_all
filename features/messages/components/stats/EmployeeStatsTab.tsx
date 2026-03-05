/**
 * Вкладка «Диалоги сотрудников» в мониторинге сообщений.
 * Позволяет выбрать сотрудника из списка и увидеть все проекты + диалоги,
 * в которых он отвечал за выбранный период.
 * Сводная статистика: отправлено сообщений, уникальных диалогов, проектов.
 */

import React, { useState, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import { AdminDialogItem } from '../../../../services/api/messages_stats.api';
import { SummaryCard, ProjectAvatar, UserAvatar } from './MessageStatsHelpers';
import { MonitoringChatUser } from './MonitoringChatPanel';

/** Объединённый сотрудник (несколько sender_id → одно имя) */
interface MergedAdmin {
    sender_name: string;
    sender_ids: string[];
    messages_sent: number;
    unique_dialogs: number;
    projects_count: number;
}

/** Проект с диалогами сотрудника (группировка) */
interface EmployeeProjectGroup {
    project_id: string;
    messages_sent: number;
    dialogs: AdminDialogItem[];
}

interface EmployeeStatsTabProps {
    /** Объединённый список сотрудников (сгруппированных по имени) */
    mergedAdminStats: MergedAdmin[];
    /** Выбранный сотрудник (по имени) */
    selectedEmployeeName: string | null;
    /** Загрузка диалогов */
    employeeLoading: boolean;
    /** Сгруппированные проекты с диалогами */
    employeeProjectsGrouped: EmployeeProjectGroup[];
    /** Сводка по выбранному сотруднику */
    employeeSummary: MergedAdmin | null;
    /** Маппинг project_id → Project */
    projectsMap: Map<string, Project>;
    /** Колбэк выбора сотрудника (по имени) */
    selectEmployee: (name: string | null) => void;
    /** Переход в чат */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
    /** Выбор пользователя для панели переписки */
    onSelectChatUser?: (user: MonitoringChatUser) => void;
    /** Активный пользователь в панели чата */
    activeChatUser?: MonitoringChatUser | null;
}

export const EmployeeStatsTab: React.FC<EmployeeStatsTabProps> = ({
    mergedAdminStats,
    selectedEmployeeName,
    employeeLoading,
    employeeProjectsGrouped,
    employeeSummary,
    projectsMap,
    selectEmployee,
    onNavigateToChat,
    onSelectChatUser,
    activeChatUser,
}) => {
    // Локальный поиск по сотрудникам
    const [employeeSearch, setEmployeeSearch] = useState('');

    // Раскрытые проекты
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // Фильтрация списка сотрудников по поиску
    const filteredAdmins = useMemo(() => {
        if (!employeeSearch.trim()) return mergedAdminStats;
        const q = employeeSearch.toLowerCase().trim();
        return mergedAdminStats.filter(a => {
            const name = a.sender_name.toLowerCase();
            return name.includes(q);
        });
    }, [mergedAdminStats, employeeSearch]);

    /** Переключение раскрытия проекта */
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    // Общая статистика по диалогам (считаем из данных)
    const totalDialogs = useMemo(() => {
        return employeeProjectsGrouped.reduce((sum, p) => sum + p.dialogs.length, 0);
    }, [employeeProjectsGrouped]);

    const totalMessages = useMemo(() => {
        return employeeProjectsGrouped.reduce((sum, p) => sum + p.messages_sent, 0);
    }, [employeeProjectsGrouped]);

    return (
        <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            {/* === Выбор сотрудника === */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Выберите сотрудника
                            </h2>
                            <span className="text-sm text-gray-400">— {mergedAdminStats.length} чел.</span>
                        </div>
                        {/* Поиск по сотрудникам */}
                        <div className="relative w-full max-w-xs">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={e => setEmployeeSearch(e.target.value)}
                                placeholder="Поиск по сотрудникам..."
                                className="w-full pl-9 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            {employeeSearch && (
                                <button
                                    onClick={() => setEmployeeSearch('')}
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
                </div>

                {/* Список сотрудников — горизонтальный скролл-список */}
                {mergedAdminStats.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-400">
                        <p className="text-sm">Нет данных по сотрудникам</p>
                        <p className="text-xs mt-1">Статистика появится, когда менеджеры начнут отправлять сообщения через систему</p>
                    </div>
                ) : (
                    <div className="px-6 py-4 flex flex-wrap gap-2">
                        {filteredAdmins.map(admin => {
                            const isSelected = selectedEmployeeName === admin.sender_name;
                            return (
                                <button
                                    key={admin.sender_name}
                                    onClick={() => selectEmployee(admin.sender_name)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-100 text-purple-700 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    {/* Аватар-инициал */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                        isSelected ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {admin.sender_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium leading-tight">{admin.sender_name}</p>
                                        <p className="text-[10px] text-gray-400 leading-tight">
                                            {admin.messages_sent} сообщ. · {admin.unique_dialogs} диалог. · {admin.projects_count} проект.
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-purple-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                        {filteredAdmins.length === 0 && employeeSearch && (
                            <p className="text-sm text-gray-400 py-2">Нет сотрудников по запросу «{employeeSearch}»</p>
                        )}
                    </div>
                )}
            </div>

            {/* === Сводка выбранного сотрудника === */}
            {selectedEmployeeName !== null && employeeSummary && !employeeLoading && (
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard
                        label="Отправлено сообщений"
                        value={totalMessages}
                        color="purple"
                    />
                    <SummaryCard
                        label="Уник. диалогов"
                        value={totalDialogs}
                        color="orange"
                    />
                    <SummaryCard
                        label="Проектов"
                        value={employeeProjectsGrouped.length}
                        color="indigo"
                    />
                </div>
            )}

            {/* === Лоадер === */}
            {employeeLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-gray-400">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm">Загрузка диалогов сотрудника...</span>
                    </div>
                </div>
            )}

            {/* === Пустое состояние (не выбран сотрудник) === */}
            {selectedEmployeeName === null && mergedAdminStats.length > 0 && (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <p className="text-gray-400 text-sm">Выберите сотрудника выше, чтобы увидеть его диалоги</p>
                    </div>
                </div>
            )}

            {/* === Таблица проектов + диалогов === */}
            {selectedEmployeeName !== null && !employeeLoading && employeeProjectsGrouped.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                            Проекты — {employeeProjectsGrouped.length}
                        </h2>
                        <span className="text-sm text-gray-400">
                            {selectedEmployeeName}
                        </span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3 w-8"></th>
                                    <th className="px-6 py-3">Проект</th>
                                    <th className="px-4 py-3 text-right">Отправлено</th>
                                    <th className="px-4 py-3 text-right">Диалогов</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {employeeProjectsGrouped.map((pg, idx) => {
                                    const proj = projectsMap.get(pg.project_id);
                                    const isExpanded = expandedProjects.has(pg.project_id);

                                    return (
                                        <React.Fragment key={pg.project_id}>
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
                                                        onClick={() => toggleProject(pg.project_id)}
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
                                                <td className="px-6 py-4 cursor-pointer" onClick={() => toggleProject(pg.project_id)}>
                                                    <div className="flex items-center gap-3">
                                                        {proj?.avatar_url ? (
                                                            <ProjectAvatar url={proj.avatar_url} name={proj.name || pg.project_id} />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                                                                {(proj?.name || pg.project_id).slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {proj?.name || `Проект ${pg.project_id}`}
                                                            </p>
                                                            <p className="text-xs text-gray-400 truncate">ID: {pg.project_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Отправлено */}
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-sm font-medium text-purple-600">{pg.messages_sent.toLocaleString()}</span>
                                                </td>
                                                {/* Диалогов */}
                                                <td className="px-4 py-4 text-right text-sm text-indigo-600 font-medium">
                                                    {pg.dialogs.length.toLocaleString()}
                                                </td>
                                            </tr>

                                            {/* Раскрытая панель пользователей */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} className="p-0">
                                                        <div className="bg-gray-50 border-t border-gray-200 animate-expand-down">
                                                            <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="text-xs font-medium text-gray-500 uppercase bg-gray-100">
                                                                            <th className="px-12 py-2 text-left">Пользователь</th>
                                                                            <th className="px-4 py-2 text-right">Сообщений</th>
                                                                            <th className="px-6 py-2 text-right">Действия</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200">
                                                                        {pg.dialogs.map((d, dIdx) => {
                                                                            const userName = [d.first_name, d.last_name].filter(Boolean).join(' ') || `id${d.vk_user_id}`;
                                                                            return (
                                                                                <tr
                                                                                    key={`${d.project_id}_${d.vk_user_id}_${dIdx}`}
                                                                                    className="hover:bg-white transition-colors opacity-0 animate-fade-in-up"
                                                                                    style={{ animationDelay: `${dIdx * 20}ms` }}
                                                                                >
                                                                                    <td className="px-12 py-2.5">
                                                                                        <div className="flex items-center gap-2.5">
                                                                                            {d.photo_url ? (
                                                                                                <UserAvatar url={d.photo_url} name={userName} />
                                                                                            ) : (
                                                                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                                                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                                    </svg>
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="min-w-0">
                                                                                                <a
                                                                                                    href={`https://vk.com/id${d.vk_user_id}`}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline truncate block"
                                                                                                    onClick={e => e.stopPropagation()}
                                                                                                >
                                                                                                    {userName}
                                                                                                </a>
                                                                                                {(d.first_name || d.last_name) && (
                                                                                                    <p className="text-xs text-gray-400 truncate">id{d.vk_user_id}</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-right text-sm text-purple-600">
                                                                                        {d.messages_sent}
                                                                                    </td>
                                                                                    <td className="px-6 py-2.5 text-right">
                                                                                        <div className="flex items-center justify-end gap-1">
                                                                                            {/* Открыть диалог в VK */}
                                                                                            <a
                                                                                                href={`https://vk.com/gim${proj?.vkProjectId || d.project_id}?sel=${d.vk_user_id}`}
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
                                                                                                            vkUserId: d.vk_user_id,
                                                                                                            projectId: d.project_id,
                                                                                                            firstName: d.first_name,
                                                                                                            lastName: d.last_name,
                                                                                                            photoUrl: d.photo_url,
                                                                                                            groupId: proj?.vkProjectId || null,
                                                                                                        });
                                                                                                    }}
                                                                                                    className={`transition-colors ${
                                                                                                        activeChatUser?.vkUserId === d.vk_user_id && activeChatUser?.projectId === d.project_id
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
                                                                                            {/* Перейти в полный чат */}
                                                                                            {onNavigateToChat && (
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        onNavigateToChat(d.project_id, d.vk_user_id);
                                                                                                    }}
                                                                                                    className="text-gray-400 hover:text-indigo-600"
                                                                                                    title="Перейти в чат"
                                                                                                >
                                                                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                                                    </svg>
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Пустые данные при выбранном сотруднике */}
            {selectedEmployeeName !== null && !employeeLoading && employeeProjectsGrouped.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-400 text-sm">У сотрудника нет диалогов за выбранный период</p>
                    </div>
                </div>
            )}
        </div>
    );
};
