/**
 * Шапка графика MessageStatsChart.
 * Легенда линий, бейджи оверлеев, MSK-время, pill-переключатель гранулярности.
 */

import React from 'react';
import { METRIC_COLORS, METRIC_LABELS, BADGE_LINE_COLORS } from './messageStatsChartConstants';
import { ChartGranularity, ChartOverlayMetric, MetricKey } from './messageStatsChartTypes';

interface MessageStatsChartHeaderProps {
    activeMetrics: MetricKey[];
    overlayMetrics?: ChartOverlayMetric[];
    activeOverlays: Set<number>;
    toggleOverlay: (idx: number) => void;
    nowMSK: string;
    granularity: ChartGranularity;
    setGranularity: (g: ChartGranularity) => void;
    /** Данные были автоматически агрегированы (downsampled) */
    isDownsampled?: boolean;
    /** Гранулярность, выбранная автоматически (для индикации) */
    autoGranularity?: ChartGranularity;
}

export const MessageStatsChartHeader: React.FC<MessageStatsChartHeaderProps> = ({
    activeMetrics,
    overlayMetrics,
    activeOverlays,
    toggleOverlay,
    nowMSK,
    granularity,
    setGranularity,
    isDownsampled,
    autoGranularity,
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {/* Левая часть: легенда + сводка дашборда */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Легенда линий */}
                {activeMetrics.map(key => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: METRIC_COLORS[key].stroke }} />
                        <span className="text-xs text-gray-600">{METRIC_LABELS[key]}</span>
                    </div>
                ))}

                {/* Метрики-оверлеи — кликабельные бейджи с часовыми данными */}
                {overlayMetrics && overlayMetrics.length > 0 && (
                    <>
                        <div className="w-px h-4 bg-gray-300" />
                        {overlayMetrics.map((om, i) => {
                            const isActive = activeOverlays.has(i);
                            const color = BADGE_LINE_COLORS[i % BADGE_LINE_COLORS.length];
                            return (
                                <button
                                    key={i}
                                    onClick={() => toggleOverlay(i)}
                                    className={`text-xs rounded-md px-1.5 py-0.5 transition-all duration-200 border cursor-pointer select-none ${
                                        isActive
                                            ? 'border-current bg-opacity-10 font-semibold shadow-sm'
                                            : 'border-transparent hover:bg-gray-100 text-gray-500'
                                    }`}
                                    style={isActive ? { color, backgroundColor: `${color}15`, borderColor: `${color}40` } : undefined}
                                    title={isActive ? `Скрыть линию «${om.label}»` : `Показать на графике`}
                                >
                                    <span className={isActive ? '' : 'text-gray-400'}>{om.label}:</span>{' '}
                                    <span className={isActive ? 'font-bold' : 'font-semibold text-gray-700'}>
                                        {om.total.toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Правая часть: время MSK + гранулярность + индикатор агрегации */}
            <div className="flex items-center gap-3">
                {/* Индикатор агрегации данных (downsampling) */}
                {isDownsampled && (
                    <span
                        className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                        title="Для улучшения производительности соседние точки сгруппированы"
                    >
                        данные агрегированы
                    </span>
                )}

                {/* Индикатор авто-переключения гранулярности */}
                {autoGranularity === 'days' && granularity === 'days' && (
                    <span
                        className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                        title="Автоматически переключено на отображение по дням из-за большого объёма данных"
                    >
                        авто: по дням
                    </span>
                )}
                {/* Индикатор серверного времени — SVG вместо эмоджи (пункт 7 дизайн-системы) */}
                <span className="text-[10px] text-gray-400 font-mono tabular-nums inline-flex items-center gap-1" title="Серверное время (Москва, UTC+3)">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {nowMSK}
                </span>

                {/* Pill-переключатель */}
                <div className="flex p-0.5 bg-gray-100 rounded-md border border-gray-200">
                    <button
                        onClick={() => setGranularity('hours')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-200 ${
                            granularity === 'hours'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        По часам
                    </button>
                    <button
                        onClick={() => setGranularity('days')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-200 ${
                            granularity === 'days'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        По дням
                    </button>
                </div>
            </div>
        </div>
    );
};
