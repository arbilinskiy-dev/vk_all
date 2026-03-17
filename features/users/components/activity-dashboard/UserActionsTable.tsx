import React from 'react';
import { UserActionStat } from '../../../../services/api/user_activity.api';
import { formatDate } from './utils';

// ==========================================
// Компонент: Таблица действий по пользователям
// ==========================================
export const UserActionsTable: React.FC<{ users: UserActionStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-6 text-sm">Нет данных</div>;

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full table-fixed">
                <thead className="bg-gray-50/80 sticky top-0">
                    <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2 text-left w-[22%]">Пользователь</th>
                        <th className="px-3 py-2 text-left w-[14%]">Роль</th>
                        <th className="px-3 py-2 text-center w-[10%]">Всего</th>
                        <th className="px-3 py-2 text-center w-[10%]">Посты</th>
                        <th className="px-3 py-2 text-center w-[10%]">Сообщения</th>
                        <th className="px-3 py-2 text-center w-[10%]">AI</th>
                        <th className="px-3 py-2 text-center w-[10%]">Товары</th>
                        <th className="px-3 py-2 text-left w-[14%]">Последнее</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map((u) => {
                        const catMap: Record<string, number> = {};
                        for (const c of (u.categories ?? [])) catMap[c.category] = c.count;

                        return (
                            <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-2.5 text-sm">
                                    <div className="font-medium text-gray-900">{u.full_name || u.username}</div>
                                    {u.full_name && <div className="text-xs text-gray-400">{u.username}</div>}
                                </td>
                                <td className="px-3 py-2.5">
                                    {u.role_name ? (
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: u.role_color || '#6b7280' }}
                                        >
                                            {u.role_name}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">—</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-sm font-bold text-indigo-600">{u.total_actions}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['posts'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['messages'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['ai'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['market'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(u.last_action_at)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
