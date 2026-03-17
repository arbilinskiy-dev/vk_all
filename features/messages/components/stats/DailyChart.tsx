/**
 * SVG-линейный график активности по дням.
 * Используется на странице «АМ Анализ».
 */

import React from 'react';
import { AmDailyPoint } from '../../../../services/api/am_analysis.api';
import { formatShortDate, safeMax } from './amAnalysisUtils';

export const DailyChart: React.FC<{ data: AmDailyPoint[] }> = ({ data }) => {
    if (!data.length) return <div className="text-center text-gray-400 py-8">Нет данных за период</div>;

    const width = 700;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = safeMax(data.map(d => Math.max(d.total, d.dialogs_read, d.unread_dialogs_read || 0, d.messages_sent)));
    const stepX = chartW / Math.max(data.length - 1, 1);

    const makeLine = (key: keyof AmDailyPoint, color: string) => {
        const points = data.map((d, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH - (Number(d[key]) / maxVal) * chartH;
            return `${x},${y}`;
        });
        return <polyline key={key} points={points.join(' ')} fill="none" stroke={color} strokeWidth={2} />;
    };

    // Ось X: даты
    const showEveryN = Math.max(1, Math.floor(data.length / 8));

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Сетка */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = padding.top + chartH * (1 - pct);
                return (
                    <g key={pct}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                            stroke="#e5e7eb" strokeDasharray="4" />
                        <text x={padding.left - 4} y={y + 3} textAnchor="end"
                            className="text-[10px] fill-gray-400">{Math.round(maxVal * pct)}</text>
                    </g>
                );
            })}

            {/* Линии */}
            {makeLine('total', '#6366f1')}
            {makeLine('dialogs_read', '#10b981')}
            {makeLine('unread_dialogs_read', '#3b82f6')}
            {makeLine('messages_sent', '#f59e0b')}

            {/* Ось X: даты */}
            {data.map((d, i) => {
                if (i % showEveryN !== 0 && i !== data.length - 1) return null;
                const x = padding.left + i * stepX;
                return (
                    <text key={i} x={x} y={height - 4} textAnchor="middle"
                        className="text-[10px] fill-gray-400">{formatShortDate(d.date)}</text>
                );
            })}

            {/* Легенда */}
            {[
                { label: 'Всего', color: '#6366f1', x: padding.left },
                { label: 'Входы', color: '#10b981', x: padding.left + 80 },
                { label: 'Прочтения', color: '#3b82f6', x: padding.left + 155 },
                { label: 'Отправлено', color: '#f59e0b', x: padding.left + 260 },
            ].map(l => (
                <g key={l.label}>
                    <rect x={l.x} y={2} width={10} height={10} rx={2} fill={l.color} />
                    <text x={l.x + 14} y={11} className="text-[11px] fill-gray-500">{l.label}</text>
                </g>
            ))}
        </svg>
    );
};
