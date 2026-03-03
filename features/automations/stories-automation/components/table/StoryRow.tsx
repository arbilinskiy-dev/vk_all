import React, { useState } from 'react';
import { UnifiedStory } from '../../types';
import { StatItem } from './StatItem';

interface StoryRowProps {
    story: UnifiedStory;
    index: number;
    isUpdating: boolean;
    updatingStatsId: string | null;
    isViewersExpanded: boolean;
    animationClass: string;
    animationStyle: React.CSSProperties;
    onUpdateStats: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onUpdateViewers?: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onUpdateAll?: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onToggleViewers: (storyId: number) => void;
    onMouseEnterPreview: (e: React.MouseEvent<HTMLDivElement>, url: string) => void;
    onMouseLeavePreview: () => void;
    onClickPreview: (url: string) => void;
}

/** Одна строка таблицы историй: превью, информация, статистика, кнопки действий */
export const StoryRow: React.FC<StoryRowProps> = ({
    story, index, isUpdating, updatingStatsId, isViewersExpanded,
    animationClass, animationStyle,
    onUpdateStats, onUpdateViewers, onUpdateAll,
    onToggleViewers, onMouseEnterPreview, onMouseLeavePreview, onClickPreview
}) => {
    const stats = story.detailed_stats;
    // Состояние загрузки изображения для skeleton+fade-in
    const [previewLoaded, setPreviewLoaded] = useState(false);

    return (
        <tr 
            className={`hover:bg-gray-50 transition-colors ${story.is_active ? 'bg-white' : 'bg-gray-50/30'} ${animationClass}`}
            style={animationStyle}
        >
            {/* Превью */}
            <td className="px-6 py-4 align-top">
                {story.preview ? (
                    <div 
                        className="block w-12 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:ring-2 ring-indigo-500 transition-all cursor-pointer relative"
                        onMouseEnter={(e) => onMouseEnterPreview(e, story.preview!)}
                        onMouseLeave={onMouseLeavePreview}
                        onClick={() => onClickPreview(story.preview || '')}
                    >
                        {/* Скелетон-плейсхолдер */}
                        {!previewLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
                        <img 
                            src={story.preview} 
                            className={`w-full h-full object-cover transition-opacity duration-300 ${previewLoaded ? 'opacity-100' : 'opacity-0'}`} 
                            alt="Story" 
                            onLoad={() => setPreviewLoaded(true)}
                        />
                        {/* Иконка видео поверх миниатюры */}
                        {story.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <svg className="w-5 h-5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-12 h-20 bg-gray-100 rounded-lg border flex flex-col items-center justify-center text-[9px] text-gray-400 text-center p-1">
                        {story.type === 'video' ? (
                            <>
                                <svg className="w-4 h-4 mb-0.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Видео
                            </>
                        ) : 'Нет фото'}
                    </div>
                )}
            </td>
            
            {/* Информация */}
            <td className="px-6 py-4 align-top">
                <div className="flex flex-col gap-2">
                    {/* Date & Type */}
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {new Date(story.date * 1000).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{story.type}</div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {story.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                                Активна
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                Архив
                            </span>
                        )}

                        {story.is_automated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                Наш сервис
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                Вручную
                            </span>
                        )}
                    </div>
                    
                    {/* Automation Link info */}
                    {story.is_automated && story.vk_post_id && (
                        <div className="text-xs text-gray-500 mt-1">
                            Пост ID: <span className="font-mono bg-gray-100 px-1 rounded">{story.vk_post_id}</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Статистика */}
            <td className="px-6 py-4 align-top">
                {stats ? (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-2 w-full max-w-full">
                            <div className="col-span-1">
                                <StatItem label="Просм." data={stats.views || {state: 'on', count: story.views}} color="indigo" fullLabel="Просмотры" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="Лайки" data={stats.likes} color="pink" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="Ответы" data={stats.replies} color="indigo" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="Клики" data={stats.open_link || stats.link_clicks} color="green" />
                            </div>
                            
                            <div className="col-span-1">
                                <StatItem label="Репосты" data={stats.shares} color="purple" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="Подп." data={stats.subscribers} color="amber" fullLabel="Подписчики" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="Скрытия" data={stats.bans} color="red" />
                            </div>
                            <div className="col-span-1">
                                <StatItem label="ЛС" data={stats.answer} color="cyan" fullLabel="Ответы в ЛС" />
                            </div>
                        </div>
                        
                        {/* Зрители и время обновления - на одной строке */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-4">
                            {/* Кнопка раскрытия зрителей (слева) */}
                            {story.viewers && story.viewers.count > 0 ? (
                                <button
                                    onClick={() => onToggleViewers(story.vk_story_id)}
                                    className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-800 transition-colors"
                                >
                                    <svg className={`w-3.5 h-3.5 transition-transform ${isViewersExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        {story.viewers.count} зрител{story.viewers.count === 1 ? 'ь' : story.viewers.count < 5 ? 'я' : 'ей'}
                                        {story.viewers.reactions_count > 0 && (
                                            <span className="ml-1 text-pink-500 flex items-center gap-0.5">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                                {story.viewers.reactions_count}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            ) : (
                                <div></div>
                            )}
                            
                            {/* Время обновления статистики (справа) */}
                            {story.stats_updated_at && (
                                <div className="text-[10px] text-gray-400 whitespace-nowrap">
                                    Обновлено: {new Date(story.stats_updated_at).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">{story.views}</span>
                            <span className="text-xs text-gray-500 uppercase font-medium">Просмотров</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 max-w-[200px]">
                            Детальная статистика отсутствует. Нажмите "Обновить" для загрузки.
                        </div>
                    </div>
                )}
            </td>

            {/* Действия */}
            <td className="px-6 py-4 align-top text-right space-y-2">
                {story.link && (
                    <a 
                        href={story.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors w-full justify-end mb-2"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Ссылка
                    </a>
                )}
                
                {/* Update Buttons - SVG Icons */}
                <div className="flex gap-1 justify-end">
                    <button 
                        onClick={() => onUpdateStats('single', { logId: story.log_id, vkStoryId: story.vk_story_id })}
                        disabled={isUpdating || updatingStatsId !== null}
                        className={`p-1.5 rounded transition-colors ${
                            isUpdating 
                                ? 'text-gray-300 cursor-wait'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title="Обновить статистику"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                    
                    {onUpdateViewers && (
                        <button 
                            onClick={() => onUpdateViewers('single', { logId: story.log_id, vkStoryId: story.vk_story_id })}
                            disabled={isUpdating || updatingStatsId !== null}
                            className={`p-1.5 rounded transition-colors ${
                                isUpdating 
                                    ? 'text-gray-300 cursor-wait'
                                    : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
                            }`}
                            title="Обновить зрителей"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    )}
                    
                    {onUpdateAll && (
                        <button 
                            onClick={() => onUpdateAll('single', { logId: story.log_id, vkStoryId: story.vk_story_id })}
                            disabled={isUpdating || updatingStatsId !== null}
                            className={`p-1.5 rounded transition-colors ${
                                isUpdating 
                                    ? 'text-gray-300 cursor-wait'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title="Обновить всё"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};
