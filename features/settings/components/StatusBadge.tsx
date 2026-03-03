/**
 * Компонент бейджа статуса задачи.
 * Отображает статус (Готово / Ошибка / Ожидание / Работа).
 */
import React from 'react';
import type { RefreshProgress } from '../../../services/api/lists.api';

interface StatusBadgeProps {
    progress: RefreshProgress | null;
}

/** Рендерит бейдж статуса для таблицы операций */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ progress }) => {
    if (!progress) return null;

    switch (progress.status) {
        case 'done':
            return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">Готово</span>;
        case 'error':
            return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">Ошибка</span>;
        case 'pending':
            return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">Ожидание</span>;
        case 'fetching':
        case 'processing':
            return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 animate-pulse whitespace-nowrap">Работа</span>;
        default:
            return null;
    }
};
