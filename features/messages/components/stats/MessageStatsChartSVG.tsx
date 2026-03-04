/**
 * SVG-тело графика MessageStatsChart.
 * Сетка, area+линии, единая hover-зона, min/max метки, оверлейные линии, ось X.
 *
 * ОПТИМИЗАЦИЯ: вместо отдельного <rect> на каждую точку —
 * один прозрачный <rect> на всю область + бинарный поиск ближайшей точки.
 * Это сокращает кол-во DOM-элементов с N×3..5 до ~N+10.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { METRIC_COLORS, BADGE_LINE_COLORS } from './messageStatsChartConstants';
import { ChartOverlayMetric, MetricKey, NormalizedPoint } from './messageStatsChartTypes';

interface MessageStatsChartSVGProps {
    normalized: NormalizedPoint[];
    activeMetrics: MetricKey[];
    overlayMetrics?: ChartOverlayMetric[];
    activeOverlays: Set<number>;
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    gridLines: { y: number; label: string }[];
    xAxisLabels: { x: number; dateLine: string; timeLine: string }[];
    minMaxPoints: Record<string, { minPoint: NormalizedPoint | null; maxPoint: NormalizedPoint | null; minIdx: number; maxIdx: number }>;
    tooltip: { x: number; y: number; point: NormalizedPoint } | null;
    setTooltip: (t: { x: number; y: number; point: NormalizedPoint } | null) => void;
    getCoords: (value: number, index: number) => { x: number; y: number };
}

export const MessageStatsChartSVG: React.FC<MessageStatsChartSVGProps> = ({
    normalized,
    activeMetrics,
    overlayMetrics,
    activeOverlays,
    width,
    height,
    paddingX,
    paddingY,
    gridLines,
    xAxisLabels,
    minMaxPoints,
    tooltip,
    setTooltip,
    getCoords,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // Массив X-координат точек (кэшируем, чтобы не считать при каждом mousemove)
    const pointXCoords = useMemo(() => {
        return normalized.map((_, i) => getCoords(0, i).x);
    }, [normalized, getCoords, width]);

    // Бинарный поиск ближайшей точки по X-координате
    const findNearestIndex = useCallback((mouseX: number): number => {
        if (pointXCoords.length === 0) return -1;
        if (pointXCoords.length === 1) return 0;

        let lo = 0;
        let hi = pointXCoords.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (pointXCoords[mid] < mouseX) lo = mid + 1;
            else hi = mid;
        }
        // Проверяем ближайшую из lo и lo-1
        if (lo > 0 && Math.abs(pointXCoords[lo - 1] - mouseX) < Math.abs(pointXCoords[lo] - mouseX)) {
            return lo - 1;
        }
        return lo;
    }, [pointXCoords]);

    // Единый onMouseMove: вычисляем SVG-координату → ближайший индекс → тултип
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
        const svg = svgRef.current;
        if (!svg || normalized.length === 0) return;

        const rect = svg.getBoundingClientRect();
        // Конвертируем экранную координату в SVG viewBox координату
        const scaleX = width / rect.width;
        const svgX = (e.clientX - rect.left) * scaleX;

        const idx = findNearestIndex(svgX);
        if (idx >= 0 && idx < normalized.length) {
            setTooltip({ x: e.clientX, y: e.clientY, point: normalized[idx] });
        }
    }, [normalized, width, findNearestIndex, setTooltip]);

    const handleMouseLeave = useCallback(() => setTooltip(null), [setTooltip]);

    // Индекс hovered точки (для подсветки)
    const hoveredIdx = useMemo(() => {
        if (!tooltip) return -1;
        return normalized.findIndex(p => p.slot === tooltip.point.slot);
    }, [tooltip, normalized]);

    return (
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">

            {/* ── Линии сетки (пунктирные, как в Chart.tsx) ── */}
            {gridLines.map((gl, i) => (
                <g key={i}>
                    <line
                        x1={paddingX}
                        y1={gl.y}
                        x2={width - paddingX}
                        y2={gl.y}
                        stroke="#e5e7eb"
                        strokeDasharray={i < gridLines.length - 1 ? '4' : '0'}
                    />
                    <text
                        x={paddingX - 8}
                        y={gl.y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#9ca3af"
                    >
                        {gl.label}
                    </text>
                </g>
            ))}

            {/* ── Заливки (area) + линии для каждого видимого ключа ── */}
            {activeMetrics.map(key => {
                const points = normalized.map((d, i) => {
                    const { x, y } = getCoords(d[key], i);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');

                // Путь для области заливки (замыкание к нижней линии)
                const firstX = getCoords(0, 0).x;
                const lastX = getCoords(0, normalized.length - 1).x;
                const baseY = height - paddingY;
                const areaPath = `M${firstX.toFixed(1)},${baseY} L${points} L${lastX.toFixed(1)},${baseY} Z`;

                return (
                    <g key={key}>
                        {/* Заливка под графиком */}
                        <path d={areaPath} fill={METRIC_COLORS[key].fill} />
                        {/* Основная линия */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke={METRIC_COLORS[key].stroke}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>
                );
            })}

            {/* ── Единая hover-зона (один <rect> вместо тысяч) ── */}
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="transparent"
                cursor="pointer"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />

            {/* ── Вертикальная линия + точки при наведении ── */}
            {hoveredIdx >= 0 && (() => {
                const pt = normalized[hoveredIdx];
                const { x: ptX } = getCoords(0, hoveredIdx);
                return (
                    <g className="pointer-events-none">
                        {/* Вертикальная линия-подсказка */}
                        <line
                            x1={ptX}
                            y1={paddingY}
                            x2={ptX}
                            y2={height - paddingY}
                            stroke="#d1d5db"
                            strokeWidth="1"
                            strokeDasharray="4"
                        />
                        {/* Точки для каждой метрики */}
                        {activeMetrics.map(key => {
                            const val = pt[key];
                            const { y: ptY } = getCoords(val, hoveredIdx);
                            return (
                                <circle
                                    key={key}
                                    cx={ptX}
                                    cy={ptY}
                                    r={5}
                                    fill="white"
                                    stroke={METRIC_COLORS[key].stroke}
                                    strokeWidth={2.5}
                                />
                            );
                        })}
                    </g>
                );
            })()}

            {/* ── Min/Max метки (постоянные, по паттерну Chart.tsx) ── */}
            {activeMetrics.map(key => {
                const info = minMaxPoints[key];
                if (!info) return null;
                const { maxPoint, maxIdx, minPoint, minIdx } = info;
                const elements: React.ReactNode[] = [];

                if (maxPoint && maxPoint[key] > 0) {
                    const { x: mx, y: my } = getCoords(maxPoint[key], maxIdx);
                    elements.push(
                        <g key={`max-${key}`}>
                            <circle cx={mx} cy={my} r="3.5" fill={METRIC_COLORS[key].stroke} stroke="white" strokeWidth="1.5" />
                            <text x={mx} y={my - 12} textAnchor="middle" fill="#374151" fontSize="11" fontWeight="bold">
                                {maxPoint[key]}
                            </text>
                        </g>
                    );
                }

                if (minPoint && minPoint[key] > 0 && minIdx !== maxIdx) {
                    const { x: mnx, y: mny } = getCoords(minPoint[key], minIdx);
                    elements.push(
                        <g key={`min-${key}`}>
                            <circle cx={mnx} cy={mny} r="3.5" fill={METRIC_COLORS[key].stroke} stroke="white" strokeWidth="1.5" />
                            <text x={mnx} y={mny + 20} textAnchor="middle" fill="#374151" fontSize="11" fontWeight="bold">
                                {minPoint[key]}
                            </text>
                        </g>
                    );
                }

                return <g key={`labels-${key}`} className="pointer-events-none">{elements}</g>;
            })}

            {/* ── Оверлейные линии (часовые данные по клику) ── */}
            {overlayMetrics && overlayMetrics.map((om, i) => {
                if (!activeOverlays.has(i)) return null;
                const color = BADGE_LINE_COLORS[i % BADGE_LINE_COLORS.length];
                const points = normalized.map((d, idx) => {
                    const val = Number(d[om.key]) || 0;
                    const { x, y } = getCoords(val, idx);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');

                return (
                    <g key={`overlay-${i}`} className="pointer-events-none">
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeDasharray="6 3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.85"
                        />
                    </g>
                );
            })}

            {/* ── Метки оси X (адаптивные, pointer-events-none) ── */}
            <g className="pointer-events-none">
                {xAxisLabels.map(({ x, dateLine, timeLine }, i) => (
                    <text
                        key={`${dateLine}-${timeLine}-${i}`}
                        x={x}
                        y={height - paddingY + 18}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#6b7280"
                    >
                        <tspan x={x} dy="0">{dateLine}</tspan>
                        {timeLine && <tspan x={x} dy="13">{timeLine}</tspan>}
                    </text>
                ))}
            </g>
        </svg>
    );
};
