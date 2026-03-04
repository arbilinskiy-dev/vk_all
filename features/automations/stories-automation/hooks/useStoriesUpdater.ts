import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
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

    // Refs для стабильности колбэков (не пересоздаём функции при каждом рендере)
    const projectIdRef = useRef(projectId);
    projectIdRef.current = projectId;
    const setStoriesRef = useRef(setStories);
    setStoriesRef.current = setStories;
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    /** Генерация loadingId для индикации в UI */
    const getLoadingId = (prefix: string, mode: 'single' | 'last_n' | 'period', params: any = {}): string => {
        if (mode === 'single' && params.logId) return `${prefix}${params.logId}`;
        if (mode === 'single' && params.vkStoryId) return `${prefix}vk_${params.vkStoryId}`;
        if (mode === 'last_n') return `${prefix}last_${params.count}`;
        if (mode === 'period') return `${prefix}period_${params.days}`;
        return `${prefix}global`;
    };

    /** Обновление статистики историй */
    const handleUpdateStats = useCallback(async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectIdRef.current) return;

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
                projectId: projectIdRef.current,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                // Информативный тост с деталями
                const parts = [`Обновлено ${res.updated || 0} записей`];
                if ((res as any).no_link) parts.push(`${(res as any).no_link} без ссылки`);
                if ((res as any).failed) parts.push(`${(res as any).failed} ошибок VK`);
                const hasWarnings = (res as any).no_link || (res as any).failed;
                window.showAppToast?.(parts.join(', '), hasWarnings ? 'warning' : 'success');

                // Локально обновляем только изменённые истории вместо перезагрузки всего списка
                if (res.updated_stories && res.updated_stories.length > 0 && setStoriesRef.current) {
                    setStoriesRef.current(prev => prev.map(story => {
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
                onSuccessRef.current?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить статистику', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    }, []); // Стабильная ссылка — не пересоздаётся

    /** Обновление зрителей */
    const handleUpdateViewers = useCallback(async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectIdRef.current) return;

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
                projectId: projectIdRef.current,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                const parts = [`Зрители обновлены: ${res.updated || 0} записей`];
                if ((res as any).no_link) parts.push(`${(res as any).no_link} без ссылки`);
                if ((res as any).failed) parts.push(`${(res as any).failed} ошибок VK`);
                const hasWarnings = (res as any).no_link || (res as any).failed;
                window.showAppToast?.(parts.join(', '), hasWarnings ? 'warning' : 'success');

                // Локально обновляем только изменённые истории
                if (res.updated_stories && res.updated_stories.length > 0 && setStoriesRef.current) {
                    setStoriesRef.current(prev => prev.map(story => {
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
                onSuccessRef.current?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить зрителей', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    }, []); // Стабильная ссылка — не пересоздаётся

    /** Обновление всего (статистика + зрители) */
    const handleUpdateAll = useCallback(async (mode: 'single' | 'last_n' | 'period', params: any = {}) => {
        if (!projectIdRef.current) return;

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
                projectId: projectIdRef.current,
                mode,
                ...params
            });

            if (res.status === 'ok') {
                const parts = [`Полное обновление: ${res.updated || 0} записей`];
                if ((res as any).no_link) parts.push(`${(res as any).no_link} без ссылки`);
                if ((res as any).failed) parts.push(`${(res as any).failed} ошибок VK`);
                const hasWarnings = (res as any).no_link || (res as any).failed;
                window.showAppToast?.(parts.join(', '), hasWarnings ? 'warning' : 'success');

                // Локально обновляем только изменённые истории, затем рефрешим дашборд
                if (res.updated_stories && res.updated_stories.length > 0 && setStoriesRef.current) {
                    setStoriesRef.current(prev => prev.map(story => {
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
                onSuccessRef.current?.();
            }
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось обновить данные', 'error');
        } finally {
            setUpdatingStatsId(null);
        }
    }, []); // Стабильная ссылка — не пересоздаётся

    return {
        updatingStatsId,
        handleUpdateStats,
        handleUpdateViewers,
        handleUpdateAll,
    };
};
