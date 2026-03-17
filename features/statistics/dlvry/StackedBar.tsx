/**
 * Горизонтальный Stacked Bar — сегментированный прогресс-бар.
 * Используется в инфографике источников DLVRY.
 */

import React from 'react';

interface StackedBarProps {
    segments: Array<{ value: number; color: string; label: string }>;
    height?: string;
}

export const StackedBar: React.FC<StackedBarProps> = ({ segments, height = 'h-3' }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <div className={`w-full ${height} bg-gray-100 rounded-full`} />;

    return (
        <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden flex`}>
            {segments
                .filter(seg => seg.value > 0)
                .map((seg) => {
                    const pct = (seg.value / total) * 100;
                    return (
                        <div
                            key={seg.label}
                            className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                            style={{ width: `${pct}%`, backgroundColor: seg.color }}
                            title={`${seg.label}: ${pct.toFixed(1)}%`}
                        />
                    );
                })
            }
        </div>
    );
};
