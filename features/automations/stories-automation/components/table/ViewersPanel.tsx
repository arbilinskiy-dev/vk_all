import React from 'react';
import { StoryViewer, ViewersData } from '../../types';

interface ViewersPanelProps {
    viewers: ViewersData;
    viewersUpdatedAt: string | null;
}

/** Форматирование пола */
const formatSex = (sex: number | undefined) => {
    if (sex === 1) return 'Жен.';
    if (sex === 2) return 'Муж.';
    return '—';
};

/** Форматирование даты последнего онлайна */
const formatLastSeen = (lastSeen: number | undefined) => {
    if (!lastSeen) return '—';
    return new Date(lastSeen * 1000).toLocaleString('ru-RU', {
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit'
    });
};

/** Бейдж платформы */
const getPlatformBadge = (platform: number | undefined) => {
    if (!platform) return null;
    const badgeBase = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ml-2";
    switch (platform) {
        case 1: return <span className={`${badgeBase} bg-orange-50 text-orange-700 border-orange-100`}>m.vk</span>;
        case 2:
        case 3: return <span className={`${badgeBase} bg-slate-100 text-slate-700 border-slate-200`}>iOS</span>;
        case 4: return <span className={`${badgeBase} bg-emerald-50 text-emerald-700 border-emerald-100`}>Android</span>;
        case 6:
        case 7: return <span className={`${badgeBase} bg-indigo-50 text-indigo-700 border-indigo-100`}>Web</span>;
        default: return <span className={`${badgeBase} bg-gray-50 text-gray-600 border-gray-200`}>Mob</span>;
    }
};

/** Раскрытая таблица зрителей одной истории (на всю ширину) */
export const ViewersPanel: React.FC<ViewersPanelProps> = ({ viewers, viewersUpdatedAt }) => {
    return (
        <tr className="bg-gray-50/50">
            <td colSpan={4} className="px-6 py-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up">
                    {/* Заголовок */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">
                                Зрители истории
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                {viewers.items.length} из {viewers.count}
                            </span>
                            {viewers.reactions_count > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    {viewers.reactions_count}
                                </span>
                            )}
                        </div>
                        {viewersUpdatedAt && (
                            <span className="text-xs text-gray-400">
                                Обновлено: {new Date(viewersUpdatedAt).toLocaleString()}
                            </span>
                        )}
                    </div>
                    
                    {viewers.partial && (
                        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Данные получены частично. Попробуйте обновить ещё раз.
                        </div>
                    )}
                    
                    {/* Таблица зрителей */}
                    <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Пользователь</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Пол</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">ДР</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Город</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">Онлайн / Платформа</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase text-xs w-20">Лайк</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase text-xs w-28">Подписчик</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase text-xs w-24">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {viewers.items.map((viewer) => (
                                    <tr key={viewer.user_id} className={`hover:bg-gray-50 transition-colors ${viewer.is_liked ? 'bg-pink-50/30' : ''} ${viewer.user.deactivated ? 'opacity-50' : ''}`}>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                {/* Аватар */}
                                                {viewer.user.photo_100 ? (
                                                    <img 
                                                        src={viewer.user.photo_100} 
                                                        alt="" 
                                                        className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0" 
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                    </div>
                                                )}
                                                {/* Имя и ID */}
                                                <div className="min-w-0">
                                                    <a 
                                                        href={`https://vk.com/id${viewer.user_id}`} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="font-medium text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        {viewer.user.first_name} {viewer.user.last_name}
                                                    </a>
                                                    <div className="text-xs text-gray-400 font-mono">id{viewer.user_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{formatSex(viewer.user.sex)}</td>
                                        <td className="px-4 py-2 text-gray-600">{viewer.user.bdate || '—'}</td>
                                        <td className="px-4 py-2 text-gray-600">{viewer.user.city || '—'}</td>
                                        <td className="px-4 py-2 text-gray-600">
                                            {formatLastSeen(viewer.user.last_seen)}
                                            {getPlatformBadge(viewer.user.platform)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {viewer.is_liked ? (
                                                <span className="text-pink-500">
                                                    <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {viewer.is_member === true ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Подписчик</span>
                                            ) : viewer.is_member === false ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">Виральный</span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {viewer.user.deactivated ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">
                                                    {viewer.user.deactivated === 'banned' ? 'Забанен' : 'Удалён'}
                                                </span>
                                            ) : viewer.user.is_closed ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Закрытый</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700">Открытый</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </td>
        </tr>
    );
};
