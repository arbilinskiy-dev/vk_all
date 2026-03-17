import React from 'react';
import { EventDistribution } from '../../../../services/api/user_activity.api';
import { EVENT_LABELS, EVENT_COLORS, FALLBACK_COLOR } from './constants';

// ==========================================
// Распределение событий (горизонтальные бары)
// ==========================================
export const EventsDistribution: React.FC<{ data: EventDistribution[] }> = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (!total) return <div className="text-center text-gray-400 py-4">Нет данных</div>;

    const sorted = [...data].sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-2">
            {sorted.map(d => {
                const pct = ((d.count / total) * 100).toFixed(1);
                const colorObj = EVENT_COLORS[d.event_type] || FALLBACK_COLOR;
                return (
                    <div key={d.event_type}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-gray-600">{EVENT_LABELS[d.event_type] || d.event_type}</span>
                            <span className="text-gray-500 font-medium">{d.count} — {pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-[width] duration-500 ${colorObj.bg}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
