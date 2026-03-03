/**
 * Таблица пользователей проекта в статистике сообщений.
 * Показывает кто именно писал, сколько сообщений, даты первого/последнего.
 * Клик по строке → переход в чат.
 */

import React from 'react';
import { MessageStatsUserItem } from '../../../../services/api/messages_stats.api';
import { UserAvatar } from './MessageStatsHelpers';

interface MessageStatsUsersTableProps {
    users: MessageStatsUserItem[];
    totalCount: number;
    page: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: string) => void;
    onPageChange: (page: number) => void;
    onUserClick: (vkUserId: number) => void;
}

/** Форматирование Unix timestamp в читаемую дату */
function formatTimestamp(ts: number | null): string {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const MessageStatsUsersTable: React.FC<MessageStatsUsersTableProps> = ({
    users,
    totalCount,
    page,
    sortBy,
    sortOrder,
    onSort,
    onPageChange,
    onUserClick,
}) => {
    const pageSize = 50;
    const totalPages = Math.ceil(totalCount / pageSize);

    /** Рендер стрелки сортировки */
    const SortIndicator: React.FC<{ field: string }> = ({ field }) => {
        if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
        return <span className="text-indigo-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    const headerClass = 'px-6 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none';

    return (
        <div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3">Пользователь</th>
                            <th className={headerClass} onClick={() => onSort('incoming_count')}>
                                Входящих <SortIndicator field="incoming_count" />
                            </th>
                            <th className={headerClass} onClick={() => onSort('outgoing_count')}>
                                Исходящих <SortIndicator field="outgoing_count" />
                            </th>
                            <th className={headerClass} onClick={() => onSort('first_message_at')}>
                                Первое сообщение <SortIndicator field="first_message_at" />
                            </th>
                            <th className={headerClass} onClick={() => onSort('last_message_at')}>
                                Последнее сообщение <SortIndicator field="last_message_at" />
                            </th>
                        </tr>
                    </thead>
                    <tbody key={page} className="divide-y divide-gray-200">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    Нет пользователей
                                </td>
                            </tr>
                        ) : (
                            users.map((u, idx) => (
                                <tr
                                    key={u.vk_user_id}
                                    onClick={() => onUserClick(u.vk_user_id)}
                                    className="cursor-pointer hover:bg-indigo-50 transition-colors opacity-0 animate-fade-in-up"
                                    title="Нажмите, чтобы перейти в чат"
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
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
                                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                                        {u.incoming_count.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-orange-600 font-medium">
                                        {u.outgoing_count.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                                        {formatTimestamp(u.first_message_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                                        {formatTimestamp(u.last_message_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Показано {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} из {totalCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 0}
                            className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Назад
                        </button>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Вперёд →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
