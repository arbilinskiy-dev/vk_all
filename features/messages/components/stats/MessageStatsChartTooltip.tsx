/**
 * Портальный тултип для графика MessageStatsChart.
 * Умное позиционирование по паттерну Chart.tsx из рассылок.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { METRIC_COLORS, METRIC_LABELS } from './messageStatsChartConstants';
import { MetricKey, NormalizedPoint } from './messageStatsChartTypes';

interface ChartTooltipProps {
    x: number;
    y: number;
    point: NormalizedPoint;
    visibleLines: MetricKey[];
    /** Активные оверлейные метрики для отображения в тултипе */
    activeOverlayItems?: { label: string; key: string; color: string }[];
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ x, y, point, visibleLines, activeOverlayItems }) => {
    const screenWidth = window.innerWidth;
    const isRightSide = x > screenWidth / 2;

    // Только динамическое позиционирование — визуальные стили через Tailwind (пункт 9 дизайн-системы)
    const positionStyle: React.CSSProperties = {
        top: y - 10,
        ...(isRightSide
            ? { right: (screenWidth - x) + 15, left: 'auto' }
            : { left: x + 15, right: 'auto' }),
    };

    const label = point.labelTime
        ? `${point.labelDate} ${point.labelTime}`
        : point.labelDate;

    return createPortal(
        <div
            style={positionStyle}
            className="fixed z-[9999] pointer-events-none -translate-y-full min-w-[160px] bg-gray-800 text-white rounded-lg shadow-lg py-2 px-3 text-xs animate-fade-in-up"
        >
            <p className="font-bold text-center text-gray-300 mb-1">{label}</p>
            <div className="space-y-1">
                {visibleLines.map(key => (
                    <div key={key} className="flex justify-between items-center gap-3">
                        <span style={{ color: METRIC_COLORS[key].stroke }}>
                            {METRIC_LABELS[key]}:
                        </span>
                        <span className="font-semibold">{Number(point[key]).toLocaleString()}</span>
                    </div>
                ))}
                {/* Оверлейные метрики (если включены) */}
                {activeOverlayItems && activeOverlayItems.length > 0 && (
                    <>
                        <div className="border-t border-gray-600 my-1" />
                        {activeOverlayItems.map(oi => (
                            <div key={oi.key} className="flex justify-between items-center gap-3">
                                <span style={{ color: oi.color }}>
                                    {oi.label}:
                                </span>
                                <span className="font-semibold">{(Number(point[oi.key]) || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};
