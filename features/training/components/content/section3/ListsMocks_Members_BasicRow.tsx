import React from 'react';
import type { MockMemberRowProps } from './ListsMocks_Members_Types';

// =====================================================================
// MOCK КОМПОНЕНТ: СТРОКА ТАБЛИЦЫ УЧАСТНИКА (базовая — раздел 3.2.1)
// =====================================================================

export const MockMemberRow: React.FC<MockMemberRowProps> = ({ user }) => {
    // Статус
    const getStatusBadge = () => {
        if (user.deactivated === 'banned') {
            return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Заблокир.</span>;
        }
        if (user.deactivated === 'deleted') {
            return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Удален</span>;
        }
        if (user.is_closed) {
            return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">Закрытый</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Активен</span>;
    };

    // Платформа
    const getPlatformBadge = () => {
        if (!user.platform) return null;
        
        const platforms: Record<number, { label: string; classes: string }> = {
            1: { label: 'm.vk', classes: 'bg-orange-50 text-orange-700 border-orange-100' },
            2: { label: 'iOS', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
            3: { label: 'iOS', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
            4: { label: 'Android', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            6: { label: 'Web', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
            7: { label: 'Web', classes: 'bg-blue-50 text-blue-700 border-blue-100' }
        };

        const platform = platforms[user.platform] || { label: 'Mob', classes: 'bg-gray-50 text-gray-600 border-gray-200' };
        
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${platform.classes}`}>
                {platform.label}
            </span>
        );
    };

    // Источник
    const getSourceBadge = () => {
        if (!user.source) return null;
        
        const sources: Record<string, { label: string; classes: string }> = {
            manual: { label: 'Ручной', classes: 'bg-gray-50 text-gray-600 border-gray-200' },
            callback: { label: 'Callback', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
            conversation: { label: 'Диалог', classes: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
            posts_sync: { label: 'Посты', classes: 'bg-violet-50 text-violet-700 border-violet-100' }
        };

        const source = sources[user.source];
        if (!source) return null;
        
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${source.classes}`}>
                {source.label}
            </span>
        );
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            {/* Аватар */}
            <td className="px-4 py-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user.photo_url ? (
                        <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            </td>

            {/* Пользователь */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <a href={`https://vk.com/${user.domain || `id${user.vk_user_id}`}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-indigo-600 hover:text-indigo-800 font-medium">
                        {user.first_name} {user.last_name}
                    </a>
                    {user.has_mobile && (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <title>Известен номер телефона</title>
                            <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                <div className="text-xs text-gray-500">ID: {user.vk_user_id}</div>
            </td>

            {/* Пол */}
            <td className="px-4 py-3 text-sm text-gray-700">
                {user.sex === 1 ? 'Жен.' : user.sex === 2 ? 'Муж.' : '—'}
            </td>

            {/* ДР */}
            <td className="px-4 py-3 text-sm text-gray-700">
                {user.bdate || '—'}
            </td>

            {/* Город */}
            <td className="px-4 py-3 text-sm text-gray-700">
                {user.city || '—'}
            </td>

            {/* Онлайн / Платформа */}
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    {user.last_seen && (
                        <div className="text-xs text-gray-600">{formatDate(user.last_seen)}</div>
                    )}
                    {getPlatformBadge()}
                </div>
            </td>

            {/* Статус */}
            <td className="px-4 py-3">
                {getStatusBadge()}
            </td>

            {/* Дата события */}
            <td className="px-4 py-3 text-sm text-gray-600">
                {new Date(user.added_at).toLocaleString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}
            </td>

            {/* Источник */}
            <td className="px-4 py-3">
                {getSourceBadge()}
            </td>
        </tr>
    );
};
