
import React, { useState, useRef, useEffect } from 'react';
import { SystemListSubscriber, SystemListAuthor, SystemListMailingItem } from '../../../shared/types';
import { ImagePreviewModal } from '../../../shared/components/modals/ImagePreviewModal';
import { ListType } from '../types';

// --- Чистые хелперы вынесены за пределы компонента (не пересоздаются при ре-рендере) ---

const formatSex = (sex: number | null | undefined) => {
    if (sex === 1) return 'Жен.';
    if (sex === 2) return 'Муж.';
    return '—';
};

const formatLastSeen = (lastSeen: number | null | undefined) => {
    if (!lastSeen) return '—';
    return new Date(lastSeen * 1000).toLocaleString('ru-RU', {
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit'
    });
};

const formatAddedDate = (dateString: string | undefined) => {
    if (!dateString || dateString.startsWith('1970')) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    });
};

const BADGE_BASE = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ml-2";

const getPlatformBadge = (platform: number | undefined | null) => {
    if (!platform) return null;
    switch (platform) {
        case 1:
            return <span className={`${BADGE_BASE} bg-orange-50 text-orange-700 border-orange-100`}>m.vk</span>;
        case 2:
        case 3:
            return <span className={`${BADGE_BASE} bg-slate-100 text-slate-700 border-slate-200`}>iOS</span>;
        case 4:
            return <span className={`${BADGE_BASE} bg-emerald-50 text-emerald-700 border-emerald-100`}>Android</span>;
        case 6:
        case 7:
            return <span className={`${BADGE_BASE} bg-blue-50 text-blue-700 border-blue-100`}>Web</span>;
        default:
            return <span className={`${BADGE_BASE} bg-gray-50 text-gray-600 border-gray-200`}>Mob</span>;
    }
};

const getSourceBadge = (source: string) => {
    switch (source) {
        case 'manual':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">Ручной</span>;
        case 'callback':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Callback</span>;
        case 'conversation':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-100">Диалог</span>;
        case 'posts_sync':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">Посты</span>;
        default:
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">{source}</span>;
    }
};

const getEventTypeBadge = (item: any) => {
    const eventType = item.event_type;
    if (eventType === 'join') {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Вступил
        </span>;
    }
    if (eventType === 'leave') {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Вышел
        </span>;
    }
    return <span className="text-gray-400">—</span>;
};

const getDateField = (item: SystemListSubscriber | SystemListAuthor | SystemListMailingItem, listType?: ListType) => {
    if (listType === 'mailing') {
        return (item as any).last_message_date;
    }
    if (listType === 'authors' || listType?.startsWith('history')) {
        return (item as any).event_date || (item as SystemListSubscriber).added_at;
    }
    return (item as SystemListSubscriber).added_at;
};

const getFirstContactData = (item: SystemListMailingItem) => {
    const fromId = item.first_message_from_id;
    let initiator = null;
    
    if (fromId) {
        if (fromId < 0) {
            initiator = (
                <span title="Инициатор: Сообщество (Мы)" className="cursor-help inline-flex items-center justify-center w-5 h-5 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </span>
            );
        } else {
            initiator = (
                <span title="Инициатор: Пользователь" className="cursor-help inline-flex items-center justify-center w-5 h-5 text-gray-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </span>
            );
        }
    } else {
        initiator = <span className="text-gray-300">—</span>;
    }
    
    return {
        date: formatAddedDate(item.first_message_date),
        initiator
    };
};

// --- Компонент ---

interface MembersTableProps {
    items: (SystemListSubscriber | SystemListAuthor | SystemListMailingItem)[];
    isLoading: boolean;
    listType?: ListType;
    onLoadMore?: () => void;
    isFetchingMore?: boolean;
}

