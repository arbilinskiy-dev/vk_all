import { useState, type Dispatch, type SetStateAction } from 'react';
import { callApi } from '../../../../shared/utils/apiClient';
import { UnifiedStory } from '../types';

/**
 * Хук обновления статистики, зрителей и полного обновления историй.
 * Принимает setStories для локального патчинга данных без перезагрузки.
 * onSuccess вызывается после каждого успешного обновления (для рефреша дашборда).
 */
export const useStoriesUpdater = (
    projectId?: string,
    setStories?: Dispatch<SetStateAction<UnifiedStory[]>>,
    onSuccess?: () => void
) => {
    const [updatingStatsId, setUpdatingStatsId] = useState<string | null>(null);

    /** Генерация loadingId для индикации в UI */
    const getLoadingId = (prefix: string, mode: 'single' | 'last_n' | 'period', params: any = {}): string => {
        if (mode === 'single' && params.logId) return `${prefix}${params.logId}`;
        if (mode === 'single' && params.vkStoryId) return `${prefix}vk_${params.vkStoryId}`;
        if (mode === 'last_n') return `${prefix}last_${params.count}`;
        if (mode === 'period') return `${prefix}period_${params.days}`;
        return `${prefix}global`;
    };

    /** Обновление статистики историй */
    const handleUpdateStats = async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectId) return;

        setUpdatingStatsId(getLoadingId('', mode, params));

        try {
            const res = await callApi<{
                status: string;
                updated: number;
                updated_stories?: Array<{
                    log_id: string;
                    vk_story_id: number;
                    detailed_stats: any;
                    stats_updated_at: string;
                }>;
            }>('updateStoriesStats', {
                projectId,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                window.showAppToast?.(`Обновлено ${res.updated || 0} записей`, 'success');

                // Локально обновляем только изменённые истории вместо перезагрузки всего списка
                if (res.updated_stories && res.updated_stories.length > 0 && setStories) {
                    setStories(prev => prev.map(story => {
                        const updated = res.updated_stories?.find(
                            u => u.log_id === story.log_id || u.vk_story_id === story.vk_story_id
                        );
                        if (updated) {
                            return {
                                ...story,
                                detailed_stats: updated.detailed_stats,
                                stats_updated_at: updated.stats_updated_at
                            };
                        }
                        return story;
                    }));
                }
                // Перезагружаем дашборд с актуальными данными
                onSuccess?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить статистику', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    };

    /** Обновление зрителей */
    const handleUpdateViewers = async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectId) return;

        setUpdatingStatsId(getLoadingId('viewers_', mode, params));

        try {
            const res = await callApi<{
                status: string;
                updated: number;
                updated_stories?: Array<{
                    log_id: string;
                    vk_story_id: number;
                    viewers: any;
                    viewers_updated_at: string;
                }>;
            }>('updateStoriesViewers', {
                projectId,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                window.showAppToast?.(`Зрители обновлены: ${res.updated || 0} записей`, 'success');

                // Локально обновляем только изменённые истории
                if (res.updated_stories && res.updated_stories.length > 0 && setStories) {
                    setStories(prev => prev.map(story => {
                        const updated = res.updated_stories?.find(
                            u => u.log_id === story.log_id || u.vk_story_id === story.vk_story_id
                        );
                        if (updated) {
                            return {
                                ...story,
                                viewers: updated.viewers,
                                viewers_updated_at: updated.viewers_updated_at
                            };
                        }
                        return story;
                    }));
                }
                // Перезагружаем дашборд с актуальными данными
                onSuccess?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить зрителей', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    };

    /** Обновление всего (статистика + зрители) */
    const handleUpdateAll = async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectId) return;

        setUpdatingStatsId(getLoadingId('all_', mode, params));

        try {
            const res = await callApi<{
                status: string;
                updated: number;
                updated_stories?: Array<{
                    log_id: string;
                    vk_story_id: number;
                    detailed_stats?: any;
                    stats_updated_at?: string;
                    viewers?: any;
                    viewers_updated_at?: string;
                }>;
            }>('updateStoriesAll', {
                projectId,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                window.showAppToast?.(`Полное обновление: ${res.updated || 0} записей`, 'success');

                // Локально обновляем только изменённые истории, затем рефрешим дашборд
                if (res.updated_stories && res.updated_stories.length > 0 && setStories) {
                    setStories(prev => prev.map(story => {
                        const updated = res.updated_stories?.find(
                            u => u.log_id === story.log_id || u.vk_story_id === story.vk_story_id
                        );
                        if (updated) {
                            return {
                                ...story,
                                ...(updated.detailed_stats && { detailed_stats: updated.detailed_stats }),
                                ...(updated.stats_updated_at && { stats_updated_at: updated.stats_updated_at }),
                                ...(updated.viewers && { viewers: updated.viewers }),
                                ...(updated.viewers_updated_at && { viewers_updated_at: updated.viewers_updated_at })
                            };
                        }
                        return story;
                    }));
                }
                // Перезагружаем дашборд с актуальными данными
                onSuccess?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить данные', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    };

    return {
        updatingStatsId,
        handleUpdateStats,
        handleUpdateViewers,
        handleUpdateAll,
    };
};
