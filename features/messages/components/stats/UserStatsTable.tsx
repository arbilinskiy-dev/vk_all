/**
 * Таблица действий сотрудников.
 * Используется на странице «АМ Анализ».
 */

import React from 'react';
import { AmUserStat } from '../../../../services/api/am_analysis.api';
import { formatDate } from './amAnalysisUtils';

export const UserStatsTable: React.FC<{ users: AmUserStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 text-left">
                        <th className="py-2 px-3 font-semibold text-gray-600">Сотрудник</th>
                        <th className="py-2 px-3 font-semibold text-gray-600">Роль</th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">Всего</th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Входы в диалоги">💬 Входы</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Прочтение непрочитанных диалогов">📖 Прочтения</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Отправка сообщений">💬 Отправлено</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Пометка как непрочитанное">🔕 Непрочит.</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Пометка как важное">⭐ Важное</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с метками">🏷️ Метки</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с шаблонами">📝 Шаблоны</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с промокодами">🎟️ Промо</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">Последнее</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-3">
                                <div className="font-medium text-gray-800">
                                    {u.full_name || u.username}
                                </div>
                                {u.full_name && (
                                    <div className="text-xs text-gray-400">@{u.username}</div>
                                )}
                            </td>
                            <td className="py-2 px-3">
                                {u.role_name ? (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: u.role_color ? `${u.role_color}20` : '#f3f4f6',
                                            color: u.role_color || '#6b7280',
                                            border: `1px solid ${u.role_color || '#d1d5db'}30`,
                                        }}
                                    >
                                        {u.role_name}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-gray-800">{u.total_actions}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-medium">{u.dialogs_read || '—'}</td>
                            <td className="py-2 px-3 text-right text-blue-600 font-medium">{u.unread_dialogs_read || '—'}</td>
                            <td className="py-2 px-3 text-right text-cyan-600 font-medium">{u.messages_sent || '—'}</td>
                            <td className="py-2 px-3 text-right text-gray-500">{u.mark_unread || '—'}</td>
                            <td className="py-2 px-3 text-right text-amber-500">{u.toggle_important || '—'}</td>
                            <td className="py-2 px-3 text-right text-violet-600">{u.labels || '—'}</td>
                            <td className="py-2 px-3 text-right text-indigo-600">{u.templates || '—'}</td>
                            <td className="py-2 px-3 text-right text-red-500">{u.promocodes || '—'}</td>
                            <td className="py-2 px-3 text-right text-xs text-gray-400">
                                {formatDate(u.last_action_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
