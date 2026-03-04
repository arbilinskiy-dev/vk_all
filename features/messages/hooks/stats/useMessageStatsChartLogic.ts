/**
 * Хук логики для компонента MessageStatsChart.
 * Стейт, ResizeObserver, вычисляемые данные (useMemo).
 */

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { MessageStatsChartPoint } from '../../../../services/api/messages_stats.api';
import { ChartGranularity, ChartOverlayMetric, MetricKey, NormalizedPoint } from '../../components/stats/messageStatsChartTypes';
import { fillGaps, toMSK, downsamplePoints, suggestGranularity, MAX_CHART_POINTS } from '../../components/stats/messageStatsChartUtils';

interface UseMessageStatsChartLogicParams {
    data: MessageStatsChartPoint[];
    visibleLines: 'both' | 'incoming' | 'outgoing';
    overlayMetrics?: ChartOverlayMetric[];
}

// Размеры SVG
const SVG_HEIGHT = 320;
const PADDING_X = 50;
const PADDING_Y = 40;

export function useMessageStatsChartLogic({ data, visibleLines, overlayMetrics }: UseMessageStatsChartLogicParams) {
    // ─── State ───
    const [granularityOverride, setGranularityOverride] = useState<ChartGranularity | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: NormalizedPoint } | null>(null);
    /** Индексы активных оверлейных метрик — для них рисуются линии на графике */
    const [activeOverlays, setActiveOverlays] = useState<Set<number>>(new Set());

    // Авто-гранулярность: если данных много — переключаемся на дни автоматически
    const autoGranularity = useMemo(() => suggestGranularity(data.length), [data.length]);
    const granularity: ChartGranularity = granularityOverride ?? autoGranularity;

    /** Ручное переключение гранулярности пользователем */
    const setGranularity = useCallback((g: ChartGranularity) => {
        setGranularityOverride(g);
    }, []);

    // Сбрасываем ручной override при смене данных (новый период)
    useEffect(() => {
        setGranularityOverride(null);
    }, [data]);

    /** Переключение оверлея: клик → показать/скрыть линию */
    const toggleOverlay = (idx: number) => {
        setActiveOverlays(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    // Адаптивная ширина через ResizeObserver (как в Chart.tsx рассылок)
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(1000);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateWidth = () => {
            if (containerRef.current) setWidth(containerRef.current.clientWidth);
        };
        updateWidth();
        const ro = new ResizeObserver(() => updateWidth());
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // ─── Derived state ───

    // fillGaps + downsampling: сначала заполняем пробелы, потом ограничиваем кол-во точек
    const filledData = useMemo(() => fillGaps(data, granularity), [data, granularity]);
    const normalized = useMemo(() => downsamplePoints(filledData, MAX_CHART_POINTS), [filledData]);

    /** Данные были агрегированы (downsampling) — показать индикатор пользователю */
    const isDownsampled = filledData.length > MAX_CHART_POINTS;

    // Какие линии видимы
    const activeMetrics: MetricKey[] = useMemo(() => {
        if (visibleLines === 'incoming') return ['incoming'];
        if (visibleLines === 'outgoing') return ['outgoing'];
        return ['incoming', 'outgoing'];
    }, [visibleLines]);

    // Максимум для шкалы Y (учитываем активные оверлейные линии)
    const maxValue = useMemo(() => {
        if (!normalized || normalized.length === 0) return 1;
        let maxVal = 1;
        for (const pt of normalized) {
            for (const key of activeMetrics) {
                if (pt[key] > maxVal) maxVal = pt[key];
            }
            // Учитываем активные оверлейные метрики
            if (overlayMetrics) {
                for (const idx of activeOverlays) {
                    const om = overlayMetrics[idx];
                    if (om) {
                        const v = Number(pt[om.key]) || 0;
                        if (v > maxVal) maxVal = v;
                    }
                }
            }
        }
        return maxVal;
    }, [normalized, activeMetrics, activeOverlays, overlayMetrics]);

    // Min/Max точки для каждой метрики (без spread — безопасно для больших массивов)
    const minMaxPoints = useMemo(() => {
        if (!normalized || normalized.length === 0) return {};
        const result: Record<string, { minPoint: NormalizedPoint | null; maxPoint: NormalizedPoint | null; minIdx: number; maxIdx: number }> = {};
        for (const key of activeMetrics) {
            let minVal = Infinity;
            let maxVal = -Infinity;
            let minIdx = 0;
            let maxIdx = 0;
            for (let i = 0; i < normalized.length; i++) {
                const v = normalized[i][key];
                if (v < minVal) { minVal = v; minIdx = i; }
                if (v > maxVal) { maxVal = v; maxIdx = i; }
            }
            result[key] = {
                minPoint: normalized[minIdx] || null,
                maxPoint: normalized[maxIdx] || null,
                minIdx,
                maxIdx,
            };
        }
        return result;
    }, [normalized, activeMetrics]);

    // Координаты точки (мемоизировано для стабильной ссылки)
    const getCoords = useCallback((value: number, index: number) => {
        const x = PADDING_X + (index / (normalized.length - 1 || 1)) * (width - 2 * PADDING_X);
        const y = (SVG_HEIGHT - PADDING_Y) - (value / maxValue) * (SVG_HEIGHT - 2 * PADDING_Y);
        return { x, y };
    }, [normalized.length, width, maxValue]);

    // Горизонтальные линии сетки (4 промежуточные + базовая)
    const gridLines = useMemo(() => {
        const roundedMax = Math.ceil(maxValue / 5) * 5 || 5;
        const gridCount = 4;
        return Array.from({ length: gridCount + 1 }, (_, i) => {
            const val = (roundedMax / gridCount) * i;
            const y = (SVG_HEIGHT - PADDING_Y) - (val / maxValue) * (SVG_HEIGHT - 2 * PADDING_Y);
            return { y, label: Math.round(val).toString() };
        });
    }, [maxValue]);

    // Адаптивные метки оси X (по паттерну Chart.tsx)
    const xAxisLabels = useMemo(() => {
        if (!normalized || normalized.length < 1) return [];
        const availableWidth = width - 2 * PADDING_X;
        const labelWidth = 70;
        let maxLabels = Math.floor(availableWidth / labelWidth);
        if (maxLabels > normalized.length) maxLabels = normalized.length;
        if (maxLabels < 2 && normalized.length >= 2) maxLabels = 2;
        if (maxLabels < 1) return [];

        const indices = new Set<number>();
        const step = normalized.length > 1 ? Math.floor((normalized.length - 1) / (maxLabels - 1)) || 1 : 1;
        for (let i = 0; i < normalized.length; i += step) indices.add(i);
        if (normalized.length > 1) indices.add(normalized.length - 1);

        return Array.from(indices).map(i => {
            const d = normalized[i];
            const { x } = getCoords(0, i);
            return { x, dateLine: d.labelDate, timeLine: d.labelTime };
        });
    }, [normalized, width]);

    // Текущее московское время для маркера «сейчас»
    const nowMSK = useMemo(() => {
        const msk = toMSK(new Date());
        const hh = String(msk.getUTCHours()).padStart(2, '0');
        const mm = String(msk.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm} MSK`;
    }, []);

    // ─── Return ───
    return {
        state: {
            granularity,
            tooltip,
            activeOverlays,
            containerRef,
            width,
            normalized,
            activeMetrics,
            maxValue,
            minMaxPoints,
            gridLines,
            xAxisLabels,
            nowMSK,
            isDownsampled,
            autoGranularity,
            height: SVG_HEIGHT,
            paddingX: PADDING_X,
            paddingY: PADDING_Y,
        },
        actions: {
            setGranularity,
            setTooltip,
            toggleOverlay,
            getCoords,
        },
    };
}
