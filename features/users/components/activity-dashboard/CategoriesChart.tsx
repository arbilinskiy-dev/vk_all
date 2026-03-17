import React from 'react';
import { safeMax } from './utils';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './constants';

// ==========================================
// Компонент: Распределение по категориям
// ==========================================
export const CategoriesChart: React.FC<{ data: Array<{ category: string; count: number }> }> = ({ data }) => {
    if (!data.length) return <div className="text-center text-gray-400 py-6 text-sm">Нет данных о действиях</div>;
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    const maxCount = safeMax(data.map(d => d.count));

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.category}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{CATEGORY_LABELS[item.category] || item.category}</span>
                        <span className="text-gray-500">{item.count} ({Math.round(item.count / total * 100)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(item.count / maxCount) * 100}%`,
                                backgroundColor: CATEGORY_COLORS[item.category] || '#94a3b8',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
