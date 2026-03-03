import { useStoriesSettings } from './useStoriesSettings';
import { useStoriesLoader } from './useStoriesLoader';
import { useStoriesUpdater } from './useStoriesUpdater';
import { usePostHelpers } from './usePostHelpers';
import { useStoriesDashboard } from './useStoriesDashboard';

/**
 * Хаб-хук автоматизации историй.
 * Композирует специализированные хуки, сохраняя единый публичный API.
 *
 * Дочерние хуки:
 *  - useStoriesSettings  — настройки, посты, логи
 *  - useStoriesLoader    — загрузка/пагинация/кэш историй
 *  - useStoriesUpdater   — обновление статистики/зрителей
 *  - usePostHelpers      — утилиты постов, ручная публикация
 *  - useStoriesDashboard — агрегированная статистика дашборда
 */
export const useStoriesAutomation = (projectId?: string, activeTab: 'settings' | 'stats' = 'settings') => {
    // 1. Настройки и данные
    const settings = useStoriesSettings(projectId);

    // 2. Загрузка и пагинация историй
    const loader = useStoriesLoader(projectId, activeTab);

    // 3. Дашборд (до updater, т.к. updater использует refreshDashboard)
    const dashboard = useStoriesDashboard(projectId);

    // 4. Обновление статистики/зрителей (с доступом к setStories для локального патча)
    //    onSuccess → refreshDashboard (перезапрос дашборда с текущими фильтрами)
    const updater = useStoriesUpdater(projectId, loader.setStories, dashboard.refreshDashboard);

    // 5. Утилиты постов (зависят от keywords и logs из settings)
    const postHelpers = usePostHelpers(projectId, settings.keywords, settings.logs, settings.loadLogs);

    return {
        // activeTab и setActiveTab передаются как props из AppContent
        stories: loader.stories,
        isLoadingStories: loader.isLoadingStories,
        loadStories: loader.loadStories,
        isSaving: settings.isSaving,
        updatingStatsId: updater.updatingStatsId,
        isActive: settings.isActive, setIsActive: settings.setIsActive,
        keywords: settings.keywords, setKeywords: settings.setKeywords,
        isLoading: settings.isLoading,
        posts: settings.posts,
        visibleCount: postHelpers.visibleCount, setVisibleCount: postHelpers.setVisibleCount,
        isPublishing: postHelpers.isPublishing,
        scrollContainerRef: postHelpers.scrollContainerRef,
        handleSave: settings.handleSave,
        handleUpdateStats: updater.handleUpdateStats,
        handleUpdateViewers: updater.handleUpdateViewers,
        handleUpdateAll: updater.handleUpdateAll,
        handleManualPublish: postHelpers.handleManualPublish,
        handleScroll: postHelpers.handleScroll,
        getPostStatus: postHelpers.getPostStatus,
        getFirstImage: postHelpers.getFirstImage,
        getCount: postHelpers.getCount,
        forceRefreshStories: loader.forceRefreshStories,
        // Пагинация историй
        totalStories: loader.totalStories,
        isLoadingMore: loader.isLoadingMore,
        loadMoreStories: loader.loadMoreStories,
        hasMore: loader.hasMore,
        // Дашборд — агрегированная статистика с бэкенда
        dashboardStats: dashboard.dashboardStats,
        isLoadingDashboard: dashboard.isLoadingDashboard,
        loadDashboardStats: dashboard.loadDashboardStats,
    };
};
