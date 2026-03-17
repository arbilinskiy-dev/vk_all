/**
 * Карточки статистики для таба «Заказы».
 * Отображает: всего заказов, общая выручка, средний чек, заказов сегодня.
 */

import React from 'react';
import { formatMoney } from './dlvryFormatUtils';

interface OrderStatsCardsProps {
    stats: import('../../../services/api/dlvry.api').DlvryOrderStats | null;
    isLoading: boolean;
}

export const OrderStatsCards: React.FC<OrderStatsCardsProps> = ({ stats, isLoading }) => {
    if (isLoading && !stats) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }
    if (!stats) return null;

    const cards = [
        { label: 'Всего заказов', value: String(stats.total_orders), color: 'text-gray-900' },
        { label: 'Общая выручка', value: `${formatMoney(stats.total_revenue)} ₽`, color: 'text-indigo-600' },
        { label: 'Средний чек', value: `${formatMoney(stats.avg_check)} ₽`, color: 'text-indigo-600' },
        { label: 'Заказов сегодня', value: String(stats.orders_today ?? 0), color: 'text-green-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(card => (
                <div key={card.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
};
