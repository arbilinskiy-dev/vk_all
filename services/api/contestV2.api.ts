/**
 * API клиент для Конкурс 2.0
 * Этап 1: Создание и публикация стартового поста
 */

import { callApi } from '../../shared/utils/apiClient';
import { ContestV2, ContestV2FormData } from '../../features/automations/contest-v2/types';

// ============================================
// Типы запросов
// ============================================

interface ContestV2ListRequest {
    project_id: string;
}

interface ContestV2GetRequest {
    contest_id: string;
}

interface ContestV2CreateRequest {
    project_id: string;
    is_active: boolean;
    title: string;
    description?: string;
    start_type: string;
    existing_post_link?: string;
    start_post_date?: string;
    start_post_time?: string;
    start_post_text?: string;
    start_post_images?: Array<{
        id: string;
        url: string;
    }>;
}

interface ContestV2UpdateRequest {
    contest_id: string;
    contest: Partial<ContestV2CreateRequest>;
}

interface ContestV2DeleteRequest {
    contest_id: string;
}

// ============================================
// API методы
// ============================================

/**
 * Получить список конкурсов проекта
 */
export const getContestsV2 = async (projectId: string): Promise<ContestV2[]> => {
    return callApi<ContestV2[]>('contest-v2/list', { project_id: projectId });
};

/**
 * Получить конкурс по ID
 */
export const getContestV2ById = async (contestId: string): Promise<ContestV2> => {
    return callApi<ContestV2>('contest-v2/get', { contest_id: contestId });
};

/**
 * Создать новый конкурс
 */
export const createContestV2 = async (
    projectId: string, 
    formData: ContestV2FormData
): Promise<ContestV2> => {
    const payload: ContestV2CreateRequest = {
        project_id: projectId,
        is_active: formData.is_active,
        title: formData.title,
        description: formData.description || undefined,
        start_type: formData.start_type,
        existing_post_link: formData.existing_post_link || undefined,
        start_post_date: formData.start_post_date || undefined,
        start_post_time: formData.start_post_time || undefined,
        start_post_text: formData.start_post_text || undefined,
        start_post_images: formData.start_post_images?.length 
            ? formData.start_post_images.map(img => ({
                id: img.id,
                url: img.url
            }))
            : undefined
    };
    
    return callApi<ContestV2>('contest-v2/create', payload);
};

/**
 * Обновить конкурс
 */
export const updateContestV2 = async (
    contestId: string,
    formData: Partial<ContestV2FormData>
): Promise<ContestV2> => {
    const payload: ContestV2UpdateRequest = {
        contest_id: contestId,
        contest: {
            is_active: formData.is_active,
            title: formData.title,
            description: formData.description,
            start_type: formData.start_type,
            existing_post_link: formData.existing_post_link,
            start_post_date: formData.start_post_date,
            start_post_time: formData.start_post_time,
            start_post_text: formData.start_post_text,
            start_post_images: formData.start_post_images?.map(img => ({
                id: img.id,
                url: img.url
            }))
        }
    };
    
    return callApi<ContestV2>('contest-v2/update', payload);
};

/**
 * Удалить конкурс
 */
export const deleteContestV2 = async (contestId: string): Promise<{ success: boolean; message: string }> => {
    return callApi<{ success: boolean; message: string }>('contest-v2/delete', { contest_id: contestId });
};
