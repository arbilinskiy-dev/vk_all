import React from 'react';
import type { MockMember } from './ListsMocks_Members_Types';

// =====================================================================
// MOCK КОМПОНЕНТ: СТРОКА УЧАСТНИКА С БЕЙДЖАМИ (раздел 3.2.3)
// =====================================================================

export const MemberRow: React.FC<{ member: MockMember }> = ({ member }) => {
    const formatLastSeen = (lastSeen: number | undefined) => {
        if (!lastSeen) return '—';
        const date = new Date(lastSeen * 1000);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddedDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPlatformBadge = (platform: number | undefined) => {
        switch (platform) {
            case 1:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-orange-50 text-orange-700 border-orange-100">m.vk</span>;
            case 2:
            case 3:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-100 text-slate-700 border-slate-200">iOS</span>;
            case 4:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-100">Android</span>;
            case 7:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-100">Web</span>;
            default:
                return <span className="text-xs text-gray-400">—</span>;
        }
    };

    const getStatusBadge = () => {
        if (member.deactivated === 'banned') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Заблокир.</span>;
        }
        if (member.deactivated === 'deleted') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Удален</span>;
        }
        if (member.is_closed) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Закрытый</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Активен</span>;
    };

    const getSourceBadge = () => {
        switch (member.source) {
            case 'manual':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">Ручной</span>;
            case 'callback':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Callback</span>;
            case 'conversation':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-100">Диалог</span>;
            case 'posts_sync':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">Посты</span>;
            default:
                return <span className="text-xs text-gray-400">—</span>;
        }
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
            {/* Аватар */}
            <td className="px-4 py-3">
                {member.photo_url ? (
                    <img src={member.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </td>

            {/* Пользователь (ID / ФИО) */}
            <td className="px-4 py-3">
                <div className="flex flex-col">
                    <a 
                        href={`https://vk.com/${member.domain || `id${member.vk_user_id}`}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                        {member.vk_user_id}
                    </a>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                        {member.first_name} {member.last_name}
                        {member.has_mobile && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor" title="Известен номер телефона">
                                <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            </td>

            {/* Пол */}
            <td className="px-4 py-3">
                {member.sex === 1 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700">Ж</span>
                ) : member.sex === 2 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">М</span>
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                )}
            </td>

            {/* День рождения */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-700">{member.bdate || '—'}</span>
            </td>

            {/* Город */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-700">{member.city || '—'}</span>
            </td>

            {/* Онлайн / Платформа */}
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500">{formatLastSeen(member.last_seen)}</span>
                    {getPlatformBadge(member.platform)}
                </div>
            </td>

            {/* Статус */}
            <td className="px-4 py-3">
                {getStatusBadge()}
            </td>

            {/* Дата события */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-700">{formatAddedDate(member.added_at)}</span>
            </td>

            {/* Источник */}
            <td className="px-4 py-3">
                {getSourceBadge()}
            </td>
        </tr>
    );
};
