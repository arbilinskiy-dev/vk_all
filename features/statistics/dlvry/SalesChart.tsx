/**
 * График продаж DLVRY.
 * Кастомный SVG-график (паттерн из features/lists/components/statistics/Chart.tsx).
 * Поддержка нескольких метрик, тултип, анимация stroke-dashoffset.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ChartDataPoint,
    ChartMetric,
    ChartGranularity,
    CHART_METRIC_LABELS,
    CHART_METRIC_COLORS,
} from './useSalesChartData';

// ─── Константы ───────────────────────────────────────────────────────────────

const ALL_METRICS: ChartMetric[] = [
    'revenue', 'orders', 'avg_check',
    'canceled', 'canceled_sum',
    'delivery_orders', 'pickup_orders',
    'delivery_revenue', 'pickup_revenue',
];

const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
    daily: 'по дням',
    weekly: 'по неделям',
    monthly: 'по месяцам',
};

// ─── Форматирование значений ─────────────────────────────────────────────────

function formatValue(value: number, metric: ChartMetric): string {
    if (metric === 'revenue' || metric === 'canceled_sum' || metric === 'delivery_revenue' || metric === 'pickup_revenue' || metric === 'avg_check') {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} млн`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(1)} тыс`;
        return value.toLocaleString('ru-RU');
    }
    return value.toLocaleString('ru-RU');
}

function formatTooltipValue(value: number, metric: ChartMetric): string {
    if (metric === 'revenue' || metric === 'canceled_sum' || metric === 'delivery_revenue' || metric === 'pickup_revenue' || metric === 'avg_check') {
        return `${value.toLocaleString('ru-RU')} ₽`;
    }
    return value.toLocaleString('ru-RU');
}

// ─── Анимация линии (stroke-dashoffset) ──────────────────────────────────────

const AnimatedPolyline: React.FC<{ points: string; stroke: string }> = ({ points, stroke }) => {
    const ref = useRef<SVGPolylineElement>(null);
    const [dashOffset, setDashOffset] = useState(0);
    const [totalLength, setTotalLength] = useState(0);

    useEffect(() => {
        if (!ref.current) return;
        const len = ref.current.getTotalLength();
        setTotalLength(len);
        setDashOffset(len);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setDashOffset(0));
        });
    }, [points]);

    return (
        <polyline
            ref={ref}
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLength || undefined}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
    );
};

// ─── Кнопка метрики ──────────────────────────────────────────────────────────

const MetricButton: React.FC<{
    metric: ChartMetric;
    isActive: boolean;
    onClick: (m: ChartMetric) => void;
}> = ({ metric, isActive, onClick }) => {
    const color = CHART_METRIC_COLORS[metric].stroke;
    return (
        <button
            onClick={() => onClick(metric)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border whitespace-nowrap ${
                isActive
                    ? 'z-10'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={isActive ? {
                backgroundColor: `${color}10`,
                color: color,
                borderColor: `${color}40`,
                boxShadow: `0 0 0 1px ${color}`,
            } : undefined}
        >
            {CHART_METRIC_LABELS[metric]}
        </button>
    );
};

// ─── Тултип ──────────────────────────────────────────────────────────────────

const ChartTooltip: React.FC<{
    x: number;
    y: number;
    point: ChartDataPoint;
    activeMetrics: Set<ChartMetric>;
}> = ({ x, y, point, activeMetrics }) => {
    const screenWidth = window.innerWidth;
    const isRightSide = x > screenWidth / 2;

    const style: any = {
        top: y - 10,
        transform: 'translateY(-100%)',
        minWidth: '150px',
        position: 'fixed',
        zIndex: 9999,
        pointerEvents: 'none',
        backgroundColor: '#1f2937',
        color: 'white',
        borderRadius: '0.375rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        fontSize: '0.75rem',
    };

    if (isRightSide) {
        style.right = (screenWidth - x) + 15;
        style.left = 'auto';
    } else {
        style.left = x + 15;
        style.right = 'auto';
    }

    return createPortal(
        <div style={style} className="animate-fade-in-up">
            <p className="font-bold text-center text-gray-300 mb-1">{point.label}</p>
            <div className="space-y-1">
                {Array.from(activeMetrics).map((metric: ChartMetric) => (
                    <div key={metric} className="flex justify-between items-center">
                        <span style={{ color: CHART_METRIC_COLORS[metric].stroke }}>
                            {CHART_METRIC_LABELS[metric]}:
                        </span>
                        <span className="font-semibold ml-3">
                            {formatTooltipValue(point[metric], metric)}
                        </span>
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};

// ─── Основной компонент ──────────────────────────────────────────────────────

interface SalesChartProps {
    data: ChartDataPoint[];
    granularity: ChartGranularity;
    isLoading: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, granularity, isLoading }) => {
    const [activeMetrics, setActiveMetrics] = useState<Set<ChartMetric>>(new Set(['revenue']));
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartDataPoint } | null>(null);

    // Адаптивная ширина — реф на обёртку SVG, а не на корневой div
    const svgWrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(800);

    useEffect(() => {
        if (!svgWrapRef.current) return;
        const updateWidth = () => {
            if (svgWrapRef.current) setWidth(svgWrapRef.current.clientWidth);
        };
        updateWidth();
        const observer = new ResizeObserver(() => updateWidth());
        observer.observe(svgWrapRef.current);
        return () => observer.disconnect();
    }, []);

    const height = 320;
    const paddingX = 55;
    const paddingY = 40;

    const toggleMetric = useCallback((metric: ChartMetric) => {
        setActiveMetrics(prev => {
            const next = new Set(prev);
            if (next.has(metric)) {
                if (next.size <= 1) return prev;
                next.delete(metric);
            } else {
                next.add(metric);
            }
            return next;
        });
    }, []);

    // Вычисляем глобальный максимум для выбранных метрик
    // Отдельные шкалы для «денежных» и «штучных» метрик (разные порядки)
    const { maxValue, getY } = useMemo(() => {
        if (!data.length) return { maxValue: 1, getY: () => height - paddingY };

        let max = 1;
        for (const metric of activeMetrics) {
            for (const pt of data) {
                if (pt[metric] > max) max = pt[metric];
            }
        }
        // Добавляем 10% запас сверху
        max = max * 1.1;

        const getY = (value: number) => {
            return (height - paddingY) - (value / max) * (height - 2 * paddingY);
        };

        return { maxValue: max, getY };
    }, [data, activeMetrics, height, paddingY]);

    const getX = useCallback((index: number) => {
        if (data.length <= 1) return paddingX + (width - 2 * paddingX) / 2;
        return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
    }, [data.length, width, paddingX]);

    // Метки оси X (адаптивные — не больше того, что поместится)
    const xAxisLabels = useMemo(() => {
        if (!data.length) return [];

        const availableWidth = width - 2 * paddingX;
        const labelWidth = granularity === 'monthly' ? 60 : 50;
        let maxLabels = Math.max(2, Math.floor(availableWidth / labelWidth));
        if (maxLabels > data.length) maxLabels = data.length;

        const indices = new Set<number>();
        const step = data.length > 1 ? Math.floor((data.length - 1) / (maxLabels - 1)) || 1 : 1;
        for (let i = 0; i < data.length; i += step) indices.add(i);
        if (data.length > 1) indices.add(data.length - 1);

        return Array.from(indices).map(i => ({
            x: getX(i),
            text: data[i].label,
        }));
    }, [data, width, paddingX, granularity, getX]);

    // Метки оси Y (3-5 горизонтальных линий)
    const yGridLines = useMemo(() => {
        const steps = 4;
        const lines: { y: number; label: string }[] = [];
        for (let i = 0; i <= steps; i++) {
            const val = (maxValue / steps) * i;
            const y = getY(val);
            // Определяем первую активную метрику для формата
            const firstMetric = activeMetrics.values().next().value as ChartMetric;
            lines.push({ y, label: formatValue(Math.round(val), firstMetric) });
        }
        return lines;
    }, [maxValue, getY, activeMetrics]);

    // Точки min/max для каждой метрики
    const minMaxPoints = useMemo(() => {
        if (!data.length) return {};
        const result: Record<string, { minIdx: number; maxIdx: number }> = {};
        for (const metric of activeMetrics) {
            let minIdx = 0, maxIdx = 0;
            for (let i = 1; i < data.length; i++) {
                if (data[i][metric] < data[minIdx][metric]) minIdx = i;
                if (data[i][metric] > data[maxIdx][metric]) maxIdx = i;
            }
            result[metric] = { minIdx, maxIdx };
        }
        return result;
    }, [data, activeMetrics]);

    // ─── Рендер ──────────────────────────────────────────────────────────────
    // Стабильный DOM: НЕ используем ранние return при isLoading / пустых данных,
    // чтобы при смене периода не было ремаунта (хуки, ref, ResizeObserver живут)

    const hasData = data.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            {/* Заголовок + гранулярность */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Динамика продаж</h3>
                <span className="text-xs text-gray-400">{GRANULARITY_LABELS[granularity]}</span>
            </div>

            {/* Переключатели метрик — горизонтальный скролл с вертикальным запасом для ring/shadow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1 py-1 -my-1 custom-scrollbar">
                {ALL_METRICS.map(metric => (
                    <MetricButton
                        key={metric}
                        metric={metric}
                        isActive={activeMetrics.has(metric)}
                        onClick={toggleMetric}
                    />
                ))}
            </div>

            {/* SVG-область: ref для ResizeObserver ВСЕГДА в DOM */}
            <div className="relative h-80 w-full select-none" ref={svgWrapRef}>
                {/* Скелетон — ТОЛЬКО когда данных вообще нет (первая загрузка) */}
                {!hasData && isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60">
                        <div className="animate-pulse flex flex-col items-center gap-3">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-48 w-full max-w-md bg-gray-100 rounded-lg" />
                        </div>
                    </div>
                )}
                {/* Лёгкий индикатор при подгрузке новых данных (старый график остаётся) */}
                {hasData && isLoading && (
                    <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-gray-100 overflow-hidden rounded-full">
                        <div className="h-full w-1/3 bg-blue-500 rounded-full animate-[loading-bar_1s_ease-in-out_infinite]" />
                    </div>
                )}
                {!hasData && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-gray-400 text-sm">Нет данных для графика</span>
                    </div>
                )}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible"
                     style={{ opacity: hasData ? 1 : 0, transition: 'opacity 0.3s' }}>
                    {/* Горизонтальная сетка + метки оси Y */}
                    {yGridLines.map(({ y, label }, i) => (
                        <g key={i}>
                            <line
                                x1={paddingX}
                                y1={y}
                                x2={width - paddingX}
                                y2={y}
                                stroke={i === 0 ? '#e5e7eb' : '#f3f4f6'}
                                strokeDasharray={i === 0 ? undefined : '4'}
                            />
                            <text
                                x={paddingX - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill="#9ca3af"
                                fontSize="10"
                            >
                                {label}
                            </text>
                        </g>
                    ))}

                    {/* Линии с заливкой */}
                    {Array.from(activeMetrics).map((metric: ChartMetric) => {
                        const pointsStr = data.map((d, i) => `${getX(i)},${getY(d[metric])}`).join(' ');
                        // Область заливки
                        const firstX = getX(0);
                        const lastX = getX(data.length - 1);
                        const baseY = height - paddingY;
                        const areaPath = `M${firstX},${baseY} L${pointsStr} L${lastX},${baseY} Z`;

                        return (
                            <g key={metric}>
                                <path d={areaPath} fill={CHART_METRIC_COLORS[metric].fill} className="animate-chart-area" />
                                <AnimatedPolyline points={pointsStr} stroke={CHART_METRIC_COLORS[metric].stroke} />
                            </g>
                        );
                    })}

                    {/* Зоны наведения + точки */}
                    {data.map((d, index) => {
                        const x = getX(index);
                        let hitX: number, hitW: number;

                        if (data.length === 1) {
                            hitX = 0;
                            hitW = width;
                        } else {
                            const prevX = index > 0 ? getX(index - 1) : x;
                            const nextX = index < data.length - 1 ? getX(index + 1) : x;
                            hitX = index === 0 ? 0 : x - (x - prevX) / 2;
                            const rightBound = index === data.length - 1 ? width : x + (nextX - x) / 2;
                            hitW = rightBound - hitX;
                        }

                        return (
                            <g key={d.sortKey}>
                                <rect
                                    x={hitX}
                                    y={0}
                                    width={hitW}
                                    height={height}
                                    fill="transparent"
                                    cursor="pointer"
                                    onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, point: d })}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                                {/* Вертикальная линия при наведении */}
                                {tooltip?.point.sortKey === d.sortKey && (
                                    <line
                                        x1={x}
                                        y1={paddingY}
                                        x2={x}
                                        y2={height - paddingY}
                                        stroke="#d1d5db"
                                        strokeDasharray="4"
                                        className="pointer-events-none"
                                    />
                                )}
                                {/* Точки */}
                                {Array.from(activeMetrics).map((metric: ChartMetric) => {
                                    const val = d[metric];
                                    const cy = getY(val);
                                    const isHovered = tooltip?.point.sortKey === d.sortKey;
                                    return (
                                        <circle
                                            key={metric}
                                            cx={x}
                                            cy={cy}
                                            r={isHovered ? 4 : 2.5}
                                            fill="white"
                                            stroke={CHART_METRIC_COLORS[metric].stroke}
                                            strokeWidth="1.5"
                                            className="transition-all duration-100 pointer-events-none"
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Метки min/max */}
                    {Array.from(activeMetrics).map((metric: ChartMetric) => {
                        const mm = minMaxPoints[metric];
                        if (!mm) return null;
                        const elements: React.ReactNode[] = [];
                        const color = CHART_METRIC_COLORS[metric].stroke;

                        if (data[mm.maxIdx][metric] > 0) {
                            const cx = getX(mm.maxIdx);
                            const cy = getY(data[mm.maxIdx][metric]);
                            elements.push(
                                <g key={`max-${metric}`}>
                                    <circle cx={cx} cy={cy} r="3" fill={color} stroke="white" strokeWidth="1" />
                                    <text x={cx} y={cy - 10} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold">
                                        {formatValue(data[mm.maxIdx][metric], metric)}
                                    </text>
                                </g>
                            );
                        }

                        if (data[mm.minIdx][metric] > 0 && mm.minIdx !== mm.maxIdx) {
                            const cx = getX(mm.minIdx);
                            const cy = getY(data[mm.minIdx][metric]);
                            elements.push(
                                <g key={`min-${metric}`}>
                                    <circle cx={cx} cy={cy} r="3" fill={color} stroke="white" strokeWidth="1" />
                                    <text x={cx} y={cy + 16} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold">
                                        {formatValue(data[mm.minIdx][metric], metric)}
                                    </text>
                                </g>
                            );
                        }

                        return <g key={`labels-${metric}`} className="pointer-events-none">{elements}</g>;
                    })}

                    {/* Метки оси X */}
                    <g className="pointer-events-none">
                        {xAxisLabels.map(({ x, text }, i) => (
                            <text
                                key={`${text}-${i}`}
                                x={x}
                                y={height - paddingY + 20}
                                textAnchor="middle"
                                fill="#6b7280"
                                fontSize="11"
                            >
                                {text}
                            </text>
                        ))}
                    </g>
                </svg>

                {/* Тултип */}
                {tooltip && (
                    <ChartTooltip
                        x={tooltip.x}
                        y={tooltip.y}
                        point={tooltip.point}
                        activeMetrics={activeMetrics}
                    />
                )}
            </div>
        </div>
    );
};
