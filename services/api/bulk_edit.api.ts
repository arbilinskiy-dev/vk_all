/**
 * API методы для массового редактирования постов
 */

import { PhotoAttachment, Attachment } from '../../shared/types';
import { callApi, getAuthHeaders } from '../../shared/utils/apiClient';
import { API_BASE_URL } from '../../shared/config';

// ===============================================
// ТИПЫ ЗАПРОСОВ И ОТВЕТОВ
// ===============================================

/** Информация об исходном посте */
export interface SourcePostInfo {
    id: string;
    postType: 'published' | 'scheduled' | 'system';
    projectId: string;
    text: string;
    date: string;
    attachmentIds: string[];   // ID вложений (для обратной совместимости)
}

/** Критерии сопоставления */
export interface MatchCriteria {
    byDateTime: boolean;
    byText: boolean;
}

/** Типы постов для поиска */
export interface TargetPostTypes {
    published: boolean;
    scheduled: boolean;
    system: boolean;
}

/** Запрос на поиск */
export interface BulkEditSearchRequest {
    sourcePost: SourcePostInfo;
    matchCriteria: MatchCriteria;
    searchFromDate: string;
    targetProjectIds: string[];
    targetPostTypes: TargetPostTypes;
}

/** Найденный пост */
export interface FoundPost {
    id: string;
    postType: 'published' | 'scheduled' | 'system';
    projectId: string;
    projectName: string;
    date: string;
    textPreview: string;
    attachmentPreviews: string[];  // URL миниатюр вложений
    imageCount: number;
    attachmentCount: number;
}

/** Статистика поиска */
export interface SearchStats {
    totalFound: number;
    byType: {
        published: number;
        scheduled: number;
        system: number;
    };
    projectCount: number;
}

/** Ответ на поиск */
export interface BulkEditSearchResponse {
    sourcePost: FoundPost;
    matchedPosts: FoundPost[];
    stats: SearchStats;
}

/** Пост для редактирования */
export interface PostToEdit {
    id: string;
    postType: 'published' | 'scheduled' | 'system';
    projectId: string;
}

/** Изменения для применения */
export interface BulkEditChanges {
    text: string | null;
    images: PhotoAttachment[] | null;
    attachments: Attachment[] | null;
    date: string | null;
}

/** Запрос на применение */
export interface BulkEditApplyRequest {
    posts: PostToEdit[];
    changes: BulkEditChanges;
}

/** Ответ на применение */
export interface BulkEditApplyResponse {
    taskId: string;
}

/** Прогресс задачи */
export interface TaskProgress {
    total: number;
    completed: number;
    failed: number;
    current?: string;
}

/** Ошибка задачи */
export interface TaskError {
    postId: string;
    projectName: string;
    error: string;
}

/** Статус задачи */
export interface BulkEditTaskStatus {
    status: 'pending' | 'running' | 'done' | 'error';
    progress: TaskProgress;
    errors: TaskError[];
    affectedProjectIds: string[];
}

// ===============================================
// API МЕТОДЫ
// ===============================================

/**
 * Поиск постов по заданным критериям.
 */
export const searchMatchingPosts = async (
    request: BulkEditSearchRequest
): Promise<BulkEditSearchResponse> => {
    console.log('[BULK_EDIT_API] → POST /bulkEdit/search', JSON.stringify(request, null, 2));
    const startTime = performance.now();
    try {
        const result = await callApi<BulkEditSearchResponse>('bulkEdit/search', request);
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[BULK_EDIT_API] ← /bulkEdit/search OK (${elapsed}ms), найдено: ${result.matchedPosts?.length || 0} постов`);
        return result;
    } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        console.error(`[BULK_EDIT_API] ← /bulkEdit/search FAIL (${elapsed}ms):`, err);
        throw err;
    }
};

/**
 * Запуск массового редактирования.
 * Возвращает taskId для отслеживания прогресса.
 */
export const applyBulkEdit = async (
    request: BulkEditApplyRequest
): Promise<BulkEditApplyResponse> => {
    console.log('[BULK_EDIT_API] → POST /bulkEdit/apply', {
        postsCount: request.posts.length,
        posts: request.posts,
        changes: {
            text: request.changes.text !== null ? `(${request.changes.text?.length} симв.)` : null,
            images: request.changes.images !== null ? `(${request.changes.images?.length} шт.)` : null,
            attachments: request.changes.attachments !== null ? `(${request.changes.attachments?.length} шт.)` : null,
            date: request.changes.date
        }
    });
    const startTime = performance.now();
    try {
        const result = await callApi<BulkEditApplyResponse>('bulkEdit/apply', request);
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[BULK_EDIT_API] ← /bulkEdit/apply OK (${elapsed}ms), taskId: ${result.taskId}`);
        return result;
    } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        console.error(`[BULK_EDIT_API] ← /bulkEdit/apply FAIL (${elapsed}ms):`, err);
        throw err;
    }
};

/**
 * Получение статуса задачи массового редактирования.
 */
export const getBulkEditStatus = async (
    taskId: string
): Promise<BulkEditTaskStatus> => {
    console.log(`[BULK_EDIT_API] → GET /bulkEdit/status/${taskId}`);
    const response = await fetch(`${API_BASE_URL}/bulkEdit/status/${taskId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[BULK_EDIT_API] ← /bulkEdit/status/${taskId} FAIL: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to get task status: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log(`[BULK_EDIT_API] ← /bulkEdit/status/${taskId}:`, data.status, `completed=${data.progress?.completed}/${data.progress?.total}`);
    return data;
};

/**
 * Polling статуса задачи до завершения.
 * @param taskId - ID задачи
 * @param onProgress - Callback для обновления прогресса
 * @param intervalMs - Интервал опроса в миллисекундах (по умолчанию 1000)
 * @returns Финальный статус задачи
 */
export const pollBulkEditTask = async (
    taskId: string,
    onProgress?: (status: BulkEditTaskStatus) => void,
    intervalMs: number = 1000
): Promise<BulkEditTaskStatus> => {
    console.log(`[BULK_EDIT_API] Начинаю поллинг задачи ${taskId} с интервалом ${intervalMs}ms`);
    let pollCount = 0;
    const pollStartTime = performance.now();
    
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(async () => {
            pollCount++;
            try {
                const status = await getBulkEditStatus(taskId);
                
                if (onProgress) {
                    onProgress(status);
                }
                
                if (status.status === 'done' || status.status === 'error') {
                    clearInterval(intervalId);
                    const totalTime = Math.round(performance.now() - pollStartTime);
                    console.log(`[BULK_EDIT_API] Поллинг завершён: ${pollCount} запросов за ${totalTime}ms, статус: ${status.status}`);
                    resolve(status);
                }
            } catch (e) {
                clearInterval(intervalId);
                console.error(`[BULK_EDIT_API] Поллинг прерван ошибкой на запросе #${pollCount}:`, e);
                reject(e);
            }
        }, intervalMs);
    });
};
