import React, { useRef, useState, useEffect } from 'react';
import { UnifiedStory } from '../../types';
import { ImagePreviewModal } from '../../../../../shared/components/modals/ImagePreviewModal';
import { HoverPreview } from '../shared/HoverPreview';
import { StoriesTableToolbar } from './StoriesTableToolbar';
import { StoryRow } from './StoryRow';
import { ViewersPanel } from './ViewersPanel';

// Тип режима обновления
export type UpdateMode = 'stats' | 'viewers' | 'all';

interface StoriesTableProps {
    stories: UnifiedStory[];
    isLoading: boolean;
    updatingStatsId: string | null;
    onUpdateStats: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onUpdateViewers?: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onUpdateAll?: (mode: 'single', params: { logId: string | null; vkStoryId: number }) => void;
    onLoadStories: () => void;
    onBatchUpdate: (mode: 'last_n' | 'period', params: any, updateType?: UpdateMode) => void;
    // Пагинация
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
    totalStories?: number;
}

export const StoriesTable: React.FC<StoriesTableProps> = ({ 
    stories, isLoading, updatingStatsId, onUpdateStats, onUpdateViewers, onUpdateAll, onLoadStories, onBatchUpdate,
    hasMore, isLoadingMore, onLoadMore, totalStories
}) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Состояние для раскрытых панелей зрителей
    const [expandedViewers, setExpandedViewers] = useState<Set<number>>(new Set());
    
    // Состояния для превью изображений
    const [hoveredImage, setHoveredImage] = useState<{ url: string; rect: DOMRect } | null>(null);
    const [isExitingPreview, setIsExitingPreview] = useState(false);
    const exitTimeoutRef = useRef<number | null>(null);
    
    // Флаг: анимация строк уже была запущена (чтобы не перезапускать при обновлении данных)
    const [hasAnimatedRows, setHasAnimatedRows] = useState(false);
    const mountedRef = useRef(false);
    
    // DEBUG: Логирование изменений stories
    console.log(`[StoriesTable] Рендер с ${stories.length} историями`);
    
    useEffect(() => {
        // При первом монтировании запускаем анимацию строк
        if (!mountedRef.current) {
            mountedRef.current = true;
            const timer = setTimeout(() => setHasAnimatedRows(true), 50);
            return () => clearTimeout(timer);
        }
    }, []);
    
    // Хелпер для классов анимации строк
    const getRowAnimationClass = () => {
        return hasAnimatedRows ? '' : 'opacity-0 animate-fade-in-up';
    };
    
    const getRowAnimationStyle = (index: number) => {
        return hasAnimatedRows ? {} : { animationDelay: `${index * 30}ms` };
    };

    // Обработчик наведения мыши
    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, url: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (exitTimeoutRef.current) {
            clearTimeout(exitTimeoutRef.current);
            exitTimeoutRef.current = null;
        }
        setIsExitingPreview(false);
        setHoveredImage({ url, rect });
    };

    // Обработчик ухода мыши
    const handleMouseLeave = () => {
        setIsExitingPreview(true);
        exitTimeoutRef.current = window.setTimeout(() => {
            setHoveredImage(null);
            setIsExitingPreview(false);
        }, 200);
    };

    // Функция переключения раскрытия зрителей
    const toggleViewers = (storyId: number) => {
        setExpandedViewers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(storyId)) {
                newSet.delete(storyId);
            } else {
                newSet.add(storyId);
            }
            return newSet;
        });
    };
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             {/* Header / Toolbar */}
             <StoriesTableToolbar
                 storiesCount={stories.length}
                 totalStories={totalStories}
                 isLoading={isLoading}
                 updatingStatsId={updatingStatsId}
                 onBatchUpdate={onBatchUpdate}
                 onLoadStories={onLoadStories}
             />

        {isLoading ? (
            <div className="overflow-x-auto bg-white">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Превью</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Информация</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статистика</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {[...Array(6)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td className="px-6 py-4"><div className="w-12 h-20 bg-gray-200 rounded-lg"></div></td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                        <div className="flex gap-1.5"><div className="h-4 bg-gray-200 rounded w-14"></div><div className="h-4 bg-gray-200 rounded w-20"></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...Array(8)].map((_, j) => <div key={j} className="h-10 bg-gray-200 rounded"></div>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4"><div className="flex gap-1 justify-end">{[...Array(3)].map((_, j) => <div key={j} className="h-8 w-8 bg-gray-200 rounded"></div>)}</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-grow text-center text-gray-500 p-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <p className="text-gray-900 font-medium">Нет данных об историях</p>
                <p className="text-sm text-gray-500 mt-1">Опубликуйте первую историю или включите автоматизацию.</p>
            </div>
        ) : (
            <div className="overflow-x-auto bg-white custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Превью</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Информация</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статистика</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {stories.map((story, index) => {
                            const isUpdating = updatingStatsId !== null && (updatingStatsId === story.log_id || updatingStatsId === `vk_${story.vk_story_id}`);
                            const uniqueKey = `${story.vk_story_id}-${index}`;

                            return (
                                <React.Fragment key={uniqueKey}>
                                    <StoryRow
                                        story={story}
                                        index={index}
                                        isUpdating={isUpdating}
                                        updatingStatsId={updatingStatsId}
                                        isViewersExpanded={expandedViewers.has(story.vk_story_id)}
                                        animationClass={getRowAnimationClass()}
                                        animationStyle={getRowAnimationStyle(index)}
                                        onUpdateStats={onUpdateStats}
                                        onUpdateViewers={onUpdateViewers}
                                        onUpdateAll={onUpdateAll}
                                        onToggleViewers={toggleViewers}
                                        onMouseEnterPreview={handleMouseEnter}
                                        onMouseLeavePreview={handleMouseLeave}
                                        onClickPreview={(url) => setPreviewImage(url)}
                                    />

                                    {/* Раскрытая таблица зрителей - на всю ширину */}
                                    {expandedViewers.has(story.vk_story_id) && story.viewers && (
                                        <ViewersPanel
                                            viewers={story.viewers}
                                            viewersUpdatedAt={story.viewers_updated_at || null}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Кнопка "Загрузить ещё" / Infinite Scroll */}
                {hasMore && (
                    <div className="flex justify-center py-4 border-t border-gray-100">
                        <button
                            onClick={onLoadMore}
                            disabled={isLoadingMore}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoadingMore ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    Загрузить ещё — {totalStories ? totalStories - stories.length : '...'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        )}
        
        {/* Hover Preview Portal */}
        {hoveredImage && <HoverPreview url={hoveredImage.url} rect={hoveredImage.rect} isExiting={isExitingPreview} />}
        
        {/* Fullscreen Modal */}
        {previewImage && (
            <ImagePreviewModal
                image={{ url: previewImage, id: 'preview', type: 'photo' }}
                onClose={() => setPreviewImage(null)}
            />
        )}
    </div>
    );
};
