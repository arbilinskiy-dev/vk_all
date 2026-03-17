/**
 * Типы для раздела настроек «Админ-инструменты».
 */
import type { RefreshProgress } from '../../services/api/lists.api';

/** Состояние массовой задачи (подписчики / посты) */
export interface BulkTaskState {
    isRunning: boolean;
    taskId: string | null;
    progress: RefreshProgress | null;
}

/** Лимит постов для сбора */
export type PostsLimit = '100' | '1000' | 'all';

/** Режим сбора постов */
export type PostsMode = 'limit' | 'actual';

/** Какая задача раскрыта в таблице */
export type ExpandedTask = 'subscribers' | 'posts' | 'mailing' | null;

/** Фильтр проектов внутри прогресс-бара */
export type ProjectFilter = 'all' | 'processing' | 'done' | 'error' | 'skipped';
