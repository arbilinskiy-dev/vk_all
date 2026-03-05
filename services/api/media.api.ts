import { Album, Photo, PhotoAttachment, Attachment } from '../../shared/types';
import { callApi, getAuthHeaders } from '../../shared/utils/apiClient';
import { API_BASE_URL } from '../../shared/config';

// --- MEDIA API ---

/**
 * Загружает фотоальбомы для проекта (из кеша или VK).
 */
export const getAlbums = async (projectId: string): Promise<Album[]> => {
    return callApi<Album[]>('media/getAlbums', { projectId });
}

/**
 * Принудительно обновляет список альбомов из VK.
 */
export const refreshAlbums = async (projectId: string): Promise<Album[]> => {
    return callApi<Album[]>('media/refreshAlbums', { projectId });
}

/**
 * Загружает фотографии для альбома (из кеша или VK).
 */
export const getPhotos = async (projectId: string, albumId: string, page: number): Promise<{ photos: Photo[], hasMore: boolean }> => {
    return callApi<{ photos: Photo[], hasMore: boolean }>('media/getPhotos', { projectId, albumId, page });
}

/**
 * Принудительно обновляет фотографии в альбоме из VK.
 */
export const refreshPhotos = async (projectId: string, albumId: string): Promise<{ photos: Photo[], hasMore: boolean }> => {
    return callApi<{ photos: Photo[], hasMore: boolean }>('media/refreshPhotos', { projectId, albumId });
}

/**
 * Создает новый фотоальбом.
 */
export const createAlbum = async (projectId: string, title: string): Promise<Album> => {
    return callApi<Album>('media/createAlbum', { projectId, title });
};


/**
 * Таймаут для загрузки фото (60 секунд).
 */
const UPLOAD_TIMEOUT_MS = 60000;

/**
 * Максимальное количество повторных попыток.
 */
const MAX_RETRIES = 2;

/**
 * Задержка между повторными попытками (мс).
 */
const RETRY_DELAY_MS = 2000;

/**
 * Вспомогательная функция для задержки.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Проверяет, является ли ошибка сетевой (retriable).
 */
const isRetriableError = (error: unknown): boolean => {
    if (error instanceof Error) {
        // Таймаут или AbortError
        if (error.name === 'AbortError') return true;
        // Сетевые ошибки
        if (error.message.includes('Failed to fetch')) return true;
        if (error.message.includes('NetworkError')) return true;
        if (error.message.includes('net::ERR')) return true;
        // 5xx ошибки сервера
        if (error.message.includes('500') || error.message.includes('502') || 
            error.message.includes('503') || error.message.includes('504')) return true;
    }
    return false;
};

/**
 * Загружает одно фото на сервер VK через наш бэкенд.
 * Добавлен таймаут (60 сек) и автоматический retry при сетевых ошибках.
 */
export const uploadPhoto = async (file: File, projectId: string): Promise<PhotoAttachment> => {
    const url = `${API_BASE_URL}/media/uploadPhoto`;
    
    let lastError: Error = new Error('Неизвестная ошибка');
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES} for file upload...`);
            await delay(RETRY_DELAY_MS);
        }
        
        // Важно: создаём новый FormData на каждую попытку
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        
        console.log(`🚀 Uploading file to: ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        // Создаём AbortController для таймаута
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: getAuthHeaders(false),
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const result = await response.json();

            if (!response.ok) {
                const errorText = result.detail || `HTTP error! status: ${response.status}`;
                throw new Error(errorText);
            }
            
            console.log(`✅ File uploaded successfully for project ${projectId}`);
            return result as PhotoAttachment;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            const errorInstance = error instanceof Error ? error : new Error(String(error));
            lastError = errorInstance;
            
            // Проверяем, был ли запрос отменён по таймауту
            if (errorInstance.name === 'AbortError') {
                console.error(`⏱️ Upload timeout for project ${projectId} after ${UPLOAD_TIMEOUT_MS / 1000}s`);
                lastError = new Error('Превышено время ожидания загрузки. Попробуйте ещё раз.');
            }
            
            console.error(`❌ Upload failed (attempt ${attempt + 1}):`, errorInstance.message);
            
            // Если ошибка не retriable или это последняя попытка - выбрасываем
            if (!isRetriableError(error) || attempt === MAX_RETRIES) {
                throw lastError;
            }
            
            // Иначе продолжаем цикл (retry)
        }
    }
    
    // На случай если вышли из цикла без return/throw
    throw lastError;
};

