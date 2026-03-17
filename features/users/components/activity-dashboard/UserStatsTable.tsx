import React from 'react';
import { UserActivityStat } from '../../../../services/api/user_activity.api';
import { formatMinutes, formatDate } from './utils';

// ==========================================
// Таблица пользователей (авторизация)
// ==========================================
export const UserStatsTable: React.FC<{ users: UserActivityStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Входов</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Неудачн.</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Таймаутов</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Сред. сессия</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Всего времени</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Сессий</th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последнее событие</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((u, i) => (
                        <tr key={u.user_id} className="hover:bg-gray-50 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                            <td className="px-3 py-2.5">
                                <div className="text-sm font-medium text-gray-800">{u.username}</div>
                                {u.full_name && <div className="text-xs text-gray-400">{u.full_name}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                {u.is_online ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Онлайн
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        Офлайн
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm font-semibold text-green-600">{u.login_count}</td>
                            <td className="px-3 py-2.5 text-center text-sm">
                                {u.failed_count > 0
                                    ? <span className="text-red-600 font-semibold">{u.failed_count}</span>
                                    : <span className="text-gray-300">0</span>
                                }
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm">
                                {u.timeout_count > 0
                                    ? <span className="text-amber-600 font-semibold">{u.timeout_count}</span>
                                    : <span className="text-gray-300">0</span>
                                }
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-600">{formatMinutes(u.avg_session_minutes)}</td>
                            <td className="px-3 py-2.5 text-center text-sm font-medium text-indigo-600">{formatMinutes(u.total_time_minutes)}</td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-500">{u.session_count}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(u.last_event_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
