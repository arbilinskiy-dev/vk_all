/**
 * Круговая SVG-диаграмма распределения действий по группам.
 * Используется на странице «АМ Анализ».
 */

import React from 'react';
import { AmGroupDistribution } from '../../../../services/api/am_analysis.api';
import { GROUP_COLORS } from './amAnalysisConstants';

export const GroupPieChart: React.FC<{ data: AmGroupDistribution[] }> = ({ data }) => {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const r = 80;

    let cumulativeAngle = -Math.PI / 2;
    const slices = data.map(d => {
        const angle = (d.count / total) * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;

        return {
            ...d,
            path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
            color: GROUP_COLORS[d.group] || '#9ca3af',
            pct: Math.round((d.count / total) * 100),
        };
    });

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
                ))}
                {/* Центральный круг */}
                <circle cx={cx} cy={cy} r={35} fill="white" />
                <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-bold fill-gray-800">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" className="text-[10px] fill-gray-400">действий</text>
            </svg>
            <div className="space-y-2">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-gray-600">{s.label}</span>
                        <span className="font-semibold text-gray-800 ml-auto">{s.count}</span>
                        <span className="text-gray-400 text-xs w-8 text-right">{s.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