/**
 * Загружает одно фото в конкретный альбом VK через наш бэкенд.
 * Добавлен таймаут (60 сек) и автоматический retry при сетевых ошибках.
 */
export const uploadPhotoToAlbum = async (file: File, projectId: string, albumId: string): Promise<Photo> => {
    const url = `${API_BASE_URL}/media/uploadPhotoToAlbum`;
    
    let lastError: Error = new Error('Неизвестная ошибка');
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES} for album upload...`);
            await delay(RETRY_DELAY_MS);
        }
        
        // Важно: создаём новый FormData на каждую попытку
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('albumId', albumId);
        
        console.log(`🚀 Uploading file to album ${albumId} via: ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        // Создаём AbortController для таймаута
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'POST',                headers: getAuthHeaders(false),                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const result = await response.json();

            if (!response.ok) {
                const errorText = result.detail || `HTTP error! status: ${response.status}`;
                throw new Error(errorText);
            }
            
            console.log(`✅ File uploaded to album ${albumId} successfully`);
            return result as Photo;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            const errorInstance = error instanceof Error ? error : new Error(String(error));
            lastError = errorInstance;
            
            // Проверяем, был ли запрос отменён по таймауту
            if (errorInstance.name === 'AbortError') {
                console.error(`⏱️ Upload timeout for album ${albumId} after ${UPLOAD_TIMEOUT_MS / 1000}s`);
                lastError = new Error('Превышено время ожидания загрузки. Попробуйте ещё раз.');
            }
            
            console.error(`❌ Album upload failed (attempt ${attempt + 1}):`, errorInstance.message);
            
            // Если ошибка не retriable или это последняя попытка - выбрасываем
            if (!isRetriableError(error) || attempt === MAX_RETRIES) {
                throw lastError;
            }
            
            // Иначе продолжаем цикл (retry)
        }
    }
    
    // На случай если вышли из цикла без return/throw
    throw lastError;
};


/**
 * Таймаут для загрузки видео (5 минут — видео значительно больше фото).
 */
const VIDEO_UPLOAD_TIMEOUT_MS = 300000;

/**
 * Загружает видео в сообщество VK через бэкенд.
 * Увеличен таймаут (5 минут) из-за большого размера видеофайлов.
 * Добавлен автоматический retry при сетевых ошибках.
 */
export const uploadVideo = async (
    file: File,
    projectId: string,
    externalSignal?: AbortSignal,
): Promise<Attachment> => {
    const url = `${API_BASE_URL}/media/uploadVideo`;
    
    let lastError: Error = new Error('Неизвестная ошибка');
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        // Если внешний signal уже отменён — не пытаемся повторять
        if (externalSignal?.aborted) {
            throw new Error('Загрузка отменена пользователем');
        }

        if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES} for video upload...`);
            await delay(RETRY_DELAY_MS);
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        
        console.log(`🚀 Uploading video to: ${url} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        // Комбинируем внешний signal отмены с таймаутом
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), VIDEO_UPLOAD_TIMEOUT_MS);
        
        // Если внешний signal сработает — отменяем и наш fetch
        const onExternalAbort = () => timeoutController.abort();
        externalSignal?.addEventListener('abort', onExternalAbort);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: getAuthHeaders(false),
                body: formData,
                signal: timeoutController.signal,
            });

            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', onExternalAbort);

            const result = await response.json();

            if (!response.ok) {
                const errorText = result.detail || `HTTP error! status: ${response.status}`;
                throw new Error(errorText);
            }
            
            console.log(`✅ Video uploaded successfully for project ${projectId}`);
            return result as Attachment;
            
        } catch (error) {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', onExternalAbort);
            
            const errorInstance = error instanceof Error ? error : new Error(String(error));
            lastError = errorInstance;
            
            // Отмена пользователем — не retry, сразу выбрасываем
            if (externalSignal?.aborted) {
                throw new Error('Загрузка отменена пользователем');
            }
            
            if (errorInstance.name === 'AbortError') {
                console.error(`⏱️ Video upload timeout for project ${projectId} after ${VIDEO_UPLOAD_TIMEOUT_MS / 1000}s`);
                lastError = new Error('Превышено время ожидания загрузки видео. Попробуйте ещё раз.');
            }
            
            console.error(`❌ Video upload failed (attempt ${attempt + 1}):`, errorInstance.message);
            
            if (!isRetriableError(error) || attempt === MAX_RETRIES) {
                throw lastError;
            }
        }
    }
    
    throw lastError;
};


