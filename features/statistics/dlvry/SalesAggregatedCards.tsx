/**
 * Карточки агрегатов для таба «Статистика продаж».
 * Отображает: всего заказов, выручку, средний чек, новые клиенты.
 */

import React from 'react';
import { formatMoney } from './dlvryFormatUtils';

interface SalesAggregatedCardsProps {
    aggregated: import('../../../services/api/dlvryStats.api').DlvryAggregated | null;
    isLoading: boolean;
}

export const SalesAggregatedCards: React.FC<SalesAggregatedCardsProps> = ({ aggregated, isLoading }) => {
    if (isLoading && !aggregated) {
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
    if (!aggregated) return null;

    const cards = [
        { label: 'Всего заказов', value: String(aggregated.total_orders), color: 'text-gray-900' },
        { label: 'Выручка', value: `${formatMoney(aggregated.total_revenue)} ₽`, color: 'text-indigo-600' },
        { label: 'Средний чек', value: `${formatMoney(aggregated.avg_check)} ₽`, color: 'text-indigo-600' },
        { label: 'Новые клиенты', value: `+${aggregated.total_first_orders}`, color: 'text-green-600' },
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
