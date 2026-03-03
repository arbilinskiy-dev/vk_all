import { useState, useEffect, useRef, useCallback } from 'react';
import { callApi } from '../../../../shared/utils/apiClient';
import { UnifiedStory } from '../types';

// Ответ с пагинацией от бэкенда
interface PaginatedStoriesResponse {
    items: UnifiedStory[];
    total: number;
    offset: number;
    limit: number;
}

// Размер страницы (батч) — ограничение Yandex Serverless Container 3.5 МБ на ответ
const PAGE_SIZE = 10;

/**
 * Хук загрузки и пагинации историй.
 * Реализует паттерн cache-first + фоновое обновление.
 */
export const useStoriesLoader = (projectId?: string, activeTab: 'settings' | 'stats' = 'settings') => {
    // Список историй
    const [stories, setStories] = useState<UnifiedStory[]>([]);
    const [isLoadingStories, setIsLoadingStories] = useState(false);
    const [totalStories, setTotalStories] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Ref для отслеживания текущего projectId (обновляется синхронно)
    const currentProjectIdRef = useRef<string | undefined>(projectId);

    // ВАЖНО: Синхронно обновляем ref при каждом рендере с новым projectId
    // Это гарантирует, что ref всегда актуален до запуска любых useEffect
    if (projectId !== currentProjectIdRef.current) {
        currentProjectIdRef.current = projectId;
    }

    // Ref для отслеживания предыдущего projectId (для сброса данных в loadStories)
    const prevProjectIdRef = useRef<string | undefined>(undefined);

    // Загрузка историй с кэшированием:
    // 1. Сначала показываем данные из кэша (быстро)
    // 2. Проверяем свежесть
    // 3. Если устарели - фоново обновляем
    const loadStories = async (forceRefresh: boolean = false) => {
        if (!projectId) return;
        const requestProjectId = projectId;
        // Сбрасываем данные если проект изменился
        if (prevProjectIdRef.current !== requestProjectId) {
            setStories([]);
            setTotalStories(0);
            prevProjectIdRef.current = requestProjectId;
        }
        setIsLoadingStories(true);
        try {
            // Шаг 1: Загружаем первую страницу из кэша
            const cachedRes = await callApi<PaginatedStoriesResponse>('getCachedStories', {
                projectId: requestProjectId,
                limit: PAGE_SIZE,
                offset: 0
            });
            if (currentProjectIdRef.current !== requestProjectId) return;
            if ((cachedRes as any).error) {
                window.showAppToast?.((cachedRes as any).error, 'error');
                setStories([]);
                setTotalStories(0);
            } else {
                setStories(cachedRes.items || []);
                setTotalStories(cachedRes.total || 0);
                // Фоновая догрузка остальных батчей из кэша
                if (cachedRes.total > PAGE_SIZE) {
                    await loadRemainingBatches(requestProjectId, cachedRes.total, cachedRes.items || [], false);
                }
            }
            // Шаг 2: Проверяем свежесть данных
            if (!forceRefresh) {
                const freshness = await callApi<{ is_stale: boolean }>('getStoriesFreshness', { projectId: requestProjectId });
                if (currentProjectIdRef.current !== requestProjectId) return;
                if (!freshness.is_stale) return;
            }
            // Шаг 3: Фоновое обновление (данные устарели или принудительное обновление)
            const refreshRes = await callApi<PaginatedStoriesResponse>('refreshStories', {
                projectId: requestProjectId,
                limit: PAGE_SIZE,
                offset: 0
            });
            if (currentProjectIdRef.current !== requestProjectId) return;
            if (!(refreshRes as any).error && refreshRes.items) {
                setStories(refreshRes.items);
                setTotalStories(refreshRes.total || 0);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Ошибка загрузки историй';
            window.showAppToast?.(msg, 'error');
        } finally {
            setIsLoadingStories(false);
        }
    };
    /**
     * Фоновая догрузка оставшихся батчей из кэша/refresh.
     * Последовательно загружает порции по PAGE_SIZE и аппендит к текущему списку.
     */
    const loadRemainingBatches = async (
        targetProjectId: string,
        total: number,
        firstBatchItems: UnifiedStory[],
        isRefresh: boolean
    ) => {
        let loaded = firstBatchItems.length;
        const endpoint = isRefresh ? 'refreshStories' : 'getCachedStories';

        while (loaded < total) {
            // Проверяем, не сменился ли проект
            if (currentProjectIdRef.current !== targetProjectId) {
                console.log(`[STORIES] Батч-загрузка отменена — проект сменился`);
                return;
            }

            try {
                const batchRes = await callApi<PaginatedStoriesResponse>(endpoint, {
                    projectId: targetProjectId,
                    limit: PAGE_SIZE,
                    offset: loaded
                });


                if ((batchRes as any).error || !batchRes.items?.length) break;

                // Аппендим новый батч к текущему списку
                setStories(prev => [...prev, ...batchRes.items]);
                loaded += batchRes.items.length;
                console.log(`[STORIES] Батч загружен: +${batchRes.items.length}, всего ${loaded}/${total}`);

                // Если получили меньше, чем запросили — больше нет данных
                if (batchRes.items.length < PAGE_SIZE) break;
            } catch (error) {
                console.error(`[STORIES] Ошибка батч-загрузки (offset=${loaded}):`, error);
                break;
            }
        }
    };

    // ...existing code...
    const loadRemainingBatchesWithCancel = async (
        targetProjectId: string,
        total: number,
        firstBatchItems: UnifiedStory[],
        isRefresh: boolean,
        isCancelled: () => boolean
    ) => {
        let loaded = firstBatchItems.length;
        const endpoint = isRefresh ? 'refreshStories' : 'getCachedStories';
        while (loaded < total) {
            if (isCancelled() || currentProjectIdRef.current !== targetProjectId) {
                return;
            }
            try {
                const batchRes = await callApi<PaginatedStoriesResponse>(endpoint, {
                    projectId: targetProjectId,
                    limit: PAGE_SIZE,
                    offset: loaded
                });
                if ((batchRes as any).error || !batchRes.items?.length) break;
                setStories(prev => [...prev, ...batchRes.items]);
                loaded += batchRes.items.length;
                if (batchRes.items.length < PAGE_SIZE) break;
            } catch (error) {
                break;
            }
        }
    };

    /** Мерж новых данных с текущими (сохраняет viewers/stats) */
    const mergeStories = (prev: UnifiedStory[], newItems: UnifiedStory[]): UnifiedStory[] => {
        const prevMap = new Map<string | number, UnifiedStory>(prev.map(s => [s.vk_story_id || s.log_id, s]));
        return newItems.map((newStory: UnifiedStory) => {
            const key = newStory.vk_story_id || newStory.log_id;
            const existing = prevMap.get(key);
            if (existing) {
                return {
                    ...newStory,
                    viewers: newStory.viewers || existing.viewers,
                    viewers_updated_at: newStory.viewers_updated_at || existing.viewers_updated_at,
                    detailed_stats: newStory.detailed_stats || existing.detailed_stats,
                    stats_updated_at: newStory.stats_updated_at || existing.stats_updated_at,
                };
            }
            return newStory;
        });
    };

    // Подгрузка следующей порции историй (infinite scroll)
    const loadMoreStories = useCallback(async () => {

        const nextOffset = stories.length;
        setIsLoadingMore(true);
        try {
            const res = await callApi<PaginatedStoriesResponse>('getCachedStories', {
                projectId,
                limit: PAGE_SIZE,
                offset: nextOffset
            });
            if (!(res as any).error && res.items?.length) {
                setStories(prev => [...prev, ...res.items]);
                setTotalStories(res.total || 0);
            }
        } catch (error) {
            // ignore
        } finally {
            setIsLoadingMore(false);
        }
    }, [projectId, stories.length, totalStories]);

    // Принудительное обновление (для кнопки "Обновить")
    const forceRefreshStories = async () => {
        await loadStories(true);
    };

    // Единственный useEffect для загрузки историй при смене tab/project
    // Используем флаг cancelled для отмены устаревших запросов
    useEffect(() => {
        let cancelled = false;
        const loadStoriesWithCancel = async () => {
            if (!projectId || activeTab !== 'stats') return;
            setIsLoadingStories(true);
            try {
                // Загружаем кэш (первая страница)
                const cachedRes = await callApi<PaginatedStoriesResponse>('getCachedStories', {
                    projectId,
                    limit: PAGE_SIZE,
                    offset: 0
                });
                if (cancelled) return;
                if ((cachedRes as any).error) {
                    window.showAppToast?.((cachedRes as any).error, 'error');
                    setStories([]);
                    setTotalStories(0);
                } else {
                    setStories(cachedRes.items || []);
                    const total = cachedRes.total || 0;
                    if (total > PAGE_SIZE && !cancelled) {
                        await loadRemainingBatchesWithCancel(projectId, total, cachedRes.items || [], false, () => cancelled);
                    }
                }
                // Проверяем свежесть
                const freshness = await callApi<{ is_stale: boolean }>('getStoriesFreshness', { projectId });
                if (cancelled) return;
                if (!freshness.is_stale) return;
                // Фоновое обновление
                const refreshRes = await callApi<PaginatedStoriesResponse>('refreshStories', {
                    projectId,
                    limit: PAGE_SIZE,
                    offset: 0
                });
                if (cancelled) return;
                if (!(refreshRes as any).error && refreshRes.items) {
                    // Мержим первый батч с текущими данными (сохраняем viewers/stats)
                    setStories(prev => mergeStories(prev, refreshRes.items));
                    setTotalStories(refreshRes.total || 0);
                    const refreshTotal = refreshRes.total || 0;
                    if (refreshTotal > PAGE_SIZE && !cancelled) {
                        await loadRemainingBatchesWithCancel(projectId, refreshTotal, refreshRes.items, true, () => cancelled);
                    }
                }
            } catch (error: any) {
                if (!cancelled) {
                    window.showAppToast?.('Ошибка загрузки историй', 'error');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingStories(false);
                }
            }
        };
        loadStoriesWithCancel();
        return () => {
            cancelled = true;
        };
    }, [activeTab, projectId]);

    return {
        stories,
        setStories,
        isLoadingStories,
        totalStories,
        isLoadingMore,
        loadStories,
        loadMoreStories,
        forceRefreshStories,
        hasMore: stories.length < totalStories,
    };
};
