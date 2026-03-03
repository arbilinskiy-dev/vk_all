// Типы для TokenLogsDashboard модуля

/**
 * Тип действия для модального окна подтверждения удаления
 */
export type ConfirmAction = 'deleteOne' | 'deleteSelected' | 'deleteAll' | null;

/**
 * Props для TokenLogsDashboard компонента
 */
export interface TokenLogsDashboardProps {
    mode: 'vk' | 'ai';
}

/**
 * Опция для мультиселекта
 */
export interface SelectOption {
    id: string;
    label: string;
}

/**
 * Фильтр по статусу
 */
export type StatusFilter = 'all' | 'success' | 'error';
