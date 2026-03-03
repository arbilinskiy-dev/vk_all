import { UnifiedStory } from '../../shared/types';
import { callApi } from '../../shared/utils/apiClient';

export const getCommunityStories = async (projectId: string, refresh: boolean = false): Promise<UnifiedStory[]> => {
    try {
        const response = await callApi<{ items: UnifiedStory[] }>('getUnifiedStories', { projectId, refresh });
        console.log(`[STORIES_API] getCommunityStories raw response for project ${projectId} (refresh=${refresh}):`, response);
        const items = response.items || [];
        return items;
    } catch (error) {
        console.error('Error fetching community stories:', error);
        return [];
    }
};

/**
 * Получение историй только из кэша БД (без VK API запросов).
 * Используется для быстрой загрузки данных при переключении проектов.
 */
export const getCachedStories = async (projectId: string): Promise<UnifiedStory[]> => {
    try {
        const response = await callApi<{ items: UnifiedStory[] }>('getCachedStories', { projectId });
        return response.items || [];
    } catch (error) {
        console.error('Error fetching cached stories:', error);
        return [];
    }
};

/**
 * Принудительное обновление историй из VK API.
 */
export const refreshStories = async (projectId: string): Promise<UnifiedStory[]> => {
    try {
        const response = await callApi<{ items: UnifiedStory[] }>('refreshStories', { projectId });
        return response.items || [];
    } catch (error) {
        console.error('Error refreshing stories:', error);
        return [];
    }
};

/**
 * Проверка свежести данных историй для проекта.
 */
export interface StoriesFreshnessResponse {
    is_stale: boolean;
    last_update: string | null;
    stale_minutes: number;
}

export const getStoriesFreshness = async (projectId: string): Promise<StoriesFreshnessResponse> => {
    try {
        return await callApi<StoriesFreshnessResponse>('getStoriesFreshness', { projectId });
    } catch (error) {
        console.error('Error checking stories freshness:', error);
        // По умолчанию считаем данные устаревшими при ошибке
        return { is_stale: true, last_update: null, stale_minutes: 5 };
    }
};
