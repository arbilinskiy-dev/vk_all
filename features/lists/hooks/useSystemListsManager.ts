
import { useEffect, useRef } from 'react';
import { Project } from '../../../shared/types';
import * as api from '../../../services/api';
import { RefreshProgress } from '../../../services/api/lists.api';
import { ListType, ListGroup, FilterCanWrite, getStatsLayoutGroup } from '../types';

import { useListState } from './useListState';
import { useListFetching } from './useListFetching';
import { useListPolling } from './useListPolling';
import { useMailingSSEUpdater } from './useMailingSSEUpdater';

interface UseSystemListsManagerProps {
    project: Project;
    activeListGroup: ListGroup;
    onActiveListGroupChange: (group: ListGroup) => void;
}

// Вспомогательная функция для определения группы по типу списка
const getGroupForList = (listType: ListType): ListGroup | null => {
    if (['subscribers', 'mailing', 'history_join', 'history_leave', 'history_timeline'].includes(listType)) return 'subscribers';
    if (['likes', 'comments', 'reposts'].includes(listType)) return 'activities';
    if (['reviews_winners', 'reviews_participants', 'reviews_posts'].includes(listType)) return 'automations';
    if (['posts', 'authors'].includes(listType)) return 'other';
    return null;
};

export const useSystemListsManager = ({ project, activeListGroup, onActiveListGroupChange }: UseSystemListsManagerProps) => {
    // 1. Инициализация состояния
    const { state, setters } = useListState({ project, activeListGroup, onActiveListGroupChange });

    // 2. Инициализация логики загрузки данных (передаем состояние и сеттеры)
    const fetchers = useListFetching(project, state, setters);

    // 3. Инициализация логики фоновых задач (передаем также методы загрузки для обновления после завершения)
    const pollers = useListPolling(project, state, setters, fetchers);

    // 4. Real-time обновление рассылки через SSE (при callback message_new →
    //    бэкенд обновляет пользователя в SystemListMailing и шлёт SSE mailing_user_updated)
    useMailingSSEUpdater({
        projectId: project.id,
        activeList: state.activeList,
        searchQuery: state.searchQuery,
        fetchItems: fetchers.fetchItems,
        fetchStats: fetchers.fetchStats,
        fetchMeta: fetchers.fetchMeta,
    });
    
    // Реф для отслеживания первого рендера (для разрешения конфликта приоритетов)
    const isFirstRun = useRef(true);

    // --- Effects (Реакция на изменения) ---

    // Проверка активных задач при загрузке/смене проекта для восстановления лоадеров
    useEffect(() => {
        pollers.checkActiveTasks();
    }, [project.id]);

    // Сброс состояния при смене проекта (activeList — сквозной, не зависит от проекта)
    // UX: НЕ обнуляем данные (items/posts/interactions/stats) — оставляем старые
    // под overlay, чтобы не мигать скелетонами. Новые данные заменят
    // атомарно при получении ответа от API (fetchItems с isReset=true).
    useEffect(() => {
        // Сброс сервисных состояний
        setters.resetFilters();
        setters.resetStatsParams();
        setters.setRefreshStates(setters.DEFAULT_REFRESH_STATES);
        setters.setIsRefreshingSubscriberDetails(false);
        setters.setIsSyncModalOpen(false);
        setters.setInteractionSyncType(null);
        setters.setSearchQuery('');
        setters.setPage(1);
        setters.setTotalItemsCount(0);
        setters.setHasMore(false);

        // isListLoaded=false → покажет overlay поверх старых данных (не скелетон!)
        // Loading effect [activeList, isListLoaded] подхватит и загрузит данные
        setters.setIsListLoaded(false);
    }, [project.id]);

    // 1. Синхронизация Группы с Активным списком (Список -> Группа)
    // Если активный список изменился (например, загрузился из localStorage), 
    // убеждаемся, что выбрана правильная группа вкладок.
    useEffect(() => {
        if (state.activeList) {
            const requiredGroup = getGroupForList(state.activeList);
            if (requiredGroup && requiredGroup !== state.activeGroup) {
                setters.setActiveGroup(requiredGroup);
            }
        }
    }, [state.activeList]);

    // 2. Синхронизация Списка с Группой (Группа -> Список)
    // Если пользователь вручную переключил группу вкладок, а текущий список 
    // к ней не относится - сбрасываем выбор списка, чтобы показать "пустое" состояние.
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            // При первой загрузке приоритет у сохраненного списка (Effect 1),
            // поэтому здесь мы ничего не делаем, чтобы не сбросить его.
            return;
        }

        if (state.activeList) {
            const currentListGroup = getGroupForList(state.activeList);
            if (currentListGroup && currentListGroup !== state.activeGroup) {
                setters.setActiveList(null);
            }
        }
    }, [state.activeGroup]);

    // Обновление при изменении фильтров списка
    useEffect(() => {
        if (state.activeList && state.isListLoaded) {
            setters.setPage(1);
            fetchers.fetchItems(1, state.searchQuery, true);
        }
    }, [state.filterQuality, state.filterSex, state.filterOnline, state.filterCanWrite, state.filterBdateMonth, state.filterPlatform, state.filterAge]);

    // Обновление статистики при изменении настроек периода или фильтра рассылки
    useEffect(() => {
        if (state.activeList && state.isListLoaded) {
            // Если период кастомный, ждем пока будут выбраны обе даты
            if (state.statsPeriod === 'custom' && (!state.statsDateFrom || !state.statsDateTo)) {
                return; 
            }
            fetchers.fetchStats(state.activeList);
        }
    }, [state.statsPeriod, state.statsGroupBy, state.statsDateFrom, state.statsDateTo, state.filterCanWrite]);

    // Загрузка данных при переключении активной вкладки (таба) или при смене проекта
    useEffect(() => {
        if (!state.isListLoaded) {
            if (state.activeList) {
                // Есть активный список — загружаем таблицу + статистику
                // (fetchItems также возвращает meta для бейджей навигации — M4)
                fetchers.fetchItems(1, '', true);
                fetchers.fetchStats(state.activeList);
            } else {
                // Нет выбранного списка (первое посещение проекта) —
                // загружаем meta для бейджей карточек навигации
                fetchers.fetchMeta();
                setters.setIsListLoaded(true);
            }
        }
    }, [state.activeList, state.isListLoaded]);

    // Debounce поиска
    // M1 fix: Убран isListLoaded из deps — его изменение false→true после загрузки таба
    // вызывало повторный fetchItems (дубль). Guard внутри эффекта достаточен.
    useEffect(() => {
        if (!state.isListLoaded || !state.activeList) return;
        const timerId = setTimeout(() => {
            fetchers.fetchItems(1, state.searchQuery, true);
        }, 500);
        return () => clearTimeout(timerId);
    }, [state.searchQuery, state.activeList]);


    // --- Обработчики действий (Actions) ---

    const handleTabChange = (type: ListType) => {
        if (state.activeList === type) return;
        
        // Определяем, одинаковая ли структура дашборда у прошлого и нового списка.
        // Если layout-группа совпадает — НЕ сбрасываем stats (нет скелетона),
        // данные обновятся внутри карточек с opacity-overlay.
        const prevGroup = state.activeList ? getStatsLayoutGroup(state.activeList) : null;
        const nextGroup = getStatsLayoutGroup(type);
        const sameLayout = prevGroup === nextGroup;
        
        setters.setActiveList(type);
        setters.setIsListLoaded(false);
        
        if (!sameLayout) {
            // Другая структура дашборда — полный сброс, покажем скелетон
            setters.setStats(null);
        }
        // Если sameLayout — stats сохраняется, UserStatsView покажет opacity-60 overlay
        
        // НЕ очищаем items/posts/interactions — старые данные остаются под overlay,
        // новые загрузятся через fetchItems(isReset=true) и заменят атомарно
        setters.setTotalItemsCount(0);
        setters.setSearchQuery('');
        setters.setPage(1);
        setters.resetFilters();
        setters.resetStatsParams();
    };

    const handleLoadMore = () => {
        if (state.hasMore && !state.isLoadingList && state.isListLoaded) {
            fetchers.fetchItems(state.page + 1, state.searchQuery, false);
        }
    };
    
    const handleResetFilters = () => {
        setters.resetFilters();
        setters.setSearchQuery('');
    };

    // Новый метод для специфичного обновления постов
    const handleRefreshPostsWithLimit = async (limit: '1000' | 'all') => {
        const listType = 'posts';
        setters.setRefreshStates(prev => ({
            ...prev,
            [listType]: { isRefreshing: true, label: "Старт..." }
        }));
        
        try {
            const onProgress = (progress: RefreshProgress) => {
                if (state.activeProjectIdRef.current !== project.id) return;
                let newLabel = "";
                if (progress.status === 'fetching') newLabel = `${progress.loaded}...`;
                else if (progress.status === 'processing') newLabel = 'Анализ';
                else if (progress.status === 'done') newLabel = 'Готово';
                
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [listType]: { isRefreshing: true, label: newLabel }
                }));
            };

            await api.refreshPostsStream(project.id, onProgress, limit);

            if (state.activeProjectIdRef.current === project.id) {
                // M4: fetchItems уже возвращает meta — отдельный fetchMeta не нужен
                if (state.activeList === listType) {
                    await Promise.all([
                        fetchers.fetchItems(1, state.searchQuery, true),
                        fetchers.fetchStats(listType),
                    ]);
                } else {
                    // Активный список другой — обновляем только счётчики карточек
                    await fetchers.fetchMeta();
                }
            }
        } catch (e) {
             if (state.activeProjectIdRef.current === project.id) {
                window.showAppToast?.("Не удалось обновить список постов: " + (e instanceof Error ? e.message : String(e)), 'error');
             }
        } finally {
             if (state.activeProjectIdRef.current === project.id) {
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [listType]: { isRefreshing: false, label: null }
                }));
             }
        }
    };


    const handleRefreshList = async (listType: ListType | 'author_details' | 'mailing_analysis', mode?: 'missing' | 'full') => {
        if (listType === 'posts') {
             // Если вызван без параметров (например, из старого интерфейса), дефолт 1000
             handleRefreshPostsWithLimit('1000');
             return;
        }
        
        if (['likes', 'comments', 'reposts'].includes(listType)) {
            setters.setInteractionSyncType(listType as 'likes' | 'comments' | 'reposts');
            setters.setIsSyncModalOpen(true);
            return;
        }

        // Особый случай для авторов и анализа
        let targetKey: ListType = listType as ListType;
        
        if (listType === 'author_details') {
            targetKey = 'authors';
        } else if (listType === 'mailing_analysis') {
            targetKey = 'mailing';
        }

        setters.setRefreshStates(prev => ({
            ...prev,
            [targetKey]: { isRefreshing: true, label: "Старт..." }
        }));

        try {
            const onProgress = (progress: RefreshProgress) => {
                if (state.activeProjectIdRef.current !== project.id) return;

                let newLabel = "";
                if (progress.status === 'fetching' || progress.status === 'processing') {
                     if (listType === 'mailing_analysis') {
                         newLabel = `Анализ ${progress.loaded}${progress.total ? '/' + progress.total : ''}`;
                     } else {
                         newLabel = `${progress.loaded}${progress.total ? '/' + progress.total : ''}`;
                     }
                } else if (progress.status === 'done') {
                    newLabel = 'Готово';
                }
                
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [targetKey]: { isRefreshing: true, label: newLabel }
                }));
            };

            if (listType === 'subscribers') {
                await api.refreshSubscribersStream(project.id, onProgress);
            } else if (listType === 'history_join' || listType === 'history_leave') {
                await api.refreshHistoryStream(project.id, listType as any, onProgress);
            } else if (listType === 'mailing') {
                await api.refreshMailingStream(project.id, onProgress);
            } else if (listType === 'author_details') {
                await api.refreshAuthorDetailsStream(project.id, onProgress);
            } else if (listType === 'mailing_analysis') {
                await api.analyzeMailingStream(project.id, onProgress, mode || 'missing');
            }

            if (state.activeProjectIdRef.current === project.id) {
                // M4: fetchItems уже возвращает meta
                if (state.activeList === targetKey) {
                    await Promise.all([
                        fetchers.fetchItems(1, state.searchQuery, true),
                        fetchers.fetchStats(targetKey as any),
                    ]);
                } else {
                    await fetchers.fetchMeta();
                }
            }
        } catch (e) {
             if (state.activeProjectIdRef.current === project.id) {
                window.showAppToast?.("Не удалось выполнить операцию: " + (e instanceof Error ? e.message : String(e)), 'error');
             }
        } finally {
             if (state.activeProjectIdRef.current === project.id) {
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [targetKey]: { isRefreshing: false, label: null }
                }));
             }
        }
    };

    const handleSyncInteractions = async (dateFrom: string, dateTo: string) => {
        const typeToSync = state.interactionSyncType;
        if (!typeToSync) {
            console.error("handleSyncInteractions called without an interaction type.");
            return;
        }
        
        setters.setIsSyncModalOpen(false);
        
        setters.setRefreshStates(prev => ({
            ...prev,
            [typeToSync]: { isRefreshing: true, label: "Старт" }
        }));

        try {
             const onProgress = (progress: RefreshProgress) => {
                if (state.activeProjectIdRef.current !== project.id) return;
                let newLabel = "";
                if (progress.status === 'fetching') newLabel = `${progress.loaded}/${progress.total || '?'}`;
                else if (progress.status === 'processing') newLabel = 'Запись';
                else if (progress.status === 'done') newLabel = 'Готово';
                
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [typeToSync]: { isRefreshing: true, label: newLabel }
                }));
            };
            
            await api.refreshInteractionsStream(project.id, dateFrom, dateTo, typeToSync, onProgress);
            
            if (state.activeProjectIdRef.current === project.id) {
                // M4: fetchItems уже возвращает meta
                if (state.activeList && ['likes', 'comments', 'reposts'].includes(state.activeList)) {
                    await Promise.all([
                        fetchers.fetchItems(1, state.searchQuery, true),
                        fetchers.fetchStats(state.activeList),
                    ]);
                } else {
                    await fetchers.fetchMeta();
                }
            }

        } catch (e) {
            window.showAppToast?.("Ошибка синхронизации: " + (e instanceof Error ? e.message : String(e)), 'error');
        } finally {
            setters.setRefreshStates(prev => ({
                ...prev,
                [typeToSync]: { isRefreshing: false, label: null }
            }));
            setters.setInteractionSyncType(null); // Сброс типа
        }
    };

    const handleRefreshInteractionUsers = async () => {
        if (!state.activeList || !['likes', 'comments', 'reposts'].includes(state.activeList)) return;
        
        const listType = state.activeList as ListType;
        
        setters.setRefreshStates(prev => ({
            ...prev,
            [listType]: { isRefreshing: true, label: "..." }
        }));
        
        try {
             const onProgress = (progress: RefreshProgress) => {
                if (state.activeProjectIdRef.current !== project.id) return;
                 
                let newLabel = "...";
                if (progress.status === 'fetching') newLabel = `${progress.loaded}`;
                
                setters.setRefreshStates(prev => ({
                    ...prev,
                    [listType]: { isRefreshing: true, label: newLabel }
                }));
            };
            
            await api.refreshInteractionUsersStream(project.id, listType as 'likes' | 'comments' | 'reposts', onProgress);
            
            if (state.activeProjectIdRef.current === project.id) {
                // M3: Параллельная загрузка
                await Promise.all([
                    fetchers.fetchItems(1, state.searchQuery, true),
                    fetchers.fetchStats(listType),
                ]);
                window.showAppToast?.("Данные пользователей обновлены.", 'success');
            }
            
        } catch (e) {
            window.showAppToast?.("Ошибка обновления пользователей: " + (e instanceof Error ? e.message : String(e)), 'error');
        } finally {
            setters.setRefreshStates(prev => ({
                ...prev,
                [listType]: { isRefreshing: false, label: null }
            }));
        }
    };

    const handleRefreshSubscriberDetails = async () => {
        if (state.activeList !== 'subscribers') return;
        
        setters.setIsRefreshingSubscriberDetails(true);
        try {
            const onProgress = (progress: RefreshProgress) => {
                console.log(`Refreshing subscriber details: ${progress.status}, ${progress.loaded}/${progress.total}`);
            };

            await api.refreshSubscriberDetailsStream(project.id, onProgress);
            
            if (state.activeProjectIdRef.current === project.id) {
                // M3: Параллельная загрузка
                await Promise.all([
                    fetchers.fetchItems(1, state.searchQuery, true),
                    fetchers.fetchStats('subscribers'),
                ]);
                window.showAppToast?.("Данные подписчиков (статус, онлайн, город) обновлены.", 'success');
            }
        } catch (e) {
            window.showAppToast?.("Ошибка обновления деталей: " + (e instanceof Error ? e.message : String(e)), 'error');
        } finally {
            setters.setIsRefreshingSubscriberDetails(false);
        }
    };

    // Очистка базы списка — мягкий сброс без перезагрузки страницы
    const handleClearList = async (listType: string): Promise<void> => {
        await api.clearListData(project.id, listType);
        
        if (state.activeProjectIdRef.current === project.id) {
            // Мягкий сброс: очищаем локальные данные и перезагружаем с сервера
            setters.setItems([]);
            setters.setPosts([]);
            setters.setInteractions([]);
            setters.setStats(null);
            setters.setTotalItemsCount(0);
            setters.setPage(1);
            setters.setSearchQuery('');
            setters.setHasMore(false);
            
            // M4: fetchItems уже возвращает meta
            if (state.activeList === listType) {
                await Promise.all([
                    fetchers.fetchItems(1, '', true),
                    fetchers.fetchStats(state.activeList),
                ]);
            } else {
                await fetchers.fetchMeta();
            }
            
            window.showAppToast?.('База списка успешно очищена', 'success');
        }
    };

    return {
        state,
        actions: {
            setActiveGroup: setters.setActiveGroup,
            setSearchQuery: setters.setSearchQuery,
            setFilterQuality: setters.setFilterQuality,
            setFilterSex: setters.setFilterSex,
            setFilterOnline: setters.setFilterOnline,
            setFilterCanWrite: setters.setFilterCanWrite,
            setFilterBdateMonth: setters.setFilterBdateMonth,
            setFilterPlatform: setters.setFilterPlatform,
            setFilterAge: setters.setFilterAge, // New
            setIsSyncModalOpen: setters.setIsSyncModalOpen,
            setStatsPeriod: setters.setStatsPeriod,
            setStatsGroupBy: setters.setStatsGroupBy,
            setStatsDateFrom: setters.setStatsDateFrom,
            setStatsDateTo: setters.setStatsDateTo,
            handleRefreshList,
            handleRefreshPostsWithLimit,
            handleSyncInteractions,
            handleRefreshInteractionUsers,
            handleRefreshSubscriberDetails,
            handleResetFilters,
            handleTabChange,
            handleLoadMore,
            handleClearList
        }
    };
};
