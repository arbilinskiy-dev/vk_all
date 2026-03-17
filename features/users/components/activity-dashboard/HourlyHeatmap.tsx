import React from 'react';
import { HourlyPoint } from '../../../../services/api/user_activity.api';
import { safeMax } from './utils';

// ==========================================
// Тепловая карта по часам
// ==========================================
export const HourlyHeatmap: React.FC<{ data: HourlyPoint[] }> = ({ data }) => {
    const maxCount = safeMax(data.map(d => d.count));

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        const ratio = count / maxCount;
        if (ratio > 0.75) return 'bg-indigo-600 text-white';
        if (ratio > 0.5) return 'bg-indigo-400 text-white';
        if (ratio > 0.25) return 'bg-indigo-300 text-indigo-900';
        return 'bg-indigo-100 text-indigo-700';
    };

    return (
        <div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {data.map(h => (
                    <div
                        key={h.hour}
                        className={`rounded text-center py-1 text-[10px] font-medium ${getColor(h.count)} transition-colors`}
                        title={`${h.hour}:00 — ${h.count} входов`}
                    >
                        <div className="text-[9px] opacity-70">{String(h.hour).padStart(2, '0')}</div>
                        <div className="font-bold text-[10px]">{h.count}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Ночь (0–5)</span>
                <span>Утро (6–11)</span>
                <span>День (12–17)</span>
                <span>Вечер (18–23)</span>
            </div>
        </div>
    );
};
