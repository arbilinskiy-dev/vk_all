/**
 * Таблица администраторов — мониторинг исходящих сообщений.
 * Показывает кто из админов сколько отправил сообщений и в сколько диалогов.
 * Раскрываемые строки — детализация диалогов конкретного администратора.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import { AdminStatsItem, AdminDialogItem } from '../../../../services/api/messages_stats.api';
import { UserAvatar } from './MessageStatsHelpers';
import { MonitoringChatUser } from './MonitoringChatPanel';

interface AdminStatsTableProps {
    adminStats: AdminStatsItem[];
    expandedAdmins: Set<number>;
    adminDialogsMap: Record<number, { dialogs: AdminDialogItem[]; loading: boolean }>;
    projectsMap: Map<string, Project>;
    toggleAdminExpand: (senderId: number) => void;
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
    /** Выбор пользователя для просмотра переписки в панели */
    onSelectChatUser?: (user: MonitoringChatUser) => void;
    /** Активный пользователь в панели чата */
    activeChatUser?: MonitoringChatUser | null;
}

export const AdminStatsTable: React.FC<AdminStatsTableProps> = ({
    adminStats,
    expandedAdmins,
    adminDialogsMap,
    projectsMap,
    toggleAdminExpand,
    onNavigateToChat,
    onSelectChatUser,
    activeChatUser,
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Заголовок */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">
                    Администраторы — {adminStats.length}
                </h2>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3 w-8"></th>
                            <th className="px-6 py-3">Администратор</th>
                            <th className="px-6 py-3 text-right">Отправлено</th>
                            <th className="px-6 py-3 text-right">Уник. диалогов</th>
                            <th className="px-6 py-3 text-right">Проектов</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {adminStats.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    <p className="text-sm">Нет данных по администраторам</p>
                                    <p className="text-xs mt-1">Статистика появится, когда менеджеры начнут отправлять сообщения через систему</p>
                                </td>
                            </tr>
                        ) : (
                        adminStats.map(admin => {
                            const isExpanded = expandedAdmins.has(admin.sender_id);
                            const dialogsData = adminDialogsMap[admin.sender_id];

                            return (
                                <React.Fragment key={admin.sender_id}>
                                    {/* Строка администратора */}
                                    <tr
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => toggleAdminExpand(admin.sender_id)}
                                    >
                                        <td className="px-6 py-3 text-center">
                                            <svg
                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-700">
                                                    {(admin.sender_name || 'A').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{admin.sender_name || `ID ${admin.sender_id}`}</p>
                                                    <p className="text-xs text-gray-400">id{admin.sender_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-sm font-semibold text-orange-600">{admin.messages_sent.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-sm text-gray-700">{admin.unique_dialogs.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-sm text-gray-500">{admin.projects_count}</span>
                                        </td>
                                    </tr>

                                    {/* Раскрытая детализация диалогов */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={5} className="px-0 py-0">
                                                <div className="bg-orange-50/50 border-t border-orange-100">
                                                    {dialogsData?.loading ? (
                                                        <div className="px-6 py-4 text-center text-sm text-gray-400">
                                                            <svg className="w-4 h-4 animate-spin inline-block mr-2" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                            Загрузка диалогов...
                                                        </div>
                                                    ) : dialogsData?.dialogs.length === 0 ? (
                                                        <div className="px-6 py-4 text-center text-sm text-gray-400">
                                                            Нет данных по диалогам
                                                        </div>
                                                    ) : (
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                    <th className="px-8 py-2">Пользователь</th>
                                                                    <th className="px-4 py-2">Проект</th>
                                                                    <th className="px-4 py-2 text-right">Сообщений</th>
                                                                    <th className="px-4 py-2 text-right">Действия</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-orange-100">
                                                                {dialogsData?.dialogs.map((d, idx) => {
                                                                    const proj = projectsMap.get(d.project_id);
                                                                    const userName = [d.first_name, d.last_name].filter(Boolean).join(' ') || `ID ${d.vk_user_id}`;
                                                                    return (
                                                                        <tr key={`${d.project_id}_${d.vk_user_id}_${idx}`} className="hover:bg-orange-50 transition-colors">
                                                                            <td className="px-8 py-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    {d.photo_url ? (
                                                                                        <UserAvatar url={d.photo_url} name={userName} />
                                                                                    ) : (
                                                                                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                                                                                            {userName.charAt(0)}
                                                                                        </div>
                                                                                    )}
                                                                                    <div>
                                                                                        <p className="text-sm text-gray-800">{userName}</p>
                                                                                        <p className="text-xs text-gray-400">id{d.vk_user_id}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <span className="text-xs text-gray-500">{proj?.name || d.project_id}</span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <span className="text-sm font-medium text-gray-700">{d.messages_sent}</span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    <a
                                                                                        href={`https://vk.com/gim${d.project_id}?sel=${d.vk_user_id}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                                                                        title="Открыть в VK"
                                                                                    >
                                                                                        VK
                                                                                    </a>
                                                                                    {onSelectChatUser && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const proj = projectsMap.get(d.project_id);
                                                                                                onSelectChatUser({
                                                                                                    vkUserId: d.vk_user_id,
                                                                                                    projectId: d.project_id,
                                                                                                    firstName: d.first_name,
                                                                                                    lastName: d.last_name,
                                                                                                    photoUrl: d.photo_url,
                                                                                                    groupId: proj?.vkProjectId || null,
                                                                                                });
                                                                                            }}
                                                                                            className={`text-xs transition-colors ${
                                                                                                activeChatUser?.vkUserId === d.vk_user_id && activeChatUser?.projectId === d.project_id
                                                                                                    ? 'text-indigo-600 font-medium'
                                                                                                    : 'text-gray-500 hover:text-indigo-700'
                                                                                            }`}
                                                                                            title="Посмотреть переписку"
                                                                                        >
                                                                                            Переписка
                                                                                        </button>
                                                                                    )}
                                                                                    {onNavigateToChat && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onNavigateToChat(d.project_id, d.vk_user_id);
                                                                                            }}
                                                                                            className="text-xs text-indigo-500 hover:text-indigo-700"
                                                                                            title="Перейти в чат"
                                                                                        >
                                                                                            Чат
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
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
