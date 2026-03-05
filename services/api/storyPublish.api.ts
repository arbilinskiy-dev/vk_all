/**
 * API для прямой публикации историй (фото/видео).
 * Использует FormData для загрузки файлов, а не JSON.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

export interface DirectStoryResult {
    status: string;
    story_link: string | null;
    story_preview: string | null;
    story_type: string;
    project_id: string;
    group_id: number;
    error?: string;
}

/** Ответ мультипроектной публикации */
export interface DirectStoryMultiResponse {
    results: DirectStoryResult[];
    total: number;
    success_count: number;
    error_count: number;
}

/**
 * Публикация истории (фото или видео) напрямую из файла.
 * Отправляет файл через multipart/form-data.
 */
export const publishDirectStory = async (
    file: File,
    projectId: string,
    linkText?: string,
    linkUrl?: string,
): Promise<DirectStoryResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    if (linkText) formData.append('link_text', linkText);
    if (linkUrl) formData.append('link_url', linkUrl);

    const url = `${API_BASE_URL}/publishDirectStory`;

    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
        // НЕ устанавливаем Content-Type — браузер сам выставит multipart/form-data с boundary
    });

    if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Ошибка ${response.status}`;
        try {
            const json = JSON.parse(text);
            errorMessage = json.detail || errorMessage;
        } catch {
            errorMessage = text.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

/**
 * Мультипроектная параллельная публикация истории.
 * Файл загружается один раз, бэкенд раздаёт его по группам параллельно.
 */
export const publishDirectStoryMulti = async (
    file: File,
    projectIds: string[],
    linkText?: string,
    linkUrl?: string,
): Promise<DirectStoryMultiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_ids', JSON.stringify(projectIds));
    
    if (linkText) formData.append('link_text', linkText);
    if (linkUrl) formData.append('link_url', linkUrl);

    const url = `${API_BASE_URL}/publishDirectStoryMulti`;

    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Ошибка ${response.status}`;
        try {
            const json = JSON.parse(text);
            errorMessage = json.detail || errorMessage;
        } catch {
            errorMessage = text.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
};
