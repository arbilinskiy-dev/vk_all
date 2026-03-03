
// ===============================================
// BATCH API — раздельные запросы для массовой загрузки
// каждого типа данных параллельно.
// Замена старого getAllPostsForProjects с батчами.
// ===============================================

import { AllPosts, ScheduledPost, SuggestedPost, SystemPost, Note } from '../../shared/types';
import { callApi } from '../../shared/utils/apiClient';


/**
 * Загружает опубликованные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getPostsBatch = async (projectIds: string[]): Promise<AllPosts> => {
    return callApi<AllPosts>('getPostsBatch', { projectIds });
};

/**
 * Загружает отложенные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getScheduledPostsBatch = async (projectIds: string[]): Promise<Record<string, ScheduledPost[]>> => {
    return callApi<Record<string, ScheduledPost[]>>('getScheduledPostsBatch', { projectIds });
};

/**
 * Загружает предложенные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getSuggestedPostsBatch = async (projectIds: string[]): Promise<Record<string, SuggestedPost[]>> => {
    return callApi<Record<string, SuggestedPost[]>>('getSuggestedPostsBatch', { projectIds });
};

/**
 * Загружает активные системные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getSystemPostsBatch = async (projectIds: string[]): Promise<Record<string, SystemPost[]>> => {
    return callApi<Record<string, SystemPost[]>>('getSystemPostsBatch', { projectIds });
};

/**
 * Загружает заметки для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getNotesBatch = async (projectIds: string[]): Promise<Record<string, Note[]>> => {
    return callApi<Record<string, Note[]>>('getNotesBatch', { projectIds });
};

/**
 * Загружает stories из кеша БД для массива проектов (1 SQL-запрос, без VK API).
 */
export const getStoriesBatch = async (projectIds: string[]): Promise<Record<string, any[]>> => {
    return callApi<Record<string, any[]>>('getStoriesBatch', { projectIds });
};