// === МУЛЬТИПРОЕКТНАЯ ПЕРЕЗАГРУЗКА МЕДИА ===

/**
 * Тип результата перезагрузки для одного проекта
 */
export interface ReuploadProjectResult {
    images: PhotoAttachment[];
    attachments: Attachment[];
}

/**
 * Детали ошибки перезагрузки для конкретного проекта
 */
export interface ReuploadFailedProject {
    project_id: string;
    error: string;
}

/**
 * Тип ответа от эндпоинта перезагрузки.
 * mapping — успешно перезагруженные проекты.
 * failed — проекты с ошибками (таймаут, VK API, и т.д.) — кандидаты на retry.
 */
export interface ReuploadForProjectsResponse {
    mapping: Record<string, ReuploadProjectResult>;
    failed: ReuploadFailedProject[];
}

/**
 * Таймаут для перезагрузки медиа (10 минут — несколько фото и видео для нескольких проектов).
 */
const REUPLOAD_TIMEOUT_MS = 600000;

/**
 * Перезагружает медиа (фото + видео) в указанные целевые проекты.
 * Фото скачиваются по URL с VK CDN и загружаются в целевые группы.
 * Видео загружаются из оригинальных файлов (File объекты из браузера).
 * 
 * @param targetProjectIds - ID проектов, куда надо перезагрузить медиа
 * @param photos - Массив фотоаттачментов [{id, url}]
 * @param videoFiles - Map: attachmentId → File (оригинальные видеофайлы)
 * @param videoAttachmentIds - ID видеоаттачментов (для маппинга с файлами)
 */
export const reuploadForProjects = async (
    targetProjectIds: string[],
    photos: PhotoAttachment[],
    videoFiles: Map<string, File>,
    videoAttachmentIds: string[],
): Promise<ReuploadForProjectsResponse> => {
    const url = `${API_BASE_URL}/media/reuploadForProjects`;
    
    const formData = new FormData();
    
    // JSON-параметры
    formData.append('target_project_ids', JSON.stringify(targetProjectIds));
    formData.append('photos_json', JSON.stringify(
        photos.map(p => ({ id: p.id, url: p.url }))
    ));
    formData.append('video_attachment_ids', JSON.stringify(videoAttachmentIds));
    
    // Видеофайлы (порядок соответствует video_attachment_ids)
    for (const vid of videoAttachmentIds) {
        const file = videoFiles.get(vid);
        if (file) {
            formData.append('files', file);
        }
    }
    
    console.log(`🔄 [Reupload] Запрос перезагрузки: ${photos.length} фото, ${videoAttachmentIds.length} видео → ${targetProjectIds.length} проектов`);
    
    // Создаём AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REUPLOAD_TIMEOUT_MS);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(false),
            body: formData,
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        if (!response.ok) {
            const errorText = result.detail || `HTTP error! status: ${response.status}`;
            throw new Error(errorText);
        }
        
        console.log(`✅ [Reupload] Успешно: ${Object.keys(result.mapping || {}).length} проектов`);
        if (result.failed?.length > 0) {
            console.warn(`⚠️ [Reupload] Ошибки для ${result.failed.length} проектов:`, result.failed);
        }
        
        return result as ReuploadForProjectsResponse;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Превышено время ожидания перезагрузки медиа. Попробуйте с меньшим количеством проектов.');
        }
        
        throw error;
    }
};