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
