/**
 * SVG-график подписок/отписок по часовым слотам.
 * Две линии: allow (зелёная) и deny (красная).
 * Переиспользует визуальный паттерн MessageStatsChart, но с иными данными.
 */

import React, { useMemo } from 'react';
import { SubscriptionsChartPoint } from '../../../../services/api/message_subscriptions.api';

interface SubscriptionsChartProps {
    data: SubscriptionsChartPoint[];
}

export const SubscriptionsChart: React.FC<SubscriptionsChartProps> = ({ data }) => {
    // Автовыбор гранулярности: если > 48 точек — группируем по дням
    const chartData = useMemo(() => {
        if (data.length <= 48) return data;

        // Группируем по дням
        const dayMap = new Map<string, { allow: number; deny: number; total: number }>();
        for (const point of data) {
            const day = point.hour_slot.slice(0, 10); // "YYYY-MM-DD"
            const existing = dayMap.get(day) || { allow: 0, deny: 0, total: 0 };
            existing.allow += point.allow;
            existing.deny += point.deny;
            existing.total += point.total;
            dayMap.set(day, existing);
        }
        return Array.from(dayMap.entries()).map(([day, v]) => ({
            hour_slot: day,
            ...v,
        }));
    }, [data]);

    // Размеры SVG
    const width = 800;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Максимум Y
    const maxY = useMemo(() => {
        const m = Math.max(...chartData.map(d => Math.max(d.allow, d.deny)), 1);
        return Math.ceil(m * 1.15);
    }, [chartData]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Нет данных за выбранный период
            </div>
        );
    }

    // Координаты точек
    const n = chartData.length;
    const stepX = n > 1 ? chartW / (n - 1) : chartW / 2;

    const toX = (i: number) => padding.left + i * stepX;
    const toY = (val: number) => padding.top + chartH - (val / maxY) * chartH;

    const allowPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.allow)}`).join(' ');
    const denyPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.deny)}`).join(' ');

    // Области заливки
    const allowArea = `${allowPath} L${toX(n - 1)},${toY(0)} L${toX(0)},${toY(0)} Z`;
    const denyArea = `${denyPath} L${toX(n - 1)},${toY(0)} L${toX(0)},${toY(0)} Z`;

    // Метки оси X
    const labelInterval = Math.max(1, Math.floor(n / 8));
    const isDayMode = chartData[0]?.hour_slot.length <= 10;

    // Y-ось: 4 линии
    const yTicks = [0, 1, 2, 3, 4].map(i => Math.round((maxY / 4) * i));

    return (
        <div>
            {/* Легенда */}
            <div className="flex items-center gap-6 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600">Подписки (allow)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">Отписки (deny)</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                {/* Y-линии */}
                {yTicks.map(tick => (
                    <g key={`y-${tick}`}>
                        <line
                            x1={padding.left} y1={toY(tick)}
                            x2={width - padding.right} y2={toY(tick)}
                            stroke="#e5e7eb" strokeWidth={1}
                        />
                        <text
                            x={padding.left - 8} y={toY(tick) + 4}
                            textAnchor="end" fontSize={10} fill="#9ca3af"
                        >
                            {tick}
                        </text>
                    </g>
                ))}

                {/* Области заливки */}
                <path d={allowArea} fill="rgba(34, 197, 94, 0.08)" />
                <path d={denyArea} fill="rgba(239, 68, 68, 0.08)" />

                {/* Линии */}
                <path d={allowPath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
                <path d={denyPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" />

                {/* Точки */}
                {chartData.map((d, i) => (
                    <g key={i}>
                        <circle cx={toX(i)} cy={toY(d.allow)} r={3} fill="#22c55e" />
                        <circle cx={toX(i)} cy={toY(d.deny)} r={3} fill="#ef4444" />
                    </g>
                ))}

                {/* X-метки */}
                {chartData.map((d, i) => {
                    if (i % labelInterval !== 0 && i !== n - 1) return null;
                    const label = isDayMode
                        ? d.hour_slot.slice(5) // "MM-DD"
                        : d.hour_slot.slice(11) + ':00'; // "HH:00"
                    return (
                        <text
                            key={`x-${i}`}
                            x={toX(i)}
                            y={height - 8}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#9ca3af"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
