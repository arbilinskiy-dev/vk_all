/**
 * Утилиты для раздела «Админ-инструменты».
 * Форматирование, парсинг данных воркеров/проектов.
 */
import type { WorkerProgress, ProjectProgress } from '../../../services/api/lists.api';

/**
 * Форматирует длительность в секундах в удобочитаемый формат (мин:сек)
 */
export const formatDuration = (seconds: number): string => {
    if (seconds < 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) {
        return `${secs} сек`;
    }
    return `${mins} мин ${secs} сек`;
};

/**
 * Парсинг данных о воркерах из sub_message (старый формат)
 */
export const parseWorkersData = (subMessage: string | undefined): WorkerProgress[] | null => {
    if (!subMessage) return null;
    try {
        const data = JSON.parse(subMessage);
        if (Array.isArray(data) && data.length > 0 && ('worker_id' in data[0] || 'id' in data[0]) && 'current' in data[0]) {
            return data;
        }
    } catch {
        // Не JSON или невалидный формат
    }
    return null;
};

/**
 * Парсинг данных о проектах из sub_message (новый формат v2)
 */
export const parseProjectsData = (subMessage: string | undefined): ProjectProgress[] | null => {
    if (!subMessage) return null;
    try {
        const data = JSON.parse(subMessage);
        if (Array.isArray(data) && data.length > 0 && 'project_id' in data[0]) {
            return data;
        }
    } catch {
        // Не JSON или невалидный формат
    }
    return null;
};

/**
 * Упрощённый прогресс проекта (рассылка и подобные задачи).
 * Формат: {name, status, message?, error?}
 */
export interface SimpleProjectProgress {
    name: string;
    status: 'done' | 'error' | 'processing';
    message?: string;
    error?: string;
}

/**
 * Парсинг упрощённых данных о проектах из sub_message (формат рассылки).
 * Отличается от v2: нет project_id, есть name + status + message.
 */
export const parseSimpleProjectsData = (subMessage: string | undefined): SimpleProjectProgress[] | null => {
    if (!subMessage) return null;
    try {
        const data = JSON.parse(subMessage);
        if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'status' in data[0] && !('project_id' in data[0]) && !('worker_id' in data[0])) {
            return data;
        }
    } catch {
        // Не JSON или невалидный формат
    }
    return null;
};
