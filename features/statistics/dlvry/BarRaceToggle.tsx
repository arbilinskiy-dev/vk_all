/**
 * Bar Race с переключателем заказы/выручка.
 * Горизонтальные бары, отсортированные по значению, с тумблером режима.
 */

import React from 'react';
import { formatMoney } from './dlvryFormatUtils';
import type { SourceData } from './sourcesTypes';

interface BarRaceToggleProps {
    sorted: SourceData[];
    totalOrders: number;
    totalRevenue: number;
    maxOrders: number;
    maxRevenue: number;
}

export const BarRaceToggle: React.FC<BarRaceToggleProps> = ({ sorted, totalOrders, totalRevenue, maxOrders, maxRevenue }) => {
    const [mode, setMode] = React.useState<'orders' | 'revenue'>('revenue');

    return (
        <div className="flex-1 flex flex-col">
            {/* Тумблер над барами */}
            <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-0.5 self-start">
                <button
                    onClick={() => setMode('revenue')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        mode === 'revenue'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Выручка
                </button>
                <button
                    onClick={() => setMode('orders')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        mode === 'orders'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Заказы
                </button>
            </div>

            {/* Bar Race — горизонтальные бары */}
            <div className="space-y-3 flex-1">
                {sorted.map(src => {
                    const value = mode === 'orders' ? src.orders : src.revenue;
                    const total = mode === 'orders' ? totalOrders : totalRevenue;
                    const max = mode === 'orders' ? maxOrders : maxRevenue;
                    const pct = total > 0 ? ((value / total) * 100) : 0;
                    const barWidth = max > 0 ? ((value / max) * 100) : 0;
                    const display = mode === 'orders' ? String(src.orders) : `${formatMoney(src.revenue)} ₽`;

                    return (
                        <div key={src.key}>
                            {/* Название + значение + процент */}
                            <div className="flex items-center justify-between mb-1 min-w-0">
                                <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium truncate">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${src.dotClass}`} />
                                    {src.label}
                                </span>
                                <span className="text-xs tabular-nums whitespace-nowrap ml-2">
                                    <span className="font-bold text-gray-900">{display}</span>
                                    <span className="text-gray-400 ml-1.5">{pct.toFixed(1)}%</span>
                                </span>
                            </div>
                            {/* Горизонтальный бар (ширина относительно макс.) */}
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${barWidth}%`, backgroundColor: src.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
