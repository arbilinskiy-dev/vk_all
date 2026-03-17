
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
    return callApi<AllPosts>('getPostsBatch', { projectIds }, 'POST', { noRetry: true });
};

/**
 * Загружает отложенные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getScheduledPostsBatch = async (projectIds: string[]): Promise<Record<string, ScheduledPost[]>> => {
    return callApi<Record<string, ScheduledPost[]>>('getScheduledPostsBatch', { projectIds }, 'POST', { noRetry: true });
};

/**
 * Загружает предложенные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getSuggestedPostsBatch = async (projectIds: string[]): Promise<Record<string, SuggestedPost[]>> => {
    return callApi<Record<string, SuggestedPost[]>>('getSuggestedPostsBatch', { projectIds }, 'POST', { noRetry: true });
};

/**
 * Загружает активные системные посты для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getSystemPostsBatch = async (projectIds: string[]): Promise<Record<string, SystemPost[]>> => {
    return callApi<Record<string, SystemPost[]>>('getSystemPostsBatch', { projectIds }, 'POST', { noRetry: true });
};

/**
 * Загружает заметки для массива проектов (1 SQL-запрос на бэкенде).
 */
export const getNotesBatch = async (projectIds: string[]): Promise<Record<string, Note[]>> => {
    return callApi<Record<string, Note[]>>('getNotesBatch', { projectIds }, 'POST', { noRetry: true });
};

/**
 * Загружает stories из кеша БД для массива проектов (1 SQL-запрос, без VK API).
 */
export const getStoriesBatch = async (projectIds: string[]): Promise<Record<string, any[]>> => {
    return callApi<Record<string, any[]>>('getStoriesBatch', { projectIds }, 'POST', { noRetry: true });
};