export const MembersTable: React.FC<MembersTableProps> = React.memo(({ items, isLoading, listType, onLoadMore, isFetchingMore }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!onLoadMore) return;
        
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [onLoadMore]);

    if (isLoading) {
        // Адаптируем скелетон под тип списка: mailing (ЛС, FC, Init, LC, Дата сбора), timeline (Событие)
        const headerWidths = listType === 'mailing'
            ? [40, 160, 50, 50, 80, 120, 70, 30, 80, 30, 80, 80, 60]
            : listType === 'history_timeline'
            ? [40, 160, 50, 50, 80, 120, 70, 70, 100, 60]
            : [40, 160, 50, 50, 80, 120, 70, 100, 60];
        const rowWidths = listType === 'mailing'
            ? [140, 35, 45, 70, 110, 65, 25, 70, 25, 70, 70, 50]
            : listType === 'history_timeline'
            ? [140, 35, 45, 70, 110, 65, 60, 80, 50]
            : [140, 35, 45, 70, 110, 65, 80];

        return (
            <div className="overflow-hidden bg-white rounded-lg shadow border border-gray-200">
                {/* Скелетон заголовка таблицы */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-6">
                    {headerWidths.map((w, i) => (
                        <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
                    ))}
                </div>
                {/* Скелетон строк таблицы */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
                        <div className="flex-1 flex gap-6">
                            {rowWidths.map((w, j) => (
                                <div key={j} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: w, animationDelay: `${i * 60 + j * 30}ms` }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (items.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Список пуст
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50"></th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Пользователь (ID / ФИО)</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Пол</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">ДР</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Город</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Онлайн / Платформа</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Статус</th>
                            {listType === 'history_timeline' && (
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Событие</th>
                            )}
                            {listType === 'mailing' && (
                                <>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider bg-gray-50" title="Разрешено писать сообщения">ЛС</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50" title="First Contact (Дата первого сообщения)">FC</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider bg-gray-50" title="Инициатор диалога">Init</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50" title="Last Contact (Дата последнего сообщения)">LC</th>
                                </>
                            )}
                            {listType !== 'mailing' && (
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    {listType === 'history_join' ? 'Дата вступления'
                                        : listType === 'history_leave' ? 'Дата выхода'
                                        : listType === 'history_timeline' ? 'Дата события'
                                        : listType === 'authors' ? 'Дата публикации'
                                        : 'Дата добавления'}
                                </th>
                            )}
                            
                            {listType === 'mailing' && (
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Дата сбора</th>
                            )}
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Источник</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(item => {
                            let fcData = { date: '—', initiator: null as React.ReactNode };
                            if (listType === 'mailing') {
                                fcData = getFirstContactData(item as SystemListMailingItem);
                            }

                            return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2">
                                    {item.photo_url ? (
                                        <img 
                                            src={item.photo_url} 
                                            alt="" 
                                            loading="lazy"
                                            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm" 
                                            onClick={() => setPreviewImage(item.photo_url!)}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <div>
                                        <a href={`https://vk.com/id${item.vk_user_id}`} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800 block text-base">
                                            {item.first_name} {item.last_name}
                                        </a>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                                            <span>id: {item.vk_user_id}</span>
                                            {item.domain && item.domain !== `id${item.vk_user_id}` && <span>(@{item.domain})</span>}
                                            {item.has_mobile && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <title>Известен номер телефона</title>
                                                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                    {formatSex(item.sex)}
                                </td>
                                <td className="px-4 py-2 text-gray-600 text-sm whitespace-nowrap">
                                    {item.bdate || '—'}
                                </td>
                                <td className="px-4 py-2 text-gray-600 text-sm">
                                    {item.city || '—'}
                                </td>
                                <td className="px-4 py-2 text-gray-600 text-xs">
                                    <div className="flex items-center">
                                        <span className="whitespace-nowrap">{formatLastSeen(item.last_seen)}</span>
                                        {getPlatformBadge(item.platform)}
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    {item.deactivated ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={item.deactivated === 'banned' ? 'Заблокирован' : 'Удален'}>
                                            {item.deactivated === 'banned' ? 'Заблокир.' : 'Удален'}
                                        </span>
                                    ) : item.is_closed ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            Закрытый
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Активен
                                        </span>
                                    )}
                                </td>
                                {listType === 'history_timeline' && (
                                    <td className="px-4 py-2">
                                        {getEventTypeBadge(item)}
                                    </td>
                                )}
                                {listType === 'mailing' && (
                                    <>
                                        <td className="px-4 py-2 text-center">
                                            {(item as any).can_access_closed ? (
                                                <span title="Разрешено писать" className="inline-flex items-center justify-center w-5 h-5 text-green-600">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </span>
                                            ) : (
                                                <span title="Запрещено писать" className="inline-flex items-center justify-center w-5 h-5 text-red-500">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 text-xs whitespace-nowrap">
                                            {fcData.date}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {fcData.initiator}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 text-xs whitespace-nowrap">
                                            {formatAddedDate(String(getDateField(item, listType)))}
                                        </td>
                                    </>
                                )}
                                {listType !== 'mailing' && (
                                     <td className="px-4 py-2 text-gray-600 text-xs whitespace-nowrap">
                                        {formatAddedDate(String(getDateField(item, listType)))}
                                    </td>
                                )}

                                {listType === 'mailing' && (
                                    <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                                        {formatAddedDate(String((item as SystemListSubscriber).added_at))}
                                    </td>
                                )}
                                <td className="px-4 py-2">
                                    {getSourceBadge(item.source)}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                {/* Trigger for infinite scroll inside the scroll container */}
                {onLoadMore && (
                    <div ref={observerTarget} className="h-8 w-full flex justify-center items-center py-2">
                         {isFetchingMore && (
                            <div className="loader h-6 w-6 border-t-indigo-500"></div>
                        )}
                    </div>
                )}
            </div>
            
            {previewImage && (
                <ImagePreviewModal 
                    image={{ id: 'preview', url: previewImage }} 
                    onClose={() => setPreviewImage(null)} 
                />
            )}
        </>
    );
});
