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

    // Ref для stories.length — чтобы loadMoreStories не пересоздавался при каждом изменении stories
    const storiesLengthRef = useRef(stories.length);
    storiesLengthRef.current = stories.length;

    // Ref для отслеживания предыдущего projectId (для сброса данных в loadStories)
    const prevProjectIdRef = useRef<string | undefined>(undefined);

    // Загрузка историй с кэшированием:
    // 1. Сначала показываем данные из кэша (быстро)
    // 2. Проверяем свежесть
    // 3. Если устарели - фоново обновляем
    const loadStories = useCallback(async (forceRefresh: boolean = false) => {
        const pid = currentProjectIdRef.current;
        if (!pid) return;
        // Сбрасываем данные если проект изменился
        if (prevProjectIdRef.current !== pid) {
            setStories([]);
            setTotalStories(0);
            prevProjectIdRef.current = pid;
        }
        setIsLoadingStories(true);
        try {
            // Шаг 1: Загружаем все батчи кэша атомарно
            const cachedRes = await callApi<PaginatedStoriesResponse>('getCachedStories', {
                projectId: pid,
                limit: PAGE_SIZE,
                offset: 0
            });
            if (currentProjectIdRef.current !== pid) return;
            if ((cachedRes as any).error) {
                window.showAppToast?.((cachedRes as any).error, 'error');
                setStories([]);
                setTotalStories(0);
            } else {
                // Атомарная загрузка кэша: все батчи локально, потом один setStories
                const cachedTotal = cachedRes.total || 0;
                const allCachedItems = cachedTotal > PAGE_SIZE
                    ? await loadAllBatchesLocal(
                        'getCachedStories',
                        pid,
                        cachedTotal,
                        cachedRes.items || [],
                        () => currentProjectIdRef.current !== pid
                    )
                    : (cachedRes.items || []);
                if (currentProjectIdRef.current !== pid) return;
                // Кэш загружен — показываем данные и снимаем скелетон сразу
                // (фоновое обновление идёт «тихо» без индикатора загрузки)
                setStories(allCachedItems);
                setTotalStories(cachedTotal);
                setIsLoadingStories(false);
            }
            // Шаг 2: Проверяем свежесть данных
            if (!forceRefresh) {
                const freshness = await callApi<{ is_stale: boolean }>('getStoriesFreshness', { projectId: pid });
                if (currentProjectIdRef.current !== pid) return;
                if (!freshness.is_stale) return;
            }
            // Шаг 3: Фоновое обновление — все батчи локально, один атомарный merge
            const refreshRes = await callApi<PaginatedStoriesResponse>('refreshStories', {
                projectId: pid,
                limit: PAGE_SIZE,
                offset: 0
            });
            if (currentProjectIdRef.current !== pid) return;
            if (!(refreshRes as any).error && refreshRes.items) {
                const refreshTotal = refreshRes.total || 0;
                const allRefreshItems = refreshTotal > PAGE_SIZE
                    ? await loadAllBatchesLocal(
                        'refreshStories',
                        pid,
                        refreshTotal,
                        refreshRes.items,
                        () => currentProjectIdRef.current !== pid
                    )
                    : refreshRes.items;
                if (currentProjectIdRef.current !== pid) return;
                setStories(prev => mergeStories(prev, allRefreshItems));
                setTotalStories(refreshTotal);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Ошибка загрузки историй';
            window.showAppToast?.(msg, 'error');
            setIsLoadingStories(false);
        }
    }, []); // Стабильная ссылка — projectId читается из ref

    /**
     * Загружает ВСЕ батчи в локальный массив (без обновления state).
     * Накапливает данные и возвращает полный массив для атомарного setStories.
     */
    const loadAllBatchesLocal = async (
        endpoint: string,
        targetProjectId: string,
        total: number,
        firstBatchItems: UnifiedStory[],
        isCancelled: () => boolean
    ): Promise<UnifiedStory[]> => {
        const allItems = [...firstBatchItems];
        let loaded = firstBatchItems.length;

        while (loaded < total) {
            if (isCancelled() || currentProjectIdRef.current !== targetProjectId) {
                return allItems; // возвращаем что успели загрузить
            }
            try {
                const batchRes = await callApi<PaginatedStoriesResponse>(endpoint, {
                    projectId: targetProjectId,
                    limit: PAGE_SIZE,
                    offset: loaded
                });
                if ((batchRes as any).error || !batchRes.items?.length) break;
                allItems.push(...batchRes.items);
                loaded += batchRes.items.length;
                if (batchRes.items.length < PAGE_SIZE) break;
            } catch {
                break;
            }
        }

        return allItems;
    };

    /** Мерж новых данных с текущими (сохраняет viewers/stats).
     *  Возвращает prev по ссылке, если данные не изменились — предотвращает лишний ре-рендер.
     */
    const mergeStories = (prev: UnifiedStory[], newItems: UnifiedStory[]): UnifiedStory[] => {
        // Быстрый путь: длина изменилась — точно новый массив
        if (prev.length !== newItems.length) {
            return buildMerged(prev, newItems);
        }
        // Если оба пустые — вернуть prev по ссылке
        if (prev.length === 0) return prev;

        const prevMap = new Map<string | number, UnifiedStory>(prev.map(s => [s.vk_story_id || s.log_id, s]));

        // Проверяем, есть ли реальные изменения
        const hasChanges = newItems.some(newStory => {
            const key = newStory.vk_story_id || newStory.log_id;
            const existing = prevMap.get(key);
            if (!existing) return true; // новая история — есть изменение
            // Сравниваем ключевые поля данных
            return (
                newStory.story_link !== existing.story_link ||
                newStory.detailed_stats !== existing.detailed_stats ||
                newStory.stats_updated_at !== existing.stats_updated_at ||
                newStory.viewers !== existing.viewers ||
                newStory.viewers_updated_at !== existing.viewers_updated_at
            );
        });

        if (!hasChanges) return prev; // Ничего не изменилось — сохраняем ссылку
        return buildMerged(prev, newItems);
    };

    /** Создаёт новый массив с мержем данных (вызывается только при реальных изменениях) */
    const buildMerged = (prev: UnifiedStory[], newItems: UnifiedStory[]): UnifiedStory[] => {
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
    // Стабильная ссылка — projectId и offset читаются из ref
    const loadMoreStories = useCallback(async () => {
        const pid = currentProjectIdRef.current;
        const nextOffset = storiesLengthRef.current;
        if (!pid) return;
        setIsLoadingMore(true);
        try {
            const res = await callApi<PaginatedStoriesResponse>('getCachedStories', {
                projectId: pid,
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
    }, []); // Стабильная ссылка — не пересоздаётся при изменении stories

    // Принудительное обновление (для кнопки "Обновить")
    const forceRefreshStories = useCallback(async () => {
        await loadStories(true);
    }, [loadStories]);

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
                    setIsLoadingStories(false);
                } else {
                    // Атомарная загрузка кэша: все батчи локально, потом один setStories
                    const cachedTotal = cachedRes.total || 0;
                    const allCachedItems = cachedTotal > PAGE_SIZE
                        ? await loadAllBatchesLocal('getCachedStories', projectId, cachedTotal, cachedRes.items || [], () => cancelled)
                        : (cachedRes.items || []);
                    if (cancelled) return;
                    // Кэш загружен — показываем данные и снимаем скелетон сразу
                    // (фоновое обновление идёт «тихо» без индикатора загрузки)
                    setStories(allCachedItems);
                    setTotalStories(cachedTotal);
                    setIsLoadingStories(false);
                }
                // Проверяем свежесть
                const freshness = await callApi<{ is_stale: boolean }>('getStoriesFreshness', { projectId });
                if (cancelled) return;
                if (!freshness.is_stale) return;
                // Фоновое обновление — загружаем ВСЕ батчи в локальный массив,
                // затем делаем один атомарный merge (без мигания 82→10→87)
                const refreshRes = await callApi<PaginatedStoriesResponse>('refreshStories', {
                    projectId,
                    limit: PAGE_SIZE,
                    offset: 0
                });
                if (cancelled) return;
                if (!(refreshRes as any).error && refreshRes.items) {
                    const refreshTotal = refreshRes.total || 0;
                    // Накапливаем все батчи локально
                    const allRefreshItems = refreshTotal > PAGE_SIZE
                        ? await loadAllBatchesLocal('refreshStories', projectId, refreshTotal, refreshRes.items, () => cancelled)
                        : refreshRes.items;
                    if (cancelled) return;
                    // Один атомарный merge — пользователь видит плавное обновление
                    setStories(prev => mergeStories(prev, allRefreshItems));
                    setTotalStories(refreshTotal);
                }
            } catch (error: any) {
                if (!cancelled) {
                    window.showAppToast?.('Ошибка загрузки историй', 'error');
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
