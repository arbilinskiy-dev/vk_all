
import { useCallback, useRef } from 'react';
import { Project } from '../../../shared/types';
import * as api from '../../../services/api';
import { ListType } from '../types';
import { useListState } from './useListState';

// Тип возвращаемого значения из useListState
type ListStateReturn = ReturnType<typeof useListState>;

export const useListFetching = (
    project: Project,
    state: ListStateReturn['state'],
    setters: ListStateReturn['setters']
) => {
    const PAGE_SIZE = 50;

    // --- C1: Инкрементальные счётчики запросов для защиты от race condition ---
    // При быстром переключении табов ответ от устаревшего запроса игнорируется
    const itemsRequestIdRef = useRef(0);
    const statsRequestIdRef = useRef(0);

    // --- M2: Ref-based guard вместо state для защиты от параллельных вызовов ---
    // state.isLoadingList в замыкании useCallback может быть stale,
    // ref обновляется синхронно и всегда актуален
    const isLoadingItemsRef = useRef(false);

    const fetchMeta = useCallback(async () => {
        setters.setIsLoadingMeta(true);
        try {
            const metaData = await api.getListMeta(project.id);
            if (state.activeProjectIdRef.current === project.id) {
                 setters.setMeta(metaData.meta);
            }
        } catch (e) {
            console.error(e);
            // M7: Уведомление пользователя об ошибке загрузки метаданных
            window.showAppToast?.('Не удалось загрузить метаданные списка', 'error');
        } finally {
            if (state.activeProjectIdRef.current === project.id) {
                setters.setIsLoadingMeta(false);
            }
        }
    }, [project.id]);

    const fetchStats = useCallback(async (listType: ListType) => {
        // Для списков автоматизации статистика пока не реализована или не требуется в том же виде
        if (listType.startsWith('reviews_')) {
            setters.setStats(null);
            return;
        }

        // C1: Запоминаем ID этого запроса — при получении ответа проверим актуальность
        const myRequestId = ++statsRequestIdRef.current;

        setters.setIsLoadingStats(true);
        try {
            const statsData = await api.getListStats(
                project.id, 
                listType,
                state.statsPeriod,
                state.statsGroupBy,
                state.statsDateFrom,
                state.statsDateTo,
                state.filterCanWrite // Передаем фильтр ЛС в статистику
            );
            // C1: Игнорируем ответ если за время запроса был запущен новый fetchStats
            if (state.activeProjectIdRef.current === project.id && statsRequestIdRef.current === myRequestId) {
                setters.setStats(statsData);
            }
        } catch (e) {
            console.error("Failed to load stats", e);
            // M7: Уведомление при ошибке загрузки статистики
            window.showAppToast?.('Не удалось загрузить статистику', 'error');
        } finally {
             if (state.activeProjectIdRef.current === project.id) {
                // Снимаем лоадер только если это последний запрос
                if (statsRequestIdRef.current === myRequestId) {
                    setters.setIsLoadingStats(false);
                }
             }
        }
    }, [project.id, state.statsPeriod, state.statsGroupBy, state.statsDateFrom, state.statsDateTo, state.filterCanWrite]);

    const fetchItems = useCallback(async (pageNum: number, search: string, isReset: boolean = false) => {
        if (!state.activeList) return;
        // M2: Ref-based guard — синхронно проверяем актуальный флаг загрузки
        if (!isReset && isLoadingItemsRef.current) return;
        
        // C1: Запоминаем ID запроса для проверки актуальности при получении ответа
        const myRequestId = ++itemsRequestIdRef.current;

        isLoadingItemsRef.current = true;
        setters.setIsLoadingList(true);
        try {
            let count = 0;
            let metaData = null;
            let total = 0;

            if (state.activeList === 'posts' || state.activeList === 'reviews_posts') {
                if (state.activeList === 'posts') {
                     const data = await api.getPostsList(project.id, pageNum, search);
                     metaData = data.meta;
                     count = data.items.length;
                     total = data.total_count;
                     // C1: Проверяем что запрос ещё актуален
                     if (state.activeProjectIdRef.current === project.id && itemsRequestIdRef.current === myRequestId) {
                        if (isReset) setters.setPosts(data.items);
                        else setters.setPosts(prev => [...prev, ...data.items]);
                     }
                } else {
                     const response: any = await api.getSubscribers(
                        project.id, 
                        pageNum, 
                        search, 
                        state.activeList as any,
                        state.filterQuality,
                        state.filterSex,
                        state.filterOnline,
                        state.filterCanWrite,
                        state.filterBdateMonth,
                        state.filterPlatform,
                        state.filterAge
                    );
                    
                    metaData = response.meta;
                    count = response.items.length;
                    total = response.total_count;
                    
                    // C1: Проверяем что запрос ещё актуален
                    if (state.activeProjectIdRef.current === project.id && itemsRequestIdRef.current === myRequestId) {
                        if (isReset) setters.setPosts(response.items);
                        else setters.setPosts(prev => [...prev, ...response.items]);
                    }
                }

            } else if (['likes', 'comments', 'reposts'].includes(state.activeList)) {
                const data = await api.getInteractionList(
                    project.id, 
                    state.activeList as 'likes' | 'comments' | 'reposts', 
                    pageNum, 
                    search,
                    state.filterQuality,
                    state.filterSex,
                    state.filterOnline,
                    state.filterBdateMonth,
                    state.filterPlatform,
                    state.filterAge
                );
                metaData = data.meta;
                count = data.items.length;
                total = data.total_count;
                // C1: Проверяем что запрос ещё актуален
                if (state.activeProjectIdRef.current === project.id && itemsRequestIdRef.current === myRequestId) {
                    if (isReset) setters.setInteractions(data.items);
                    else setters.setInteractions(prev => [...prev, ...data.items]);
                }

            } else {
                // Подписчики, История, Рассылка, Участники конкурса, Победители
                const data = await api.getSubscribers(
                    project.id, 
                    pageNum, 
                    search, 
                    state.activeList as any,
                    state.filterQuality,
                    state.filterSex,
                    state.filterOnline,
                    state.filterCanWrite,
                    state.filterBdateMonth,
                    state.filterPlatform,
                    state.filterAge
                );
                metaData = data.meta;
                count = data.items.length;
                total = data.total_count;
                // C1: Проверяем что запрос ещё актуален
                if (state.activeProjectIdRef.current === project.id && itemsRequestIdRef.current === myRequestId) {
                    if (isReset) setters.setItems(data.items);
                    else setters.setItems(prev => [...prev, ...data.items]);
                }
            }
            
            // C1: Записываем общие метаданные только если запрос актуален
            if (state.activeProjectIdRef.current === project.id && itemsRequestIdRef.current === myRequestId) {
                if (metaData) setters.setMeta(metaData);
                setters.setIsListLoaded(true);
                // m2: Используем total_count для точного определения hasMore
                // вместо эвристики count === PAGE_SIZE (избегаем лишний запрос на границе)
                setters.setHasMore(pageNum * PAGE_SIZE < total);
                setters.setPage(pageNum);
                if (isReset) setters.setTotalItemsCount(total);
            }

        } catch (e) {
            console.error(e);
            // M7: Уведомление при ошибке загрузки списка
            window.showAppToast?.('Не удалось загрузить данные списка', 'error');
        } finally {
            // M2: Снимаем ref-guard синхронно
            if (itemsRequestIdRef.current === myRequestId) {
                isLoadingItemsRef.current = false;
            }
            if (state.activeProjectIdRef.current === project.id) {
                // Снимаем UI-лоадер только если это последний запрос
                if (itemsRequestIdRef.current === myRequestId) {
                    setters.setIsLoadingList(false);
                }
            }
        }
    // M2: Убран state.isLoadingList из deps — используем ref вместо state для guard
    }, [project.id, state.activeList, state.filterQuality, state.filterSex, state.filterOnline, state.filterCanWrite, state.filterBdateMonth, state.filterPlatform, state.filterAge]);

    return {
        fetchMeta,
        fetchStats,
        fetchItems
    };
};
